import axios from 'axios';
import { IUserService } from './interfaces.js';
import { User, LoginCredentials, RegisterInput, LoginResponse, RegisterResponse } from './types.js';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';

export class LegacyUserService implements IUserService {
  async getUser(userId: string): Promise<User> {
    const response = await axios.get<User>(`${USER_SERVICE_URL}/users/${userId}`);
    if (!response.data) {
      throw new Error('User not found');
    }
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
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
      }
    };
  }

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const response = await axios.post<{ user: User; token: string }>(
      `${USER_SERVICE_URL}/auth/register`,
      input
    );
    
    const { user } = response.data;

    // Convert REST response to RegisterResponse format for consistency
    return {
      success: true,
      message: 'User registered successfully. Please login to get your token.',
      userId: user.id
    };
  }
}

export const legacyUserService = new LegacyUserService();

