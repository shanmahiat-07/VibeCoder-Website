interface Https {
  get<T>(url: string, headers?: HeadersInit): Promise<T>;
  post<T>(url: string, body: BodyInit, headers?: HeadersInit): Promise<T>;
  put<T>(url: string, body: BodyInit, headers?: HeadersInit): Promise<T>;
  delete<T>(url: string, headers?: HeadersInit): Promise<T>;
  request<T>(url: string, options: RequestOptions): Promise<T>;
  createHeaders(headers: HeadersInit): Headers;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: BodyInit;
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

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
const projectKey = import.meta.env.VITE_X_BLOCKS_KEY ?? '';

export const clients: Https = {
  async get<T>(url: string, headers: HeadersInit = {}): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  },

  async post<T>(url: string, body: BodyInit, headers: HeadersInit = {}): Promise<T> {
    return this.request<T>(url, { method: 'POST', headers, body });
  },

  async put<T>(url: string, body: BodyInit, headers: HeadersInit = {}): Promise<T> {
    return this.request<T>(url, { method: 'PUT', headers, body });
  },

  async delete<T>(url: string, headers: HeadersInit = {}): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', headers });
  },

  async request<T>(url: string, { method, headers = {}, body }: RequestOptions): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}/${url.replace(/^\//, '')}`;
    const response = await fetch(fullUrl, {
      method,
      headers: this.createHeaders(headers),
      body,
      referrerPolicy: 'no-referrer',
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    let error: Record<string, unknown>;

    try {
      error = await response.json();
    } catch {
      error = { error: response.statusText || 'Request failed' };
    }

    throw new HttpError(response.status, error);
  },

  createHeaders(headers: HeadersInit): Headers {
    const headerEntries =
      headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;

    return new Headers({
      'Content-Type': 'application/json',
      ...(projectKey && { 'x-blocks-key': projectKey }),
      ...headerEntries,
    });
  },
};
