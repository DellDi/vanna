import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { useConversation } from './useConversation'
import { useExampleQuestions } from './useExampleQuestions'
import { useFollowupQuestions } from './useFollowupQuestions'
import { useSQLQuery } from './useSQLQuery'

/**
 * 聊天界面 Hook
 * 整合所有功能，提供完整的聊天界面状态和操作
 */
export function useChatInterface() {
  const searchParams = useSearchParams()
  const questionId = searchParams.get('id')
  
  const {
    messages,
    loading: conversationLoading,
    currentId,
    setLoading,
    setCurrentId,
    addUserMessage,
    addAssistantMessage,
    createNewConversation,
    loadQuestion,
    initializeConversation
  } = useConversation()
  
  const {
    exampleQuestions,
    fetchExampleQuestions,
    loading: exampleQuestionsLoading
  } = useExampleQuestions()
  
  const {
    followupQuestions,
    generateFollowupQuestions,
    clearFollowupQuestions,
    loading: followupQuestionsLoading
  } = useFollowupQuestions()
  
  const {
    loading: sqlQueryLoading,
    generateSQL,
    runQuery,
    generateChart,
    exportData
  } = useSQLQuery()

  // 合并所有loading状态
  const loading = conversationLoading || exampleQuestionsLoading || followupQuestionsLoading || sqlQueryLoading

  // 监听新建对话事件
  useEffect(() => {
    const handleNewConversation = () => {
      createNewConversation()
      fetchExampleQuestions()
    }

    // 添加事件监听
    window.addEventListener('new-conversation', handleNewConversation)

    // 清理函数
    return () => {
      window.removeEventListener('new-conversation', handleNewConversation)
    }
  }, [])

  // 如果URL中有问题ID，则加载该问题
  useEffect(() => {
    // 使用类型保护确保 questionId 是 string
    if (questionId && typeof questionId === 'string') {
      const loadQuestionData = async () => {
        const response = await loadQuestion(questionId)
        if (response && response.followup_questions && response.followup_questions.length > 0) {
          clearFollowupQuestions()
          // 直接设置后续问题，避免额外请求
          // 这里假设loadQuestion返回的response中包含followup_questions
        }
      }
      loadQuestionData()
    } else if (messages.length === 0) {
      // 首次加载时初始化系统
      initializeConversation()
      fetchExampleQuestions()
    }
  }, [questionId, messages.length])

  /**
   * 发送消息并生成SQL查询
   */
  const handleSendMessage = async (message: string) => {
    try {
      setLoading(true)
      addUserMessage(message)

      // 生成SQL查询
      const response = await generateSQL(message)

      if (!response.success) {
        addAssistantMessage(response.message || '抱歉，生成SQL查询时出现错误。')
        setCurrentId(null)
        return
      }

      // 只有在 success 为 true 时，response 才会有 text 和 id 属性
      if (response.text) {
        addAssistantMessage(response.text)
      }
      if (response.id) {
        setCurrentId(response.id)
      }

    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error('发送消息失败')
      addAssistantMessage('抱歉，处理您的请求时出现错误。')
    }
  }

  /**
   * 执行SQL查询
   */
  const handleRunQuery = async (id: string) => {
    if (!currentId) {
      toast.error('没有可执行的查询ID')
      return
    }

    try {
      setLoading(true)

      // 执行SQL查询
      const result = await runQuery(currentId)

      // 将结果添加到消息中
      if (result.success) {
        if (result.formattedData) {
          addAssistantMessage(`查询结果:\n${result.formattedData}`)
        } else if (result.rawData) {
          addAssistantMessage(`查询结果: ${result.rawData}`)
        }

        // 如果配置中允许自动生成图表，则自动生成
        if (result.shouldGenerateChart) {
          try {
            await handleGenerateChart(currentId)
          } catch (figError) {
            console.error('生成可视化失败:', figError)
            // 不阻止主流程
          }
        }

        // 尝试生成后续问题，但不阻止主流程
        try {
          await handleGenerateFollowup(currentId)
        } catch (followupError) {
          console.error('生成后续问题失败:', followupError)
          // 不向用户显示这个错误，静默处理
        }
      } else if (result.error) {
        addAssistantMessage(result.error)
      }
    } catch (error) {
      console.error('执行查询失败:', error)
      toast.error('执行查询失败')
      addAssistantMessage('执行查询失败，请检查SQL语句或稍后再试。')
    }
  }

  /**
   * 生成图表
   */
  const handleGenerateChart = async (id: string) => {
    const result = await generateChart(id)
    if (result.success && result.fig) {
      addAssistantMessage(`plotly_chart:\n${result.fig}`)
    }
  }

  /**
   * 导出数据
   */
  const handleExportData = (id: string) => {
    if (!id || !currentId) {
      toast.error('无效的查询ID')
      return
    }
    exportData(currentId)
  }

  /**
   * 生成后续问题
   */
  const handleGenerateFollowup = async (id: string) => {
    await generateFollowupQuestions(id)
  }

  /**
   * 重新生成SQL
   */
  const handleRegenerateSQL = async (id: string) => {
    if (!id) {
      toast.error('无效的查询ID')
      return
    }

    try {
      setLoading(true)
      // 获取最后一个用户消息
      const userMessages = messages.filter(m => m.type === 'user')
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1].content
        await handleSendMessage(lastUserMessage)
      } else {
        toast.error('无法找到原始问题')
      }
    } catch (error) {
      console.error('重新生成SQL失败:', error)
      toast.error('重新生成SQL失败')
    }
  }

  return {
    // 状态
    messages,
    loading,
    currentId,
    exampleQuestions,
    followupQuestions,
    
    // 操作方法
    handleSendMessage,
    handleRunQuery,
    handleGenerateChart,
    handleExportData,
    handleGenerateFollowup,
    handleRegenerateSQL,
    createNewConversation
  }
}
