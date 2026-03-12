export interface UploadedFile {
  id: number
  name: string
  size?: number
}

export interface ProcessedFile {
  id: number
  file_name: string
  total_pages: number
}

export interface ExtractionResult {
  key: string
  value: string
  references: Reference[]
}

export interface Reference {
  document_id: number
  file_name: string
  page_number: number
  text: string
  bounding_box?: [number, number, number, number]
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
  [documentId: number]: any
}

// PDF Comparison types
export interface ComparisonChange {
  specification_name: string
  change_type: 'added' | 'modified' | 'removed'
  old_value: string | null
  new_value: string | null
  description: string
  pages_old: number[]
  pages_new: number[]
}

export interface ComparisonResult {
  summary: string
  total_changes: number
  changes: ComparisonChange[]
}

export type ChangeFilter = 'all' | 'added' | 'modified' | 'removed'
