import axios from 'axios';
import { AuthContext } from './auth.js';
import { featureToggle } from './featureToggle.js';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const USER_SERVICE_KOTLIN_URL = process.env.USER_SERVICE_KOTLIN_URL || 'http://user-service-kotlin:3002';

const LICENSE_SERVICE_URL = process.env.LICENSE_SERVICE_URL || 'http://license-service:8000';
const LICENSE_SERVICE_KOTLIN_URL = process.env.LICENSE_SERVICE_KOTLIN_URL || 'http://license-service-kotlin:8001';

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
  id?: string;
}

interface Context {
  auth: AuthContext;
}

// Helper to fetch user from GraphQL or REST
async function fetchUser(userId: string): Promise<User> {
  if (featureToggle.getUserService()) {
    // Use GraphQL service (Kotlin)
    const query = `
      query GetUser($id: ID!) {
        getUser(id: $id) {
          id
          email
          username
          role
        }
      }
    `;
    
    const response = await axios.post(`${USER_SERVICE_KOTLIN_URL}/graphql`, {
      query,
      variables: { id: userId }
    });
    
    if (response.data.errors) {
      const errorMessage = response.data.errors[0]?.message || 'Failed to fetch user';
      throw new Error(errorMessage);
    }
    
    const user = response.data.data?.getUser;
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    return user;
  } else {
    // Use REST service
    const response = await axios.get<User>(`${USER_SERVICE_URL}/users/${userId}`);
    if (!response.data) {
      throw new Error('User not found');
    }
    return response.data;
  }
}

// Helper to fetch license status from GraphQL or REST
async function fetchLicenseStatus(userId: string): Promise<LicenseStatus> {
  if (featureToggle.getLicenseService()) {
    // Use GraphQL service (Kotlin)
    const query = `
      query GetLicenseStatus($userId: ID!) {
        getLicenseStatus(userId: $userId) {
          id
          isValidSeat
          seatType
          expirationDate
        }
      }
    `;
    
    const response = await axios.post(`${LICENSE_SERVICE_KOTLIN_URL}/graphql`, {
      query,
      variables: { userId }
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message || 'Failed to fetch license status');
    }
    
    return response.data.data.getLicenseStatus;
  } else {
    // Use REST service
    const response = await axios.get<LicenseStatus>(
      `${LICENSE_SERVICE_URL}/users/${userId}/authorizations`
    );
    return response.data;
  }
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
        if (featureToggle.getUserService()) {
          // Use GraphQL service (Kotlin)
          const mutation = `
            mutation Login($credentials: LoginInput!) {
              login(credentials: $credentials) {
                token
                user {
                  id
                  email
                  username
                  role
                }
              }
            }
          `;
          
          const variables = {
            credentials: {
              email: credentials.email,
              password: credentials.password
            }
          };
          
          const response = await axios.post(`${USER_SERVICE_KOTLIN_URL}/graphql`, {
            query: mutation,
            variables
          });
          
          if (response.data.errors) {
            throw new Error(response.data.errors[0].message || 'Login failed');
          }
          
          const { user, token } = response.data.data.login;
          
          return {
            token,
            user: {
              ...user,
              role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
            }
          };
        } else {
          // Use REST service
          const response = await axios.post<{ user: User; token: string }>(
            `${USER_SERVICE_URL}/auth/login`,
            credentials
          );
          
          const { user, token } = response.data;

          return {
            token,
            user: {
              ...user,
              role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
              // licenseStatus will be resolved by the field resolver if requested
            }
          };
        }
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
    
    register: async (_: any, { input }: { input: { email: string; password: string; username: string; role?: string } }) => {
      try {
        if (featureToggle.getUserService()) {
          // Use GraphQL service (Kotlin) with Kafka - event-driven
          const mutation = `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                success
                message
              }
            }
          `;
          
          const variables = {
            input: {
              email: input.email,
              password: input.password,
              username: input.username,
              role: input.role || 'STUDENT'
            }
          };
          
          const response = await axios.post(`${USER_SERVICE_KOTLIN_URL}/graphql`, {
            query: mutation,
            variables
          });
          
          if (response.data.errors) {
            throw new Error(response.data.errors[0].message || 'Registration failed');
          }
          
          return response.data.data.register;
        } else {
          // Use REST service - returns AuthPayload for backward compatibility
          const response = await axios.post<{ user: User; token: string }>(
            `${USER_SERVICE_URL}/auth/register`,
            input
          );
          
          const { user, token } = response.data;

          // Convert REST response to MutationResult for consistency
          return {
            success: true,
            message: 'User registered successfully. Please login to get your token.'
          };
        }
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
