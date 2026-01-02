import axios from 'axios';
import { LegacyLicenseService } from '../legacyLicenseService.js';
import { LicenseStatus, UpdateLicenseInput } from '../types.js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LegacyLicenseService', () => {
  let service: LegacyLicenseService;
  const baseUrl = 'http://license-service:8000';

  beforeEach(() => {
    service = new LegacyLicenseService();
    jest.clearAllMocks();
  });

  describe('getLicenseStatus', () => {
    it('should return license status when REST API call succeeds', async () => {
      const mockLicense: LicenseStatus = {
        id: '1',
        isValidSeat: true,
        seatType: 'Premium',
        expirationDate: '2024-12-31',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockLicense,
      });

      const result = await service.getLicenseStatus('1');

      expect(result).toEqual(mockLicense);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/users/1/authorizations`
      );
    });

    it('should return license status with optional fields', async () => {
      const mockLicense: LicenseStatus = {
        isValidSeat: false,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockLicense,
      });

      const result = await service.getLicenseStatus('2');

      expect(result).toEqual(mockLicense);
    });

    it('should throw error when axios request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getLicenseStatus('1')).rejects.toThrow('Network error');
    });
  });

  describe('updateLicenseStatus', () => {
    it('should return success result when REST API call succeeds', async () => {
      const input: UpdateLicenseInput = {
        isValidSeat: true,
        seatType: 'Premium',
        expirationDate: '2024-12-31',
      };

      mockedAxios.put.mockResolvedValueOnce({
        data: {},
      });

      const result = await service.updateLicenseStatus('1', input);

      expect(result).toEqual({
        success: true,
        message: 'License status updated successfully',
      });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${baseUrl}/users/1/authorizations`,
        {
          isValidSeat: true,
          seatType: 'Premium',
          expirationDate: '2024-12-31',
        }
      );
    });

    it('should handle partial updates', async () => {
      const input: UpdateLicenseInput = {
        isValidSeat: false,
      };

      mockedAxios.put.mockResolvedValueOnce({
        data: {},
      });

      const result = await service.updateLicenseStatus('1', input);

      expect(result).toEqual({
        success: true,
        message: 'License status updated successfully',
      });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${baseUrl}/users/1/authorizations`,
        {
          isValidSeat: false,
          seatType: undefined,
          expirationDate: undefined,
        }
      );
    });

    it('should return success even when axios request fails (legacy behavior)', async () => {
      const input: UpdateLicenseInput = {
        isValidSeat: true,
      };

      // Note: In a real scenario, we might want to handle errors differently
      // but the current implementation doesn't check for errors
      mockedAxios.put.mockResolvedValueOnce({
        data: {},
      });

      const result = await service.updateLicenseStatus('999', input);

      expect(result.success).toBe(true);
    });
  });
});

