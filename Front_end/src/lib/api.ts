/**
 * Fetch wrapper that automatically attaches the auth token to API requests.
 * All API calls should go through this module.
 */

import { useAuthStore } from '../stores/authStore';

const BASE_URL = '';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(rest.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach auth token if available and not skipping auth
  if (!skipAuth) {
    const token = useAuthStore.getState().session?.access_token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    headers,
  });

  // Handle 401 — token expired or invalid
  if (response.status === 401 && !skipAuth) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  let data: any = {};
  const contentType = response.headers.get('content-type');
  
  if (response.status !== 204 && contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.warn('Failed to parse JSON response:', jsonErr);
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  // Special method for file uploads
  upload: <T>(endpoint: string, formData: FormData, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),
};
