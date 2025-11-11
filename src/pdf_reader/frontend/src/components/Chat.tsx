import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '../store/useAppStore'
import type { ChatMessage } from '../types'

interface ChatProps {
  modelOptions?: string[]
  defaultModel?: string
}

export function Chat({ modelOptions = ['gpt-4.1'], defaultModel = 'gpt-4.1' }: ChatProps) {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(defaultModel)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const {
    uploadedFileIds,
    conversationHistory,
    addChatMessage,
    clearChat,
    setConversationHistory,
  } = useAppStore()

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [])

  useEffect(() => {
    autoResizeTextarea()
  }, [question, autoResizeTextarea])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory, streamingContent, scrollToBottom])

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('specification_assistant_chat_history')
      if (saved) {
        const history = JSON.parse(saved)
        setConversationHistory(history)
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }, [setConversationHistory])

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('specification_assistant_chat_history', JSON.stringify(conversationHistory))
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }, [conversationHistory])

  const handleClearChat = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the conversation history?')) {
      clearChat()
      localStorage.removeItem('specification_assistant_chat_history')
    }
  }, [clearChat])

  const submitQuestion = useCallback(async () => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || uploadedFileIds.length === 0) {
      alert('Please enter a question and ensure PDFs are uploaded.')
      return
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmedQuestion }
    addChatMessage(userMessage)

    setQuestion('')
    setIsLoading(true)
    setIsStreaming(false)
    setStreamingContent('')

    let fullAnswer = ''
    let systemMessage: string | null = null
    let lastRenderTime = 0
    let isFirstChunk = true
    const RENDER_THROTTLE_MS = 32

    try {
      // Send conversation history without the current user message (which is sent separately as 'question')
      // and without system messages (similar to vanilla JS implementation)
      const historyToSend = conversationHistory.filter(msg => msg.role !== 'system')

      const response = await fetch('/ask-question-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: uploadedFileIds,
          question: trimmedQuestion,
          conversation_history: historyToSend,
          model_name: selectedModel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body reader')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6))

            if (data.type === 'system_message') {
              systemMessage = data.content
            } else if (data.type === 'chunk') {
              // First chunk - hide loading indicator and start streaming
              if (isFirstChunk) {
                setIsLoading(false)
                setIsStreaming(true)
                isFirstChunk = false
              }
              fullAnswer += data.content
              // Throttled update
              const now = Date.now()
              if (now - lastRenderTime >= RENDER_THROTTLE_MS) {
                setStreamingContent(fullAnswer)
                lastRenderTime = now
              }
            } else if (data.type === 'done') {
              // Final update
              setStreamingContent(fullAnswer)
              setIsStreaming(false)

              // Build final conversation history
              // Start with existing history and append new messages
              const newHistory: ChatMessage[] = [...conversationHistory]

              // Add system message at the beginning ONLY if we don't have one yet
              if (systemMessage && !newHistory.some(msg => msg.role === 'system')) {
                newHistory.unshift({ role: 'system', content: systemMessage })
              }

              // Append user and assistant messages
              newHistory.push(userMessage)
              newHistory.push({ role: 'assistant', content: fullAnswer })

              setConversationHistory(newHistory)
            } else if (data.type === 'error') {
              throw new Error(data.content)
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setIsStreaming(false)
      setStreamingContent('')
      addChatMessage({
        role: 'assistant',
        content: `Error: ${errorMessage}`,
      })
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent('')
      textareaRef.current?.focus()
    }
  }, [question, uploadedFileIds, conversationHistory, selectedModel, addChatMessage, setConversationHistory])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitQuestion()
    }
  }

  const visibleMessages = conversationHistory.filter(msg => msg.role !== 'system')

  return (
    <div className="chat-container">
      <div className="chat-section">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-status">
            {uploadedFileIds.length > 0
              ? `Ready to answer questions (${uploadedFileIds.length} PDF${uploadedFileIds.length > 1 ? 's' : ''})`
              : 'Upload PDFs to start asking questions'}
          </div>
          <div className="model-picker-inline">
            <span className="model-picker-label">Model:</span>
            <select
              className="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <button className="clear-chat-btn" onClick={handleClearChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages-container" ref={messagesContainerRef}>
          {visibleMessages.length === 0 && !isStreaming ? (
            <div className="chat-welcome">
              Ask questions about your uploaded PDFs and get AI-powered answers.
            </div>
          ) : (
            <>
              {visibleMessages.map((msg, index) => (
                <ChatMessageComponent key={index} message={msg} />
              ))}
              {isStreaming && streamingContent && (
                <div className="chat-message assistant">
                  <div className="chat-message-role">Assistant</div>
                  <div className="chat-message-content">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
          {isLoading && !isStreaming && (
            <div className="typing-indicator active">
              <span />
              <span />
              <span />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your PDFs..."
            disabled={isLoading || uploadedFileIds.length === 0}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={submitQuestion}
            disabled={isLoading || !question.trim() || uploadedFileIds.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

interface ChatMessageProps {
  message: ChatMessage
}

function ChatMessageComponent({ message }: ChatMessageProps) {
  const roleLabel = message.role === 'user' ? 'You' : 'Assistant'
  const isError = message.role === 'assistant' && message.content.startsWith('Error:')

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="chat-message-role">{roleLabel}</div>
      <div className="chat-message-content">
        {message.role === 'assistant' && !isError ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          <span style={isError ? { color: '#EF4444' } : undefined}>{message.content}</span>
        )}
      </div>
    </div>
  )
}
