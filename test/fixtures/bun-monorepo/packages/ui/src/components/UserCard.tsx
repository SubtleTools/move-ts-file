import { User, UserRole } from '@test-monorepo/core/types/user'
import { UserValidator } from '@test-monorepo/core/utils/validation'

export interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  onDelete?: (userId: string) => void
  readonly?: boolean
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  readonly = false,
}) => {
  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-500'
      case UserRole.MODERATOR:
        return 'bg-yellow-500'
      case UserRole.USER:
        return 'bg-blue-500'
      case UserRole.GUEST:
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  const isValidEmail = UserValidator.validateEmail(user.email).isValid

  return (
    <div className='user-card p-4 border rounded-lg shadow'>
      <div className='flex justify-between items-start mb-2'>
        <h3 className='text-lg font-semibold'>{user.name}</h3>
        <span className={`px-2 py-1 text-xs rounded text-white ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>
      </div>

      <div className='mb-2'>
        <p className={`text-sm ${isValidEmail ? 'text-gray-600' : 'text-red-600'}`}>
          {user.email}
          {!isValidEmail && <span className='ml-1'>⚠️</span>}
        </p>
        <p className='text-xs text-gray-500'>ID: {user.id}</p>
      </div>

      <div className='text-xs text-gray-500 mb-3'>
        <p>Created: {user.createdAt.toLocaleDateString()}</p>
        <p>Updated: {user.updatedAt.toLocaleDateString()}</p>
      </div>

      {!readonly && (
        <div className='flex gap-2'>
          {onEdit && (
            <button
              onClick={() => onEdit(user)}
              className='px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600'
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(user.id)}
              className='px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600'
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
