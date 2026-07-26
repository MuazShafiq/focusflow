const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

interface ApiEnvelope<T> {
  data: T;
}

interface ApiFailure {
  error?: { message?: string };
}

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
  accessToken?: string,
): Promise<T> => {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const failure = (await response.json().catch(() => ({}))) as ApiFailure;
    throw new ApiClientError(
      failure.error?.message ?? "FocusFlow could not complete that request",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return ((await response.json()) as ApiEnvelope<T>).data;
};
