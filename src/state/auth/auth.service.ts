import { clients, HttpError } from '@/lib/https';
import type { Membership } from '@/types/user.type';

import type { AuthSession, AuthUser } from './auth.storage';
import { readAuthToken } from './auth.storage';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type OAuthCallbackParams = {
  code?: string;
  token?: string;
  error?: string;
  redirectUri?: string;
};

type KnownAuthPayload = Record<string, unknown> & {
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
  id_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: unknown;
  currentUser?: unknown;
  data?: unknown;
  result?: unknown;
};

const LOGIN_ENDPOINT = 'https://api.seliseblocks.com/idp/v1/Authentication/Token';
const CURRENT_USER_ENDPOINT = 'current-user';
const CURRENT_USER_ENDPOINT_CANDIDATES = [
  CURRENT_USER_ENDPOINT,
  'currentuser',
  'getcurrentuser',
  'CurrentUser',
];
const OAUTH_EXCHANGE_ENDPOINT_CANDIDATES = ['token', 'oauth/token', 'auth/token', 'oauth/exchange'];

const getFirstString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : '');

const unwrapPayload = (payload: unknown): KnownAuthPayload => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const record = payload as KnownAuthPayload;

  if (record.data && typeof record.data === 'object') {
    return record.data as KnownAuthPayload;
  }

  if (record.result && typeof record.result === 'object') {
    return record.result as KnownAuthPayload;
  }

  return record;
};

const normalizeMemberships = (value: unknown): Membership[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const memberships = value
    .map((membership) => {
      if (!membership || typeof membership !== 'object') {
        return null;
      }

      const record = membership as Record<string, unknown>;
      const organizationId = getFirstString(record.organizationId ?? record.organizationID ?? record.orgId);
      const roles = Array.isArray(record.roles)
        ? record.roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
        : [];

      if (!organizationId && roles.length === 0) {
        return null;
      }

      return {
        organizationId,
        roles,
      };
    })
    .filter((membership): membership is Membership => membership !== null);

  return memberships.length > 0 ? memberships : undefined;
};

const normalizeUser = (payload: unknown): AuthUser => {
  const record = unwrapPayload(payload);
  const userSource =
    (record.user && typeof record.user === 'object' ? (record.user as Record<string, unknown>) : null) ??
    (record.currentUser && typeof record.currentUser === 'object'
      ? (record.currentUser as Record<string, unknown>)
      : null) ??
    record;

  const itemId =
    getFirstString(userSource.itemId ?? userSource.ItemId ?? userSource.id ?? userSource.userId) || 'unknown-user';
  const email =
    getFirstString(userSource.email ?? userSource.Email ?? userSource.userName ?? userSource.username) ||
    'unknown@example.com';

  return {
    itemId,
    id: itemId,
    email,
    firstName: getFirstString(userSource.firstName ?? userSource.FirstName) || undefined,
    lastName: getFirstString(userSource.lastName ?? userSource.LastName) || undefined,
    userName: getFirstString(userSource.userName ?? userSource.username ?? userSource.UserName) || undefined,
    phoneNumber: getFirstString(userSource.phoneNumber ?? userSource.PhoneNumber) || undefined,
    roles: Array.isArray(userSource.roles)
      ? userSource.roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
      : undefined,
    permissions: Array.isArray(userSource.permissions)
      ? userSource.permissions.filter(
          (permission): permission is string => typeof permission === 'string' && permission.trim().length > 0,
        )
      : undefined,
    memberships: normalizeMemberships(userSource.memberships),
  };
};

const normalizeToken = (payload: KnownAuthPayload) => {
  return (
    getFirstString(payload.token) ||
    getFirstString(payload.access_token) ||
    getFirstString(payload.accessToken) ||
    getFirstString(payload.jwt) ||
    getFirstString(payload.id_token) ||
    getFirstString(payload.idToken)
  );
};

const isFallbackEligible = (error: unknown) => {
  if (!(error instanceof HttpError)) {
    return true;
  }

  return error.status === 404 || error.status === 405;
};

const tryEndpoint = async <T>(endpoints: readonly string[], request: (url: string) => Promise<T>): Promise<T> => {
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      return await request(endpoint);
    } catch (error) {
      lastError = error;

      if (!isFallbackEligible(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Authentication request failed');
};

export const login = async (credentials: LoginCredentials): Promise<AuthSession> => {
  const payload = new URLSearchParams();
  payload.append('grant_type', 'password');
  payload.append('username', credentials.email);
  payload.append('password', credentials.password);

  const response = await clients.request<unknown>(LOGIN_ENDPOINT, {
    method: 'POST',
    body: payload,
    skipAuth: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-blocks-key': import.meta.env.VITE_X_BLOCKS_KEY ?? '',
    },
  });

  const normalized = unwrapPayload(response);
  const token = normalizeToken(normalized);

  if (!token) {
    throw new Error('Login succeeded but no access token was returned.');
  }

  const user = normalizeUser(normalized);

  return {
    token,
    refreshToken: getFirstString(normalized.refreshToken) || undefined,
    user,
  };
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const token = readAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await tryEndpoint(CURRENT_USER_ENDPOINT_CANDIDATES, async (endpoint) => {
      return clients.request<unknown>(endpoint, {
        method: 'GET',
      });
    });

    return normalizeUser(response);
  } catch (error) {
    if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
      return null;
    }

    throw error;
  }
};

const getCurrentUserWithToken = async (token: string): Promise<AuthUser> => {
  const response = await tryEndpoint(CURRENT_USER_ENDPOINT_CANDIDATES, async (endpoint) => {
    return clients.request<unknown>(endpoint, {
      method: 'GET',
      skipAuth: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  });

  return normalizeUser(response);
};

export const completeOAuthCallback = async ({
  code,
  token,
  error,
  redirectUri,
}: OAuthCallbackParams): Promise<AuthSession> => {
  if (error) {
    throw new Error(error);
  }

  let resolvedToken = token?.trim() ?? '';
  let responsePayload: KnownAuthPayload = {};

  if (!resolvedToken && code?.trim()) {
    const exchangePayload = {
      code: code.trim(),
      redirect_uri:
        redirectUri?.trim() ||
        import.meta.env.VITE_OAUTH_REDIRECT_URI?.trim() ||
        'http://localhost:3000/auth/callback',
      client_id: import.meta.env.VITE_BLOCKS_OIDC_CLIENT_ID?.trim(),
      grant_type: 'authorization_code',
    };

    const exchangeResponse = await tryEndpoint(
      OAUTH_EXCHANGE_ENDPOINT_CANDIDATES,
      async (endpoint) =>
        clients.request<unknown>(endpoint, {
          method: 'POST',
          body: JSON.stringify(exchangePayload),
          skipAuth: true,
        }),
    );

    responsePayload = unwrapPayload(exchangeResponse);
    resolvedToken = normalizeToken(responsePayload);
  }

  if (!resolvedToken && !code?.trim()) {
    throw new Error('OAuth callback missing authorization code.');
  }

  if (!resolvedToken) {
    throw new Error('OAuth token exchange failed.');
  }

  const user = await getCurrentUserWithToken(resolvedToken);

  return {
    token: resolvedToken,
    refreshToken:
      getFirstString(responsePayload.refresh_token) ||
      getFirstString(responsePayload.refreshToken) ||
      undefined,
    user,
  };
};
