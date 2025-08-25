import { userEventEmitter, AllUserEvents } from '@test-monorepo/core/events/user-events';

export const useUserNotifications = () => {
  React.useEffect(() => {
    const handleUserEvent = (event: AllUserEvents) => {
      switch (event.type) {
        case 'user:created':
          console.log('User created:', event.user.name);
          break;
        case 'user:updated':
          console.log('User updated:', event.user.name);
          break;
        case 'user:deleted':
          console.log('User deleted:', event.user.name);
          break;
      }
    };

    userEventEmitter.on('user:created', handleUserEvent);
    userEventEmitter.on('user:updated', handleUserEvent);
    userEventEmitter.on('user:deleted', handleUserEvent);

    return () => {
      // Note: Real implementation would need proper cleanup
    };
  }, []);
};