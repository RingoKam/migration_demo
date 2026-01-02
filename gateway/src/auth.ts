import axios from 'axios';
import { featureToggle } from './featureToggle.js';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const USER_SERVICE_KOTLIN_URL = process.env.USER_SERVICE_KOTLIN_URL || 'http://user-service-kotlin:3002';

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
    if (featureToggle.getUserService()) {
      // Use Kotlin GraphQL service
      const token = authHeader.replace('Bearer ', '');
      const query = `
        query VerifyToken($token: String!) {
          verifyToken(token: $token) {
            user {
              id
              email
              username
              role
            }
            isValid
          }
        }
      `;

      const response = await axios.post(
        `${USER_SERVICE_KOTLIN_URL}/graphql`,
        {
          query,
          variables: { token }
        }
      );

      if (response.data.errors) {
        return { isAuthenticated: false };
      }

      const verifyResponse = response.data.data?.verifyToken;
      if (verifyResponse?.isValid && verifyResponse?.user) {
        return {
          userId: verifyResponse.user.id,
          email: verifyResponse.user.email,
          role: verifyResponse.user.role,
          isAuthenticated: true,
        };
      }

      return { isAuthenticated: false };
    } else {
      // Use REST service
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
    }
  } catch (error) {
    // Token is invalid or user-service returned an error
    return { isAuthenticated: false };
  }
}

