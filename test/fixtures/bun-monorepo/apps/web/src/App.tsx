import { UserController } from '@test-monorepo/api/controllers/user-controller'
import { UserRole } from '@test-monorepo/core/types/user'
import { UserManagementPage } from './pages/UserManagement'

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<'users' | 'dashboard'>('dashboard')
  const [userController] = React.useState(() => new UserController())

  const renderCurrentPage = (): React.ReactNode => {
    switch (currentPage) {
      case 'users':
        return <UserManagementPage userController={userController} />
      case 'dashboard':
      default:
        return <DashboardPage userController={userController} />
    }
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex'>
              <div className='flex-shrink-0 flex items-center'>
                <h1 className='text-xl font-bold text-gray-900'>
                  Test Monorepo App
                </h1>
              </div>
              <div className='ml-6 flex space-x-8'>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentPage === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentPage('users')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentPage === 'users'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Users
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        {renderCurrentPage()}
      </main>
    </div>
  )
}

const DashboardPage: React.FC<{ userController: UserController }> = ({
  userController,
}) => {
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    guestUsers: 0,
  })

  React.useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async (): Promise<void> => {
    try {
      const [allUsersResponse, adminUsersResponse] = await Promise.all([
        userController.getAllUsers(),
        userController.getUsersByRole(UserRole.ADMIN),
      ])

      if (allUsersResponse.success && adminUsersResponse.success) {
        const allUsers = allUsersResponse.data || []
        const adminUsers = adminUsersResponse.data || []

        setStats({
          totalUsers: allUsers.length,
          adminUsers: adminUsers.length,
          regularUsers: allUsers.filter(u => u.role === UserRole.USER).length,
          guestUsers: allUsers.filter(u => u.role === UserRole.GUEST).length,
        })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div className='dashboard-page'>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-900'>Dashboard</h2>
        <p className='mt-2 text-gray-600'>
          Welcome to the Test Monorepo application dashboard.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-medium'>👥</span>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Total Users</p>
              <p className='text-2xl font-semibold text-gray-900'>{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-red-500 rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-medium'>👑</span>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Admins</p>
              <p className='text-2xl font-semibold text-gray-900'>{stats.adminUsers}</p>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-medium'>👤</span>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Regular Users</p>
              <p className='text-2xl font-semibold text-gray-900'>{stats.regularUsers}</p>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-medium'>👻</span>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Guests</p>
              <p className='text-2xl font-semibold text-gray-900'>{stats.guestUsers}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
