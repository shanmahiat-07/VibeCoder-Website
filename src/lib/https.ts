import { readAuthToken } from '@/state/auth/auth.storage';

interface Https {
  get<T>(url: string, headers?: HeadersInit): Promise<T>;
  post<T>(url: string, body: BodyInit, headers?: HeadersInit, skipAuth?: boolean): Promise<T>;
  put<T>(url: string, body: BodyInit, headers?: HeadersInit, skipAuth?: boolean): Promise<T>;
  delete<T>(url: string, headers?: HeadersInit): Promise<T>;
  request<T>(url: string, options: RequestOptions): Promise<T>;
  createHeaders(headers: HeadersInit, skipAuth?: boolean, body?: BodyInit): Headers;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: BodyInit;
  skipAuth?: boolean;
}

export class HttpError extends Error {
  status: number;
  error: Record<string, unknown>;

  constructor(status: number, error: Record<string, unknown>) {
    const errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error);

    super(errorMessage);
    this.status = status;
    this.error = error;
  }
}

const IAM_BASE_URL = import.meta.env.VITE_IAM_BASE_URL?.replace(/\/$/, '') ?? '';
const projectKey = import.meta.env.VITE_X_BLOCKS_KEY ?? '';
console.log('IAM project key:', projectKey);

export const clients: Https = {
  async get<T>(url: string, headers: HeadersInit = {}): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  },

  async post<T>(url: string, body: BodyInit, headers: HeadersInit = {}, skipAuth = false): Promise<T> {
    return this.request<T>(url, { method: 'POST', headers, body, skipAuth });
  },

  async put<T>(url: string, body: BodyInit, headers: HeadersInit = {}, skipAuth = false): Promise<T> {
    return this.request<T>(url, { method: 'PUT', headers, body, skipAuth });
  },

  async delete<T>(url: string, headers: HeadersInit = {}): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', headers });
  },

  async request<T>(url: string, { method, headers = {}, body, skipAuth = false }: RequestOptions): Promise<T> {
    if (!IAM_BASE_URL && !url.startsWith('http')) {
      const message = 'Missing required SELISE IAM configuration';
      console.error(message, {
        missingKey: 'VITE_IAM_BASE_URL',
      });
      throw new Error(message);
    }
    if (!projectKey) {
      const message = 'Missing required SELISE IAM configuration';
      console.error(message, {
        missingKey: 'VITE_X_BLOCKS_KEY',
      });
      throw new Error(message);
    }

    const fullUrl = url.startsWith('http') ? url : `${IAM_BASE_URL}/${url.replace(/^\//, '')}`;
    const requestHeaders = this.createHeaders(headers, skipAuth, body);

    console.debug('[HTTP request]', {
      url: fullUrl,
      method,
      headers: Object.fromEntries(requestHeaders.entries()),
    });

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body,
        referrerPolicy: 'no-referrer',
      });
    } catch (error) {
      const fetchError = error as Error;
      const message = fetchError?.message?.toLowerCase?.() ?? '';
      const errorType =
        message.includes('failed to fetch') || message.includes('network')
          ? 'network_or_cors_error'
          : 'unknown_fetch_error';

      console.error('[HTTP fetch failed]', {
        url: fullUrl,
        method,
        errorType,
        error,
      });
      throw error;
    }

    if (response.ok) {
      if (response.status === 204) {
        return undefined as T;
      }

      return response.json() as Promise<T>;
    }

    let error: Record<string, unknown>;

    try {
      error = await response.json();
    } catch {
      error = { error: response.statusText || 'Request failed' };
    }

    console.error('[HTTP response error]', {
      url: fullUrl,
      method,
      status: response.status,
      errorType:
        response.status === 404
          ? 'endpoint_not_found'
          : response.status === 0
            ? 'cors_or_network_error'
            : 'http_error',
      error,
    });

    throw new HttpError(response.status, error);
  },

  createHeaders(headers: HeadersInit, skipAuth = false, body?: BodyInit): Headers {
    const headerEntries =
      headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
    const token = skipAuth ? null : readAuthToken();
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (skipAuth) {
      const nextHeaders = new Headers({
        'x-blocks-key': projectKey,
        ...headerEntries,
      });

      if (!isFormData && !nextHeaders.has('Content-Type')) {
        nextHeaders.set('Content-Type', 'application/json');
      }

      return nextHeaders;
    }

    const nextHeaders = new Headers({
      'x-blocks-key': projectKey,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headerEntries,
    });

    if (!isFormData && !nextHeaders.has('Content-Type')) {
      nextHeaders.set('Content-Type', 'application/json');
    }

    return nextHeaders;
  },
};
