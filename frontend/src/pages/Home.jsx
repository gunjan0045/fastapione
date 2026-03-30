import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, FileText, Video, Eye, CheckCircle, BarChart3, BrainCircuit, Upload, Play, MessageSquare, LineChart } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';

const Home = () => {
  const features = [
    { icon: FileText, title: "Resume Analyzer", description: "Get instant AI feedback on your resume to match job descriptions perfectly." },
    { icon: Video, title: "AI Mock Interview", description: "Practice answering real interview questions with our advanced AI avatar." },
    { icon: Eye, title: "Body Language Detection", description: "Receive insights on your posture, eye contact, and confidence levels." },
    { icon: CheckCircle, title: "Answer Evaluation", description: "Get graded responses highlighting strengths and areas for improvement." },
    { icon: BarChart3, title: "Performance Dashboard", description: "Track your progress over time with detailed analytics and scoring." },
    { icon: BrainCircuit, title: "AI Insights", description: "Personalized coaching tips and resource recommendations based on your performance." },
  ];

  const steps = [
    { icon: Upload, title: "1. Upload Resume", desc: "Share your experience" },
    { icon: Play, title: "2. Start Interview", desc: "Practice with AI" },
    { icon: MessageSquare, title: "3. Get Feedback", desc: "Instant evaluation" },
    { icon: LineChart, title: "4. View Report", desc: "Track progress" },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-sm mb-8 ring-1 ring-blue-500/20">
          <Rocket className="w-4 h-4" /> New Features Available
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-8">
          AI Interview Coach <span className="inline-block animate-bounce">🚀</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Practice interviews, analyze resumes, and improve confidence using advanced AI technology. Pass your next interview with ease.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login" className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-1 w-full sm:w-auto">
            Get Started
          </Link>
          <a href="#features" className="px-8 py-4 text-lg font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl transition-all w-full sm:w-auto">
            Learn More
          </a>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-100/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Supercharge Your Prep</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to crack your next interview.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => <FeatureCard key={i} index={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-16">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-linear-to-r from-blue-100 via-blue-500 to-blue-100 dark:from-slate-800 dark:via-blue-500/50 dark:to-slate-800"></div>
          {steps.map((s, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center group">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <s.icon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-slate-600 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-5xl mx-auto px-6 mb-20">
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Rocket className="w-64 h-64 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">Ready to crack your interview?</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of successful candidates who have mastered their interview skills with AI Interview Coach.
          </p>
          <Link to="/login" className="inline-block px-10 py-5 text-lg font-bold text-blue-600 bg-white hover:bg-slate-50 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 relative z-10">
            Start Practice Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;