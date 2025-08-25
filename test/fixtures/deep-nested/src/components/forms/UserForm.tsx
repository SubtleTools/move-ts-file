import { EmailRule, RequiredRule } from '../../utils/validation/rules';
import { TextInput } from '../ui/inputs/TextInput';

export interface UserFormData {
  username: string;
  email: string;
  fullName: string;
}

export interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = React.useState<UserFormData>({
    username: initialData?.username || '',
    email: initialData?.email || '',
    fullName: initialData?.fullName || '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof UserFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    const requiredRule = new RequiredRule();
    const emailRule = new EmailRule();

    if (!requiredRule.validate(formData.username)) {
      newErrors.username = requiredRule.message;
    }

    if (!requiredRule.validate(formData.email)) {
      newErrors.email = requiredRule.message;
    } else if (!emailRule.validate(formData.email)) {
      newErrors.email = emailRule.message;
    }

    if (!requiredRule.validate(formData.fullName)) {
      newErrors.fullName = requiredRule.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof UserFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className='user-form'>
      <div className='form-field'>
        <label>Username</label>
        <TextInput
          value={formData.username}
          onChange={updateField('username')}
          placeholder='Enter username'
          required
          minLength={3}
          disabled={loading}
          error={errors.username}
        />
      </div>

      <div className='form-field'>
        <label>Email</label>
        <TextInput
          value={formData.email}
          onChange={updateField('email')}
          placeholder='Enter email'
          required
          disabled={loading}
          error={errors.email}
        />
      </div>

      <div className='form-field'>
        <label>Full Name</label>
        <TextInput
          value={formData.fullName}
          onChange={updateField('fullName')}
          placeholder='Enter full name'
          required
          disabled={loading}
          error={errors.fullName}
        />
      </div>

      <button type='submit' disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
