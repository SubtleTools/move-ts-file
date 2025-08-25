import { TextInput } from '../../../src/components/ui/inputs/TextInput'
import { MinLengthRule, RequiredRule } from '../../../src/utils/validation/rules'

describe('TextInput', () => {
  test('renders with basic props', () => {
    const mockOnChange = jest.fn()

    const { container } = render(
      <TextInput
        value='test value'
        onChange={mockOnChange}
        placeholder='Test placeholder'
      />,
    )

    const input = container.querySelector('input')
    expect(input).toHaveValue('test value')
    expect(input).toHaveAttribute('placeholder', 'Test placeholder')
  })

  test('calls onChange when input changes', () => {
    const mockOnChange = jest.fn()

    const { container } = render(
      <TextInput value='' onChange={mockOnChange} />,
    )

    const input = container.querySelector('input')
    fireEvent.change(input, { target: { value: 'new value' } })

    expect(mockOnChange).toHaveBeenCalledWith('new value')
  })

  test('shows error message when error prop is provided', () => {
    const mockOnChange = jest.fn()

    const { container } = render(
      <TextInput
        value=''
        onChange={mockOnChange}
        error='This field is required'
      />,
    )

    expect(container.querySelector('.text-input__error')).toHaveTextContent('This field is required')
    expect(container.querySelector('input')).toHaveClass('text-input--error')
  })

  test('validation rules work correctly', () => {
    const requiredRule = new RequiredRule()
    const minLengthRule = new MinLengthRule(5)

    expect(requiredRule.validate('')).toBe(false)
    expect(requiredRule.validate('test')).toBe(true)

    expect(minLengthRule.validate('test')).toBe(false)
    expect(minLengthRule.validate('testing')).toBe(true)
  })
})
