import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/themeHook';
import api from '../utils/api';
import { ArrowLeft, Bell, Lock, ShieldCheck, Palette, Mail, KeyRound, Globe, Smartphone, Eye, ChevronRight, Save, Trash2, UserRoundCog, History, HelpCircle } from 'lucide-react';

const LANGUAGE_CODES = [
  'en', 'hi', 'bn', 'ur', 'pa', 'gu', 'mr', 'ta', 'te', 'kn', 'ml', 'or', 'as',
  'ne', 'si', 'my', 'th', 'vi', 'id', 'ms', 'tl', 'zh', 'ja', 'ko', 'km', 'lo',
  'ar', 'fa', 'he', 'tr', 'ru', 'uk', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'el',
  'sr', 'hr', 'sl', 'mk', 'sq', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'sv', 'no',
  'da', 'fi', 'is', 'ga', 'cy', 'et', 'lv', 'lt', 'sw', 'am', 'ha', 'yo', 'ig',
  'zu', 'xh', 'af', 'so', 'rw', 'ny', 'sn', 'st', 'tn', 'ts', 've', 'nso', 'mg'
];

const FALLBACK_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Bulgaria', 'Cambodia', 'Cameroon', 'Canada', 'Chile',
  'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Ethiopia', 'Finland', 'France', 'Georgia', 'Germany',
  'Ghana', 'Greece', 'Guatemala', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia', 'Maldives', 'Mexico',
  'Mongolia', 'Morocco', 'Myanmar (Burma)', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
  'Oman', 'Pakistan', 'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Saudi Arabia', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain',
  'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Tunisia',
  'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const normalizeText = (value) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isSubsequence = (query, target) => {
  let q = 0;
  let t = 0;
  while (q < query.length && t < target.length) {
    if (query[q] === target[t]) q += 1;
    t += 1;
  }
  return q === query.length;
};

const getMatchScore = (query, target) => {
  const normalizedQuery = normalizeText(query);
  const normalizedTarget = normalizeText(target);

  if (!normalizedQuery) return 0;
  if (normalizedTarget === normalizedQuery) return 100;
  if (normalizedTarget.startsWith(normalizedQuery)) return 90;
  if (normalizedTarget.includes(` ${normalizedQuery}`)) return 80;

  const tokens = normalizedTarget.split(' ');
  if (tokens.some((token) => token.startsWith(normalizedQuery))) return 75;
  if (normalizedTarget.includes(normalizedQuery)) return 65;
  if (isSubsequence(normalizedQuery.replace(/\s/g, ''), normalizedTarget.replace(/\s/g, ''))) return 45;

  return -1;
};

