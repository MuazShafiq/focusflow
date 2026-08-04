import Constants from "expo-constants";

const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (metroHost ? `http://${metroHost}:4000/api` : "http://localhost:4000/api");

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> => {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiClientError(
      body?.error?.message ?? "FocusFlow could not complete that request",
      response.status,
    );
  }
  return body.data as T;
};
