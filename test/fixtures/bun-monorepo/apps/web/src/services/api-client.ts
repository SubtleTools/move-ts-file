import { ApiError, PaginatedResponse, PaginationParams } from '@test-monorepo/api/types/api-types';
import { User } from '@test-monorepo/core';

export class ApiClient {
  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User> | ApiError> {
    try {
      // Mock API call
      return {
        data: [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      return {
        code: 'API_ERROR',
        message: 'Failed to fetch users',
      };
    }
  }
}
