import { formatUserName, User } from '../utils/helper'

export interface UserCardProps {
  user: User
  onClick?: () => void
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  return (
    <div className='user-card' onClick={onClick}>
      <h3>{formatUserName(user)}</h3>
      <p>ID: {user.id}</p>
    </div>
  )
}
