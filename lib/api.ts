import { createClient } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();

  // Retrieve current active Supabase session and JWT access token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Session retrieval warning:', sessionError.message);
  }

  const token = session?.access_token;

  // Construct headers, inject auth token if available
  const headers = new Headers(options.headers || {});

  // Set default Content-Type to JSON (unless sending FormData)
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Execute fetch request against FastAPI backend
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Error handling
  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // Fallback if response body isn't parseable JSON
    }
    throw new Error(errorMessage);
  }

  // Handling empty bodies
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
