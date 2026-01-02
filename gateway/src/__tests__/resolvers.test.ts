import { resolvers } from '../resolvers.js';
import { featureToggle } from '../featureToggle.js';
import { kotlinUserService } from '../services/kotlinUserService.js';
import { legacyUserService } from '../services/legacyUserService.js';
import { kotlinLicenseService } from '../services/kotlinLicenseService.js';
import { legacyLicenseService } from '../services/legacyLicenseService.js';
import { User, LoginCredentials, RegisterInput, LicenseStatus } from '../services/types.js';
import { AuthContext } from '../auth.js';

// Mock the services
jest.mock('../services/kotlinUserService.js', () => ({
  kotlinUserService: {
    getUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('../services/legacyUserService.js', () => ({
  legacyUserService: {
    getUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('../services/kotlinLicenseService.js', () => ({
  kotlinLicenseService: {
    getLicenseStatus: jest.fn(),
    updateLicenseStatus: jest.fn(),
  },
}));

jest.mock('../services/legacyLicenseService.js', () => ({
  legacyLicenseService: {
    getLicenseStatus: jest.fn(),
    updateLicenseStatus: jest.fn(),
  },
}));

jest.mock('../featureToggle.js', () => ({
  featureToggle: {
    getUserService: jest.fn(),
    getLicenseService: jest.fn(),
    getState: jest.fn(),
    setState: jest.fn(),
  },
}));

const mockedFeatureToggle = featureToggle as jest.Mocked<typeof featureToggle>;
const mockedKotlinUserService = kotlinUserService as jest.Mocked<typeof kotlinUserService>;
const mockedLegacyUserService = legacyUserService as jest.Mocked<typeof legacyUserService>;
const mockedKotlinLicenseService = kotlinLicenseService as jest.Mocked<typeof kotlinLicenseService>;
const mockedLegacyLicenseService = legacyLicenseService as jest.Mocked<typeof legacyLicenseService>;

describe('Resolvers', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'STUDENT',
  };

  const mockLicense: LicenseStatus = {
    id: '1',
    isValidSeat: true,
    seatType: 'Premium',
    expirationDate: '2024-12-31',
  };

  const mockAuthContext: AuthContext = {
    isAuthenticated: true,
    userId: '1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset feature toggles to default (legacy)
    mockedFeatureToggle.getUserService.mockReturnValue(false);
    mockedFeatureToggle.getLicenseService.mockReturnValue(false);
    mockedFeatureToggle.getState.mockReturnValue({
      userService: false,
      licenseService: false,
    });
  });

  describe('Query.getUser', () => {
    it('should call legacy user service when feature toggle is off', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.getUser.mockResolvedValue(mockUser);

      const result = await resolvers.Query.getUser(
        null as any,
        { id: '1' },
        { auth: mockAuthContext } as any
      );

      expect(mockedLegacyUserService.getUser).toHaveBeenCalledWith('1');
      expect(mockedKotlinUserService.getUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockUser,
        role: 'STUDENT',
      });
    });

    it('should call kotlin user service when feature toggle is on', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedKotlinUserService.getUser.mockResolvedValue(mockUser);

      const result = await resolvers.Query.getUser(
        null as any,
        { id: '1' },
        { auth: mockAuthContext } as any
      );

      expect(mockedKotlinUserService.getUser).toHaveBeenCalledWith('1');
      expect(mockedLegacyUserService.getUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockUser,
        role: 'STUDENT',
      });
    });

    it('should return null when user is not found', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.getUser.mockRejectedValue(new Error('User not found'));

      await expect(
        resolvers.Query.getUser(null as any, { id: '999' }, { auth: mockAuthContext } as any)
      ).rejects.toThrow('User not found');
    });
  });

  describe('Query.me', () => {
    it('should call legacy user service when feature toggle is off', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.getUser.mockResolvedValue(mockUser);

      const result = await resolvers.Query.me(
        null as any,
        {},
        { auth: mockAuthContext } as any
      );

      expect(mockedLegacyUserService.getUser).toHaveBeenCalledWith('1');
      expect(mockedKotlinUserService.getUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockUser,
        role: 'STUDENT',
      });
    });

    it('should call kotlin user service when feature toggle is on', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedKotlinUserService.getUser.mockResolvedValue(mockUser);

      const result = await resolvers.Query.me(
        null as any,
        {},
        { auth: mockAuthContext } as any
      );

      expect(mockedKotlinUserService.getUser).toHaveBeenCalledWith('1');
      expect(mockedLegacyUserService.getUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockUser,
        role: 'STUDENT',
      });
    });

    it('should throw error when user is not authenticated', async () => {
      const unauthenticatedContext = {
        isAuthenticated: false,
        userId: undefined,
      };

      await expect(
        resolvers.Query.me(null as any, {}, { auth: unauthenticatedContext } as any)
      ).rejects.toThrow('User not authenticated');
    });

    it('should throw error when user is not found', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.getUser.mockRejectedValue(new Error('User not found'));

      await expect(
        resolvers.Query.me(null as any, {}, { auth: mockAuthContext } as any)
      ).rejects.toThrow('User not found');
    });
  });

  describe('Query.featureToggles', () => {
    it('should return current feature toggle state', () => {
      const mockState = {
        userService: true,
        licenseService: false,
      };
      mockedFeatureToggle.getState.mockReturnValue(mockState);

      const result = resolvers.Query.featureToggles();

      expect(mockedFeatureToggle.getState).toHaveBeenCalled();
      expect(result).toEqual(mockState);
    });
  });

  describe('User.licenseStatus', () => {
    it('should call legacy license service when feature toggle is off', async () => {
      mockedFeatureToggle.getLicenseService.mockReturnValue(false);
      mockedLegacyLicenseService.getLicenseStatus.mockResolvedValue(mockLicense);

      const result = await resolvers.User.licenseStatus(mockUser);

      expect(mockedLegacyLicenseService.getLicenseStatus).toHaveBeenCalledWith('1');
      expect(mockedKotlinLicenseService.getLicenseStatus).not.toHaveBeenCalled();
      expect(result).toEqual(mockLicense);
    });

    it('should call kotlin license service when feature toggle is on', async () => {
      mockedFeatureToggle.getLicenseService.mockReturnValue(true);
      mockedKotlinLicenseService.getLicenseStatus.mockResolvedValue(mockLicense);

      const result = await resolvers.User.licenseStatus(mockUser);

      expect(mockedKotlinLicenseService.getLicenseStatus).toHaveBeenCalledWith('1');
      expect(mockedLegacyLicenseService.getLicenseStatus).not.toHaveBeenCalled();
      expect(result).toEqual(mockLicense);
    });
  });

  describe('Mutation.login', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResponse = {
      token: 'jwt-token-123',
      user: mockUser,
    };

    it('should call legacy user service when feature toggle is off', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.login.mockResolvedValue(mockLoginResponse);

      const result = await resolvers.Mutation.login(
        null as any,
        { credentials }
      );

      expect(mockedLegacyUserService.login).toHaveBeenCalledWith(credentials);
      expect(mockedKotlinUserService.login).not.toHaveBeenCalled();
      expect(result).toEqual(mockLoginResponse);
    });

    it('should call kotlin user service when feature toggle is on', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedKotlinUserService.login.mockResolvedValue(mockLoginResponse);

      const result = await resolvers.Mutation.login(
        null as any,
        { credentials }
      );

      expect(mockedKotlinUserService.login).toHaveBeenCalledWith(credentials);
      expect(mockedLegacyUserService.login).not.toHaveBeenCalled();
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle errors correctly', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        resolvers.Mutation.login(null as any, { credentials })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Mutation.register', () => {
    const registerInput: RegisterInput = {
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      role: 'STUDENT',
    };

    const mockRegisterResponse = {
      success: true,
      message: 'User registered successfully',
      userId: '2',
    };

    it('should call legacy user service when feature toggle is off', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.register.mockResolvedValue(mockRegisterResponse);

      const result = await resolvers.Mutation.register(
        null as any,
        { input: registerInput }
      );

      expect(mockedLegacyUserService.register).toHaveBeenCalledWith(registerInput);
      expect(mockedKotlinUserService.register).not.toHaveBeenCalled();
      expect(result).toEqual(mockRegisterResponse);
    });

    it('should call kotlin user service when feature toggle is on', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedKotlinUserService.register.mockResolvedValue(mockRegisterResponse);

      const result = await resolvers.Mutation.register(
        null as any,
        { input: registerInput }
      );

      expect(mockedKotlinUserService.register).toHaveBeenCalledWith(registerInput);
      expect(mockedLegacyUserService.register).not.toHaveBeenCalled();
      expect(result).toEqual(mockRegisterResponse);
    });

    it('should create license when provided and user service is legacy', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedFeatureToggle.getLicenseService.mockReturnValue(false);
      mockedLegacyUserService.register.mockResolvedValue(mockRegisterResponse);
      mockedLegacyLicenseService.updateLicenseStatus.mockResolvedValue({
        success: true,
        message: 'License updated',
      });

      const inputWithLicense = {
        ...registerInput,
        license: {
          isValidSeat: true,
          seatType: 'Premium',
          expirationDate: '2024-12-31',
        },
      };

      const result = await resolvers.Mutation.register(
        null as any,
        { input: inputWithLicense }
      );

      expect(mockedLegacyUserService.register).toHaveBeenCalled();
      expect(mockedLegacyLicenseService.updateLicenseStatus).toHaveBeenCalledWith('2', {
        isValidSeat: true,
        seatType: 'Premium',
        expirationDate: '2024-12-31',
      });
      expect(result).toEqual(mockRegisterResponse);
    });

    it('should create license when provided and user service is kotlin', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedFeatureToggle.getLicenseService.mockReturnValue(true);
      mockedKotlinUserService.register.mockResolvedValue(mockRegisterResponse);
      mockedKotlinLicenseService.updateLicenseStatus.mockResolvedValue({
        success: true,
        message: 'License updated',
      });

      const inputWithLicense = {
        ...registerInput,
        license: {
          isValidSeat: true,
          seatType: 'Premium',
          expirationDate: '2024-12-31',
        },
      };

      const result = await resolvers.Mutation.register(
        null as any,
        { input: inputWithLicense }
      );

      expect(mockedKotlinUserService.register).toHaveBeenCalled();
      expect(mockedKotlinLicenseService.updateLicenseStatus).toHaveBeenCalledWith('2', {
        isValidSeat: true,
        seatType: 'Premium',
        expirationDate: '2024-12-31',
      });
      expect(result).toEqual(mockRegisterResponse);
    });

    it('should use correct license service based on license feature toggle', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedFeatureToggle.getLicenseService.mockReturnValue(false); // Legacy license service
      mockedKotlinUserService.register.mockResolvedValue(mockRegisterResponse);
      mockedLegacyLicenseService.updateLicenseStatus.mockResolvedValue({
        success: true,
        message: 'License updated',
      });

      const inputWithLicense = {
        ...registerInput,
        license: {
          isValidSeat: true,
        },
      };

      await resolvers.Mutation.register(
        null as any,
        { input: inputWithLicense }
      );

      // Should use Kotlin user service but legacy license service
      expect(mockedKotlinUserService.register).toHaveBeenCalled();
      expect(mockedLegacyLicenseService.updateLicenseStatus).toHaveBeenCalled();
      expect(mockedKotlinLicenseService.updateLicenseStatus).not.toHaveBeenCalled();
    });

    it('should not create license when not provided', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedLegacyUserService.register.mockResolvedValue(mockRegisterResponse);

      await resolvers.Mutation.register(
        null as any,
        { input: registerInput }
      );

      expect(mockedLegacyUserService.register).toHaveBeenCalled();
      expect(mockedLegacyLicenseService.updateLicenseStatus).not.toHaveBeenCalled();
      expect(mockedKotlinLicenseService.updateLicenseStatus).not.toHaveBeenCalled();
    });

    it('should handle license creation errors gracefully', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedFeatureToggle.getLicenseService.mockReturnValue(false);
      mockedLegacyUserService.register.mockResolvedValue(mockRegisterResponse);
      mockedLegacyLicenseService.updateLicenseStatus.mockRejectedValue(
        new Error('License service error')
      );

      const inputWithLicense = {
        ...registerInput,
        license: {
          isValidSeat: true,
        },
      };

      // Should not throw, but log the error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await resolvers.Mutation.register(
        null as any,
        { input: inputWithLicense }
      );

      expect(result).toEqual(mockRegisterResponse);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create license during registration:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Service selection based on feature toggles', () => {
    it('should use kotlin services when both toggles are on', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedFeatureToggle.getLicenseService.mockReturnValue(true);
      mockedKotlinUserService.getUser.mockResolvedValue(mockUser);
      mockedKotlinLicenseService.getLicenseStatus.mockResolvedValue(mockLicense);

      await resolvers.Query.getUser(null as any, { id: '1' }, { auth: mockAuthContext } as any);
      await resolvers.User.licenseStatus(mockUser);

      expect(mockedKotlinUserService.getUser).toHaveBeenCalled();
      expect(mockedKotlinLicenseService.getLicenseStatus).toHaveBeenCalled();
      expect(mockedLegacyUserService.getUser).not.toHaveBeenCalled();
      expect(mockedLegacyLicenseService.getLicenseStatus).not.toHaveBeenCalled();
    });

    it('should use legacy services when both toggles are off', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(false);
      mockedFeatureToggle.getLicenseService.mockReturnValue(false);
      mockedLegacyUserService.getUser.mockResolvedValue(mockUser);
      mockedLegacyLicenseService.getLicenseStatus.mockResolvedValue(mockLicense);

      await resolvers.Query.getUser(null as any, { id: '1' }, { auth: mockAuthContext } as any);
      await resolvers.User.licenseStatus(mockUser);

      expect(mockedLegacyUserService.getUser).toHaveBeenCalled();
      expect(mockedLegacyLicenseService.getLicenseStatus).toHaveBeenCalled();
      expect(mockedKotlinUserService.getUser).not.toHaveBeenCalled();
      expect(mockedKotlinLicenseService.getLicenseStatus).not.toHaveBeenCalled();
    });

    it('should use mixed services when toggles are different', async () => {
      mockedFeatureToggle.getUserService.mockReturnValue(true);
      mockedFeatureToggle.getLicenseService.mockReturnValue(false);
      mockedKotlinUserService.getUser.mockResolvedValue(mockUser);
      mockedLegacyLicenseService.getLicenseStatus.mockResolvedValue(mockLicense);

      await resolvers.Query.getUser(null as any, { id: '1' }, { auth: mockAuthContext } as any);
      await resolvers.User.licenseStatus(mockUser);

      expect(mockedKotlinUserService.getUser).toHaveBeenCalled();
      expect(mockedLegacyLicenseService.getLicenseStatus).toHaveBeenCalled();
      expect(mockedLegacyUserService.getUser).not.toHaveBeenCalled();
      expect(mockedKotlinLicenseService.getLicenseStatus).not.toHaveBeenCalled();
    });
  });
});

