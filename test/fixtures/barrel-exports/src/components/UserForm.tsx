// Import from barrel index
import { User, required, isEmail } from '../utils/index.js';

export interface UserFormProps {
  onSubmit: (user: User) => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = React.useState({ id: '', name: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!required(formData.name) || !required(formData.email)) {
      alert('Name and email are required');
      return;
    }
    
    if (!isEmail(formData.email)) {
      alert('Please enter a valid email');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Name" 
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />
      <input 
        type="email" 
        placeholder="Email" 
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />
      <button type="submit">Submit</button>
    </form>
  );
};