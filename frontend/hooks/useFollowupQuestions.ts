import { useState } from 'react'
import { generateFollowupQuestionsAction } from '@/lib/actions'
import { toast } from 'sonner'

/**
 * 后续问题 Hook
 * 用于获取和管理后续问题推荐
 */
export function useFollowupQuestions() {
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * 生成后续问题
   * @param id 查询ID
   */
  const generateFollowupQuestions = async (id: string) => {
    if (!id) {
      toast.error('无效的查询ID')
      return false
    }

    try {
      setLoading(true)
      // 生成后续问题
      const response = await generateFollowupQuestionsAction(id)
      if (response && response.questions && Array.isArray(response.questions)) {
        setFollowupQuestions(response.questions)
        return true
      } else {
        // 如果返回的数据结构不符合预期，设置为空数组
        setFollowupQuestions([])
        return false
      }
    } catch (error) {
      console.error('生成后续问题失败:', error)
      // 出错时设置为空数组，避免显示之前的后续问题
      setFollowupQuestions([])
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * 清空后续问题
   */
  const clearFollowupQuestions = () => {
    setFollowupQuestions([])
  }

  return {
    followupQuestions,
    loading,
    generateFollowupQuestions,
    clearFollowupQuestions
  }
}
