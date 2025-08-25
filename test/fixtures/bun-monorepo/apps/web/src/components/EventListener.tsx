import { userEventEmitter } from '@test-monorepo/core';
import { useUserNotifications } from '@test-monorepo/ui/hooks/useUserNotifications';

export const EventListener: React.FC = () => {
  useUserNotifications();
  return null; // This is just an event listener component
};