<script>
  import Navigation from '$lib/components/Navigation.svelte';
  import UploadView from '$lib/components/UploadView.svelte';
  import ChatView from '$lib/components/ChatView.svelte';
  import ExtractView from '$lib/components/ExtractView.svelte';
  import PreviewModal from '$lib/components/PreviewModal.svelte';
  import CarouselModal from '$lib/components/CarouselModal.svelte';
  import StatusNotification from '$lib/components/StatusNotification.svelte';
  import { uploadStore } from '$lib/stores/uploadStore';

  let activeTab = $state('upload');

  // Reactive variable to check if tabs should be enabled
  let tabsEnabled = $derived($uploadStore.fileIds.length > 0);
</script>

<div class="container">
  <header>
    <h1>Spec Assistant</h1>
    <p class="subtitle">Upload your PDF files and use LLMs to extract keys or ask questions</p>
  </header>

  <Navigation bind:activeTab {tabsEnabled} />

  <main>
    {#if activeTab === 'upload'}
      <UploadView />
    {:else if activeTab === 'qa'}
      <ChatView />
    {:else if activeTab === 'extract'}
      <ExtractView />
    {/if}
  </main>

  <PreviewModal />
  <CarouselModal />
  <StatusNotification />
</div>

<style>
  .container {
    max-width: 1600px;
    width: 100%;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 32px 40px;
    min-height: calc(100vh - 40px);
  }

  h1 {
    color: #1a202c;
    margin-bottom: 6px;
    font-size: 2.2em;
    font-weight: 700;
    letter-spacing: -0.02em;
    text-align: center;
  }

  .subtitle {
    color: #718096;
    margin-bottom: 20px;
    font-size: 1em;
    text-align: center;
    line-height: 1.5;
  }
</style>
