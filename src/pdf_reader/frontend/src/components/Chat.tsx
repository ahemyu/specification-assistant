import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '../store/useAppStore'
import type { ChatMessage } from '../types'
import { IoClose, IoTrashOutline, IoSend } from "react-icons/io5";
import { useTranslation } from '../core/i18n/LanguageContext'

interface ChatProps {
  modelOptions?: string[]
  defaultModel?: string
}

export function Chat({ modelOptions = ['Gemini3-Flash'], defaultModel = 'Gemini3-Flash' }: ChatProps) {
  const { t, language } = useTranslation()
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
    setIsQAPopupOpen, // Import setIsQAPopupOpen
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
  }, [messagesContainerRef])

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
    if (window.confirm(t('confirmClearChat'))) {
      clearChat()
      localStorage.removeItem('specification_assistant_chat_history')
    }
  }, [clearChat, t])

  const submitQuestion = useCallback(async () => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || uploadedFileIds.length === 0) {
      alert(t('enterQuestionError'))
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
      // and without system messages 
      const historyToSend = conversationHistory.filter(msg => msg.role !== 'system')

      const response = await fetch('/ask-question-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: uploadedFileIds,
          question: trimmedQuestion,
          conversation_history: historyToSend,
          model_name: selectedModel,
          language: language,
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

              // Add system message at the beginning only if we don't have one yet
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
        content: `${t('errorPrefix')}${errorMessage}`,
      })
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent('')
      textareaRef.current?.focus()
    }
  }, [question, uploadedFileIds, conversationHistory, selectedModel, addChatMessage, setConversationHistory, t])

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
          <div className="model-picker-inline">
            <label htmlFor="modelSelect" className="model-picker-label">{t('modelLabel')}</label>
            <select
              id="modelSelect"
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
          <button className="clear-chat-btn" onClick={handleClearChat} title={t('clearChatTitle')}>
            <IoTrashOutline size={24} />
          </button>
          <button className="close-chat-btn" onClick={() => setIsQAPopupOpen(false)} title={t('closeChatTitle')}>
            <IoClose size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages-container" ref={messagesContainerRef}>
          {visibleMessages.length === 0 && !isStreaming ? (
            <div className="chat-welcome">
              <p>{t('chatWelcomeMessage')}</p>
            </div>
          ) : (
            <>
              {visibleMessages.map((msg, index) => (
                <ChatMessageComponent key={index} message={msg} />
              ))}
              {isStreaming && streamingContent && (
                <div className="chat-message assistant">
                  <div className="chat-message-role">{t('assistantRole')}</div>
                  <div className="chat-message-content">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Loading Indicator */}
        {isLoading && !isStreaming && (
          <div className="typing-indicator active">
            <span />
            <span />
            <span />
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            id="questionInput"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chatPlaceholder')}
            disabled={isLoading || uploadedFileIds.length === 0}
            rows={1}
            aria-label="Enter your question"
          />
          <button
            className="send-btn"
            id="askBtn"
            onClick={submitQuestion}
            disabled={isLoading || !question.trim() || uploadedFileIds.length === 0}
            title={t('sendMessageTitle')}
          >
            <IoSend />
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
  const { t } = useTranslation()
  const isUser = message.role === 'user';
  const roleLabel = isUser ? t('youRole') : t('assistantRole');
  const isError = message.role === 'assistant' && message.content.startsWith(t('errorPrefix'));

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="chat-message-role">{roleLabel}</div>
      <div className={`chat-message-content${isError ? ' chat-error' : ''}`}>
        {message.role === 'assistant' && !isError ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          <span>{message.content}</span>
        )}
      </div>
    </div>
  );
}
