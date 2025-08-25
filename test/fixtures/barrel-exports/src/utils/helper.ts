export interface User {
  id: string;
  name: string;
  email: string;
}

export const formatUserName = (user: User): string => {
  return `${user.name} (${user.email})`;
};

export const validateEmail = (email: string): boolean => {
  return email.includes('@') && email.includes('.');
};

export class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }
}
