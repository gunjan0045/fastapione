import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, ArrowLeft, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ParticlesBackground from '../components/ParticlesBackground';

const REGISTER_HERO_LINES = ['Create your', 'account and start', 'improving today.'];

const TypingCaret = () => (
  <span
    className="inline-block h-[0.88em] w-0.5 ml-1 align-[-0.08em] rounded-full bg-current shadow-[0_0_12px_rgba(123,198,255,0.9)]"
    aria-hidden="true"
  />
);

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

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayedLines, setDisplayedLines] = useState(() => REGISTER_HERO_LINES.map(() => ''));
  const [activeLine, setActiveLine] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [typingDone, setTypingDone] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;

    const typeTimer = setInterval(() => {
      if (lineIndex >= REGISTER_HERO_LINES.length) {
        setTypingDone(true);
        clearInterval(typeTimer);
        return;
      }

      const currentLine = REGISTER_HERO_LINES[lineIndex];
      setDisplayedLines((prev) => {
        const next = [...prev];
        next[lineIndex] = currentLine.slice(0, charIndex + 1);
        return next;
      });

      charIndex += 1;
      if (charIndex >= currentLine.length) {
        lineIndex += 1;
        setActiveLine(lineIndex);
        charIndex = 0;
      }
    }, 45);

    return () => clearInterval(typeTimer);
  }, []);

  useEffect(() => {
    if (typingDone) return;

    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 430);

    return () => clearInterval(cursorTimer);
  }, [typingDone]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Register
      await api.post('/auth/register', { name, email, password });
      
      // Auto Login
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider) => {
    const backendBase = String(api.defaults.baseURL || 'http://localhost:8000').replace(/\/$/, '');
    window.location.href = `${backendBase}/auth/oauth/${provider.toLowerCase()}/start`;
  };

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-10 px-4 sm:px-6 relative overflow-hidden">
      <ParticlesBackground />
      <div className="absolute top-24 left-10 w-72 h-72 bg-blue-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 right-10 w-80 h-80 bg-indigo-500/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 grid-lines opacity-20 dark:opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        <motion.section
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-4xl border border-white/10 bg-[#08102d]/85 dark:bg-[#08102d]/90 backdrop-blur-2xl shadow-[0_30px_80px_-35px_rgba(10,18,50,0.9)] p-7 md:p-10 lg:p-12 text-white"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_30%)]" />
          <div className="relative flex flex-col h-full justify-between gap-10">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="w-3.5 h-3.5" /> Build your interview profile
              </div>

              <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-tight">
                <motion.span
                  initial={{ opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                  animate={displayedLines[0].length > 0 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : { opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                  transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                  className="block min-h-[1.1em]"
                >
                  {displayedLines[0] || '\u00A0'}
                  {!typingDone && activeLine === 0 && showCursor && <TypingCaret />}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                  animate={displayedLines[1].length > 0 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : { opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                  transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                  className="soft-gradient-text block min-h-[1.1em]"
                >
                  {displayedLines[1] || '\u00A0'}
                  {!typingDone && activeLine === 1 && showCursor && <TypingCaret />}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                  animate={displayedLines[2].length > 0 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : { opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                  transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                  className="block min-h-[1.1em]"
                >
                  {displayedLines[2] || '\u00A0'}
                  {!typingDone && activeLine === 2 && showCursor && <TypingCaret />}
                </motion.span>
              </h1>
              <p className="mt-5 max-w-xl text-base md:text-lg text-white/75 leading-7">
                Save your practice sessions, generate feedback reports, and manage profile details from a single dashboard.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Fast setup', value: '< 1 min', icon: BadgeCheck },
                { label: 'Private data', value: 'Secure', icon: ShieldCheck },
                { label: 'Always ready', value: '24/7', icon: Sparkles },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
                  <item.icon className="w-5 h-5 text-cyan-300" />
                  <p className="mt-4 text-2xl font-black">{item.value}</p>
                  <p className="mt-1 text-sm text-white/65">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 md:p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/90 font-semibold">Quick onboarding</p>
                <div className="mt-4 space-y-3">
                  {[
                    { step: '1', title: 'Create account', note: 'Set your identity in under a minute' },
                    { step: '2', title: 'Upload resume', note: 'Let AI adapt to your profile' },
                    { step: '3', title: 'Start interview', note: 'Get tailored feedback and growth plan' },
                  ].map((node) => (
                    <div key={node.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-cyan-300/20 text-cyan-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{node.step}</div>
                      <div>
                        <p className="font-semibold text-white">{node.title}</p>
                        <p className="text-sm text-white/65">{node.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/6 p-4 md:p-5 backdrop-blur-xl">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-cyan-300/20 blur-xl" />
                <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-blue-400/20 blur-xl" />
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, 4, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mx-auto mt-2 w-24 h-24 rounded-full border border-cyan-200/30 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.9),rgba(125,211,252,0.32),rgba(37,99,235,0.25))] shadow-[0_0_30px_rgba(103,232,249,0.35)]"
                />
                <div className="relative mt-5 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-white/70">"Setup was seamless. I started practicing the same day and got clearer direction instantly."</p>
                  <p className="mt-2 text-xs font-semibold text-cyan-100">Priya Sharma, Final Year Student</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-4xl bg-linear-to-b from-cyan-500/10 via-transparent to-blue-500/10 blur-2xl pointer-events-none" />
          <div className="relative h-full rounded-4xl border border-slate-200 dark:border-indigo-200/10 bg-white/85 dark:bg-[#090f2d]/88 backdrop-blur-2xl shadow-2xl neon-ring overflow-hidden">
            <div className="p-7 md:p-10">
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.24em] text-blue-500 font-bold">Start here</p>
                <h2 className="mt-3 text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create your account</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-300">Fill in your details once and keep everything synced across the platform.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm text-center">{error}</div>}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-indigo-200/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-indigo-200/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-indigo-200/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-indigo-200/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-2xl font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                  <UserPlus className="w-5 h-5" />
                  {loading ? 'Registering...' : 'Sign Up'}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs uppercase tracking-widest font-semibold text-slate-500 bg-white dark:bg-[#090f2d]">or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('Google')}
                    className="inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:border-blue-400/60 transition-colors text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    <GoogleBrandIcon /> Sign up with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('GitHub')}
                    className="inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:border-blue-400/60 transition-colors text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    <GitHubBrandIcon /> Sign up with GitHub
                  </button>
                </div>
              </form>

              <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Already have an account?</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Go back to the login screen.</p>
                </div>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-sm font-bold text-white dark:text-slate-900 transition-transform hover:scale-[1.02]">
                  Sign in <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Register;