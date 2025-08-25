import { formatUserName, User, UserService } from '../src/utils/helper'

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    userService = new UserService()
  })

  test('should add and retrieve user', () => {
    const user: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    }

    userService.addUser(user)
    const retrieved = userService.getUserById('1')

    expect(retrieved).toEqual(user)
    expect(formatUserName(user)).toBe('Test User (test@example.com)')
  })
})
