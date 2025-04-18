/**
 * 侧边栏组件 - 在不同页面中复用
 */
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DellDiLogo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { MessageSquare, Database, Settings, Plus, ArrowLeft, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getQuestionHistoryAction } from "@/lib/actions"
import { toast } from "sonner"

interface SidebarProps {
  currentPage: "chat" | "training"
  version?: string
}

export function Sidebar({ currentPage, version = "v1.0.2" }: SidebarProps) {
  const router = useRouter()
  const [recentQuestions, setRecentQuestions] = useState<Array<{id: string; question: string}>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestionHistory = async () => {
      try {
        setLoading(true)
        const response = await getQuestionHistoryAction()
        setRecentQuestions(response.questions || [])
      } catch (error) {
        console.error("获取问题历史失败:", error)
        toast.error("获取问题历史失败")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestionHistory()
  }, [])

  const navigateToChat = () => router.push("/")
  const navigateToTrainingData = () => router.push("/training-data")
  
  // 新建对话功能
  const handleNewConversation = () => {
    // 清除当前对话，跳转到主页
    router.push("/")
    // 通知主页面清除当前对话状态
    window.dispatchEvent(new CustomEvent("new-conversation"))
  }
  
  const handleQuestionClick = (id: string) => {
    // 实现加载问题的逻辑
    router.push(`/?id=${id}`)
  }

  return (
    <div className="w-72 border-r flex flex-col bg-card">
      <div className="p-4 flex items-center gap-2 border-b">
        <DellDiLogo className="h-8 w-8 text-primary" />
        <span className="text-xl font-semibold text-primary">DellDi</span>
        <ThemeToggle className="ml-auto" />
      </div>

      {/* 顶部按钮区域 */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Database size={14} className="mr-1" />
            连接
          </Button>
          <Button 
            variant={currentPage === "training" ? "secondary" : "outline"} 
            size="sm" 
            className="flex-1"
            onClick={navigateToTrainingData}
          >
            <Settings size={14} className="mr-1" />
            设置
          </Button>
        </div>
      </div>

      {/* 主要操作按钮 */}
      <div className="p-4">
        {currentPage === "chat" ? (
          <Button 
            className="w-full justify-start gap-2" 
            variant="default"
            onClick={handleNewConversation}
          >
            <Plus size={16} />
            新建对话
          </Button>
        ) : (
          <Button className="w-full justify-start gap-2" variant="default" onClick={navigateToChat}>
            <ArrowLeft size={16} />
            返回聊天
          </Button>
        )}
      </div>

      {/* 最近问题标题 */}
      <div className="px-4 py-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          {currentPage === "chat" ? "最近对话" : "最近问题"}
        </h3>
      </div>

      {/* 最近问题列表 */}
      <div className="overflow-y-auto flex-1 px-2">
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">加载中...</div>
        ) : recentQuestions.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">暂无历史记录</div>
        ) : (
          <div className="space-y-1">
            {recentQuestions.map((item, index) => (
              <Button
                key={item.id}
                variant={index === 1 ? "secondary" : "ghost"}
                className="w-full justify-start text-left font-normal h-auto py-2"
                onClick={() => handleQuestionClick(item.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  {currentPage === "chat" ? (
                    <MessageSquare size={14} className={index === 1 ? "" : "shrink-0 text-muted-foreground"} />
                  ) : (
                    <FileText size={14} className={index === 1 ? "" : "shrink-0 text-muted-foreground"} />
                  )}
                  <span className="truncate">{item.question}</span>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="mt-auto p-4 border-t flex items-center justify-between">
        <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
          {version}
        </Badge>
        <Button variant="ghost" size="sm" className="text-xs">
          退出登录
        </Button>
      </div>
    </div>
  )
}
