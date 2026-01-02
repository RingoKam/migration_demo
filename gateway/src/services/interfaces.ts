import {
  User,
  LoginCredentials,
  RegisterInput,
  LoginResponse,
  RegisterResponse,
  LicenseStatus,
  UpdateLicenseInput,
  MutationResult
} from './types.js';

export interface IUserService {
  getUser(userId: string): Promise<User>;
  login(credentials: LoginCredentials): Promise<LoginResponse>;
  register(input: RegisterInput): Promise<RegisterResponse>;
}

export interface ILicenseService {
  getLicenseStatus(userId: string): Promise<LicenseStatus>;
  updateLicenseStatus(userId: string, input: UpdateLicenseInput): Promise<MutationResult>;
}

