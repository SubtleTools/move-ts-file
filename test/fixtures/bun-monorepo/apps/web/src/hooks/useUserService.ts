import { UserService } from '@test-monorepo/api/services/user-service';
import { UserController } from '@test-monorepo/api';

export const useUserService = () => {
  const [service] = React.useState(() => {
    const controller = new UserController();
    return new UserService(controller);
  });

  return service;
};