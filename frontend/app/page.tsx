"use client"

import type React from "react"

import { useState } from "react"
import { Mic, Send, Settings, Plus, MessageSquare, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DellDiLogo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export default function ChatInterface() {
  const router = useRouter()
  const [messages, setMessages] = useState([
    {
      type: "user",
      content: "金茂和狗狗的去年收入分别是多少?",
    },
    {
      type: "assistant",
      content: `SELECT
  CASE
    WHEN dwd_organization_name = '中国金茂' THEN '金茂'
    WHEN dwd_organization_name = '金茂狗' THEN '狗'
  END AS organization,
  SUM(CAST(chargePaid AS DECIMAL(10, 2))) AS total_income_last_year
FROM ns_dws.dws_target_finance tf
JOIN ns_dws.dwd_organizations o ON tf.enterpriseID = o.enterpriseId
WHERE currentDate BETWEEN '2022-01' AND '2022-12'
GROUP BY
  CASE
    WHEN dwd_organization_name = '中国金茂' THEN '金茂'
    WHEN dwd_organization_name = '金茂狗' THEN '狗'
  END;`,
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { type: "user", content: inputValue }])
      setInputValue("")
      // In a real app, you would send the message to an API and get a response
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const navigateToTrainingData = () => {
    router.push("/training-data")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col bg-card">
        <div className="p-4 flex items-center gap-2 border-b">
          <DellDiLogo className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-primary">DellDi</span>
          <ThemeToggle className="ml-auto" />
        </div>

        {/* Button area at the top left */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Database size={14} className="mr-1" />
              Connect
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={navigateToTrainingData}>
              <Settings size={14} className="mr-1" />
              Settings
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Button className="w-full justify-start gap-2" variant="default">
            <Plus size={16} />
            New conversation
          </Button>
        </div>

        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Conversations</h3>
        </div>

        <div className="overflow-y-auto flex-1 px-2">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-left font-normal h-auto py-2">
              <div className="flex items-center gap-2 w-full">
                <MessageSquare size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">金茂的收入</span>
              </div>
            </Button>

            <Button variant="secondary" className="w-full justify-start text-left font-normal h-auto py-2">
              <div className="flex items-center gap-2 w-full">
                <MessageSquare size={14} className="shrink-0" />
                <span className="truncate">金茂和狗狗的去年收入分别是多少?</span>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start text-left font-normal h-auto py-2">
              <div className="flex items-center gap-2 w-full">
                <MessageSquare size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">狗的去年收入</span>
              </div>
            </Button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t flex items-center justify-between">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
            v1.0.2
          </Badge>
          <Button variant="ghost" size="sm" className="text-xs">
            Sign out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="text-center py-12 px-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
            Welcome to DellDi
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Your AI-powered copilot for SQL queries.</p>
        </div>

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
                      <span className="font-medium">You</span>
                      <span className="text-xs text-muted-foreground ml-2">Just now</span>
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
                      <span className="text-xs text-muted-foreground ml-2">Just now</span>
                    </div>

                    <Card className="overflow-hidden border border-muted">
                      <CardContent className="p-0">
                        <pre className="font-mono text-sm p-4 overflow-x-auto bg-black text-green-400">
                          {message.content}
                        </pre>
                      </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="gap-1">
                        <span>Copy SQL</span>
                      </Button>
                      <Button variant="default" className="gap-1">
                        <span>Run Query</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto relative">
            <Input
              placeholder="Ask me a question about your data..."
              className="pr-24 py-6 text-base"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Mic size={18} />
              </Button>
              <Button size="icon" className="rounded-full h-9 w-9" onClick={handleSendMessage}>
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
