import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import Chatbot from '../components/Chatbot';
import ParticlesBackground from '../components/ParticlesBackground';

const Contact = () => {
  return (
    <>
      <ParticlesBackground />
      {/* 
        Extra padding bottom pb-32 allows scrolling past the chatbot 
        lg:pr-10 or flex wrapper ensures it's readable.
      */}
      <div className="pt-28 pb-125 min-h-[calc(100vh-80px)] px-6 lg:pl-12 lg:pr-100 xl:pr-16 w-full relative z-10 flex justify-center lg:justify-start xl:justify-center">
        <div className="w-full max-w-5xl animate-in fade-in duration-500">
          
          {/* Heading Section */}
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight"
            >
              Get in Touch
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            >
              Have questions or need support? We're here to help you ace your interviews.
            </motion.p>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 w-full">
            
            {/* Left Side: Contact Information */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl h-full flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                  Contact Information
                </h3>
                <div className="space-y-8">
                  
                  {/* Email */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-cyan-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-cyan-800/30 text-blue-600 dark:text-cyan-400 shadow-sm">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Email Support</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">support@interviewcoach.ai</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-cyan-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-cyan-800/30 text-blue-600 dark:text-cyan-400 shadow-sm">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Phone Inquiry</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  {/* Office Address */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-cyan-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-cyan-800/30 text-blue-600 dark:text-cyan-400 shadow-sm">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Headquarters</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        123 Innovation Drive,<br/> Tech City, TC 94103
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Right Side: Form */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className=""
            >
              <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                  
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 dark:focus:border-cyan-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      placeholder="Jane Doe"
                    />
                  </div>

                  {/* Email & Subject Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 dark:focus:border-cyan-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 dark:focus:border-cyan-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Message</label>
                    <textarea
                      rows="5"
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 dark:focus:border-cyan-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none dark:text-white custom-scrollbar"
                      placeholder="Write your message here..."
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all group"
                  >
                    Send Message 
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </motion.div>
            
          </div>
        </div>
      </div>

      <Chatbot />
    </>
  );
};

export default Contact;