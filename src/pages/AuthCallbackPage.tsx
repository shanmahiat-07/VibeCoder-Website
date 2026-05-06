import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/state/auth/auth-context';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isReady, completeOAuthLogin } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callbackParams = useMemo(
    () => ({
      code: searchParams.get('code') ?? undefined,
      token: searchParams.get('token') ?? searchParams.get('access_token') ?? undefined,
      error: searchParams.get('error') ?? undefined,
    }),
    [searchParams]
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        await completeOAuthLogin(callbackParams);

        if (active) {
          navigate('/', { replace: true });
        }
      } catch (error) {
        if (!active) return;

        setErrorMessage(error instanceof Error ? error.message : 'OAuth login failed');

        window.setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1800);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [callbackParams, completeOAuthLogin, navigate]);

  if (isReady && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">SELISE IAM</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Completing sign in</h1>
        {errorMessage ? (
          <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Processing OAuth callback and creating session...</p>
        )}
      </div>
    </main>
  );
};
