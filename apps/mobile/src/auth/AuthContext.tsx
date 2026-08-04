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
import type { AuthSession, UserPreferences } from "../types";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(displayName: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  request<T>(path: string, options?: RequestInit): Promise<T>;
  savePreferences(preferences: UserPreferences): Promise<void>;
}

const key = "focusflow.session";
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    SecureStore.getItemAsync(key)
      .then((value) => {
        if (!value) {
          setSession(null);
          return;
        }
        const storedSession = JSON.parse(value) as AuthSession;
        storedSession.user.preferences.clockFormat ??= "12h";
        setSession(storedSession);
      })
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
        try {
          const tokens = await apiRequest<{
            accessToken: string;
            refreshToken: string;
          }>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          });
          const next = { ...session, ...tokens };
          await save(next);
          return await apiRequest<T>(path, options, next.accessToken);
        } catch (refreshError) {
          if (
            refreshError instanceof ApiClientError &&
            refreshError.status === 401
          ) {
            await save(null);
            throw new ApiClientError(
              "Your local session expired. Please sign in again.",
              401,
            );
          }
          throw refreshError;
        }
      }
    },
    [save, session],
  );
  const savePreferences = useCallback(
    async (preferences: UserPreferences) => {
      if (!session) return;
      await save({
        ...session,
        user: { ...session.user, preferences },
      });
    },
    [save, session],
  );
  const value = useMemo(
    () => ({
      session,
      loading,
      login,
      register,
      logout,
      request,
      savePreferences,
    }),
    [session, loading, login, register, logout, request, savePreferences],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
