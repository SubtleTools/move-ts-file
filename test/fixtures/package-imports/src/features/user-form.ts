import { emailRule, requiredRule, ValidationResult, Validator } from '../shared/validation'

export interface UserFormData {
  username: string
  email: string
  age?: number
}

export class UserFormValidator {
  private usernameValidator = new Validator<string>()
    .addRule(requiredRule)
    .addRule({
      name: 'minLength',
      validator: (value: string) => value.length >= 3,
      message: 'Username must be at least 3 characters',
    })

  private emailValidator = new Validator<string>()
    .addRule(requiredRule)
    .addRule(emailRule)

  validate(formData: UserFormData): Record<keyof UserFormData, ValidationResult> {
    return {
      username: this.usernameValidator.validate(formData.username),
      email: this.emailValidator.validate(formData.email),
      age: { isValid: true, errors: [] }, // Age is optional
    }
  }

  isFormValid(formData: UserFormData): boolean {
    const results = this.validate(formData)
    return Object.values(results).every(result => result.isValid)
  }
}
