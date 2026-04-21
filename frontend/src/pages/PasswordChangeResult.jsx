import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const PasswordChangeResult = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'error';
  const message = searchParams.get('message') || 'Unable to process your security request.';
  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-6 flex items-center justify-center">
      <div className="max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl p-8 md:p-10 text-center">
        <div className={`mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
          {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>

        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          {isSuccess ? 'Security Action Completed' : 'Security Action Failed'}
        </h1>

        <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="clickable-surface inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            Go to Login
          </Link>
          <Link
            to="/settings"
            className="clickable-surface inline-flex items-center justify-center px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
          >
            Open Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeResult;
