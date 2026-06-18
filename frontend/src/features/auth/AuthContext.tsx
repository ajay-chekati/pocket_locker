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
  login: (body: LoginRequest) => Promise<void>;
  signup: (body: SignupRequest) => Promise<void>;
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

  const login = useCallback(async (body: LoginRequest) => {
    const res = await authApi.login(body);
    tokenStore.set(res.token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (body: SignupRequest) => {
    const res = await authApi.signup(body);
    tokenStore.set(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
