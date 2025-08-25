export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest',
}

export interface CreateUserRequest {
  name: string
  email: string
  role?: UserRole
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  role?: UserRole
}

export type UserWithoutDates = Omit<User, 'createdAt' | 'updatedAt'>
export type UserSummary = Pick<User, 'id' | 'name' | 'role'>
