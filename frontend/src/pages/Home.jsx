import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Rocket, FileText, Video, Eye, CheckCircle, BarChart3, BrainCircuit, Upload, Play, MessageSquare, LineChart, ShieldCheck, Sparkles, Clock3, Users, TrendingUp, BadgeCheck } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';
import ThreeHeroOrb from '../components/ThreeHeroOrb';
import Footer from '../components/Footer';

const HERO_LINES = ['Practice Today', 'Succeed', 'Tomorrow'];

const TypingCaret = () => (
  <span
    className="inline-block h-[0.88em] w-0.5 ml-1 align-[-0.08em] rounded-full bg-current shadow-[0_0_12px_rgba(123,198,255,0.9)]"
    aria-hidden="true"
  />
);

const Home = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isMobileMotion, setIsMobileMotion] = useState(false);
  const [displayedLines, setDisplayedLines] = useState(() => HERO_LINES.map(() => ''));
  const [activeLine, setActiveLine] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobileMotion(query.matches);
    update();

    if (query.addEventListener) {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  const revealY = (desktopY, mobileY = 16) => (shouldReduceMotion ? 0 : isMobileMotion ? mobileY : desktopY);
  const revealDuration = (desktopDuration, mobileDuration) => (shouldReduceMotion ? 0.01 : isMobileMotion ? mobileDuration : desktopDuration);
  const revealTransition = (desktopDuration, mobileDuration, delay = 0) => ({
    duration: revealDuration(desktopDuration, mobileDuration),
    delay: shouldReduceMotion ? 0 : delay,
    ease: [0.22, 1, 0.36, 1]
  });

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;

    const typeTimer = setInterval(() => {
      if (lineIndex >= HERO_LINES.length) {
        setTypingDone(true);
        clearInterval(typeTimer);
        return;
      }

      const currentLineIndex = lineIndex;
      const currentCharIndex = charIndex;
      const currentLine = HERO_LINES[currentLineIndex];

      if (!currentLine) {
        setTypingDone(true);
        clearInterval(typeTimer);
        return;
      }

      setDisplayedLines((prev) => {
        const next = [...prev];
        next[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1);
        return next;
      });

      charIndex += 1;
      if (charIndex >= currentLine.length) {
        lineIndex += 1;
        setActiveLine(lineIndex);
        charIndex = 0;
      }
    }, 45);

    return () => clearInterval(typeTimer);
  }, []);

  useEffect(() => {
    if (typingDone) return;

    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 430);

    return () => clearInterval(cursorTimer);
  }, [typingDone]);

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

  const trustStats = [
    { value: '10K+', label: 'Active Users' },
    { value: '25K+', label: 'Interviews Taken' },
    { value: '92%', label: 'Avg Improvement' },
    { value: '4.9', label: 'User Rating' },
  ];

  const comparison = [
    { metric: 'Adaptive Follow-Ups', ai: 'Real-time', others: 'Limited' },
    { metric: 'Body Language Signals', ai: 'Included', others: 'N/A' },
    { metric: 'Coding + HR in one flow', ai: 'Supported', others: 'Split tools' },
    { metric: 'Performance trend analytics', ai: 'Built-in', others: 'Manual' },
  ];

  const testimonial = [
    {
      quote: 'Mere placement interviews ke liye jo confidence chahiye tha, vo yahin se build hua.',
      author: 'Aarav S.',
      role: 'Frontend Engineer',
    },
    {
      quote: 'Live coding + feedback flow almost real panel jaisa feel hua.',
      author: 'Nisha K.',
      role: 'SDE Intern',
    },
    {
      quote: 'Resume based questions ne mujhe random prep se focused prep pe shift kar diya.',
      author: 'Rohit M.',
      role: 'Backend Developer',
    },
  ];

  return (
    <div className="w-full overflow-hidden">
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-12 px-6 max-w-7xl mx-auto"
      >
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/70 dark:bg-blue-900/35 text-blue-700 dark:text-blue-300 font-medium text-sm mb-8 ring-1 ring-blue-500/30">
              <Sparkles className="w-4 h-4" /> AI Interview Studio v2 Live
            </div>
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold text-slate-900 dark:text-white mb-8 leading-[1.05]">
              <motion.span
                initial={{ opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                animate={displayedLines[0].length > 0 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : { opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                className="block min-h-[1.1em]"
              >
                {displayedLines[0] || '\u00A0'}
                {!typingDone && activeLine === 0 && showCursor && <TypingCaret />}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                animate={displayedLines[1].length > 0 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : { opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                className="soft-gradient-text block mt-1 min-h-[1.1em]"
              >
                {displayedLines[1] || '\u00A0'}
                {!typingDone && activeLine === 1 && showCursor && <TypingCaret />}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                animate={displayedLines[2].length > 0 ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : { opacity: 0, y: 20, filter: 'blur(7px)', scale: 0.985 }}
                transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                className="soft-gradient-text block min-h-[1.1em]"
              >
                {displayedLines[2] || '\u00A0'}
                {!typingDone && activeLine === 2 && showCursor && <TypingCaret />}
              </motion.span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              AI-powered mock interviews, smart feedback, and personalized insights to help you land your dream job.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link to="/login" className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-1 w-full sm:w-auto">
                Start Free Trial
              </Link>
              <a href="#features" className="px-8 py-4 text-lg font-semibold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl transition-all w-full sm:w-auto">
                Explore Features
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {trustStats.map((item) => (
                <div key={item.label} className="glass-panel rounded-2xl p-3 text-left">
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white">{item.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-110 md:h-130 rounded-4xl glass-panel neon-ring noise-overlay panel-shadow">
            <div className="absolute inset-0 rounded-4xl bg-[radial-gradient(circle_at_30%_30%,rgba(124,213,255,0.3),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(127,113,255,0.25),transparent_52%)]" />
            <div className="absolute inset-0 z-0">
              <ThreeHeroOrb />
            </div>

            <div className="absolute top-6 left-6 right-6 flex justify-between z-10">
              <div className="glass-panel rounded-xl px-4 py-2">
                <p className="text-xs uppercase tracking-widest text-slate-300">AI</p>
                <p className="text-sm font-semibold text-white">Live Interview Engine</p>
              </div>
              <div className="glass-panel rounded-xl px-4 py-2 text-right">
                <p className="text-xs uppercase tracking-widest text-slate-300">Score Trend</p>
                <p className="text-sm font-semibold text-cyan-300">+18.6</p>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3 z-10">
              <div className="glass-panel rounded-xl p-3">
                <p className="text-xs text-slate-400">Session Type</p>
                <p className="text-sm font-semibold text-white">Frontend Mock</p>
              </div>
              <div className="glass-panel rounded-xl p-3">
                <p className="text-xs text-slate-400">Confidence</p>
                <p className="text-sm font-semibold text-white">82%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Structured Evaluation</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Technical, communication, confidence aur body-language scoring ek hi flow me.</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
            <Clock3 className="w-5 h-5 text-fuchsia-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">24x7 Practice Window</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Jab chaho tab interview run karo, aur har session ka report save hota rahega.</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">AI + Human Expert Mode</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Self practice se lekar live expert mock tak complete prep pipeline.</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="features"
        initial={{ opacity: 0, y: revealY(42, 14) }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.18, margin: '-70px' }}
        transition={revealTransition(0.62, 0.42)}
        className="py-24 bg-slate-100/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 transition-transform"
      >
        <motion.div
          className="max-w-7xl mx-auto px-6"
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        >
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: revealY(24, 10) }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2, margin: '-80px' }}
            transition={revealTransition(0.56, 0.38, 0.04)}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Supercharge Your Prep</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to crack your next interview.</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: revealY(28, 12) }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15, margin: '-80px' }}
            transition={revealTransition(0.62, 0.44, 0.06)}
          >
            {features.map((f, i) => <FeatureCard key={i} index={i} {...f} />)}
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: revealY(44, 15) }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.16 }}
        transition={revealTransition(0.72, 0.48)}
        className="py-24 px-6 max-w-7xl mx-auto"
      >
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-panel rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold mb-4">
              <TrendingUp className="w-4 h-4" /> Why this platform stands out
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Better than random mock prep</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Har interview session context-aware hota hai. Aapke answers ke basis par next questions adapt hote hain, jisse prep realistic banti hai.
            </p>
            <div className="space-y-3">
              {comparison.map((row) => (
                <div key={row.metric} className="grid grid-cols-3 gap-2 text-sm bg-slate-900/45 rounded-xl p-3 border border-indigo-200/10">
                  <p className="text-slate-300">{row.metric}</p>
                  <p className="text-cyan-300 font-semibold text-center">{row.ai}</p>
                  <p className="text-slate-500 text-center">{row.others}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-2 text-fuchsia-300 text-sm font-semibold mb-4">
              <BadgeCheck className="w-4 h-4" /> What you unlock
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-5">Complete prep dashboard</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/45 border border-indigo-300/10 rounded-xl p-4">
                <p className="text-xs text-slate-400">Performance trend</p>
                <p className="text-2xl font-bold text-cyan-300">84%</p>
              </div>
              <div className="bg-slate-900/45 border border-indigo-300/10 rounded-xl p-4">
                <p className="text-xs text-slate-400">Best score</p>
                <p className="text-2xl font-bold text-fuchsia-300">92%</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-300" /> Resume-focused and role-focused question banks</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-300" /> Instant strengths and weaknesses for every answer</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-300" /> Session history with visual reports and review trails</li>
            </ul>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: revealY(44, 15) }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={revealTransition(0.78, 0.5)}
        className="py-24 px-6 max-w-7xl mx-auto text-center"
      >
        <motion.h2
          initial={{ opacity: 0, y: revealY(20, 8) }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={revealTransition(0.58, 0.36)}
          className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-16"
        >
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-linear-to-r from-blue-100 via-blue-500 to-blue-100 dark:from-slate-800 dark:via-blue-500/50 dark:to-slate-800"></div>
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: revealY(26, 10) }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.28 }}
              transition={revealTransition(0.5, 0.34, i * (isMobileMotion ? 0.03 : 0.05))}
              className="relative z-10 flex flex-col items-center group"
            >
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <s.icon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-slate-600 dark:text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: revealY(44, 15) }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.22 }}
        transition={revealTransition(0.86, 0.56)}
        className="py-12 px-6 max-w-7xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-10">Learners who improved faster</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonial.map((item) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: revealY(24, 9) }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.28 }}
              transition={revealTransition(0.7, 0.46)}
              className="glass-panel rounded-2xl p-6"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-5">"{item.quote}"</p>
              <p className="font-semibold text-slate-900 dark:text-white">{item.author}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: revealY(46, 16) }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={revealTransition(0.96, 0.62)}
        className="py-24 max-w-5xl mx-auto px-6 mb-20"
      >
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
      </motion.section>

      <Footer />
    </div>
  );
};

export default Home;