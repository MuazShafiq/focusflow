import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { ApiClientError, apiRequest } from "../lib/api";
import type { AuthSession } from "../types";

interface AuthContextValue {
  session: AuthSession | null;
  login(email: string, password: string): Promise<void>;
  register(input: {
    displayName: string;
    email: string;
    password: string;
    timezone: string;
  }): Promise<void>;
  logout(): Promise<void>;
  request<T>(path: string, options?: RequestInit): Promise<T>;
}

const STORAGE_KEY = "focusflow.session";
const AuthContext = createContext<AuthContextValue | null>(null);

const loadSession = (): AuthSession | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(loadSession);
  const saveSession = useCallback((next: AuthSession | null) => {
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);
  const login = useCallback(
    async (email: string, password: string) => {
      saveSession(
        await apiRequest<AuthSession>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      );
    },
    [saveSession],
  );
  const register = useCallback(
    async (input: {
      displayName: string;
      email: string;
      password: string;
      timezone: string;
    }) => {
      saveSession(
        await apiRequest<AuthSession>("/auth/register", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      );
    },
    [saveSession],
  );
  const logout = useCallback(async () => {
    if (session) {
      await apiRequest<void>(
        "/auth/logout",
        { method: "POST" },
        session.accessToken,
      ).catch(() => undefined);
    }
    saveSession(null);
  }, [saveSession, session]);
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
        saveSession(next);
        return apiRequest<T>(path, options, next.accessToken);
      }
    },
    [saveSession, session],
  );
  const value = useMemo(
    () => ({ session, login, register, logout, request }),
    [session, login, register, logout, request],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
