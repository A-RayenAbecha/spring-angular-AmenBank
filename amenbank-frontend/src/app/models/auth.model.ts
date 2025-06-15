import { User } from './user.model';

export interface LoginResponse {
  message?: string;
  role?: string;
  token?: string;
  user?: User;
  twoFactorRequired?: boolean;
}

export interface TwoFactorRequest {
  username: string;
  token: string;
}

export interface RegisterRequest {
  username: string;
  first_name: string;
  last_name: string;
  dateOfBirth: string;
  cin: string;
  email: string;
  password: string;
  role: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
} 