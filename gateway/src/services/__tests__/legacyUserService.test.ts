import axios from 'axios';
import { LegacyUserService } from '../legacyUserService.js';
import { User, LoginCredentials, RegisterInput } from '../types.js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LegacyUserService', () => {
  let service: LegacyUserService;
  const baseUrl = 'http://user-service:3001';

  beforeEach(() => {
    service = new LegacyUserService();
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user when REST API call succeeds', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'STUDENT',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockUser,
      });

      const result = await service.getUser('1');

      expect(result).toEqual(mockUser);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/users/1`);
    });

    it('should throw error when user is not found', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: null,
      });

      await expect(service.getUser('999')).rejects.toThrow('User not found');
    });

    it('should throw error when axios request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getUser('1')).rejects.toThrow('Network error');
    });
  });

  describe('login', () => {
    it('should return login response when REST API call succeeds', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: 'STUDENT',
        },
        token: 'jwt-token-123',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await service.login(credentials);

      expect(result).toEqual({
        token: 'jwt-token-123',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: 'STUDENT',
        },
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/auth/login`,
        credentials
      );
    });

    it('should throw error when axios request fails', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(service.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should return register response when REST API call succeeds', async () => {
      const input: RegisterInput = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        role: 'STUDENT',
      };

      const mockResponse = {
        user: {
          id: '2',
          email: 'newuser@example.com',
          username: 'newuser',
          role: 'STUDENT',
        },
        token: 'jwt-token-456',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await service.register(input);

      expect(result).toEqual({
        success: true,
        message: 'User registered successfully. Please login to get your token.',
        userId: '2',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/auth/register`,
        input
      );
    });

    it('should throw error when axios request fails', async () => {
      const input: RegisterInput = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existing',
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Email already exists'));

      await expect(service.register(input)).rejects.toThrow('Email already exists');
    });
  });
});

