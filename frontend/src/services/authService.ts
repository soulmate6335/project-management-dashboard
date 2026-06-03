// src/services/authService.ts
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { User } from '../features/auth/store/authSlice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/** Shape returned by the API for all error responses */
interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>; // field-level validation errors
  code?: string;                     // machine-readable error code
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
if (!BASE_URL) {
  // Fail loudly at boot — a missing base URL means every request will 404.
  throw new Error(
    '[authService] VITE_API_URL is not defined. ' +
    'Add it to your .env file: VITE_API_URL=https://your-api.com'
  );
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach the JWT on every outgoing request
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — normalise errors into AuthServiceError instances
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    return Promise.reject(normaliseError(error));
  }
);

// ---------------------------------------------------------------------------
// AuthServiceError
//
// A typed error subclass so callers can do:
//   catch (err) { if (err instanceof AuthServiceError) ... }
// ---------------------------------------------------------------------------
export class AuthServiceError extends Error {
  /** HTTP status code (0 = network error, no response received) */
  public readonly status: number;
  /** Machine-readable code from the API, e.g. 'INVALID_CREDENTIALS' */
  public readonly code: string | undefined;
  /** Field-level validation messages, e.g. { email: ['already taken'] } */
  public readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function normaliseError(error: AxiosError<ApiErrorResponse>): AuthServiceError {
  if (error.response) {
    // Server responded with a non-2xx status
    const { status, data } = error.response;
    const message = data?.message ?? httpStatusMessage(status);
    return new AuthServiceError(message, status, data?.code, data?.errors);
  }

  if (error.request) {
    // Request was sent but no response received (timeout, network down, CORS)
    return new AuthServiceError(
      'Unable to reach the server. Please check your connection.',
      0
    );
  }

  // Something went wrong setting up the request
  return new AuthServiceError(error.message ?? 'An unexpected error occurred.', 0);
}

function httpStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'The request was invalid. Please check your input.',
    401: 'Invalid email or password.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'An account with this email already exists.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Please try again later.',
    502: 'The server is temporarily unavailable. Please try again later.',
    503: 'The service is currently unavailable. Please try again later.',
  };
  return messages[status] ?? `An unexpected error occurred (HTTP ${status}).`;
}

// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------

/**
 * Authenticate an existing user.
 * Resolves with the user object and JWT on success.
 * Rejects with {@link AuthServiceError} on failure.
 */
async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Create a new user account.
 * Resolves with the newly created user and JWT on success.
 * Rejects with {@link AuthServiceError} on failure (including 409 if email is taken).
 */
async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

/**
 * Fetch the currently authenticated user using the stored JWT.
 * Used on app boot to rehydrate auth state without a full login round-trip.
 * Rejects with {@link AuthServiceError} (401) if the token is missing or expired.
 */
async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
const authService = { login, register, getCurrentUser };

export default authService;

// Named exports for consumers that prefer them
export { login, register, getCurrentUser };