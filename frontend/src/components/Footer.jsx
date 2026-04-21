import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Rocket } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-slate-200/70 dark:border-indigo-200/10 bg-white/65 dark:bg-[#070d28]/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-cyan-300">
                <Rocket className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Interview Coach</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
              Build confidence with AI-powered interview practice, coding rounds, and detailed performance analytics.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">Home</Link></li>
              <li><Link to="/features" className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">Features</Link></li>
              <li><Link to="/about" className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">Contact Page</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-blue-600 dark:text-cyan-300 shrink-0" />
                <a href="mailto:support@interviewcoach.ai" className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">support@interviewcoach.ai</a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-blue-600 dark:text-cyan-300 shrink-0" />
                <a href="tel:+15551234567" className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">+1 (555) 123-4567</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-600 dark:text-cyan-300 shrink-0" />
                <span>Tech City, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-slate-200/80 dark:border-indigo-200/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {year} AI Interview Coach. All rights reserved.</p>
          <p>Made for better interview outcomes.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
