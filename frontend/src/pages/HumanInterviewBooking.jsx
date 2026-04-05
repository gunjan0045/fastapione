import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Calendar, Clock, Video, CheckCircle2, AlertCircle } from 'lucide-react';

const HumanInterviewBooking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    domain: 'Software Engineering',
    experience_level: 'Mid Level (2-4 Yrs)',
    preferred_date: '',
    preferred_time: '',
    duration: '45 mins',
    notes: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/interview/book-expert', formData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Booking Confirmed!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We've sent your request to our network of Industry Experts. You'll receive a confirmation email with the calendar link shortly.
          </p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
            Redirecting to dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <div className="bg-indigo-600 px-8 py-10 relative overflow-hidden text-white">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <Video className="w-10 h-10 text-indigo-200 mb-4" />
              <h1 className="text-3xl font-extrabold mb-2">Book a Live API Expert</h1>
              <p className="text-indigo-100 max-w-lg">
                Schedule a 1-on-1 mock interview with a verified Senior Engineer. Receive instant feedback and industry-level grilling.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Role / Domain</label>
                <select name="domain" value={formData.domain} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
                  <option>Software Engineering</option>
                  <option>Frontend / React</option>
                  <option>Backend / Python</option>
                  <option>Data Science / ML</option>
                  <option>Product Management</option>
                  <option>HR / Behavioral</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Experience Level</label>
                <select name="experience_level" value={formData.experience_level} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
                  <option>Fresher (0 Yrs)</option>
                  <option>Junior (1-2 Yrs)</option>
                  <option>Mid Level (2-4 Yrs)</option>
                  <option>Senior (5+ Yrs)</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Preferred Date
                </label>
                <input 
                  type="date" 
                  required
                  name="preferred_date" 
                  value={formData.preferred_date} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Preferred Time Slot
                </label>
                <input 
                  type="time" 
                  required
                  name="preferred_time" 
                  value={formData.preferred_time} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Duration Needed</label>
              <div className="flex gap-4">
                {['30 mins', '45 mins', '60 mins'].map(t => (
                  <label key={t} className={`flex-1 p-3 rounded-xl border text-center cursor-pointer transition-all ${formData.duration === t ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                     <input type="radio" name="duration" value={t} checked={formData.duration === t} onChange={handleChange} className="hidden" />
                     {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Specific Areas to Focus On (Optional)</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="E.g., I struggle with System Design questions, please grill me on that."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none min-h-[100px] resize-none"
              />
            </div>

            <div className="pt-4 flex gap-4">
               <button 
                  type="button"
                  onClick={() => navigate('/interview')}
                  className="px-6 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
               >
                 Cancel
               </button>
               <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold py-4 flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-70"
               >
                 {loading ? (
                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   "Confirm Booking Request"
                 )}
               </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default HumanInterviewBooking;
