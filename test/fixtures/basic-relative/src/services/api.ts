import { User, UserService } from '../utils/helper'

class ApiService {
  private userService = new UserService()

  async fetchUsers(): Promise<User[]> {
    // Mock API call
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ]
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      id: Math.random().toString(36),
      ...userData,
    }
    this.userService.addUser(user)
    return user
  }
}

export { ApiService }
