import axios from 'axios';
import { KotlinUserService } from '../kotlinUserService.js';
import { User, LoginCredentials, RegisterInput } from '../types.js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KotlinUserService', () => {
  let service: KotlinUserService;
  const baseUrl = 'http://user-service-kotlin:3002';

  beforeEach(() => {
    service = new KotlinUserService();
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user when GraphQL query succeeds', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'STUDENT',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            getUser: mockUser,
          },
        },
      });

      const result = await service.getUser('1');

      expect(result).toEqual(mockUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/graphql`,
        expect.objectContaining({
          query: expect.stringContaining('query GetUser'),
          variables: { id: '1' },
        })
      );
    });

    it('should throw error when user is not found', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            getUser: null,
          },
        },
      });

      await expect(service.getUser('999')).rejects.toThrow('User with id 999 not found');
    });

    it('should throw error when GraphQL returns errors', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [
            { message: 'User not found' },
          ],
        },
      });

      await expect(service.getUser('999')).rejects.toThrow('User not found');
    });

    it('should throw default error when error has no message', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [{}],
        },
      });

      await expect(service.getUser('999')).rejects.toThrow('Failed to fetch user');
    });

    it('should throw default error when errors array is empty', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [],
        },
      });

      await expect(service.getUser('999')).rejects.toThrow('Failed to fetch user');
    });
  });

  describe('login', () => {
    it('should return login response when mutation succeeds', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        token: 'jwt-token-123',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: 'STUDENT',
        },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            login: mockResponse,
          },
        },
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
        `${baseUrl}/graphql`,
        expect.objectContaining({
          query: expect.stringContaining('mutation Login'),
          variables: {
            credentials: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
        })
      );
    });

    it('should throw error when GraphQL returns errors', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [
            { message: 'Invalid credentials' },
          ],
        },
      });

      await expect(service.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw default error when error has no message', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [{}],
        },
      });

      await expect(service.login(credentials)).rejects.toThrow('Login failed');
    });
  });

  describe('register', () => {
    it('should return register response when mutation succeeds', async () => {
      const input: RegisterInput = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        role: 'STUDENT',
      };

      const mockResponse = {
        success: true,
        message: 'User registered successfully',
        userId: '2',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            register: mockResponse,
          },
        },
      });

      const result = await service.register(input);

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/graphql`,
        expect.objectContaining({
          query: expect.stringContaining('mutation Register'),
          variables: {
            input: {
              email: 'newuser@example.com',
              password: 'password123',
              username: 'newuser',
              role: 'STUDENT',
            },
          },
        })
      );
    });

    it('should use default role when role is not provided', async () => {
      const input: RegisterInput = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
      };

      const mockResponse = {
        success: true,
        message: 'User registered successfully',
        userId: '2',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            register: mockResponse,
          },
        },
      });

      await service.register(input);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/graphql`,
        expect.objectContaining({
          variables: {
            input: {
              email: 'newuser@example.com',
              password: 'password123',
              username: 'newuser',
              role: 'STUDENT',
            },
          },
        })
      );
    });

    it('should throw error when GraphQL returns errors', async () => {
      const input: RegisterInput = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existing',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [
            { message: 'Email already exists' },
          ],
        },
      });

      await expect(service.register(input)).rejects.toThrow('Email already exists');
    });

    it('should throw default error when error has no message', async () => {
      const input: RegisterInput = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [{}],
        },
      });

      await expect(service.register(input)).rejects.toThrow('Registration failed');
    });
  });
});

