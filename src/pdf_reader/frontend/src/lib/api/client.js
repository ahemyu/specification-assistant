// API client for backend communication
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Upload multiple PDF files
 */
export async function uploadPdfs(files) {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a PDF file by ID
 */
export async function deletePdf(fileId) {
  const response = await fetch(`${API_BASE}/delete-pdf/${fileId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Delete failed');
  }

  return response.json();
}

/**
 * Preview a file's content
 */
export async function previewFile(fileId) {
  const response = await fetch(`${API_BASE}/preview/${fileId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Preview failed');
  }

  return response.json();
}

/**
 * Ask a question with streaming response
 * Returns an async generator that yields response chunks
 */
export async function* askQuestionStream(fileIds, question, history, modelName) {
  const response = await fetch(`${API_BASE}/ask-question-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_ids: fileIds,
      question: question,
      conversation_history: history,
      model_name: modelName
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Question failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          yield data;
        } catch (e) {
          console.error('Failed to parse SSE data:', e);
        }
      }
    }
  }
}

/**
 * Extract keys from PDFs (manual mode)
 */
export async function extractKeys(fileIds, keyNames, context) {
  const response = await fetch(`${API_BASE}/extract-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_ids: fileIds,
      key_names: keyNames,
      additional_context: context
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Extraction failed');
  }

  return response.json();
}

/**
 * Upload an Excel template file
 */
export async function uploadExcelTemplate(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload-excel-template`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Template upload failed');
  }

  return response.json();
}

/**
 * Extract keys using uploaded Excel template
 */
export async function extractKeysFromTemplate(templateId, fileIds, context) {
  const response = await fetch(`${API_BASE}/extract-keys-from-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: templateId,
      file_ids: fileIds,
      additional_context: context
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Template extraction failed');
  }

  return response.json();
}

/**
 * Download extraction results as Excel
 */
export async function downloadExtractionExcel(results) {
  const response = await fetch(`${API_BASE}/download-extraction-excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      extraction_results: results
    })
  });

  if (!response.ok) {
    throw new Error('Download failed');
  }

  const blob = await response.blob();
  return blob;
}

/**
 * Download filled Excel template
 */
export async function downloadFilledExcel(templateId) {
  const response = await fetch(`${API_BASE}/download-filled-excel/${templateId}`);

  if (!response.ok) {
    throw new Error('Download failed');
  }

  const blob = await response.blob();
  return blob;
}

/**
 * Get download URL for a text file
 */
export function getDownloadUrl(fileId) {
  return `${API_BASE}/download/${fileId}`;
}
