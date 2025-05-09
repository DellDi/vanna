import { useState } from 'react'
import { generateExampleQuestionsAction } from '@/lib/actions'
import { toast } from 'sonner'

/**
 * 示例问题 Hook
 * 用于获取和管理示例问题列表
 */
export function useExampleQuestions() {
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * 获取示例问题列表
   */
  const fetchExampleQuestions = async () => {
    try {
      setLoading(true)
      const response = await generateExampleQuestionsAction()
      if (response && response.questions && Array.isArray(response.questions)) {
        setExampleQuestions(response.questions)
      }
    } catch (error) {
      console.error('获取示例问题失败:', error)
      toast.error('获取示例问题失败')
    } finally {
      setLoading(false)
    }
  }

  return {
    exampleQuestions,
    fetchExampleQuestions,
    loading
  }
}
