import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Activity, Star, Eye, Code, ThumbsUp, ArrowLeft, Loader2, Award, Zap, BrainCircuit, Mic, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ParticlesBackground from '../components/ParticlesBackground';

const InterviewFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
   const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await api.get('/interview/history');
      const data = res.data.find(h => h.id === parseInt(id));
      if (data) {
        setSessionData(data);
      } else {
        alert("Session not found.");
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-slate-900 flex justify-center items-center">
       <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
     </div>
  );

  if (!sessionData) return null;

  const radarData = [
    { subject: 'Technical', A: sessionData.technical_score || 0, fullMark: 100 },
    { subject: 'Communication', A: sessionData.communication_score || 0, fullMark: 100 },
    { subject: 'Problem Solving', A: sessionData.problem_solving_score || 0, fullMark: 100 },
    { subject: 'Confidence', A: sessionData.confidence_score || 0, fullMark: 100 },
    { subject: 'Body Language', A: sessionData.body_language_score || 0, fullMark: 100 },
  ];

  let questionsParsed = [];
  let answersParsed = [];
  let feedbacksParsed = [];
  
  try { questionsParsed = JSON.parse(sessionData.questions || '[]'); } catch(e) {}
  try { answersParsed = JSON.parse(sessionData.answers || '[]'); } catch(e) {}
  try { feedbacksParsed = JSON.parse(sessionData.per_question_feedback || '[]'); } catch(e) {}

  const finalScore = sessionData.final_score || 0;
  
  const getScoreColor = (score) => {
     if(score >= 80) return 'text-emerald-400';
     if(score >= 60) return 'text-amber-400';
     return 'text-red-400';
  };

   const handleDownloadPdf = async () => {
      try {
         setDownloadLoading(true);
         const response = await api.get(`/interview/history/${id}/pdf`, { responseType: 'blob' });
         const blob = new Blob([response.data], { type: 'application/pdf' });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `interview-feedback-${id}.pdf`;
         document.body.appendChild(link);
         link.click();
         link.remove();
         window.URL.revokeObjectURL(url);
      } catch (error) {
         console.error('Failed to download PDF', error);
         alert('PDF download failed. Please try again.');
      } finally {
         setDownloadLoading(false);
      }
   };

  return (
    <>
      <ParticlesBackground />
      <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto relative z-10 space-y-8 animate-in fade-in duration-500">
        
            <div className="flex flex-wrap items-center justify-between gap-4">
               <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                   <ArrowLeft className="w-4 h-4" /> Back to Dashboard
               </button>

               <button
                  onClick={handleDownloadPdf}
                  disabled={downloadLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.25)] transition"
               >
                  {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download PDF
               </button>
            </div>

      <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-indigo-200/10 rounded-3xl p-8 shadow-2xl flex flex-col lg:flex-row gap-8 items-center lg:items-stretch neon-ring">
           
           {/* Final Score Circle */}
           <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-full border-12 border-slate-700 shadow-inner relative w-62.5 h-62.5 shrink-0 neon-pulse">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest absolute top-10">Overall</span>
              <span className={`text-6xl font-extrabold ${getScoreColor(finalScore)} drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]`}>
                {finalScore}%
              </span>
              <div className="flex text-amber-400 mt-4">
                 {[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.round(finalScore/20) ? 'fill-current' : 'opacity-30'}`} /> )}
              </div>
           </div>

           <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">Detailed Performance Report</h1>
              <p className="text-slate-300 leading-relaxed mb-6">
                {sessionData.final_feedback || "The AI evaluated your performance across 5 key metrics. Use this holistic feedback to structure your upcoming interview preparation."}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-blue-400 mb-1 flex items-center gap-1.5 text-xs font-bold uppercase"><Code className="w-3 h-3"/> Tech</span>
                    <span className="text-2xl font-bold text-white">{sessionData.technical_score || 0}%</span>
                 </div>
                 <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-purple-400 mb-1 flex items-center gap-1.5 text-xs font-bold uppercase"><Mic className="w-3 h-3"/> Comm</span>
                    <span className="text-2xl font-bold text-white">{sessionData.communication_score || 0}%</span>
                 </div>
                 <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-amber-400 mb-1 flex items-center gap-1.5 text-xs font-bold uppercase"><BrainCircuit className="w-3 h-3"/> Logic</span>
                    <span className="text-2xl font-bold text-white">{sessionData.problem_solving_score || 0}%</span>
                 </div>
                 <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-emerald-400 mb-1 flex items-center gap-1.5 text-xs font-bold uppercase"><Eye className="w-3 h-3"/> Body</span>
                    <span className="text-2xl font-bold text-white">{sessionData.body_language_score || 0}%</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Radar Chart */}
           <div className="bg-white/10 dark:bg-slate-900/80 p-6 rounded-3xl border border-indigo-200/10 shadow-xl backdrop-blur-xl">
             <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Skill Distribution Radar</h2>
             <div className="h-87.5 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                   <PolarGrid stroke="#334155" />
                   <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 12}} />
                   <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#475569'}} />
                   <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                   <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b'}} />
                 </RadarChart>
               </ResponsiveContainer>
             </div>
           </div>

           {/* Strengths & Weaknesses Placeholder */}
           <div className="bg-white/10 dark:bg-slate-900/80 p-6 rounded-3xl border border-indigo-200/10 shadow-xl backdrop-blur-xl flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ThumbsUp className="w-5 h-5 text-emerald-500" /> Key Strengths</h2>
                <ul className="space-y-3">
                   <li className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-100 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      {finalScore > 75 ? "Excellent grasp of core programming concepts demonstrated during the session." : "You communicated clearly on foundational topics."}
                   </li>
                   {sessionData.body_language_score > 70 && (
                     <li className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-100 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        Maintained a professional posture and good eye contact.
                     </li>
                   )}
                </ul>
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" /> Areas for Improvement</h2>
                <ul className="space-y-3">
                   {sessionData.technical_score < 70 && (
                     <li className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-100 text-sm">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        Brushing up on advanced depth in technical implementations is recommended.
                     </li>
                   )}
                   {sessionData.body_language_score < 60 && (
                     <li className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-100 text-sm">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        Avoid looking away frequently; maintaining eye-level contact boosts confidence perception.
                     </li>
                   )}
                   {sessionData.final_score > 80 && sessionData.technical_score >= 70 && sessionData.body_language_score >= 60 && (
                     <li className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-blue-100 text-sm">
                        <Award className="w-5 h-5 text-blue-500 shrink-0" />
                        Overall performance was stellar. Keep practicing edge cases to perfect your algorithm speed!
                     </li>
                   )}
                </ul>
              </div>
           </div>
        </div>

        {/* Question by Question Feedback */}
      <div className="bg-white/10 dark:bg-slate-900/80 p-6 lg:p-8 rounded-3xl border border-indigo-200/10 shadow-xl backdrop-blur-xl">
           <h2 className="text-2xl font-bold text-white mb-6">Question-by-Question Evaluation</h2>
           
           <div className="space-y-6">
              {questionsParsed.map((q, idx) => (
                 <div key={idx} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition">
                    <div className="flex gap-4 items-start mb-4">
                       <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold shrink-0">{idx + 1}</span>
                       <h3 className="text-lg font-bold text-white">{q}</h3>
                    </div>
                    <div className="ml-12 space-y-4">
                       <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm text-slate-300">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Your Answer</span>
                          {answersParsed[idx] || "No answer recorded."}
                       </div>
                       
                       <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20 text-sm text-indigo-100">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap className="w-3 h-3"/> AI Feedback</span>
                          {feedbacksParsed[idx] || "Acceptable answer."}
                       </div>
                    </div>
                 </div>
              ))}
              
              {questionsParsed.length === 0 && (
                 <div className="text-center p-8 text-slate-500">
                    No detailed Q&A logs found for this session.
                 </div>
              )}
           </div>
        </div>
        
      </div>
    </>
  );
};

export default InterviewFeedback;
