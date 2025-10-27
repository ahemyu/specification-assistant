<script>
  import { previewModal } from '$lib/stores/extractionStore';
  import { previewFile, getDownloadUrl } from '$lib/api/client';
  import { notification } from '$lib/stores/notificationStore';

  let { file, onDelete } = $props();

  async function handlePreview() {
    try {
      const data = await previewFile(file.file_id);
      previewModal.set({
        isOpen: true,
        fileId: file.file_id,
        filename: data.filename,
        content: data.content,
        size: data.size
      });
    } catch (error) {
      notification.show(`Preview failed: ${error.message}`, 'error');
    }
  }
</script>

<div class="file-card">
  <div class="file-header">
    <div class="file-info">
      <h3 class="file-name">{file.filename}</h3>
      <p class="file-pages">{file.total_pages} pages</p>
    </div>
  </div>

  <div class="file-actions">
    <button class="action-btn preview" onclick={handlePreview}>
      Preview Text
    </button>
    <a
      href={getDownloadUrl(file.file_id)}
      download
      class="action-btn download"
    >
      Download Text File
    </a>
    <button class="action-btn delete" onclick={onDelete}>
      Delete
    </button>
  </div>
</div>

<style>
  .file-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
  }

  .file-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .file-header {
    margin-bottom: 20px;
  }

  .file-info {
    min-width: 0;
  }

  .file-name {
    margin: 0 0 5px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-pages {
    margin: 0;
    font-size: 0.9rem;
    color: #718096;
  }

  .file-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .action-btn {
    padding: 10px 15px;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .action-btn.preview {
    background-color: #59BDB9;
    color: white;
  }

  .action-btn.preview:hover {
    background-color: #4a9e9a;
  }

  .action-btn.download {
    background-color: #87BD25;
    color: white;
  }

  .action-btn.download:hover {
    background-color: #6fa01d;
  }

  .action-btn.delete {
    background-color: #e53e3e;
    color: white;
  }

  .action-btn.delete:hover {
    background-color: #c53030;
  }
</style>
