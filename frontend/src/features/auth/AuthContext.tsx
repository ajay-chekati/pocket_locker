import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  LoginRequest,
  SignupRequest,
  UserDto,
} from "@pocket-locker/shared";
import { tokenStore } from "../../lib/apiClient.js";
import { authApi } from "./authApi.js";

interface AuthContextValue {
  user: UserDto | null;
  /** True until the initial token check resolves, to avoid auth UI flicker. */
  loading: boolean;
  /** Returns the email pending verification (signup never logs in directly). */
  signup: (body: SignupRequest) => Promise<string>;
  /** Verify the emailed OTP; on success the user is logged in. */
  verifyOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  login: (body: LoginRequest) => Promise<void>;
  /** Email a password-reset code (always resolves — never reveals existence). */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Set a new password with the emailed code; on success the user is logged in. */
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, resolve the current user (or clear stale token).
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const signup = useCallback(async (body: SignupRequest) => {
    const res = await authApi.signup(body);
    return res.email; // pending verification — no token yet
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const res = await authApi.verifyOtp({ email, code });
    tokenStore.set(res.token);
    setUser(res.user);
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await authApi.resendOtp({ email });
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    const res = await authApi.login(body);
    tokenStore.set(res.token);
    setUser(res.user);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await authApi.forgotPassword({ email });
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, password: string) => {
      const res = await authApi.resetPassword({ email, code, password });
      tokenStore.set(res.token);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      verifyOtp,
      resendOtp,
      login,
      requestPasswordReset,
      resetPassword,
      logout,
    }),
    [
      user,
      loading,
      signup,
      verifyOtp,
      resendOtp,
      login,
      requestPasswordReset,
      resetPassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
