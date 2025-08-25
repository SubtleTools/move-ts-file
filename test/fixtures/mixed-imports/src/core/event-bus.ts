import { createLogger, Logger, LogLevel } from '~utils/logger';

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe(): void;
}

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private logger: Logger;

  constructor() {
    this.logger = createLogger(LogLevel.DEBUG);
  }

  subscribe<T>(event: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);
    this.logger.debug(`Subscribed to event: ${event}`);

    return {
      unsubscribe: () => {
        const handlers = this.handlers.get(event);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.handlers.delete(event);
          }
        }
        this.logger.debug(`Unsubscribed from event: ${event}`);
      },
    };
  }

  async emit<T>(event: string, data: T): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers for event: ${event}`);
      return;
    }

    this.logger.info(`Emitting event: ${event}`, { data });

    const promises = Array.from(handlers).map(handler => {
      try {
        return Promise.resolve(handler(data));
      } catch (error) {
        this.logger.error(`Handler error for event: ${event}`, { error });
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }
}

export const globalEventBus = new EventBus();
