import axios from 'axios';
import { KotlinLicenseService } from '../kotlinLicenseService.js';
import { LicenseStatus, UpdateLicenseInput } from '../types.js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KotlinLicenseService', () => {
  let service: KotlinLicenseService;
  const baseUrl = 'http://license-service-kotlin:8001';

  beforeEach(() => {
    service = new KotlinLicenseService();
    jest.clearAllMocks();
  });

  describe('getLicenseStatus', () => {
    it('should return license status when GraphQL query succeeds', async () => {
      const mockLicense: LicenseStatus = {
        id: '1',
        isValidSeat: true,
        seatType: 'Premium',
        expirationDate: '2024-12-31',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            getLicenseStatus: mockLicense,
          },
        },
      });

      const result = await service.getLicenseStatus('1');

      expect(result).toEqual(mockLicense);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/graphql`,
        expect.objectContaining({
          query: expect.stringContaining('query GetLicenseStatus'),
          variables: { userId: '1' },
        })
      );
    });

    it('should throw error when GraphQL returns errors', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [
            { message: 'License not found' },
          ],
        },
      });

      await expect(service.getLicenseStatus('999')).rejects.toThrow('License not found');
    });

    it('should throw default error when error has no message', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [{}],
        },
      });

      await expect(service.getLicenseStatus('999')).rejects.toThrow('Failed to fetch license status');
    });

    it('should throw default error when errors array is empty', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [],
        },
      });

      await expect(service.getLicenseStatus('999')).rejects.toThrow('Failed to fetch license status');
    });
  });

  describe('updateLicenseStatus', () => {
    it('should return mutation result when GraphQL mutation succeeds', async () => {
      const input: UpdateLicenseInput = {
        isValidSeat: true,
        seatType: 'Premium',
        expirationDate: '2024-12-31',
      };

      const mockResponse = {
        success: true,
        message: 'License updated successfully',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            updateLicenseStatus: mockResponse,
          },
        },
      });

      const result = await service.updateLicenseStatus('1', input);

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/graphql`,
        expect.objectContaining({
          query: expect.stringContaining('mutation UpdateLicenseStatus'),
          variables: {
            userId: '1',
            input: {
              isValidSeat: true,
              seatType: 'Premium',
              expirationDate: '2024-12-31',
            },
          },
        })
      );
    });

    it('should handle partial updates', async () => {
      const input: UpdateLicenseInput = {
        isValidSeat: false,
      };

      const mockResponse = {
        success: true,
        message: 'License updated successfully',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            updateLicenseStatus: mockResponse,
          },
        },
      });

      const result = await service.updateLicenseStatus('1', input);

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/graphql`,
        expect.objectContaining({
          variables: {
            userId: '1',
            input: {
              isValidSeat: false,
              seatType: undefined,
              expirationDate: undefined,
            },
          },
        })
      );
    });

    it('should throw error when GraphQL returns errors', async () => {
      const input: UpdateLicenseInput = {
        isValidSeat: true,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [
            { message: 'User not found' },
          ],
        },
      });

      await expect(service.updateLicenseStatus('999', input)).rejects.toThrow('User not found');
    });

    it('should throw default error when error has no message', async () => {
      const input: UpdateLicenseInput = {
        isValidSeat: true,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [{}],
        },
      });

      await expect(service.updateLicenseStatus('1', input)).rejects.toThrow('Failed to update license status');
    });
  });
});

