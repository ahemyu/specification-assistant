<script>
  import { notification } from '$lib/stores/notificationStore';
</script>

{#if $notification}
  <div class="status-message {$notification.type}">
    {$notification.message}
  </div>
{/if}

<style>
  .status-message {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-weight: 500;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
    max-width: 400px;
  }

  .status-message.info {
    background-color: #59BDB9;
    color: white;
  }

  .status-message.success {
    background-color: #87BD25;
    color: white;
  }

  .status-message.error {
    background-color: #e53e3e;
    color: white;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .status-message {
      left: 20px;
      right: 20px;
      max-width: none;
    }
  }
</style>
