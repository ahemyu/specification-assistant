<script>
  import { carouselState } from '$lib/stores/extractionStore';

  function close() {
    carouselState.update(s => ({ ...s, isOpen: false }));
  }

  function next() {
    carouselState.update(s => ({
      ...s,
      currentIndex: (s.currentIndex + 1) % s.keyNames.length
    }));
  }

  function prev() {
    carouselState.update(s => ({
      ...s,
      currentIndex: (s.currentIndex - 1 + s.keyNames.length) % s.keyNames.length
    }));
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowRight') {
      next();
    } else if (e.key === 'ArrowLeft') {
      prev();
    }
  }

  let currentKeyName = $derived(
    $carouselState.keyNames[$carouselState.currentIndex] || ''
  );

  let currentResult = $derived(
    $carouselState.results[currentKeyName] || null
  );
</script>

{#if $carouselState.isOpen && currentResult}
  <div
    class="modal-overlay"
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="carousel-modal">
      {#if $carouselState.keyNames.length > 1}
        <button
          class="carousel-nav prev"
          onclick={prev}
          aria-label="Previous result"
        >
          ←
        </button>
      {/if}

      <div class="carousel-card">
        {#key $carouselState.currentIndex}
          <div class="card-header">
            <h2>{currentKeyName}</h2>
            <span class="card-counter">
              {$carouselState.currentIndex + 1} / {$carouselState.keyNames.length}
            </span>
          </div>

          <div class="card-body">
            <div class="result-section">
              <h3>Extracted Value:</h3>
              <div class="value-box">
                {currentResult.key_value || 'Not found'}
              </div>
            </div>

            {#if currentResult.description}
              <div class="result-section">
                <h3>Description:</h3>
                <p class="description">{currentResult.description}</p>
              </div>
            {/if}

            {#if currentResult.source_locations && currentResult.source_locations.length > 0}
              <div class="result-section">
                <h3>Source Locations:</h3>
                <ul class="sources-list">
                  {#each currentResult.source_locations as source}
                    <li>
                      <strong>{source.pdf_filename}</strong>
                      {#if source.page_numbers && source.page_numbers.length > 0}
                        - Pages: {source.page_numbers.join(', ')}
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/key}
      </div>

      {#if $carouselState.keyNames.length > 1}
        <button
          class="carousel-nav next"
          onclick={next}
          aria-label="Next result"
        >
          →
        </button>
      {/if}

      <button class="close-btn" onclick={close} aria-label="Close modal">
        ×
      </button>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }

  .carousel-modal {
    position: relative;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
  }

  .carousel-card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .card-header {
    background: linear-gradient(135deg, #1C2C8C 0%, #59BDB9 100%);
    color: white;
    padding: 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .card-counter {
    font-size: 1rem;
    opacity: 0.9;
    font-weight: 600;
  }

  .card-body {
    padding: 30px;
    overflow-y: auto;
    max-height: calc(90vh - 120px);
  }

  .card-body::-webkit-scrollbar {
    width: 8px;
  }

  .card-body::-webkit-scrollbar-track {
    background: #f7fafc;
  }

  .card-body::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
  }

  .result-section {
    margin-bottom: 25px;
  }

  .result-section:last-child {
    margin-bottom: 0;
  }

  .result-section h3 {
    margin: 0 0 10px 0;
    color: #1C2C8C;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .value-box {
    padding: 20px;
    background-color: #e6f9f8;
    border-radius: 8px;
    border: 2px solid #59BDB9;
    font-size: 1.1rem;
    color: #2d3748;
    word-wrap: break-word;
    font-weight: 500;
  }

  .description {
    margin: 0;
    padding: 15px;
    background-color: #f7fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    color: #4a5568;
    line-height: 1.6;
  }

  .sources-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .sources-list li {
    padding: 12px 15px;
    background-color: #f7fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    margin-bottom: 10px;
    color: #4a5568;
  }

  .sources-list li:last-child {
    margin-bottom: 0;
  }

  .sources-list strong {
    color: #2d3748;
  }

  .carousel-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.95);
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-size: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
    z-index: 10;
    color: #1C2C8C;
  }

  .carousel-nav:hover {
    background: white;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  .carousel-nav.prev {
    left: -70px;
  }

  .carousel-nav.next {
    right: -70px;
  }

  .close-btn {
    position: absolute;
    top: -50px;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    color: #e53e3e;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
    line-height: 1;
    padding: 0;
  }

  .close-btn:hover {
    background: white;
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    .modal-overlay {
      padding: 10px;
    }

    .carousel-modal {
      max-height: 95vh;
    }

    .carousel-nav {
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
    }

    .carousel-nav.prev {
      left: 10px;
    }

    .carousel-nav.next {
      right: 10px;
    }

    .close-btn {
      top: 10px;
      right: 10px;
      position: fixed;
    }

    .card-header {
      padding: 20px;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .card-header h2 {
      font-size: 1.2rem;
    }

    .card-body {
      padding: 20px;
    }
  }
</style>