const ToggleRow = ({ title, description, enabled, onToggle, icon: Icon }) => (
  <button
    type="button"
    onClick={onToggle}
    className="clickable-surface w-full flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 p-4 text-left hover:border-blue-300 dark:hover:border-cyan-500/30"
  >
    <div className="flex items-start gap-3">
      <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
        {Icon && <Icon className="w-5 h-5" />}
      </span>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
      {enabled ? 'On' : 'Off'}
    </span>
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [darkModePref, setDarkModePref] = useState(true);
  const [dataExport, setDataExport] = useState(true);
  const [language, setLanguage] = useState('English');
  const [nationality, setNationality] = useState('India');
  const [countrySearch, setCountrySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [passwordLastChangedAt, setPasswordLastChangedAt] = useState('Not available');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationNotice, setVerificationNotice] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [confirmingVerification, setConfirmingVerification] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const countryOptions = useMemo(() => {
    if (typeof Intl === 'undefined' || !Intl.DisplayNames) {
      return FALLBACK_COUNTRIES;
    }

    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const blacklist = new Set(['EU', 'UN', 'ZZ', 'XA', 'XB']);
      const names = new Set();

      for (let i = 65; i <= 90; i += 1) {
        for (let j = 65; j <= 90; j += 1) {
          const code = String.fromCharCode(i, j);
          if (blacklist.has(code)) continue;
          const value = regionNames.of(code);
          if (value && value !== code) {
            names.add(value);
          }
        }
      }

      return Array.from(names).sort((a, b) => a.localeCompare(b));
    } catch (_error) {
      return FALLBACK_COUNTRIES;
    }
  }, []);

  const languageOptions = useMemo(() => {
    if (typeof Intl === 'undefined' || !Intl.DisplayNames) {
      return ['English', 'Hindi', 'Arabic', 'French', 'Spanish', 'German'];
    }

    try {
      const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
      const names = LANGUAGE_CODES
        .map((code) => languageNames.of(code))
        .filter(Boolean);

      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    } catch (_error) {
      return ['English', 'Hindi', 'Arabic', 'French', 'Spanish', 'German'];
    }
  }, []);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim();
    if (!query) return countryOptions;

    return countryOptions
      .map((country) => ({ country, score: getMatchScore(query, country) }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score || a.country.localeCompare(b.country))
      .map((item) => item.country);
  }, [countryOptions, countrySearch]);

  const filteredLanguages = useMemo(() => {
    const query = languageSearch.trim();
    if (!query) return languageOptions;

    return languageOptions
      .map((lang) => ({ lang, score: getMatchScore(query, lang) }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score || a.lang.localeCompare(b.lang))
      .map((item) => item.lang);
  }, [languageOptions, languageSearch]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/auth/settings');
        const settings = res.data || {};
        setEmailAlerts(Boolean(settings.email_notifications ?? true));
        setNewsletter(Boolean(settings.newsletter_enabled ?? false));
        setProfilePublic(Boolean(settings.profile_public ?? true));
        setTwoFactor(Boolean(settings.two_factor_enabled ?? false));
        setDarkModePref(Boolean(settings.dark_mode_preference ?? theme === 'dark'));
        setDataExport(Boolean(settings.data_export_enabled ?? true));
        setLanguage(settings.language || 'English');
        setNationality(settings.region || 'India');
        setEmailVerified(Boolean(settings.email_verified ?? false));
        setPasswordLastChangedAt(
          settings.password_last_changed_at
            ? new Date(settings.password_last_changed_at).toLocaleString()
            : 'Never changed'
        );
        setPasswordForm((prev) => ({ ...prev, email: settings.email || user?.email || '' }));
      } catch (error) {
        alert('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [theme]);

  const updateSettings = async (payload) => {
    const res = await api.put('/auth/settings', payload);
    return res.data;
  };

  const toggleAndPersist = async (setter, fieldName, currentValue) => {
    const nextValue = !currentValue;
    setter(nextValue);
    try {
      await updateSettings({ [fieldName]: nextValue });
    } catch (error) {
      setter(currentValue);
      alert('Failed to update setting. Please try again.');
    }
  };

  const accountSummary = useMemo(() => ({
    name: user?.name || 'Not available',
    email: user?.email || 'Not available',
    memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently',
    accountType: 'Free',
    verified: emailVerified,
  }), [user, emailVerified]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        email_notifications: emailAlerts,
        newsletter_enabled: newsletter,
        profile_public: profilePublic,
        two_factor_enabled: twoFactor,
        dark_mode_preference: darkModePref,
        data_export_enabled: dataExport,
        language,
        region: nationality,
      });
      alert('Settings saved successfully.');
    } catch (error) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerificationCode = async () => {
    setSendingVerification(true);
    try {
      const recipient = (passwordForm.email || '').trim();
      const res = await api.post('/auth/verify-email/send', {
        recipient_email: recipient || undefined,
      });
      const message = res?.data?.message || 'Verification code sent.';
      const code = res?.data?.code;
      setVerificationNotice(message);
      if (code) {
        setVerificationCode(code);
      }
    } catch (error) {
      const message = error?.response?.data?.detail || 'Failed to send verification code.';
      setVerificationNotice(message);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleConfirmVerificationCode = async () => {
    if (!verificationCode.trim()) {
      alert('Please enter the verification code.');
      return;
    }

    setConfirmingVerification(true);
    try {
      const res = await api.post('/auth/verify-email/confirm', { code: verificationCode.trim() });
      if (res?.data?.access_token) {
        localStorage.setItem('token', res.data.access_token);
      }
      setEmailVerified(true);
      setVerificationCode('');
      setVerificationNotice('Email verified successfully.');
      alert(res?.data?.message || 'Email verified successfully.');
    } catch (error) {
      const message = error?.response?.data?.detail || 'Email verification failed.';
      setVerificationNotice(message);
      alert(message);
    } finally {
      setConfirmingVerification(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!emailVerified) {
      alert('Verify your email first before changing password.');
      return;
    }

    if (!passwordForm.email || !passwordForm.currentPassword || !passwordForm.newPassword) {
      alert('Please fill email, current password, and new password.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        email: passwordForm.email,
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setPasswordLastChangedAt(new Date().toLocaleString());
      alert(res?.data?.message || 'Password updated successfully. A security email has been sent.');
    } catch (error) {
      const message = error?.response?.data?.detail || 'Password update failed.';
      alert(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLoginSessions = async () => {
    try {
      const res = await api.get('/auth/me');
      const created = res?.data?.created_at ? new Date(res.data.created_at).toLocaleString() : 'Unknown';
      alert(`Active session: Current browser\nAccount created: ${created}`);
    } catch (error) {
      alert('Unable to fetch session details.');
    }
  };

  const handlePrivacyControls = async () => {
    await toggleAndPersist(setProfilePublic, 'profile_public', profilePublic);
  };

  const handleSendTestEmail = async () => {
    try {
      const res = await api.post('/auth/test-email', {});
      alert(res?.data?.message || 'Test email sent successfully.');
    } catch (error) {
      const message = error?.response?.data?.detail || 'Failed to send test email.';
      alert(message);
    }
  };

  const handleNationalityLanguageUpdate = async () => {
    try {
      await updateSettings({ language, region: nationality });
      alert('Nationality and language updated.');
    } catch (error) {
      alert('Failed to update nationality/language.');
    }
  };

  const handleDangerAction = () => {
    if (window.confirm('This will log you out and clear your session. Continue?')) {
      logout();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>

        <div className="rounded-4xl bg-linear-to-r from-[#1f235f] via-[#3136d9] to-[#4b72ff] text-white shadow-[0_25px_60px_-20px_rgba(43,64,212,0.45)] border border-white/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.14),transparent_20%)]" />
          <div className="relative p-6 md:p-8 lg:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/15 text-xs font-semibold mb-3">
                <UserRoundCog className="w-3.5 h-3.5" /> Account controls
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">Settings</h1>
              <p className="mt-2 text-white/80 max-w-2xl">Manage account, notifications, privacy, and platform preferences in one place.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button disabled={saving} onClick={handleSave} className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 border border-white/20 font-bold hover:bg-white/20 transition-colors">
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200 dark:border-indigo-200/10 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200/70 dark:border-slate-800/70">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Summary</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All account-related details at a glance.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Name</p>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">{accountSummary.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Email</p>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white break-all">{accountSummary.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Member Since</p>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">{accountSummary.memberSince}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Plan</p>
                    <p className="mt-2 font-bold text-slate-900 dark:text-white">{accountSummary.accountType}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200 dark:border-indigo-200/10 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200/70 dark:border-slate-800/70">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Links</h2>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: 'Profile', desc: 'Edit personal info', to: '/profile', icon: UserRoundCog },
                  { label: 'Interview History', desc: 'Review feedback reports', to: '/dashboard', icon: History },
                  { label: 'Send Test Email', desc: 'Verify SMTP configuration', to: null, icon: HelpCircle, action: handleSendTestEmail },
                ].map((item) => (
                  <button key={item.label} onClick={() => (item.action ? item.action() : navigate(item.to))} className="clickable-surface w-full flex items-center justify-between gap-3 p-4 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-slate-500 truncate">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleRow title="Email Alerts" description="Get notifications for interview reminders and reports." enabled={emailAlerts} onToggle={() => toggleAndPersist(setEmailAlerts, 'email_notifications', emailAlerts)} icon={Bell} />
              <ToggleRow title="Newsletter" description="Receive product updates and interview tips." enabled={newsletter} onToggle={() => toggleAndPersist(setNewsletter, 'newsletter_enabled', newsletter)} icon={Mail} />
              <ToggleRow title="Profile Visibility" description="Let your profile appear in shared team views." enabled={profilePublic} onToggle={() => toggleAndPersist(setProfilePublic, 'profile_public', profilePublic)} icon={Eye} />
              <ToggleRow title="Two-Factor Authentication" description="Add an extra security layer for your account." enabled={twoFactor} onToggle={() => toggleAndPersist(setTwoFactor, 'two_factor_enabled', twoFactor)} icon={Lock} />
              <ToggleRow title="Dark Theme Preference" description="Remember dark mode across sessions." enabled={darkModePref} onToggle={() => toggleAndPersist(setDarkModePref, 'dark_mode_preference', darkModePref)} icon={Palette} />
              <ToggleRow title="Data Export" description="Allow downloadable interview reports and summaries." enabled={dataExport} onToggle={() => toggleAndPersist(setDataExport, 'data_export_enabled', dataExport)} icon={Globe} />
            </div>

            <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200 dark:border-indigo-200/10 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600 dark:text-cyan-300" /> Security & Access</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Password, sessions, privacy, and device access settings.</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Login Sessions', desc: 'Review active devices and sessions', icon: Smartphone, onClick: handleLoginSessions },
                  { label: 'Privacy Controls', desc: 'Manage what other users can see', icon: ShieldCheck, onClick: handlePrivacyControls },
                ].map((item) => (
                  <button key={item.label} onClick={item.onClick} className="clickable-surface w-full flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 hover:border-blue-300 dark:hover:border-cyan-500/30">
                    <div className="flex items-center gap-3 min-w-0 text-left">
                      <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Email Verification</p>
                      <p className="text-sm text-slate-500">Password and secure credentials are available only after email verification.</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${emailVerified ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-400/30' : 'bg-amber-500/10 text-amber-700 border border-amber-400/30'}`}>
                      {emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      disabled={sendingVerification}
                      onClick={handleSendVerificationCode}
                      className="clickable-surface inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-60"
                    >
                      <Mail className="w-4 h-4" /> Send Code
                    </button>

                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />

                    <button
                      type="button"
                      disabled={confirmingVerification}
                      onClick={handleConfirmVerificationCode}
                      className="clickable-surface inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-60"
                    >
                      <ShieldCheck className="w-4 h-4" /> Verify Email
                    </button>
                  </div>

                  {verificationNotice && (
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
                      {verificationNotice}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 space-y-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Secure Credentials</p>
                    <p className="text-sm text-slate-500">Password visibility and change controls.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-3">
                      <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Password</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{emailVerified ? '************' : 'Hidden until email verification'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-3">
                      <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Last Changed</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{passwordLastChangedAt}</p>
                    </div>
                  </div>

                  <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleChangePassword}>
                    <input
                      type="email"
                      value={passwordForm.email}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Current password"
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="New password"
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={changingPassword || !emailVerified}
                      className="md:col-span-3 clickable-surface inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-60"
                    >
                      <KeyRound className="w-4 h-4" /> Change Password (Verified Email Required)
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200 dark:border-indigo-200/10 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200/70 dark:border-slate-800/70">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600 dark:text-cyan-300" /> Nationality & Language
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select your nationality and preferred language from global options.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold text-slate-500">Nationality</label>
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    >
                      {filteredCountries.length === 0 && (
                        <option value={nationality}>No matching country found</option>
                      )}
                      {filteredCountries.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold text-slate-500">Language</label>
                    <input
                      type="text"
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      placeholder="Search language..."
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    >
                      {filteredLanguages.length === 0 && (
                        <option value={language}>No matching language found</option>
                      )}
                      {filteredLanguages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleNationalityLanguageUpdate}
                  className="clickable-surface inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  <Save className="w-4 h-4" /> Update Nationality & Language
                </button>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl border border-rose-200 dark:border-rose-500/20 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-rose-200/70 dark:border-rose-500/20">
                <h2 className="text-xl font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Danger Zone</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign out or clear access to secure your account.</p>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-3">
                <button onClick={handleDangerAction} className="clickable-surface inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold">
                  <Trash2 className="w-4 h-4" /> Logout & Clear Session
                </button>
                <Link to="/dashboard" className="clickable-surface inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
