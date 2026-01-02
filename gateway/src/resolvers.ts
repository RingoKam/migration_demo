import axios from 'axios';
import { AuthContext } from './auth.js';
import { featureToggle } from './featureToggle.js';
import { kotlinUserService } from './services/kotlinUserService.js';
import { legacyUserService } from './services/legacyUserService.js';
import { kotlinLicenseService } from './services/kotlinLicenseService.js';
import { legacyLicenseService } from './services/legacyLicenseService.js';
import { User, LicenseStatus } from './services/types.js';

interface Context {
  auth: AuthContext;
}

// Helper to get the appropriate user service based on feature toggle
function getUserService() {
  return featureToggle.getUserService() ? kotlinUserService : legacyUserService;
}

// Helper to get the appropriate license service based on feature toggle
function getLicenseService() {
  return featureToggle.getLicenseService() ? kotlinLicenseService : legacyLicenseService;
}

// Helper to fetch user from the appropriate service
async function fetchUser(userId: string): Promise<User> {
  return getUserService().getUser(userId);
}

// Helper to fetch license status from the appropriate service
async function fetchLicenseStatus(userId: string): Promise<LicenseStatus> {
  return getLicenseService().getLicenseStatus(userId);
}

export const resolvers = {
  Query: {
    getUser: async (_: any, { id }: { id: string }, context: Context) => {
      const user = await fetchUser(id);
      if (!user) {
        return null;
      }
      
      return {
        ...user,
        role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
      };
    },
    
    me: async (_: any, __: any, context: Context) => {
      // Auth check is now handled by @auth directive
      if (!context.auth.userId) {
        throw new Error('User not authenticated');
      }
      
      const user = await fetchUser(context.auth.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      console.log('user', user);

      return {
        ...user,
        role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
      };
    },

    featureToggles: () => {
      return featureToggle.getState();
    }
  },

  // Field resolver for licenseStatus - only called when this field is requested
  User: {
    licenseStatus: async (user: User) => {
      // Only fetch license status when this field is actually requested
      return await fetchLicenseStatus(user.id);
    }
  },

  Mutation: {
    login: async (_: any, { credentials }: { credentials: { email: string; password: string } }) => {
      try {
        return await getUserService().login(credentials);
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          const errorData = error.response.data;
          if (errorData?.errors) {
            throw new Error(errorData.errors[0]?.message || 'Login failed');
          }
          throw new Error(errorData?.error || 'Login failed');
        }
        throw new Error(error.message || 'Login failed');
      }
    },
    
    register: async (_: any, { input }: { input: { email: string; password: string; username: string; role?: string; license?: { isValidSeat?: boolean; seatType?: string; expirationDate?: string } } }) => {
      try {
        const result = await getUserService().register({
          email: input.email,
          password: input.password,
          username: input.username,
          role: input.role
        });
        
        // Create license if provided (handle separately from user registration)
        if (input.license && result.userId) {
          try {
            await getLicenseService().updateLicenseStatus(result.userId, {
              isValidSeat: input.license.isValidSeat,
              seatType: input.license.seatType,
              expirationDate: input.license.expirationDate
            });
          } catch (licenseError) {
            // TODO: handle license creation, at least log the error
            console.error('Failed to create license during registration:', licenseError);
          }
        }
        
        return result;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          const errorData = error.response.data;
          if (errorData?.errors) {
            throw new Error(errorData.errors[0]?.message || 'Registration failed');
          }
          throw new Error(errorData?.error || 'Registration failed');
        }
        throw new Error(error.message || 'Registration failed');
      }
    },

    updateFeatureToggles: async (_: any, { input }: { input: { userService?: boolean; licenseService?: boolean } }) => {
      return featureToggle.setState(input);
    }
  }
};
