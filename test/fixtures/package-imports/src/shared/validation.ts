export interface ValidationRule<T = any> {
  name: string;
  validator: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validator<T = any> {
  private rules: ValidationRule<T>[] = [];

  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const createValidator = <T>(): Validator<T> => {
  return new Validator<T>();
};

// Common validation rules
export const emailRule: ValidationRule<string> = {
  name: 'email',
  validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: 'Invalid email format',
};

export const requiredRule: ValidationRule<any> = {
  name: 'required',
  validator: (value: any) => value != null && value !== '',
  message: 'Field is required',
};
