import { CreateUserRequest, UpdateUserRequest, User, UserRole, UserSummary } from '@test-monorepo/core'
import { ValidationError } from '@test-monorepo/core/utils/validation'
import { InMemoryUserRepository, UserRepository } from '../services/user-repository'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: string[]
}

export class UserController {
  constructor(private userRepository: UserRepository = new InMemoryUserRepository()) {}

  async getAllUsers(limit?: number, offset?: number): Promise<ApiResponse<User[]>> {
    try {
      const users = await this.userRepository.findAll(limit, offset)
      return {
        success: true,
        data: users,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.findById(id)
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        }
      }
      return {
        success: true,
        data: user,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.findByEmail(email)
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        }
      }
      return {
        success: true,
        data: user,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.create(userData)
      return {
        success: true,
        data: user,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
          errors: [error.message],
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.update(id, userData)
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        }
      }
      return {
        success: true,
        data: user,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
          errors: [error.message],
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<boolean>> {
    try {
      const deleted = await this.userRepository.delete(id)
      if (!deleted) {
        return {
          success: false,
          error: 'User not found',
        }
      }
      return {
        success: true,
        data: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getUserSummaries(): Promise<ApiResponse<UserSummary[]>> {
    try {
      const summaries = await this.userRepository.getUserSummaries()
      return {
        success: true,
        data: summaries,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getUsersByRole(role: UserRole): Promise<ApiResponse<User[]>> {
    try {
      if (this.userRepository instanceof InMemoryUserRepository) {
        const users = await this.userRepository.getUsersByRole(role)
        return {
          success: true,
          data: users,
        }
      }
      // Fallback for other repository implementations
      const allUsers = await this.userRepository.findAll()
      const filteredUsers = allUsers.filter(user => user.role === role)
      return {
        success: true,
        data: filteredUsers,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
