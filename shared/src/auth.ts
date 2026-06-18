import { z } from "zod";
import type { Plan } from "./constants.js";

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

/** Public-safe view of a user (never includes the password hash). */
export interface UserDto {
  id: string;
  email: string;
  plan: Plan;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}
