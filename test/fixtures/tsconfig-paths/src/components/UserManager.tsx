import { User, UserRepository } from '@services/user-repository';
import { DatabaseConfig } from '@utils/database';

interface UserManagerProps {
  dbConfig: DatabaseConfig;
}

export const UserManager: React.FC<UserManagerProps> = ({ dbConfig }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [repository] = React.useState(() => new UserRepository(dbConfig));

  const loadUser = async (id: number) => {
    const user = await repository.findById(id);
    if (user) {
      setUsers(prev => [...prev.filter(u => u.id !== id), user]);
    }
  };

  const createUser = async (userData: { username: string; email: string; }) => {
    const user = await repository.create(userData);
    setUsers(prev => [...prev, user]);
  };

  return (
    <div className='user-manager'>
      <h2>User Management</h2>
      <div className='user-list'>
        {users.map(user => (
          <div key={user.id} className='user-item'>
            <span>{user.username}</span>
            <span>{user.email}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
