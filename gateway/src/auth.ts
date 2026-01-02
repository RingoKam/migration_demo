import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';

export interface AuthContext {
  userId?: string;
  email?: string;
  role?: string;
  isAuthenticated: boolean;
}

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

/**
 * Create authentication context by calling user-service to verify token
 */
export async function createAuthContext(authHeader: string | null | undefined): Promise<AuthContext> {
  if (!authHeader) {
    return { isAuthenticated: false };
  }

  try {
    // Call user-service to verify the token
    const response = await axios.get<{ user: User; isValid: boolean }>(
      `${USER_SERVICE_URL}/auth/verify`,
      {
        headers: {
          Authorization: authHeader
        }
      }
    );

    if (response.data.isValid && response.data.user) {
      return {
        userId: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
        isAuthenticated: true,
      };
    }

    return { isAuthenticated: false };
  } catch (error) {
    // Token is invalid or user-service returned an error
    return { isAuthenticated: false };
  }
}

