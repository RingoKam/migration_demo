import axios from 'axios';
import { IUserService } from './interfaces.js';
import { User, LoginCredentials, RegisterInput, LoginResponse, RegisterResponse } from './types.js';

const USER_SERVICE_KOTLIN_URL = process.env.USER_SERVICE_KOTLIN_URL || 'http://user-service-kotlin:3002';

export class KotlinUserService implements IUserService {
  async getUser(userId: string): Promise<User> {
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
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
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
      throw new Error(response.data.errors[0]?.message || 'Login failed');
    }
    
    const { user, token } = response.data.data.login;
    
    return {
      token,
      user: {
        ...user,
        role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
      }
    };
  }

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          success
          message
          userId
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
      throw new Error(response.data.errors[0]?.message || 'Registration failed');
    }
    
    return response.data.data.register;
  }
}

export const kotlinUserService = new KotlinUserService();

