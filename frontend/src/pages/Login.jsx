import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const GoogleBrandIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 2.9 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-2H12z" />
    <path fill="#34A853" d="M2 12c0 1.9.5 3.7 1.5 5.2l3.2-2.5c-.4-.7-.7-1.7-.7-2.7s.2-1.9.7-2.7L3.5 6.8C2.5 8.3 2 10.1 2 12z" />
    <path fill="#4A90E2" d="M12 22c2.7 0 4.9-.9 6.5-2.4l-3.1-2.4c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1l-3.3 2.5C4.9 20.1 8.2 22 12 22z" />
    <path fill="#FBBC05" d="M6.4 14.1c-.2-.6-.4-1.3-.4-2.1s.1-1.4.4-2.1L3.1 7.4C2.4 8.8 2 10.3 2 12s.4 3.2 1.1 4.6l3.3-2.5z" />
  </svg>
);

const GitHubBrandIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 .5C5.7.5.7 5.6.7 11.8c0 5 3.2 9.2 7.7 10.7.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.2 1.9 1.2 1 .1 1.8 1.3 1.8 1.3 1 .1 1.8-.6 2.2-1 .1-.8.4-1.3.7-1.6-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.5 3-.5s2.1.2 3 .5c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.7-5.7 7.7-10.7C23.3 5.6 18.3.5 12 .5z"
    />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // FastAPI expects form data
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(res.data.access_token); // save token in AuthContext/localStorage
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const backendBase = String(api.defaults.baseURL || 'http://localhost:8000').replace(/\/$/, '');
    window.location.href = `${backendBase}/auth/oauth/${provider.toLowerCase()}/start`;
  };

  return (
    <div className="fixed inset-0 z-2000 overflow-hidden bg-black text-white">
      <main className="grid min-h-screen md:grid-cols-2">
        <section className="flex items-center justify-center px-4 py-10 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-105 rounded-2xl p-7"
            style={{
              background: '#0a0a1a',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.18), 0 0 28px rgba(99, 102, 241, 0.34), 0 0 55px rgba(6, 182, 212, 0.14), 0 20px 50px -30px rgba(0, 0, 0, 0.95)'
            }}
          >
            <h1 className="text-[41px] leading-tight font-bold text-white">
              Welcome back to{' '}
              <span className="bg-linear-to-r from-[#7c3aed] to-[#06b6d4] bg-clip-text text-transparent">AI Interview Coach</span>
            </h1>
            <p className="mt-3 text-sm text-[#9ca3af]">Enter your credentials to access</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-white">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email/UNI ID"
                    required
                    className="w-full rounded-[10px] border border-[#30344a] bg-[#0b0b16] py-3 pl-10 pr-3 text-white placeholder:text-[#6b7280] outline-none transition-colors focus:border-[#06b6d4]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-[10px] border border-[#30344a] bg-[#0b0b16] py-3 pl-10 pr-10 text-white placeholder:text-[#6b7280] outline-none transition-colors focus:border-[#06b6d4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-cyan-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <Link to="/register" className="text-[#06b6d4] transition-colors hover:text-cyan-300">
                  Don&apos;t Have an Account? Sign Up
                </Link>
                <button type="button" className="text-[#06b6d4] transition-colors hover:text-cyan-300">
                  Forgot password?
                </button>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="mt-2 w-full rounded-[10px] bg-linear-to-r from-[#7c3aed] to-[#6d28d9] py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {loading ? 'Logging in...' : 'Login'}
                </span>
              </button>

              <div className="pt-2 text-center text-sm text-[#9ca3af]">OR</div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#7c3aed] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9]"
                >
                  <GoogleBrandIcon /> Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#312e81] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3730a3]"
                >
                  <GitHubBrandIcon /> GitHub
                </button>
              </div>
            </form>
          </motion.div>
        </section>

        <section className="relative hidden items-center justify-center overflow-hidden md:flex">
          <div className="pointer-events-none absolute inset-0 bg-[#000000]" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(1px 1px at 12% 16%, rgba(255,255,255,0.95), transparent), radial-gradient(1px 1px at 28% 72%, rgba(255,255,255,0.85), transparent), radial-gradient(1.2px 1.2px at 48% 24%, rgba(255,255,255,0.95), transparent), radial-gradient(1px 1px at 64% 58%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 84% 20%, rgba(255,255,255,0.88), transparent), radial-gradient(1.4px 1.4px at 90% 72%, rgba(255,255,255,0.98), transparent), radial-gradient(1px 1px at 36% 42%, rgba(255,255,255,0.72), transparent), radial-gradient(1.3px 1.3px at 58% 84%, rgba(255,255,255,0.85), transparent), radial-gradient(1px 1px at 72% 38%, rgba(255,255,255,0.92), transparent), radial-gradient(1px 1px at 18% 88%, rgba(255,255,255,0.8), transparent)',
              opacity: 0.95
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.08),transparent_55%)]" aria-hidden="true" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
            className="relative max-w-xl px-8 text-center"
          >
            <h2 className="text-7xl font-black tracking-tight bg-linear-to-r from-[#7c3aed] to-[#06b6d4] bg-clip-text text-transparent">
              AI Interview Coach
            </h2>
            <p className="mt-6 text-3xl italic leading-relaxed text-white/70">
              AI Interview Coach is your career growth space where{' '}
              <span className="font-semibold text-[#06b6d4]">candidates</span> connect and grow.
            </p>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default Login;