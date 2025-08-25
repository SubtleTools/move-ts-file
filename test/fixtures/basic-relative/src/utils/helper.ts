export interface User {
  id: string
  name: string
  email: string
}

export class UserService {
  private users: User[] = []

  addUser(user: User): void {
    this.users.push(user)
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id)
  }
}

export const formatUserName = (user: User): string => {
  return `${user.name} (${user.email})`
}
