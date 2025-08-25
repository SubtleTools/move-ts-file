import type { Logger } from '~utils/logger'
import { EventBus, globalEventBus } from '../core/event-bus'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  duration?: number
}

export interface NotificationOptions {
  type?: Notification['type']
  duration?: number
  persist?: boolean
}

export class NotificationService {
  private notifications: Map<string, Notification> = new Map()
  private eventBus: EventBus

  constructor(eventBus: EventBus = globalEventBus) {
    this.eventBus = eventBus
  }

  show(title: string, message: string, options: NotificationOptions = {}): string {
    const notification: Notification = {
      id: this.generateId(),
      type: options.type || 'info',
      title,
      message,
      timestamp: new Date(),
      duration: options.duration,
    }

    this.notifications.set(notification.id, notification)

    this.eventBus.emit('notification:show', notification)

    if (!options.persist && notification.duration !== 0) {
      const timeout = notification.duration || 3000
      setTimeout(() => this.dismiss(notification.id), timeout)
    }

    return notification.id
  }

  dismiss(id: string): void {
    const notification = this.notifications.get(id)
    if (notification) {
      this.notifications.delete(id)
      this.eventBus.emit('notification:dismiss', notification)
    }
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values())
  }

  clear(): void {
    const notifications = Array.from(this.notifications.values())
    this.notifications.clear()
    notifications.forEach(notification => {
      this.eventBus.emit('notification:dismiss', notification)
    })
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
