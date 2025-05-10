/**
 * 消息列表组件 - 显示聊天界面中的消息
 */
'use client'

import { Message } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Download,
  Copy,
  Play,
  BarChart4,
  RefreshCw,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface MessageListProps {
  currentId: string
  messages: Message[]
  onRunQuery?: (id: string) => void
  onGenerateChart?: (id: string) => void
  onExportData?: (id: string) => void
  onRegenerateSQL?: (id: string) => void
  onGenerateFollowup?: (id: string) => void
}

// 消息类型定义
// 用于识别消息的内容类型，以便显示不同的操作按钮
enum MessageContentType {
  WELCOME = 'welcome', // 欢迎消息
  SQL = 'sql', // SQL查询
  QUERY_RESULT = 'result', // 查询结果
  CHART = 'chart', // 图表
  ERROR = 'error', // 错误消息
  UNKNOWN = 'unknown', // 未知类型
}

export function MessageList({
  currentId,
  messages,
  onRunQuery,
  onGenerateChart,
  onExportData,
  onRegenerateSQL,
  onGenerateFollowup,
}: MessageListProps) {
  // 使用更精确的类型定义，支持字符串索引
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  )
  const [results, setResults] = useState<Record<string, any>>({})

  // 复制内容到剪贴板
  const handleCopy = (content: string, type: string = 'SQL') => {
    navigator.clipboard.writeText(content)
    toast.success(`${type}已复制到剪贴板`)
  }

  // 执行查询
  const handleRunQuery = async (content: string, index: number) => {
    const indexKey = index.toString()
    try {
      setLoadingStates((prev) => ({ ...prev, [indexKey]: true }))

      if (onRunQuery) {
        onRunQuery(content)
      } else {
        toast.success('查询已执行')
      }
    } catch (error) {
      toast.error('执行查询失败')
    } finally {
      setLoadingStates((prev) => ({ ...prev, [indexKey]: false }))
    }
  }

  // 生成图表
  const handleGenerateChart = (id: string, index: number) => {
    const chartKey = `chart_${index}`
    if (onGenerateChart) {
      setLoadingStates((prev) => ({ ...prev, [chartKey]: true }))
      try {
        onGenerateChart(id)
        toast.success('正在生成图表...')
      } catch (error) {
        toast.error('生成图表失败')
      } finally {
        setLoadingStates((prev) => ({ ...prev, [chartKey]: false }))
      }
    }
  }

  // 导出数据
  const handleExportData = (id: string) => {
    if (onExportData) {
      onExportData(id)
      toast.success('正在准备导出数据...')
    }
  }

  // 重新生成SQL
  const handleRegenerateSQL = (id: string, index: number) => {
    const regenKey = `regen_${index}`
    if (onRegenerateSQL) {
      setLoadingStates((prev) => ({ ...prev, [regenKey]: true }))
      try {
        onRegenerateSQL(id)
        toast.success('正在重新生成SQL...')
      } catch (error) {
        toast.error('重新生成SQL失败')
      } finally {
        setLoadingStates((prev) => ({ ...prev, [regenKey]: false }))
      }
    }
  }

  // 识别消息内容类型
  const identifyContentType = (
    message: Message,
    index: number
  ): MessageContentType => {
    if (message.type === 'user') {
      return MessageContentType.UNKNOWN
    }

    const content = message.content || ''

    // 欢迎消息
    if (content.includes('您好') && content.includes('SQL查询助手')) {
      return MessageContentType.WELCOME
    }

    // 错误消息
    if (
      content.includes('抱歉') ||
      content.includes('失败') ||
      content.includes('错误')
    ) {
      return MessageContentType.ERROR
    }

    // 查询结果
    if (content.includes('查询结果:')) {
      return MessageContentType.QUERY_RESULT
    }

    // 图表结果 - 如果有图表数据
    if (content.includes('plotly') || content.includes('chart')) {
      return MessageContentType.CHART
    }

    // 默认假设是SQL查询 - 检查是否含有SQL关键字
    if (
      content.includes('SELECT') ||
      content.includes('FROM') ||
      content.includes('WHERE') ||
      content.includes('GROUP BY') ||
      content.includes('ORDER BY') ||
      content.includes('JOIN')
    ) {
      return MessageContentType.SQL
    }

    return MessageContentType.UNKNOWN
  }

  // 根据消息类型渲染操作按钮
  const renderActionButtons = (message: Message, index: number) => {
    const contentType = identifyContentType(message, index)

    // 所有消息都有复制按钮，除了欢迎消息
    const copyButton =
      contentType !== MessageContentType.WELCOME ? (
        <Button
          variant="outline"
          className="gap-1"
          onClick={() =>
            handleCopy(
              message.content,
              contentType === MessageContentType.SQL ? 'SQL' : '内容'
            )
          }
        >
          <Copy className="h-4 w-4" />
          <span>
            复制{contentType === MessageContentType.SQL ? ' SQL' : ''}
          </span>
        </Button>
      ) : null

    // 根据消息类型渲染不同的按钮组
    switch (contentType) {
      case MessageContentType.SQL:
        const indexKey = index.toString()
        const regenKey = `regen_${index}`
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            {copyButton}
            <Button
              variant="default"
              className="gap-1"
              onClick={() => handleRunQuery(message.content, index)}
              disabled={loadingStates[indexKey]}
            >
              <Play className="h-4 w-4" />
              <span>{loadingStates[indexKey] ? '执行中...' : '执行查询'}</span>
            </Button>
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => handleRegenerateSQL(message.content, index)}
              disabled={loadingStates[regenKey]}
            >
              <RefreshCw className="h-4 w-4" />
              <span>
                {loadingStates[regenKey] ? '重新生成中...' : '重新生成'}
              </span>
            </Button>
          </div>
        )

      case MessageContentType.QUERY_RESULT:
        const chartKey = `chart_${index}`
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            {copyButton}
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => handleGenerateChart(currentId, index)}
              disabled={loadingStates[chartKey]}
            >
              <BarChart4 className="h-4 w-4" />
              <span>{loadingStates[chartKey] ? '生成中...' : '生成图表'}</span>
            </Button>
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => handleExportData(currentId)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>导出数据</span>
            </Button>
            <Button
              variant="outline"
              className="gap-1"
              onClick={() =>
                onGenerateFollowup && onGenerateFollowup(currentId)
              }
            >
              <MessageSquare className="h-4 w-4" />
              <span>更多问题建议</span>
            </Button>
          </div>
        )

      case MessageContentType.CHART:
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            {copyButton}
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => handleExportData(currentId)}
            >
              <Download className="h-4 w-4" />
              <span>下载图表</span>
            </Button>
          </div>
        )

      case MessageContentType.ERROR:
        return copyButton ? (
          <div className="flex flex-col sm:flex-row gap-3">{copyButton}</div>
        ) : null

      case MessageContentType.WELCOME:
        return null

      default:
        return copyButton ? (
          <div className="flex flex-col sm:flex-row gap-3">{copyButton}</div>
        ) : null
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8">
      {messages.map((message, index) => (
        <div key={index} className="animate-slideIn">
          {message.type === 'user' && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <span className="font-medium">你</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    刚刚
                  </span>
                </div>
                <p className="text-foreground">{message.content}</p>
              </div>
            </div>
          )}

          {message.type === 'assistant' && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto mt-6">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <AvatarFallback>DI</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex items-center">
                  <span className="font-medium">DellDi</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    刚刚
                  </span>
                </div>

                <Card className="overflow-hidden border border-muted">
                  <CardContent className="p-0">
                    <MarkdownRenderer
                      content={message.content}
                      className="p-4 overflow-x-auto"
                    />
                  </CardContent>
                </Card>

                {results[index] && (
                  <Card className="overflow-hidden border border-muted mt-4">
                    <CardContent className="p-4">
                      {/* <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(results[index], null, 2)}
                      </pre> */}
                      <MarkdownRenderer
                        content={JSON.stringify(results[index], null, 2)}
                        className="p-4 overflow-x-auto"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* 根据消息类型显示不同的操作按钮 */}
                {renderActionButtons(message, index)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
