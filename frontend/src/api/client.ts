const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('civic_pulse_token');
  
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear expired token if current request failed with 401
      localStorage.removeItem('civic_pulse_token');
      localStorage.removeItem('civic_pulse_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let data: any = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      let errorMsg = data?.detail || data?.message;
      if (!errorMsg) {
        if (response.status >= 500) {
          errorMsg = 'Municipal server is temporarily unavailable. Please retry shortly.';
        } else if (response.status === 404) {
          errorMsg = 'Requested resource not found.';
        } else {
          errorMsg = `Request failed with status ${response.status}`;
        }
      }
      const errorsList = data?.errors || [];
      const err: ApiError = {
        message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        status: response.status,
        errors: errorsList,
      };
      throw err;
    }

    return data as T;
  } catch (error: any) {
    if (error.message && error.status) {
      throw error;
    }
    // Network error or unexpected exception
    throw {
      message: error.message || 'Unable to connect to municipal server. Please check your network connection.',
      status: 0,
    } as ApiError;
  }
}
