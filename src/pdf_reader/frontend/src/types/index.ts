export interface UploadedFile {
  id: string
  name: string
  size?: number
}

export interface ProcessedFile {
  file_id: string
  original_filename: string
  processed_filename: string
  status: string
}

export interface ExtractionResult {
  key: string
  value: string
  references: Reference[]
}

export interface Reference {
  file_id: string
  page_number: number
  text: string
}

export interface ReviewedKey {
  status: 'pending' | 'accepted' | 'edited'
  value: string
  originalValue: string
}

export type ExtractionMode = 'excel' | 'manual'
export type ExtractionState = 'setup' | 'review' | 'summary'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface PDFCache {
  [fileId: string]: any
}