import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { register } from '@/state/auth/auth.service';
import { useAuth } from '@/state/auth/auth-context';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isReady } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await register(email, password);
      navigate('/login', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReady && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/20">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">SELISE IAM</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Sign up</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Create an account with email and password.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                placeholder="Enter your password"
                required
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-200 underline underline-offset-4 hover:text-cyan-100">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
