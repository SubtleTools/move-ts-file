import { createDatabase, Database, DatabaseConfig } from '@utils/database';

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

export class UserRepository {
  private db: Database;

  constructor(config: DatabaseConfig) {
    this.db = createDatabase(config);
  }

  async findById(id: number): Promise<User | null> {
    const results = await this.db.query<User>(
      'SELECT * FROM users WHERE id = ?',
      [id],
    );
    return results[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.db.query<User>(
      'SELECT * FROM users WHERE email = ?',
      [email],
    );
    return results[0] || null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: Math.floor(Math.random() * 1000),
      createdAt: new Date(),
      ...userData,
    };

    await this.db.query(
      'INSERT INTO users (id, username, email, created_at) VALUES (?, ?, ?, ?)',
      [user.id, user.username, user.email, user.createdAt],
    );

    return user;
  }
}
