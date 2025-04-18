/**
 * 消息输入组件 - 处理用户输入
 */
"use client"

import { useState, KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mic, Send } from "lucide-react"

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim())
      setInputValue("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="border-t p-4">
      <div className="max-w-4xl mx-auto relative">
        <Input
          placeholder="询问有关数据的问题..."
          className="pr-24 py-6 text-base"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" disabled={disabled}>
            <Mic size={18} />
          </Button>
          <Button 
            size="icon" 
            className="rounded-full h-9 w-9" 
            onClick={handleSendMessage}
            disabled={disabled || !inputValue.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
