import { CreateUserRequest, User, UserRole } from '../types/user'

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export class UserValidator {
  static validateEmail(email: string): ValidationResult {
    const errors: ValidationError[] = []

    if (!email) {
      errors.push(new ValidationError('Email is required', 'email', 'required'))
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(new ValidationError('Invalid email format', 'email', 'invalid_format'))
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static validateUserRole(role: string): ValidationResult {
    const errors: ValidationError[] = []

    if (!Object.values(UserRole).includes(role as UserRole)) {
      errors.push(
        new ValidationError(
          `Invalid user role. Must be one of: ${Object.values(UserRole).join(', ')}`,
          'role',
          'invalid_enum',
        ),
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static validateCreateUserRequest(request: CreateUserRequest): ValidationResult {
    const errors: ValidationError[] = []

    if (!request.name || request.name.trim().length < 2) {
      errors.push(new ValidationError('Name must be at least 2 characters', 'name', 'min_length'))
    }

    const emailValidation = this.validateEmail(request.email)
    errors.push(...emailValidation.errors)

    if (request.role) {
      const roleValidation = this.validateUserRole(request.role)
      errors.push(...roleValidation.errors)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const isValidUser = (user: Partial<User>): user is User => {
  return !!(
    user.id
    && user.name
    && user.email
    && user.role
    && user.createdAt
    && user.updatedAt
  )
}
