import axios from 'axios';
import { ILicenseService } from './interfaces.js';
import { LicenseStatus, UpdateLicenseInput, MutationResult } from './types.js';

const LICENSE_SERVICE_KOTLIN_URL = process.env.LICENSE_SERVICE_KOTLIN_URL || 'http://license-service-kotlin:8001';

export class KotlinLicenseService implements ILicenseService {
  async getLicenseStatus(userId: string): Promise<LicenseStatus> {
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
      throw new Error(response.data.errors[0]?.message || 'Failed to fetch license status');
    }
    
    return response.data.data.getLicenseStatus;
  }

  async updateLicenseStatus(userId: string, input: UpdateLicenseInput): Promise<MutationResult> {
    const mutation = `
      mutation UpdateLicenseStatus($userId: ID!, $input: UpdateLicenseInput!) {
        updateLicenseStatus(userId: $userId, input: $input) {
          success
          message
        }
      }
    `;
    
    const variables = {
      userId,
      input: {
        isValidSeat: input.isValidSeat,
        seatType: input.seatType,
        expirationDate: input.expirationDate
      }
    };
    
    const response = await axios.post(`${LICENSE_SERVICE_KOTLIN_URL}/graphql`, {
      query: mutation,
      variables
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0]?.message || 'Failed to update license status');
    }
    
    return response.data.data.updateLicenseStatus;
  }
}

export const kotlinLicenseService = new KotlinLicenseService();

