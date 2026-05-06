import type { Membership, User } from '@/types/user.type';

export type AuthUser = Partial<User> & Pick<User, 'itemId' | 'email'> & {
  id?: string;
  memberships?: Membership[];
};

export type AuthSession = {
  token: string;
  refreshToken?: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = 'vibecoder_website.auth.session';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeParse = (value: string | null): AuthSession | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<AuthSession>;

    if (!parsed || typeof parsed !== 'object' || typeof parsed.token !== 'string' || !parsed.user) {
      return null;
    }

    return {
      token: parsed.token,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
      user: parsed.user as AuthUser,
    };
  } catch {
    return null;
  }
};

export const readAuthSession = (): AuthSession | null => {
  if (!canUseStorage()) {
    return null;
  }

  return safeParse(window.localStorage.getItem(AUTH_STORAGE_KEY));
};

export const writeAuthSession = (session: AuthSession) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const readAuthToken = () => readAuthSession()?.token ?? null;

export const readAuthUser = () => readAuthSession()?.user ?? null;

export const getCurrentUserId = () => {
  const user = readAuthUser();

  return user?.id ?? user?.itemId ?? null;
};
