import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const token = params.get('token');
  const error = params.get('error');

  const decodedError = useMemo(() => {
    if (!error) return '';
    try {
      return decodeURIComponent(error);
    } catch {
      return error;
    }
  }, [error]);

  useEffect(() => {
    if (token) {
      login(token);
      navigate('/dashboard', { replace: true });
      return;
    }

    if (error) {
      const timer = setTimeout(() => navigate('/login', { replace: true }), 2500);
      return () => clearTimeout(timer);
    }
  }, [token, error, login, navigate]);

  return (
    <div className="min-h-screen pt-32 px-6 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-4xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl p-8 text-center shadow-2xl">
        {token ? (
          <>
            <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500" />
            <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">OAuth Success</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Signing you in and redirecting to dashboard...</p>
          </>
        ) : (
          <>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
            <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">OAuth Failed</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{decodedError || 'Unable to complete OAuth login.'}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;