import axios from 'axios';

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

export const resolvers = {
  Query: {
    getUser: async (_: any, { id }: { id: string }) => {
      // Fetch user data from NodeJS service
      const userResponse = await axios.get<User>(`${USER_SERVICE_URL}/users/${id}`);
      const user = userResponse.data;

      // Fetch license status from Python service
      const licenseResponse = await axios.get<LicenseStatus>(
        `${LICENSE_SERVICE_URL}/users/${id}/authorizations`
      );
      const licenseStatus = licenseResponse.data;

      return {
        ...user,
        role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
        licenseStatus
      };
    }
  },

  Mutation: {
    login: async (_: any, { credentials }: { credentials: { email: string; password: string } }) => {
      // Placeholder implementation - just return user 1 for demo
      const userResponse = await axios.get<User>(`${USER_SERVICE_URL}/users/1`);
      const user = userResponse.data;

      const licenseResponse = await axios.get<LicenseStatus>(
        `${LICENSE_SERVICE_URL}/users/${user.id}/authorizations`
      );
      const licenseStatus = licenseResponse.data;

      return {
        token: Math.random().toString(36).substring(7), // Placeholder token
        user: {
          ...user,
          role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
          licenseStatus
        }
      };
    }
  }
};

