import { User } from '@test-monorepo/core/types/user';
import { capitalize, slugify } from '@test-monorepo/core/utils/string-utils';

export const formatUserName = (user: User): string => {
  return capitalize(user.name);
};

export const formatUserSlug = (user: User): string => {
  return slugify(user.name);
};
