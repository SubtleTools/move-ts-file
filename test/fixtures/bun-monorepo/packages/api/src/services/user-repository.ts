import { CreateUserRequest, UpdateUserRequest, User, UserRole, UserSummary } from '@test-monorepo/core/types/user';
import { isValidUser, UserValidator, ValidationError } from '@test-monorepo/core/utils/validation';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(limit?: number, offset?: number): Promise<User[]>;
  create(userData: CreateUserRequest): Promise<User>;
  update(id: string, userData: UpdateUserRequest): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  getUserSummaries(): Promise<UserSummary[]>;
}

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private nextId = 1;

  constructor() {
    // Seed with some initial data
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const adminUser: User = {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    const regularUser: User = {
      id: '2',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.USER,
      createdAt: new Date('2023-06-15'),
      updatedAt: new Date('2023-06-15'),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(regularUser.id, regularUser);
    this.nextId = 3;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findAll(limit = 50, offset = 0): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    return allUsers.slice(offset, offset + limit);
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const validation = UserValidator.validateCreateUserRequest(userData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already exists', 'email', 'duplicate');
    }

    const now = new Date();
    const user: User = {
      id: this.nextId.toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role || UserRole.USER,
      createdAt: now,
      updatedAt: now,
    };

    if (!isValidUser(user)) {
      throw new Error('Created user is invalid');
    }

    this.users.set(user.id, user);
    this.nextId++;

    return user;
  }

  async update(id: string, userData: UpdateUserRequest): Promise<User | null> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      return null;
    }

    // Create updated user data for validation
    const updatedData: CreateUserRequest = {
      name: userData.name || existingUser.name,
      email: userData.email || existingUser.email,
      role: userData.role || existingUser.role,
    };

    const validation = UserValidator.validateCreateUserRequest(updatedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check if new email conflicts with another user
    if (userData.email && userData.email !== existingUser.email) {
      const emailConflict = await this.findByEmail(userData.email);
      if (emailConflict) {
        throw new ValidationError('Email already exists', 'email', 'duplicate');
      }
    }

    const updatedUser: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUserSummaries(): Promise<UserSummary[]> {
    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      name: user.name,
      role: user.role,
    }));
  }

  // Additional utility methods
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getRecentUsers(days = 30): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return Array.from(this.users.values()).filter(
      user => user.createdAt >= cutoffDate,
    );
  }
}
