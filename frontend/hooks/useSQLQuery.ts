import { useState } from 'react'
import { toast } from 'sonner'
import { 
  generateSQLAction,
  runSQLAction,
  generatePlotlyFigureAction
} from '@/lib/actions'

/**
 * SQL查询 Hook
 * 用于处理SQL查询生成、执行和结果处理
 */
export function useSQLQuery() {
  const [loading, setLoading] = useState(false)

  /**
   * 生成SQL查询
   * @param message 用户输入的问题
   */
  const generateSQL = async (message: string) => {
    try {
      setLoading(true)

      // 生成SQL查询
      const response = await generateSQLAction(message)

      // 检查响应中是否包含错误信息
      if (
        response.text.includes('insufficient_context') ||
        response.text.includes('无法确定')
      ) {
        return {
          success: false,
          error: 'insufficient_context',
          message: '抱歉，我无法确定相关的具体表结构和字段信息，需要更多上下文来生成准确的SQL查询。请提供更多信息或尝试其他问题。',
          id: null
        }
      }

      return {
        success: true,
        text: response.text,
        id: response.id
      }
    } catch (error) {
      console.error('生成SQL查询失败:', error)
      toast.error('生成SQL查询失败')
      return {
        success: false,
        error: 'generation_failed',
        message: '抱歉，生成SQL查询时出现错误。',
        id: null
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 执行SQL查询
   * @param id 查询ID
   */
  const runQuery = async (id: string) => {
    if (!id) {
      toast.error('没有可执行的查询ID')
      return { success: false }
    }

    try {
      setLoading(true)

      // 执行SQL查询
      const dfResponse = await runSQLAction(id)

      // 将结果添加到消息中
      if (dfResponse && dfResponse.df) {
        try {
          // 解析JSON数据
          const data = JSON.parse(dfResponse.df)
          const formattedData = JSON.stringify(data, null, 2)

          toast.success('查询执行成功')
          
          return {
            success: true,
            data,
            formattedData,
            shouldGenerateChart: dfResponse.should_generate_chart
          }
        } catch (parseError) {
          console.error('解析查询结果失败:', parseError)
          return {
            success: true,
            rawData: dfResponse.df,
            shouldGenerateChart: false
          }
        }
      }
      
      return { success: false }
    } catch (error) {
      console.error('执行查询失败:', error)
      toast.error('执行查询失败')
      return {
        success: false,
        error: '执行查询失败，请检查SQL语句或稍后再试。'
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 生成图表
   * @param id 查询ID
   */
  const generateChart = async (id: string) => {
    if (!id) {
      toast.error('无效的查询ID')
      return { success: false }
    }

    try {
      setLoading(true)
      // 生成图表
      const figResponse = await generatePlotlyFigureAction(id)

      if (figResponse && figResponse.fig) {
        toast.success('图表生成成功')
        return {
          success: true,
          fig: figResponse.fig
        }
      }
      
      return { success: false }
    } catch (error) {
      console.error('生成图表失败:', error)
      toast.error('生成图表失败')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 导出数据为CSV
   * @param id 查询ID
   */
  const exportData = (id: string) => {
    if (!id) {
      toast.error('无效的查询ID')
      return false
    }

    try {
      // 导出数据为CSV
      window.open(`/api/v0/download_csv?id=${id}`, '_blank')
      toast.success('数据导出成功')
      return true
    } catch (error) {
      console.error('导出数据失败:', error)
      toast.error('导出数据失败')
      return false
    }
  }

  return {
    loading,
    generateSQL,
    runQuery,
    generateChart,
    exportData
  }
}
