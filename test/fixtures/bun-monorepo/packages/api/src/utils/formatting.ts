import { slugify, capitalize } from '@test-monorepo/core/utils/string-utils';
import { User } from '@test-monorepo/core/types/user';

export const formatUserName = (user: User): string => {
  return capitalize(user.name);
};

export const formatUserSlug = (user: User): string => {
  return slugify(user.name);
};