export interface ValidationRule {
  validate(value: any): boolean;
  message: string;
}

export class RequiredRule implements ValidationRule {
  message = 'Field is required';

  validate(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }
}

export class MinLengthRule implements ValidationRule {
  message: string;

  constructor(private minLength: number) {
    this.message = `Must be at least ${minLength} characters`;
  }

  validate(value: string): boolean {
    return typeof value === 'string' && value.length >= this.minLength;
  }
}

export class EmailRule implements ValidationRule {
  message = 'Invalid email format';

  validate(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}

export class NumericRule implements ValidationRule {
  message = 'Must be a number';

  validate(value: any): boolean {
    return !isNaN(Number(value));
  }
}
