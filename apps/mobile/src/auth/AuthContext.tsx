import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { ApiClientError, apiRequest } from "../lib/api";
import type { AuthSession } from "../types";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(displayName: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  request<T>(path: string, options?: RequestInit): Promise<T>;
}

const key = "focusflow.session";
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    SecureStore.getItemAsync(key)
      .then((value) => setSession(value ? JSON.parse(value) : null))
      .finally(() => setLoading(false));
  }, []);
  const save = useCallback(async (next: AuthSession | null) => {
    setSession(next);
    if (next) await SecureStore.setItemAsync(key, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(key);
  }, []);
  const login = useCallback(
    async (email: string, password: string) => {
      await save(
        await apiRequest<AuthSession>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      );
    },
    [save],
  );
  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      await save(
        await apiRequest<AuthSession>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            displayName,
            email,
            password,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        }),
      );
    },
    [save],
  );
  const logout = useCallback(async () => {
    if (session) {
      await apiRequest(
        "/auth/logout",
        { method: "POST" },
        session.accessToken,
      ).catch(() => undefined);
    }
    await save(null);
  }, [save, session]);
  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      if (!session) throw new ApiClientError("Authentication is required", 401);
      try {
        return await apiRequest<T>(path, options, session.accessToken);
      } catch (error) {
        if (!(error instanceof ApiClientError) || error.status !== 401) {
          throw error;
        }
        const tokens = await apiRequest<{
          accessToken: string;
          refreshToken: string;
        }>("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        const next = { ...session, ...tokens };
        await save(next);
        return apiRequest<T>(path, options, next.accessToken);
      }
    },
    [save, session],
  );
  const value = useMemo(
    () => ({ session, loading, login, register, logout, request }),
    [session, loading, login, register, logout, request],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
