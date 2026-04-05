import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle, FileUp, Activity, 
  BarChart2, PlayCircle, Loader2, Calendar, TrendingUp, Settings2, Target
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ParticlesBackground from '../components/ParticlesBackground';
import StatCard from '../components/StatCard';
import ResumeCard from '../components/ResumeCard';
import ResumeDetailsModal from '../components/ResumeDetailsModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  
  // New States for UI flow
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [interviewType, setInterviewType] = useState('Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchResumes();
    fetchInterviews();
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

  const handleDeleteResume = async (id) => {
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
    } catch (err) { alert("Upload failed"); } 
    finally { setUploading(false); }
  };

  const handleStartInterview = () => {
    navigate(`/interview?resumeId=${selectedResume.id}&type=${interviewType}&diff=${difficulty}`);
  };

  const avgScore = interviews.length 
    ? Math.round(interviews.reduce((sum, item) => sum + (item.final_score || item.score || 0), 0) / interviews.length) 
    : 0;

  const bestScore = interviews.length
    ? Math.max(...interviews.map(i => i.final_score || i.score || 0))
    : 0;

  return (
    <>
    <ParticlesBackground />
    <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto relative z-10 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header Banner / Stats */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Welcome Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-center lg:col-span-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back,</p>
          <p className="text-2xl font-bold dark:text-white truncate">{user?.first_name || user?.email || 'User'}</p>
        </div>
        
        <StatCard 
          title="Total Interviews" 
          value={interviews.length} 
          icon={CheckCircle} 
          colorClass="emerald" 
        />
        <StatCard 
          title="Average Score" 
          value={`${avgScore}%`} 
          icon={Activity} 
          colorClass="blue" 
        />
        <StatCard 
          title="Best Score" 
          value={`${bestScore}%`} 
          icon={TrendingUp} 
          colorClass="violet" 
        />
      </div>

      {/* 2. Main 70/30 Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (70%) - Charts & History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Performance Chart */}
          <div className="bg-white dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 backdrop-blur-xl">
            <h2 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Performance Growth
            </h2>
            <div className="h-60 w-full">
              {interviews.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={interviews} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="id" hide />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff'}} />
                    <Area type="monotone" dataKey={i => i.final_score || i.score || 0} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
                  <Activity className="w-12 h-12 mb-2 opacity-20" />
                  <p>No interview data available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="bg-white dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 backdrop-blur-xl">
            <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Recent Sessions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-4 font-bold px-2">Date</th>
                    <th className="pb-4 font-bold px-2">Resume ID</th>
                    <th className="pb-4 font-bold px-2">Score</th>
                    <th className="pb-4 font-bold px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {interviews.slice(0, 5).map((interview) => (
                    <tr key={interview.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {new Date(interview.completed_at || interview.created_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-2 text-sm text-slate-500 dark:text-slate-400">
                        {interview.resume_id ? `Resume #${interview.resume_id}` : 'General Interview'}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${(interview.final_score || interview.score) >= 70 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                          {interview.final_score || interview.score || 0}%
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                         <button onClick={() => navigate(`/feedback/${interview.id}`)} className="text-xs font-bold text-blue-500 hover:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition">
                            View Feedback
                         </button>
                      </td>
                    </tr>
                  ))}
                  {interviews.length === 0 && (
                    <tr><td colSpan="3" className="py-8 text-center text-slate-500 text-sm">Complete an interview to see history.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (30%) - Action Cards */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
          
          {/* Start Interview Setup Card */}
          <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-[0_20px_40px_-15px_rgba(37,99,235,0.5)] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full blur-2xl group-hover:scale-110 transition-transform"></div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
              <PlayCircle className="w-6 h-6 text-cyan-300" /> Start Interview
            </h3>
            
            <div className="space-y-4 relative z-10 mb-6">
              {/* Type Select */}
              <div>
                <label className="text-xs text-blue-200 font-semibold mb-1.5 flex items-center gap-1.5"><Settings2 className="w-3 h-3"/> Interview Type</label>
                <select 
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-blue-900/40 border border-blue-400/30 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="Mixed">Mixed (HR & Tech)</option>
                  <option value="Technical">Technical Focus</option>
                  <option value="HR">Behavioral / HR</option>
                </select>
              </div>
              
              {/* Difficulty Select */}
              <div>
                <label className="text-xs text-blue-200 font-semibold mb-1.5 flex items-center gap-1.5"><Target className="w-3 h-3"/> Difficulty Level</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-blue-900/40 border border-blue-400/30 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard / Senior</option>
                </select>
              </div>
            </div>

            <button 
              disabled={!selectedResume}
              onClick={handleStartInterview}
              className="w-full bg-white text-blue-700 py-3.5 rounded-2xl font-bold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 relative z-10"
            >
              {selectedResume ? "BEGIN SESSION NOW" : "SELECT A RESUME FIRST"}
            </button>
            {!selectedResume && <p className="text-[10px] text-blue-200 text-center mt-2">Required: Pick a resume below</p>}
          </div>

          {/* Upload Resume Card */}
          <div className="bg-white dark:bg-slate-900/80 p-5 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 backdrop-blur-xl shrink-0">
            <h3 className="text-sm font-bold dark:text-white mb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-500" /> Upload New Resume
            </h3>
            <input type="file" hidden ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf" />
            
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex-1 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-3 text-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition group"
              >
                <FileUp className="h-5 w-5 mx-auto mb-1 text-slate-400 group-hover:text-blue-500" />
                <p className="text-[10px] font-medium text-slate-500 truncate px-2">{file?.name || 'Browse PDF'}</p>
              </button>
              
              <button 
                onClick={handleUpload} 
                disabled={!file || uploading} 
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
              </button>
            </div>
          </div>

          {/* Resume List Card */}
          <div className="bg-white dark:bg-slate-900/80 p-5 pl-2 pr-2 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 backdrop-blur-xl flex-1 min-h-[300px] flex flex-col">
            <h3 className="text-sm font-bold dark:text-white mb-3 ml-3 flex items-center gap-2 shrink-0">
              <FileText className="w-4 h-4 text-amber-500" /> Your Resumes
            </h3>
            
            <div className="flex-1 overflow-y-auto px-3 space-y-2 custom-scrollbar">
              {resumes.map((resume) => (
                <ResumeCard 
                  key={resume.id} 
                  resume={resume} 
                  isSelected={selectedResume?.id === resume.id}
                  onSelect={(r) => {
                    setSelectedResume(r);
                    // Also open details modal if we want when clicking? Yes.
                    setIsResumeModalOpen(true);
                  }}
                  onDelete={handleDeleteResume}
                />
              ))}
              {resumes.length === 0 && (
                <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <p className="text-sm text-slate-500">No resumes uploaded.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Modals outside standard flow */}
      <ResumeDetailsModal 
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        resume={selectedResume}
        onDelete={handleDeleteResume}
      />
    </div>
    </>
  );
};

export default Dashboard;