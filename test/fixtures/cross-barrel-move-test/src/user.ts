import { formatDate } from './utils';

export interface User {
  id: string;
  name: string;
  createdAt: Date;
}

export const displayUser = (user: User): string => {
  return `${user.name} (${formatDate(user.createdAt)})`;
};
