import { MinLengthRule, RequiredRule, ValidationRule } from '../../../utils/validation/rules'

export interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  disabled?: boolean
  error?: string
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  disabled = false,
  error,
}) => {
  const rules: ValidationRule[] = []

  if (required) {
    rules.push(new RequiredRule())
  }

  if (minLength) {
    rules.push(new MinLengthRule(minLength))
  }

  const validate = (inputValue: string): string[] => {
    return rules
      .filter(rule => !rule.validate(inputValue))
      .map(rule => rule.message)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  return (
    <div className='text-input'>
      <input
        type='text'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'text-input--error' : ''}
      />
      {error && <span className='text-input__error'>{error}</span>}
    </div>
  )
}
