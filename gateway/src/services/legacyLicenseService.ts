import axios from 'axios';
import { ILicenseService } from './interfaces.js';
import { LicenseStatus, UpdateLicenseInput, MutationResult } from './types.js';

const LICENSE_SERVICE_URL = process.env.LICENSE_SERVICE_URL || 'http://license-service:8000';

export class LegacyLicenseService implements ILicenseService {
  async getLicenseStatus(userId: string): Promise<LicenseStatus> {
    const response = await axios.get<LicenseStatus>(
      `${LICENSE_SERVICE_URL}/users/${userId}/authorizations`
    );
    return response.data;
  }

  async updateLicenseStatus(userId: string, input: UpdateLicenseInput): Promise<MutationResult> {
    await axios.put(
      `${LICENSE_SERVICE_URL}/users/${userId}/authorizations`,
      {
        isValidSeat: input.isValidSeat,
        seatType: input.seatType,
        expirationDate: input.expirationDate
      }
    );
    
    // Legacy service doesn't return a result, so we provide a default success response
    return {
      success: true,
      message: 'License status updated successfully'
    };
  }
}

export const legacyLicenseService = new LegacyLicenseService();

