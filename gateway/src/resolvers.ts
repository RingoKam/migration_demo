import axios from 'axios';
import { AuthContext } from './auth.js';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const LICENSE_SERVICE_URL = process.env.LICENSE_SERVICE_URL || 'http://license-service:8000';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface LicenseStatus {
  isValidSeat: boolean;
  seatType?: string;
  expirationDate?: string;
}

interface Context {
  auth: AuthContext;
}

async function fetchUserWithLicense(userId: string): Promise<any> {
  // Fetch user data from NodeJS service
  const userResponse = await axios.get<User>(`${USER_SERVICE_URL}/users/${userId}`);
  const user = userResponse.data;

  // Fetch license status from Python service
  const licenseResponse = await axios.get<LicenseStatus>(
    `${LICENSE_SERVICE_URL}/users/${userId}/authorizations`
  );
  const licenseStatus = licenseResponse.data;

  return {
    ...user,
    role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
    licenseStatus
  };
}

export const resolvers = {
  Query: {
    getUser: async (_: any, { id }: { id: string }, context: Context) => {
      return fetchUserWithLicense(id);
    },
    
    me: async (_: any, __: any, context: Context) => {
      if (!context.auth.isAuthenticated || !context.auth.userId) {
        throw new Error('Authentication required');
      }
      
      return fetchUserWithLicense(context.auth.userId);
    }
  },

  Mutation: {
    login: async (_: any, { credentials }: { credentials: { email: string; password: string } }) => {
      try {
        // Call user-service login endpoint
        const response = await axios.post<{ user: User; token: string }>(
          `${USER_SERVICE_URL}/auth/login`,
          credentials
        );
        
        const { user, token } = response.data;
        
        // Fetch license status
        const licenseResponse = await axios.get<LicenseStatus>(
          `${LICENSE_SERVICE_URL}/users/${user.id}/authorizations`
        );
        const licenseStatus = licenseResponse.data;

        return {
          token,
          user: {
            ...user,
            role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
            licenseStatus
          }
        };
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data?.error || 'Login failed');
        }
        throw new Error('Login failed');
      }
    },
    
    register: async (_: any, { input }: { input: { email: string; password: string; username: string; role: string } }) => {
      try {
        // Call user-service register endpoint
        const response = await axios.post<{ user: User; token: string }>(
          `${USER_SERVICE_URL}/auth/register`,
          input
        );
        
        const { user, token } = response.data;
        
        // Fetch license status
        const licenseResponse = await axios.get<LicenseStatus>(
          `${LICENSE_SERVICE_URL}/users/${user.id}/authorizations`
        );
        const licenseStatus = licenseResponse.data;

        return {
          token,
          user: {
            ...user,
            role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
            licenseStatus
          }
        };
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data?.error || 'Registration failed');
        }
        throw new Error('Registration failed');
      }
    }
  }
};

