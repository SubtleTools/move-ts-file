import type { LogLevel } from '~utils/logger'

export const APP_CONFIG = {
  name: 'Mixed Imports App',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
} as const

export const DEFAULT_LOG_LEVEL: LogLevel = 1 // INFO

export const NOTIFICATION_DEFAULTS = {
  duration: 3000,
  maxNotifications: 10,
} as const

export const API_ENDPOINTS = {
  base: process.env.API_BASE_URL || 'http://localhost:3000/api',
  auth: '/auth',
  users: '/users',
  notifications: '/notifications',
} as const
