import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Chatbot from '../components/Chatbot';

const Contact = () => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-16 md:py-24 max-w-7xl mx-auto px-6 w-full relative z-10"
      >
        {/* Heading Section */}
        <div className="text-center mt-10 mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions? We're here to help. Contact our team anytime.
          </p>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 relative">
          
          {/* Contact Info Panel */}
          <div className="p-10 md:p-12 bg-blue-50 dark:bg-slate-800/50">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Contact Information
            </h3>
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                <div className="w-12 h-12 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Email</p>
                  <p>support@interviewcoach.ai</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                <div className="w-12 h-12 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Phone</p>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>

              {/* Office Address */}
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                <div className="w-12 h-12 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Office</p>
                  <p>123 Innovation Drive, Tech City, TC 94103</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Panel */}
          <div className="p-10 md:p-12">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="john@example.com"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <textarea
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none dark:text-white"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </motion.div>
      <Chatbot />
    </>
  );
};

export default Contact