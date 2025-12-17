import { useEffect, useState } from 'react'
import { onNotification, type Notification } from '../utils/notifications'

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const unsubscribe = onNotification((notification) => {
      setNotifications((prev) => [...prev, notification])

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, 5000)
    })

    return unsubscribe
  }, [])

  if (notifications.length === 0) return null

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          role="status"
          aria-live="polite"
        >
          {notification.message}
          <button
            className="notification-close"
            onClick={() =>
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
            }
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
