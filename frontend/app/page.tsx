'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { useChatInterface } from '@/hooks/useChatInterface'

export default function ChatInterface() {
  const {
    messages,
    loading,
    currentId,
    exampleQuestions,
    followupQuestions,
    handleSendMessage,
    handleRunQuery,
    handleGenerateChart,
    handleExportData,
    handleGenerateFollowup,
    handleRegenerateSQL
  } = useChatInterface()

  // 页面内容渲染

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
          currentId={currentId || ''}
          messages={messages}
          onRunQuery={handleRunQuery}
          onGenerateChart={handleGenerateChart}
          onExportData={handleExportData}
          onRegenerateSQL={handleRegenerateSQL}
          onGenerateFollowup={handleGenerateFollowup}
        />

        {/* 消息输入框 */}
        <MessageInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>
    </div>
  )
}
