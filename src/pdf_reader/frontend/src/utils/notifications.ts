export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  message: string
  type: NotificationType
}

let notificationCallbacks: Array<(notification: Notification) => void> = []

export function showNotification(message: string, type: NotificationType = 'info') {
  const notification: Notification = {
    id: Date.now().toString(),
    message,
    type,
  }

  notificationCallbacks.forEach((callback) => callback(notification))
}

export function onNotification(callback: (notification: Notification) => void) {
  notificationCallbacks.push(callback)
  return () => {
    notificationCallbacks = notificationCallbacks.filter((cb) => cb !== callback)
  }
}
