import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './auth-context';

export const RequireAuth = ({ children }: Readonly<{ children: JSX.Element }>) => {
  const location = useLocation();
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Loading session</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

