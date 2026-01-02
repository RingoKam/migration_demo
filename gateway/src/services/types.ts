export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface LicenseStatus {
  isValidSeat: boolean;
  seatType?: string;
  expirationDate?: string;
  id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  role?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
}

export interface UpdateLicenseInput {
  isValidSeat?: boolean;
  seatType?: string;
  expirationDate?: string;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

