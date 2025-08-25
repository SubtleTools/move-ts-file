import { UserController } from '@test-monorepo/api';
import { UserService } from '@test-monorepo/api/services/user-service';

export const useUserService = () => {
  const [service] = React.useState(() => {
    const controller = new UserController();
    return new UserService(controller);
  });

  return service;
};
