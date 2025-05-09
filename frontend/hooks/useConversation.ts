import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Message } from '@/lib/types'
import { 
  createNewConversationAction,
  loadQuestionAction
} from '@/lib/actions'

/**
 * 对话管理 Hook
 * 用于管理对话状态、消息列表和对话操作
 */
export function useConversation() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  /**
   * 初始化对话，显示欢迎消息
   */
  const initializeConversation = () => {
    setMessages([
      {
        type: 'assistant',
        content: '您好，我是DellDi，您的SQL查询助手。请问有什么可以帮助您的？',
      },
    ])
  }

  /**
   * 创建新对话
   */
  const createNewConversation = async () => {
    try {
      setLoading(true)
      // 调用新建对话接口
      await createNewConversationAction()

      // 清除当前对话状态
      setMessages([])
      setCurrentId(null)

      // 显示欢迎消息
      initializeConversation()

      // 更新URL，移除可能的id参数
      router.push('/', { scroll: false })
    } catch (error) {
      console.error('新建对话失败:', error)
      toast.error('新建对话失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载已存问题
   */
  const loadQuestion = async (id: string) => {
    try {
      setLoading(true)
      const response = await loadQuestionAction(id)

      setMessages([
        { type: 'user', content: response.question },
        { type: 'assistant', content: response.sql },
      ])

      setCurrentId(response.id)
      
      return response
    } catch (error) {
      console.error('加载问题失败:', error)
      toast.error('加载问题失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 添加消息到对话
   */
  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  /**
   * 添加用户消息
   */
  const addUserMessage = (content: string) => {
    addMessage({ type: 'user', content })
  }

  /**
   * 添加助手消息
   */
  const addAssistantMessage = (content: string) => {
    addMessage({ type: 'assistant', content })
  }

  return {
    messages,
    loading,
    currentId,
    setLoading,
    setCurrentId,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    createNewConversation,
    loadQuestion,
    initializeConversation
  }
}
