import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle, FileUp, Sparkles, Activity, 
  Cpu, TrendingUp, BarChart2, Trash2, PlayCircle, AlertCircle, Loader2, Calendar, ChevronRight
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [aiMessageIndex, setAiMessageIndex] = useState(0);
  const fileInputRef = useRef(null);

  const aiLiveMessages = [
    'AI coach is scanning your resume for impact keywords ...',
    'Simulating behavioral Q&A... focus on STAR answers.',
    'SmithBot says: Confidence + clarity = high score.',
    'Predicting interview question categories: Technical, Culture, Role-fit.',
    'Summarizing your latest mock session: strong technical, improve stories.'
  ];

  useEffect(() => {
    fetchResumes();
    fetchInterviews();
    const interval = setInterval(() => {
      setAiMessageIndex((prev) => (prev + 1) % aiLiveMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resume/');
      setResumes(res.data);
    } catch (err) { console.error('Failed to fetch resumes:', err); }
  };

  const fetchInterviews = async () => {
    try {
      const res = await api.get('/interview/history');
      setInterviews(Array.isArray(res.data) ? [...res.data].reverse() : []);
    } catch (err) { setInterviews([]); }
  };

  const handleDeleteResume = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this resume?")) return;
    try {
      await api.delete(`/resume/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
      if (selectedResume?.id === id) setSelectedResume(null);
    } catch (err) { alert("Failed to delete"); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/resume/upload', formData);
      setFile(null);
      fetchResumes();
    } catch (err) { setError("Upload failed"); } 
    finally { setUploading(false); }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10 space-y-8">
      
      {/* Header Stats */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-3xl p-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-medium text-slate-500">Total Resumes</p><p className="text-3xl font-bold dark:text-white">{resumes.length}</p></div>
            <BarChart2 className="h-7 w-7 text-blue-500" />
          </div>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-3xl p-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-medium text-slate-500">Interviews</p><p className="text-3xl font-bold dark:text-white">{interviews.length}</p></div>
            <CheckCircle className="h-7 w-7 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-3xl p-5 shadow-xl overflow-hidden flex flex-col justify-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">AI Coach Insights</p>
           <p className="text-xs font-semibold text-cyan-500 animate-pulse">{aiLiveMessages[aiMessageIndex]}</p>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700 rounded-3xl p-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-medium text-slate-500">Avg Score</p><p className="text-3xl font-bold dark:text-white">
              {interviews.length ? Math.round(interviews.reduce((sum, item) => sum + (item.score || 0), 0) / interviews.length) : 0}%
            </p></div>
            <TrendingUp className="h-7 w-7 text-violet-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Growth & Table */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Section */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Performance Growth
            </h2>
            <div className="h-48 w-full">
              {interviews.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={interviews}>
                    <defs><linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="id" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff'}} />
                    <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">No interview data available yet.</div>
              )}
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Recent Sessions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 font-bold">Date</th>
                    <th className="pb-3 font-bold">Resume Name</th>
                    <th className="pb-3 font-bold">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {interviews.map((interview) => (
                    <tr key={interview.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 text-xs dark:text-slate-300 font-medium">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-xs dark:text-slate-400">
                        {interview.resume_name || 'General Interview'}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${interview.score >= 70 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {interview.score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {interviews.length === 0 && (
                    <tr><td colSpan="3" className="py-10 text-center text-slate-500 text-xs italic">Complete an interview to see history.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Action Card & Uploads */}
        <div className="space-y-6">
          
          {/* CRITICAL: START INTERVIEW CARD */}
          <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-2xl text-white">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" /> Mock Interview
            </h3>
            <p className="text-blue-100 text-xs mb-6 leading-relaxed">
              {selectedResume 
                ? `Practicing with: ${selectedResume.name}` 
                : "Select a resume from the list below to unlock your session."}
            </p>
            <button 
              disabled={!selectedResume}
              onClick={() => navigate(`/interview/setup?resumeId=${selectedResume.id}`)}
              className="w-full bg-white text-blue-600 py-3.5 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {selectedResume ? "START INTERVIEW NOW" : "SELECT A RESUME"}
            </button>
          </div>

          {/* Upload Resume */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-md font-bold dark:text-white mb-4 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-500" /> New Upload
            </h3>
            <input type="file" hidden ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-400 transition group"
            >
              <FileUp className="h-6 w-6 mx-auto mb-2 text-slate-400 group-hover:text-blue-500" />
              <p className="text-[10px] font-medium text-slate-500 truncate">{file?.name || 'Click to select PDF'}</p>
            </button>
            <button 
              onClick={handleUpload} 
              disabled={!file || uploading} 
              className="w-full mt-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-2.5 rounded-xl font-bold text-xs disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Process Resume'}
            </button>
          </div>

          {/* Resume List */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-md font-bold dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> Your Resumes
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {resumes.map((resume) => (
                <div 
                  key={resume.id} 
                  onClick={() => setSelectedResume(resume)} 
                  className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                    selectedResume?.id === resume.id 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md' 
                    : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold truncate pr-2">{resume.name}</span>
                  <button onClick={(e) => handleDeleteResume(e, resume.id)} className={`${selectedResume?.id === resume.id ? 'text-white' : 'text-red-500'} hover:scale-110`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;