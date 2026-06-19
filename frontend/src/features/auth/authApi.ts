import type {
  AuthResponse,
  LoginRequest,
  ResendOtpRequest,
  SignupRequest,
  UserDto,
  VerificationRequiredResponse,
  VerifyOtpRequest,
} from "@pocket-locker/shared";
import { api } from "../../lib/apiClient.js";

export const authApi = {
  signup: (body: SignupRequest) =>
    api<VerificationRequiredResponse>("/auth/signup", { method: "POST", body }),
  verifyOtp: (body: VerifyOtpRequest) =>
    api<AuthResponse>("/auth/verify-otp", { method: "POST", body }),
  resendOtp: (body: ResendOtpRequest) =>
    api<VerificationRequiredResponse>("/auth/resend-otp", {
      method: "POST",
      body,
    }),
  login: (body: LoginRequest) =>
    api<AuthResponse>("/auth/login", { method: "POST", body }),
  me: () => api<UserDto>("/auth/me"),
};
