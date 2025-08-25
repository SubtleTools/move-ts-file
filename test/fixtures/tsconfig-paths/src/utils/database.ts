export interface DatabaseConfig {
  host: string
  port: number
  database: string
  ssl?: boolean
}

export class Database {
  constructor(private config: DatabaseConfig) {}

  async connect(): Promise<void> {
    console.log(`Connecting to ${this.config.host}:${this.config.port}`)
    // Mock connection logic
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    console.log(`Executing: ${sql}`, params)
    // Mock query logic
    return [] as T[]
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from database')
    // Mock disconnection logic
  }
}

export const createDatabase = (config: DatabaseConfig): Database => {
  return new Database(config)
}
