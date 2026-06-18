import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  UserDto,
} from "@pocket-locker/shared";
import { api } from "../../lib/apiClient.js";

export const authApi = {
  signup: (body: SignupRequest) =>
    api<AuthResponse>("/auth/signup", { method: "POST", body }),
  login: (body: LoginRequest) =>
    api<AuthResponse>("/auth/login", { method: "POST", body }),
  me: () => api<UserDto>("/auth/me"),
};
