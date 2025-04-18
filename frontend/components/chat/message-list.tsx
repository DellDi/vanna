/**
 * 消息列表组件 - 显示聊天界面中的消息
 */
"use client"

import { Message } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { runSQLAction, generatePlotlyFigureAction } from "@/lib/actions"
import { toast } from "sonner"

interface MessageListProps {
  messages: Message[]
  onRunQuery?: (id: string) => void
}

export function MessageList({ messages, onRunQuery }: MessageListProps) {
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({})
  const [results, setResults] = useState<Record<number, any>>({})

  const handleCopySQL = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("SQL已复制到剪贴板")
  }

  const handleRunQuery = async (content: string, index: number) => {
    try {
      // 假设这是一个SQL响应，并且我们已经有了ID
      // 在实际实现中，你需要从前一个响应中获取ID
      if (onRunQuery) {
        onRunQuery(content)
      } else {
        setLoadingStates(prev => ({ ...prev, [index]: true }))
        // 这里应该是实际的实现逻辑
        toast.success("查询已执行")
        setLoadingStates(prev => ({ ...prev, [index]: false }))
      }
    } catch (error) {
      toast.error("执行查询失败")
      setLoadingStates(prev => ({ ...prev, [index]: false }))
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8">
      {messages.map((message, index) => (
        <div key={index} className="animate-slideIn">
          {message.type === "user" && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <span className="font-medium">你</span>
                  <span className="text-xs text-muted-foreground ml-2">刚刚</span>
                </div>
                <p className="text-foreground">{message.content}</p>
              </div>
            </div>
          )}

          {message.type === "assistant" && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto mt-6">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <AvatarFallback>DI</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex items-center">
                  <span className="font-medium">DellDi</span>
                  <span className="text-xs text-muted-foreground ml-2">刚刚</span>
                </div>

                <Card className="overflow-hidden border border-muted">
                  <CardContent className="p-0">
                    <pre className="font-mono text-sm p-4 overflow-x-auto bg-black text-green-400">
                      {message.content}
                    </pre>
                  </CardContent>
                </Card>

                {results[index] && (
                  <Card className="overflow-hidden border border-muted mt-4">
                    <CardContent className="p-4">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(results[index], null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => handleCopySQL(message.content)}
                  >
                    <span>复制 SQL</span>
                  </Button>
                  <Button 
                    variant="default" 
                    className="gap-1"
                    onClick={() => handleRunQuery(message.content, index)}
                    disabled={loadingStates[index]}
                  >
                    <span>{loadingStates[index] ? "执行中..." : "执行查询"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
