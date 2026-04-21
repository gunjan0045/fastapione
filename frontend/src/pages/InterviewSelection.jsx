import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, User, ArrowRight, Zap, Code, FileText, CalendarCheck, Clock, ShieldCheck } from 'lucide-react';

const InterviewSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white"
          >
            How would you like to <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">Interview?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Choose between an instant, highly adaptive AI coaching session or booking a scheduled live mock interview with a verified Industry Expert.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* AI INTERVIEW CARD */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-indigo-200/10 hover:border-blue-500 dark:hover:border-cyan-500 shadow-xl transition-all group relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-blue-100 dark:bg-slate-700 rounded-2xl text-blue-600 dark:text-cyan-400">
                <Bot className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold dark:text-white">AI Interviewer</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 mb-8 flex-1">
              An instant, adaptive intelligence engine that adjusts difficulty in real-time, grades your code, and challenges you with deep contextual follow-ups based on your resume.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-sm font-medium dark:text-slate-200">
                <Zap className="w-5 h-5 text-amber-500" /> Instant availability, 24/7
              </li>
              <li className="flex items-center gap-3 text-sm font-medium dark:text-slate-200">
                <Code className="w-5 h-5 text-blue-500" /> Live integrated Code IDE
              </li>
              <li className="flex items-center gap-3 text-sm font-medium dark:text-slate-200">
                <FileText className="w-5 h-5 text-green-500" /> Dynamic Resume-based questions
              </li>
            </ul>

            <button 
              onClick={() => navigate(`/interview/setup${location.search}`)}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform group-hover:scale-[1.02]"
            >
              Start AI Interview <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* HUMAN EXPERT CARD */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl p-8 border border-slate-100 dark:border-indigo-200/10 hover:border-indigo-500 shadow-xl transition-all group relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 dark:bg-slate-700 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <User className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold dark:text-white">Industry Expert</h2>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full">
                PREMIUM
              </span>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 mb-8 flex-1">
              Connect 1-on-1 with a verified Senior Engineer or Product Manager from top tech companies for a realistic, high-pressure live mock interview.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-sm font-medium dark:text-slate-200">
                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Verified FAANG+ Interviewers
              </li>
              <li className="flex items-center gap-3 text-sm font-medium dark:text-slate-200">
                <CalendarCheck className="w-5 h-5 text-blue-500" /> Pick your Domain & Platform
              </li>
              <li className="flex items-center gap-3 text-sm font-medium dark:text-slate-200">
                <Clock className="w-5 h-5 text-slate-500" /> Guaranteed detailed written feedback
              </li>
            </ul>

            <button 
              onClick={() => navigate('/interview/book-expert')}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform shadow-lg shadow-indigo-600/20 group-hover:scale-[1.02]"
            >
              Book Real Interviewer <CalendarCheck className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSelection;
