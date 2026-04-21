import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ArrowLeft, Edit3, Mail, CalendarDays, ShieldCheck, FileText, Target, Award, Clock3, Trash2, ChevronRight, UserRound, BadgeCheck, BarChart3, Settings2, Activity, Phone, MapPin, GraduationCap, Building2, IdCard, Link as LinkIcon, Briefcase, UserCircle2, Save, X, Globe } from 'lucide-react';

const StatPill = ({ label, value, icon: Icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-cyan-300 border-blue-500/15',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/15',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/15',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/15',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]} backdrop-blur-xl bg-white/70 dark:bg-slate-900/70`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider opacity-70 font-semibold">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        {Icon && <Icon className="w-5 h-5 shrink-0" />}
      </div>
    </div>
  );
};

const SectionCard = ({ title, description, icon: Icon, children, action }) => (
  <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200 dark:border-indigo-200/10 rounded-3xl shadow-xl overflow-hidden">
    <div className="p-6 md:p-7 border-b border-slate-200/70 dark:border-slate-800/70 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-cyan-300" />} {title}
        </h3>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
    <div className="p-6 md:p-7">{children}</div>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    date_of_birth: '',
    government_id_type: '',
    government_id_number: '',
    college_name: '',
    school_name: '',
    highest_qualification: '',
    profession: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    bio: '',
  });

  const profileFields = [
    'phone',
    'address',
    'city',
    'state',
    'country',
    'postal_code',
    'date_of_birth',
    'government_id_type',
    'government_id_number',
    'college_name',
    'school_name',
    'highest_qualification',
    'profession',
    'linkedin_url',
    'github_url',
    'portfolio_url',
    'bio',
  ];

  const profileCompletion = useMemo(() => {
    const filled = ['name', ...profileFields].filter((field) => {
      const value = field === 'name' ? (profileForm.name || user?.name || '') : profileForm[field];
      return Boolean(String(value || '').trim());
    }).length;
    return Math.round((filled / (profileFields.length + 1)) * 100);
  }, [profileForm, profileFields, user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [resumeRes, interviewRes, profileRes] = await Promise.all([
          api.get('/resume/'),
          api.get('/interview/history'),
          api.get('/auth/settings'),
        ]);
        setResumes(Array.isArray(resumeRes.data) ? resumeRes.data : []);
        setInterviews(Array.isArray(interviewRes.data) ? interviewRes.data : []);
        const profile = profileRes.data || {};
        setProfileForm({
          name: profile.name || user?.name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || profile.region || '',
          postal_code: profile.postal_code || '',
          date_of_birth: profile.date_of_birth || '',
          government_id_type: profile.government_id_type || '',
          government_id_number: profile.government_id_number || '',
          college_name: profile.college_name || '',
          school_name: profile.school_name || '',
          highest_qualification: profile.highest_qualification || '',
          profession: profile.profession || '',
          linkedin_url: profile.linkedin_url || '',
          github_url: profile.github_url || '',
          portfolio_url: profile.portfolio_url || '',
          bio: profile.bio || '',
        });
      } catch (error) {
        setResumes([]);
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    document.body.style.overflow = isProfileModalOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isProfileModalOpen]);

  const stats = useMemo(() => {
    const scores = interviews.map((item) => item.final_score || 0);
    const avg = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
    const best = scores.length ? Math.max(...scores) : 0;
    const recent = interviews[0] || null;
    const latestResume = resumes[0] || null;
    const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently';

    return {
      avg,
      best,
      totalInterviews: interviews.length,
      totalResumes: resumes.length,
      joined,
      recent,
      latestResume,
    };
  }, [interviews, resumes, user]);

  const primaryEmail = user?.email || 'Not available';
  const displayName = user?.name || 'Your Profile';
  const initials = (displayName || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Delete this resume from your profile?')) return;

    try {
      await api.delete(`/resume/${resumeId}`);
      setResumes((prev) => prev.filter((resume) => resume.id !== resumeId));
    } catch (error) {
      alert('Failed to delete resume');
    }
  };

  const handleOpenProfileModal = () => {
    setProfileForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || '',
    }));
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);

    try {
      await api.put('/auth/settings', {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country,
        region: profileForm.country,
        postal_code: profileForm.postal_code,
        date_of_birth: profileForm.date_of_birth,
        government_id_type: profileForm.government_id_type,
        government_id_number: profileForm.government_id_number,
        college_name: profileForm.college_name,
        school_name: profileForm.school_name,
        highest_qualification: profileForm.highest_qualification,
        profession: profileForm.profession,
        linkedin_url: profileForm.linkedin_url,
        github_url: profileForm.github_url,
        portfolio_url: profileForm.portfolio_url,
        bio: profileForm.bio,
      });
      setIsProfileModalOpen(false);
      alert('Profile updated successfully.');
    } catch (error) {
      alert(error?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
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
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="relative overflow-hidden rounded-4xl bg-linear-to-r from-[#161c5a] via-[#2c23d5] to-[#3b66ff] text-white shadow-[0_25px_60px_-20px_rgba(43,64,212,0.45)] border border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-2xl font-black backdrop-blur-xl">
                {initials}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/15 text-xs font-semibold mb-3">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified account
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">{displayName}</h1>
                <p className="mt-2 text-white/80 max-w-2xl">{primaryEmail}</p>
                <p className="mt-1 text-white/70 text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Member since {stats.joined}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/settings" className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors shadow-lg">
                <Settings2 className="w-4 h-4" /> Account Settings
              </Link>
              <button onClick={handleOpenProfileModal} className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 border border-white/20 font-bold hover:bg-white/20 transition-colors">
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatPill label="Average Score" value={`${stats.avg}%`} icon={BarChart3} tone="blue" />
          <StatPill label="Best Score" value={`${stats.best}%`} icon={Award} tone="emerald" />
          <StatPill label="Interviews" value={stats.totalInterviews} icon={Activity} tone="violet" />
          <StatPill label="Resumes" value={stats.totalResumes} icon={FileText} tone="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard
              title="Profile Information"
              description="Everything tied to your interview account in one place."
              icon={UserRound}
              action={<button onClick={handleOpenProfileModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"><Edit3 className="w-4 h-4" /> Edit</button>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Full Name</p>
                  <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{displayName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Email</p>
                  <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Mail className="w-4 h-4 text-blue-600" /> {primaryEmail}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Joined</p>
                  <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><CalendarDays className="w-4 h-4 text-violet-600" /> {stats.joined}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Status</p>
                  <p className="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Active</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Interview Insights"
              description="Clickable shortcuts and performance history from your recent sessions."
              icon={Target}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => navigate('/dashboard')} className="clickable-surface text-left rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/80 dark:bg-blue-500/10 p-4 hover:shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Recent activity</p>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">Open Dashboard</p>
                  <p className="mt-1 text-sm text-slate-500">View uploads, scores, and recent sessions</p>
                </button>
                <button onClick={() => navigate('/interview')} className="clickable-surface text-left rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/80 dark:bg-violet-500/10 p-4 hover:shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">Practice</p>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">Start Interview</p>
                  <p className="mt-1 text-sm text-slate-500">Begin a new AI mock session</p>
                </button>
                <button onClick={() => navigate('/features')} className="clickable-surface text-left rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 p-4 hover:shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Explore</p>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">See Features</p>
                  <p className="mt-1 text-sm text-slate-500">Browse platform capabilities</p>
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Complete Profile"
              description="Fill in address, identity, school, college, and professional details to complete your profile."
              icon={UserCircle2}
              action={
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-slate-500">Completion</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{profileCompletion}%</p>
                  </div>
                  <button onClick={handleOpenProfileModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
                    <Edit3 className="w-4 h-4" /> Complete Profile
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Phone', value: profileForm.phone || 'Add phone number', icon: Phone },
                  { label: 'Address', value: profileForm.address || 'Add address', icon: MapPin },
                  { label: 'City / State / Country', value: [profileForm.city, profileForm.state, profileForm.country].filter(Boolean).join(', ') || 'Add location', icon: Globe },
                  { label: 'Postal Code', value: profileForm.postal_code || 'Add postal code', icon: FileText },
                  { label: 'ID Card', value: profileForm.government_id_type ? `${profileForm.government_id_type} • ${profileForm.government_id_number ? `${profileForm.government_id_number.slice(0, 2)}****${profileForm.government_id_number.slice(-2)}` : 'Add number'}` : 'Add valid ID details', icon: IdCard },
                  { label: 'Education', value: [profileForm.school_name, profileForm.college_name, profileForm.highest_qualification].filter(Boolean).join(' • ') || 'Add school/college', icon: GraduationCap },
                  { label: 'Profession', value: profileForm.profession || 'Add profession', icon: Briefcase },
                  { label: 'Links', value: [profileForm.linkedin_url, profileForm.github_url, profileForm.portfolio_url].filter(Boolean).length ? 'Profile links added' : 'Add LinkedIn / GitHub / Portfolio', icon: LinkIcon },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-300 shrink-0">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white wrap-break-word">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Performance"
              description="Most recent interview summaries with direct feedback access."
              icon={BarChart3}
              action={<button onClick={() => navigate('/settings')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"><Settings2 className="w-4 h-4" /> Manage settings</button>}
            >
              <div className="space-y-3">
                {interviews.slice(0, 3).map((item) => {
                  const score = item.final_score || 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Interview #{item.id}</p>
                        <p className="text-sm text-slate-500">{new Date(item.completed_at || item.created_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${score >= 80 ? 'bg-emerald-500/10 text-emerald-600' : score >= 60 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>{score}%</span>
                        <Link to={`/feedback/${item.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-500">View <ChevronRight className="w-4 h-4" /></Link>
                      </div>
                    </div>
                  );
                })}
                {interviews.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">No interview sessions yet.</div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Settings" description="Account-related controls and shortcuts." icon={Settings2}>
              <div className="space-y-3">
                <Link to="/settings" className="clickable-surface flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 hover:border-blue-300 dark:hover:border-cyan-500/30">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Account Settings</p>
                    <p className="text-sm text-slate-500">Password, email, notifications</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
                <button onClick={() => navigate('/contact')} className="clickable-surface flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 hover:border-blue-300 dark:hover:border-cyan-500/30 text-left">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Support</p>
                    <p className="text-sm text-slate-500">Contact the team</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={() => navigate('/about')} className="clickable-surface flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 hover:border-blue-300 dark:hover:border-cyan-500/30 text-left">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">About Platform</p>
                    <p className="text-sm text-slate-500">Learn how it works</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Resume Library" description="All uploaded resumes linked to your profile." icon={FileText}>
              <div className="space-y-3 max-h-105 overflow-y-auto pr-1 custom-scrollbar">
                {resumes.map((resume) => (
                  <div key={resume.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{resume.name || resume.filename}</p>
                        <p className="text-sm text-slate-500 truncate mt-1">{resume.email || 'No email detected'}</p>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {new Date(resume.created_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <button
                        className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                        title="Delete resume"
                        onClick={() => handleDeleteResume(resume.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {resumes.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">No resumes uploaded yet.</div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {isProfileModalOpen && (
        <div
          className="fixed inset-0 flex items-start justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-4 sm:pb-6 overflow-y-auto"
          style={{ zIndex: 999 }}
        >
          <button
            type="button"
            aria-label="Close profile editor"
            onClick={() => setIsProfileModalOpen(false)}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          <form
            onSubmit={handleSaveProfile}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-6 py-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Edit Profile</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add address, ID card, education, and contact details.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Full Name</span>
                  <input value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Phone</span>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="+91 98765 43210" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Address</span>
                  <textarea value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} rows="3" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="Street, locality, landmark" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">City</span>
                  <input value={profileForm.city} onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">State</span>
                  <input value={profileForm.state} onChange={(e) => setProfileForm((prev) => ({ ...prev, state: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Country</span>
                  <input value={profileForm.country} onChange={(e) => setProfileForm((prev) => ({ ...prev, country: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Postal Code</span>
                  <input value={profileForm.postal_code} onChange={(e) => setProfileForm((prev) => ({ ...prev, postal_code: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Date of Birth</span>
                  <input type="date" value={profileForm.date_of_birth} onChange={(e) => setProfileForm((prev) => ({ ...prev, date_of_birth: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Valid ID Type</span>
                  <input value={profileForm.government_id_type} onChange={(e) => setProfileForm((prev) => ({ ...prev, government_id_type: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="Aadhaar / Passport / PAN" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Valid ID Number</span>
                  <input value={profileForm.government_id_number} onChange={(e) => setProfileForm((prev) => ({ ...prev, government_id_number: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="Enter ID number" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">School Name</span>
                  <input value={profileForm.school_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, school_name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">College Name</span>
                  <input value={profileForm.college_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, college_name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Highest Qualification</span>
                  <input value={profileForm.highest_qualification} onChange={(e) => setProfileForm((prev) => ({ ...prev, highest_qualification: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Profession</span>
                  <input value={profileForm.profession} onChange={(e) => setProfileForm((prev) => ({ ...prev, profession: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="Student / Software Engineer / etc." />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">LinkedIn</span>
                  <input value={profileForm.linkedin_url} onChange={(e) => setProfileForm((prev) => ({ ...prev, linkedin_url: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="https://linkedin.com/in/..." />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">GitHub</span>
                  <input value={profileForm.github_url} onChange={(e) => setProfileForm((prev) => ({ ...prev, github_url: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="https://github.com/..." />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Portfolio</span>
                  <input value={profileForm.portfolio_url} onChange={(e) => setProfileForm((prev) => ({ ...prev, portfolio_url: e.target.value }))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="https://yourportfolio.com" />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Bio</span>
                <textarea value={profileForm.bio} onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))} rows="4" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 outline-none focus:border-blue-500" placeholder="Tell recruiters and interviewers about yourself..." />
              </label>

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={profileSaving} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-60">
                  <Save className="w-4 h-4" /> {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
