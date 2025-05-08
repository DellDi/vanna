'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { Message } from '@/lib/types'
import { Sidebar } from '@/components/layout/sidebar'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import {
  initializeAction,
  generateSQLAction,
  runSQLAction,
  generatePlotlyFigureAction,
  loadQuestionAction,
  generateFollowupQuestionsAction,
  generateExampleQuestionsAction,
  createNewConversationAction,
} from '@/lib/actions'

export default function ChatInterface() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const questionId = searchParams.get('id')

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([])

  // 示例问题状态
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([])

  // 获取示例问题
  const fetchExampleQuestions = async () => {
    try {
      const response = await generateExampleQuestionsAction()
      if (response && response.questions && Array.isArray(response.questions)) {
        setExampleQuestions(response.questions)
      }
    } catch (error) {
      console.error('获取示例问题失败:', error)
    }
  }

  // 新建对话函数
  const createNewConversation = async () => {
    try {
      // 调用新建对话接口
      await createNewConversationAction()

      // 清除当前对话状态
      setMessages([])
      setCurrentId(null)
      setFollowupQuestions([])

      // 显示欢迎消息
      setMessages([
        {
          type: 'assistant',
          content:
            '您好，我是DellDi，您的SQL查询助手。请问有什么可以帮助您的？',
        },
      ])

      // 获取示例问题
      fetchExampleQuestions()

      // 更新URL，移除可能的id参数
      router.push('/', { scroll: false })
    } catch (error) {
      console.error('新建对话失败:', error)
      toast.error('新建对话失败')
    }
  }

  // 监听新建对话事件
  useEffect(() => {
    const handleNewConversation = () => {
      createNewConversation()
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
    if (questionId) {
      loadQuestion(questionId)
    } else if (messages.length === 0) {
      // 首次加载时初始化系统
      // const initialize = async () => {
      //   try {
      //     // 调用初始化接口
      //     await initializeAction()

      //     // 首次加载显示欢迎消息
      setMessages([
        {
          type: 'assistant',
          content:
            '您好，我是DellDi，您的SQL查询助手。请问有什么可以帮助您的？',
        },
      ])

      // 获取示例问题
      fetchExampleQuestions()
      //   } catch (error) {
      //     console.error('初始化失败:', error)
      //     toast.error('系统初始化失败，请刷新页面重试')
      //   }
      // }

      // initialize()
    }
  }, [questionId, messages.length])

  // 加载已存问题
  const loadQuestion = async (id: string) => {
    try {
      setLoading(true)
      const response = await loadQuestionAction(id)

      setMessages([
        { type: 'user', content: response.question },
        { type: 'assistant', content: response.sql },
      ])

      setCurrentId(response.id)

      if (
        response.followup_questions &&
        response.followup_questions.length > 0
      ) {
        setFollowupQuestions(response.followup_questions)
      }
    } catch (error) {
      console.error('加载问题失败:', error)
      toast.error('加载问题失败')
    } finally {
      setLoading(false)
    }
  }

  // 发送消息并生成SQL查询
  const handleSendMessage = async (message: string) => {
    try {
      setLoading(true)
      setMessages((prev) => [...prev, { type: 'user', content: message }])

      // 生成SQL查询
      const response = await generateSQLAction(message)

      // 检查响应中是否包含错误信息
      if (
        response.text.includes('insufficient_context') ||
        response.text.includes('无法确定')
      ) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'assistant',
            content:
              '抱歉，我无法确定相关的具体表结构和字段信息，需要更多上下文来生成准确的SQL查询。请提供更多信息或尝试其他问题。',
          },
        ])
        setCurrentId(null)
        return
      }

      setMessages((prev) => [
        ...prev,
        { type: 'assistant', content: response.text },
      ])
      setCurrentId(response.id)

     
    } catch (error) {
      console.error('生成SQL查询失败:', error)
      toast.error('生成SQL查询失败')
      setMessages((prev) => [
        ...prev,
        { type: 'assistant', content: '抱歉，生成SQL查询时出现错误。' },
      ])
    } finally {
      setLoading(false)
    }
  }

  // 执行SQL查询
  const handleRunQuery = async (id: string) => {
    if (!currentId) {
      toast.error('没有可执行的查询ID')
      return
    }

    try {
      setLoading(true)

      // 执行SQL查询
      const dfResponse = await runSQLAction(currentId)

      // 将结果添加到消息中
      if (dfResponse && dfResponse.df) {
        try {
          // 解析JSON数据并格式化显示
          const data = JSON.parse(dfResponse.df)
          const formattedData = JSON.stringify(data, null, 2)

          setMessages((prev) => [
            ...prev,
            {
              type: 'assistant',
              content: `查询结果:\n${formattedData}`,
            },
          ])

          // 如果配置中允许自动生成图表，则自动生成
          if (dfResponse.should_generate_chart) {
            try {
              await handleGenerateChart(currentId)
            } catch (figError) {
              console.error('生成可视化失败:', figError)
              // 不阻止主流程
            }
          }

          // 尝试生成后续问题，但不阻止主流程
          // try {
          //   await generateFollowupQuestions(currentId)
          // } catch (followupError) {
          //   console.error('生成后续问题失败:', followupError)
          //   // 不向用户显示这个错误，静默处理
          // }

          toast.success('查询执行成功')
        } catch (parseError) {
          console.error('解析查询结果失败:', parseError)
          setMessages((prev) => [
            ...prev,
            {
              type: 'assistant',
              content: `查询结果: ${dfResponse.df}`,
            },
          ])
        }
      }
    } catch (error) {
      console.error('执行查询失败:', error)
      toast.error('执行查询失败')
      setMessages((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: '执行查询失败，请检查SQL语句或稍后再试。',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // 生成图表
  const handleGenerateChart = async (id: string) => {
    if (!id) {
      toast.error('无效的查询ID')
      return
    }

    try {
      setLoading(true)
      // 生成图表
      const figResponse = await generatePlotlyFigureAction(id)
      
      if (figResponse && figResponse.fig) {
        // 将图表添加到消息中
        setMessages((prev) => [
          ...prev,
          {
            type: 'assistant',
            content: `plotly_chart:\n${figResponse.fig}`,
          },
        ])
        toast.success('图表生成成功')
      }
    } catch (error) {
      console.error('生成图表失败:', error)
      toast.error('生成图表失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出数据
  const handleExportData = async (id: string) => {
    if (!id || !currentId) {
      toast.error('无效的查询ID')
      return
    }

    try {
      // 导出数据为CSV
      window.open(`/api/v0/download_csv?id=${currentId}`, '_blank')
      toast.success('数据导出成功')
    } catch (error) {
      console.error('导出数据失败:', error)
      toast.error('导出数据失败')
    }
  }

  // 重新生成SQL
  const handleRegenerateSQL = async (id: string) => {
    if (!id) {
      toast.error('无效的查询ID')
      return
    }

    try {
      setLoading(true)
      // 这里应该调用重新生成SQL的API
      // 暂时使用原有的生成SQL逻辑
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
    } finally {
      setLoading(false)
    }
  }

  // 生成后续问题
  const generateFollowupQuestions = async (id: string) => {
    if (!id) return

    try {
      const response = await generateFollowupQuestionsAction(id)
      if (response && response.questions && Array.isArray(response.questions)) {
        setFollowupQuestions(response.questions)
      } else {
        // 如果返回的数据结构不符合预期，设置为空数组
        setFollowupQuestions([])
      }
    } catch (error) {
      console.error('生成后续问题失败:', error)
      // 出错时设置为空数组，避免显示之前的后续问题
      setFollowupQuestions([])
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <Sidebar currentPage="chat" />

      {/* 主要内容 */}
      <div className="flex-1 flex flex-col">
        <div className="text-center py-12 px-4">
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 text-transparent bg-clip-text">
            欢迎使用 DellDi
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            您的 AI 驱动的 SQL 查询助手
          </p>
        </div>

        {/* 示例问题或后续问题建议 */}
        {(followupQuestions.length > 0 ||
          (messages.length <= 1 && exampleQuestions.length > 0)) && (
          <div className="px-6 mb-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {followupQuestions.length > 0 ? '您可能想问：' : '示例问题：'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {followupQuestions.length > 0
                  ? // 显示后续问题
                    followupQuestions.map((question, index) => (
                      <button
                        key={index}
                        className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        onClick={() => handleSendMessage(question)}
                        disabled={loading}
                      >
                        {question}
                      </button>
                    ))
                  : // 显示示例问题
                    exampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        onClick={() => handleSendMessage(question)}
                        disabled={loading}
                      >
                        {question}
                      </button>
                    ))}
              </div>
            </div>
          </div>
        )}

        {/* 消息列表 */}
        <MessageList 
          messages={messages} 
          onRunQuery={handleRunQuery}
          onGenerateChart={handleGenerateChart}
          onExportData={handleExportData}
          onRegenerateSQL={handleRegenerateSQL}
        />

        {/* 消息输入框 */}
        <MessageInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>
    </div>
  )
}
