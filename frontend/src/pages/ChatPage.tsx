import { useState, useRef, useEffect } from "react"
import { ragAPI } from "../lib/api"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card } from "../components/ui/card"
import { TypingIndicator } from "../components/ui/spinner"
import { Send, Bot, User, FileText, RefreshCw } from "lucide-react"
import type { ChatMessage, Source } from "../types"

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const chatHistory = messages
    .reduce<{ question: string; answer: string }[]>((acc, msg, idx, arr) => {
      if (msg.role === "user" && arr[idx + 1]?.role === "assistant") {
        acc.push({ question: msg.content, answer: arr[idx + 1].content })
      }
      return acc
    }, [])
    .slice(-3)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const query = input.trim()
    setInput("")

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const data = await ragAPI.ask(query, chatHistory)
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err.response?.data?.detail || "An error occurred. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Medical Assistant</h2>
          <p className="text-sm text-muted-foreground">Ask questions about your medical documents</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Clear Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">How can I help you today?</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Upload a medical PDF first, then ask me anything about its content.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "What is the recommended dosage?",
                  "What are the contraindications?",
                  "Describe the maintenance procedure",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                    className="rounded-full border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "order-first" : ""}`}>
                <Card className={`px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </Card>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src: Source, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                      >
                        <FileText className="h-3 w-3" />
                        {src.source}
                        {src.page && <span className="text-muted-foreground">p.{src.page}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <Card className="px-4 py-1">
                <TypingIndicator />
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-4 py-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask a question about your documents..."
            disabled={loading}
            className="flex-1"
            autoFocus
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
