import { UserController } from '@test-monorepo/api'
import { CreateUserRequest, User, UserRole } from '@test-monorepo/core'
import { UserCard, UserForm } from '@test-monorepo/ui'

interface UserManagementPageProps {
  userController?: UserController
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  userController = new UserController(),
}) => {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await userController.getAllUsers()
      if (response.success && response.data) {
        setUsers(response.data)
      } else {
        setError(response.error || 'Failed to load users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (userData: CreateUserRequest): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await userController.createUser(userData)
      if (response.success && response.data) {
        setUsers(prev => [...prev, response.data!])
        setShowForm(false)
      } else {
        setError(response.error || 'Failed to create user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User): void => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleUpdateUser = async (userData: CreateUserRequest): Promise<void> => {
    if (!editingUser) return

    setLoading(true)
    setError(null)
    try {
      const response = await userController.updateUser(editingUser.id, userData)
      if (response.success && response.data) {
        setUsers(prev => prev.map(user => user.id === editingUser.id ? response.data! : user))
        setShowForm(false)
        setEditingUser(null)
      } else {
        setError(response.error || 'Failed to update user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this user?')) return

    setLoading(true)
    setError(null)
    try {
      const response = await userController.deleteUser(userId)
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== userId))
      } else {
        setError(response.error || 'Failed to delete user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelForm = (): void => {
    setShowForm(false)
    setEditingUser(null)
  }

  const getUsersByRole = (role: UserRole): User[] => {
    return users.filter(user => user.role === role)
  }

  const getTotalUserCount = (): number => {
    return users.length
  }

  const getActiveUserCount = (): number => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return users.filter(user => user.updatedAt >= thirtyDaysAgo).length
  }

  return (
    <div className='user-management-page p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>User Management</h1>
          <div className='flex gap-6 mt-2 text-sm text-gray-600'>
            <span>Total Users: {getTotalUserCount()}</span>
            <span>Active Users: {getActiveUserCount()}</span>
            <span>Admins: {getUsersByRole(UserRole.ADMIN).length}</span>
            <span>Moderators: {getUsersByRole(UserRole.MODERATOR).length}</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
        >
          Create User
        </button>
      </div>

      {error && (
        <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
          <button
            onClick={() => setError(null)}
            className='ml-2 text-red-900 hover:text-red-700'
          >
            ✕
          </button>
        </div>
      )}

      {showForm && (
        <div className='mb-6 p-6 bg-gray-50 rounded-lg'>
          <UserForm
            initialData={editingUser || undefined}
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
            onCancel={handleCancelForm}
            loading={loading}
            mode={editingUser ? 'edit' : 'create'}
          />
        </div>
      )}

      {loading && !showForm && (
        <div className='text-center py-8'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          <p className='mt-2 text-gray-600'>Loading users...</p>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            readonly={loading}
          />
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className='text-center py-12'>
          <p className='text-gray-500 text-lg'>No users found</p>
          <button
            onClick={() => setShowForm(true)}
            className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Create Your First User
          </button>
        </div>
      )}
    </div>
  )
}
