import type { DatabaseConfig } from '@utils/database'

export const developmentConfig: DatabaseConfig = {
  host: 'localhost',
  port: 5432,
  database: 'myapp_dev',
  ssl: false,
}

export const productionConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'prod-db.example.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'myapp_prod',
  ssl: true,
}

export const getConfig = (): DatabaseConfig => {
  return process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig
}
