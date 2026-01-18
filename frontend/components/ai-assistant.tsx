"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/app/providers"

interface Message {
  id: number
  role: "assistant" | "user"
  content: string
}

export function AIAssistant() {
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your AI Calendar Assistant. I can help you add events, check availability, or calculate travel times. What can I do for you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return
    if (!token) {
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), role: "assistant", content: "Please sign in to chat with me." }
        ])
        return
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Format history for Gemini (exclude the very first greeting if it's generic, or include it)
      // Map 'assistant' -> 'model'
      const history = messages
        .filter(m => m.id !== 1) // Optional: Skip the default greeting
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))

      const response = await api.chatWithAgent(currentInput, history, token)
      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: response.data.response,
          },
        ])
      } else {
        throw new Error(response.message || "Failed to get response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2d4a5e] flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-[#2d4a5e]">AI Agent</h3>
          <p className="text-xs text-[#6b7c8a]">Powered by Gemini 2.0</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            {message.role === "assistant" && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#2d4a5e] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/70 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-[#2d4a5e] leading-relaxed">{message.content}</p>
                </div>
              </div>
            )}
            {message.role === "user" && (
              <div className="flex justify-end">
                <div className="bg-[#2d4a5e] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-white">{message.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-[#2d4a5e] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/70 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#2d4a5e]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-white/40">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2 bg-white/70 rounded-full px-4 py-2"
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm text-[#2d4a5e] placeholder:text-[#6b7c8a] disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-full bg-[#2d4a5e] flex items-center justify-center hover:bg-[#1e3a4e] transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  )
}
