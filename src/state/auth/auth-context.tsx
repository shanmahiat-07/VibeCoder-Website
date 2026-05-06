import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { clearAuthSession, readAuthSession, writeAuthSession, type AuthUser } from './auth.storage';
import {
  completeOAuthCallback,
  getCurrentUser,
  login as loginWithIam,
  type LoginCredentials,
  type OAuthCallbackParams,
} from './auth.service';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  completeOAuthLogin: (params: OAuthCallbackParams) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
  const storedSession = useMemo(() => readAuthSession(), []);
  const [user, setUser] = useState<AuthUser | null>(storedSession?.user ?? null);
  const [token, setToken] = useState<string | null>(storedSession?.token ?? null);
  const [isReady, setIsReady] = useState<boolean>(!storedSession?.token);

  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      if (!storedSession?.token) {
        if (isActive) {
          setIsReady(true);
        }

        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (!isActive) {
          return;
        }

        if (currentUser) {
          const nextSession = {
            token: storedSession.token,
            refreshToken: storedSession.refreshToken,
            user: currentUser,
          };

          writeAuthSession(nextSession);
          setToken(nextSession.token);
          setUser(nextSession.user);
        } else {
          clearAuthSession();
          setToken(null);
          setUser(null);
        }
      } catch {
        if (!isActive) {
          return;
        }

        clearAuthSession();
        setToken(null);
        setUser(null);
      } finally {
        if (isActive) {
          setIsReady(true);
        }
      }
    };

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, [storedSession?.refreshToken, storedSession?.token]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await loginWithIam(credentials);

    writeAuthSession(session);
    setToken(session.token);
    setUser(session.user);
    setIsReady(true);

    return session.user;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    setIsReady(true);
  }, []);

  const completeOAuthLogin = useCallback(async (params: OAuthCallbackParams) => {
    const session = await completeOAuthCallback(params);

    writeAuthSession(session);
    setToken(session.token);
    setUser(session.user);
    setIsReady(true);

    return session.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isReady,
      login,
      completeOAuthLogin,
      logout,
    }),
    [completeOAuthLogin, isReady, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
