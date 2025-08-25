import { CreateUserRequest, UpdateUserRequest, UserRole } from '@test-monorepo/core';
import { UserValidator, ValidationError } from '@test-monorepo/core/utils/validation';

export interface UserFormProps {
  initialData?: UpdateUserRequest;
  onSubmit: (data: CreateUserRequest) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}) => {
  const [formData, setFormData] = React.useState<CreateUserRequest>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || UserRole.USER,
  });

  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  const validateForm = (): boolean => {
    const validation = UserValidator.validateCreateUserRequest(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof CreateUserRequest>(
    field: K,
    value: CreateUserRequest[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors for this field
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className='user-form space-y-4'>
      <h2 className='text-xl font-bold mb-4'>
        {mode === 'create' ? 'Create User' : 'Edit User'}
      </h2>

      <div className='form-field'>
        <label htmlFor='name' className='block text-sm font-medium mb-1'>
          Name *
        </label>
        <input
          id='name'
          type='text'
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded ${getFieldError('name') ? 'border-red-500' : 'border-gray-300'}`}
          placeholder='Enter user name'
          disabled={loading}
        />
        {getFieldError('name') && <p className='text-red-500 text-xs mt-1'>{getFieldError('name')}</p>}
      </div>

      <div className='form-field'>
        <label htmlFor='email' className='block text-sm font-medium mb-1'>
          Email *
        </label>
        <input
          id='email'
          type='email'
          value={formData.email}
          onChange={e => updateField('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded ${getFieldError('email') ? 'border-red-500' : 'border-gray-300'}`}
          placeholder='Enter email address'
          disabled={loading}
        />
        {getFieldError('email') && <p className='text-red-500 text-xs mt-1'>{getFieldError('email')}</p>}
      </div>

      <div className='form-field'>
        <label htmlFor='role' className='block text-sm font-medium mb-1'>
          Role
        </label>
        <select
          id='role'
          value={formData.role}
          onChange={e => updateField('role', e.target.value as UserRole)}
          className={`w-full px-3 py-2 border rounded ${getFieldError('role') ? 'border-red-500' : 'border-gray-300'}`}
          disabled={loading}
        >
          {Object.values(UserRole).map(role => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
        {getFieldError('role') && <p className='text-red-500 text-xs mt-1'>{getFieldError('role')}</p>}
      </div>

      <div className='flex gap-2 pt-4'>
        <button
          type='submit'
          disabled={loading}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
        >
          {loading ? 'Submitting...' : (mode === 'create' ? 'Create User' : 'Update User')}
        </button>
        {onCancel && (
          <button
            type='button'
            onClick={onCancel}
            disabled={loading}
            className='px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50'
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
