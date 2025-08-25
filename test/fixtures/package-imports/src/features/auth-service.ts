import { createValidator, emailRule, requiredRule } from '../shared/validation'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  token?: string
  errors?: string[]
}

export class AuthService {
  private loginValidator = createValidator<LoginCredentials>()
    .addRule({
      name: 'email_required',
      validator: creds => !!creds.email,
      message: 'Email is required',
    })
    .addRule({
      name: 'email_format',
      validator: creds => emailRule.validator(creds.email),
      message: 'Invalid email format',
    })
    .addRule({
      name: 'password_required',
      validator: creds => !!creds.password,
      message: 'Password is required',
    })

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const validation = this.loginValidator.validate(credentials)

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      }
    }

    // Mock authentication logic
    if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
      return {
        success: true,
        token: 'mock-jwt-token-' + Date.now(),
      }
    }

    return {
      success: false,
      errors: ['Invalid credentials'],
    }
  }
}
