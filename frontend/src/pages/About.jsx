import React, { useEffect, useState } from 'react';
import { Users, BrainCircuit, Rocket } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';

const About = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isMobileMotion, setIsMobileMotion] = useState(false);

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

  const revealY = (desktopY, mobileY = 12) => (shouldReduceMotion ? 0 : isMobileMotion ? mobileY : desktopY);
  const revealTransition = (desktopDuration, mobileDuration, delay = 0) => ({
    duration: shouldReduceMotion ? 0.01 : isMobileMotion ? mobileDuration : desktopDuration,
    delay: shouldReduceMotion ? 0 : delay,
    ease: [0.22, 1, 0.36, 1]
  });

  const features = [
    {
      icon: BrainCircuit,
      title: 'AI-Powered Insights',
      desc: 'Get actionable interview and resume feedback using our AI technology.'
    },
    {
      icon: Users,
      title: 'Community Support',
      desc: 'Join a growing community of learners and share experiences.'
    },
    {
      icon: Rocket,
      title: 'Career Growth',
      desc: 'Boost your chances of landing your dream job with smart guidance.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: revealY(40, 14) }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={revealTransition(0.7, 0.46)}
      className="pt-28 pb-20 px-6 max-w-7xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.35 }}
        transition={revealTransition(0.62, 0.4)}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-4">
          About AI Interview Coach
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Our platform combines AI, real-time analysis, and personalized feedback to help you prepare and ace your interviews.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={revealTransition(0.56, 0.36, i * (isMobileMotion ? 0.04 : 0.08))}
            className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-200 dark:border-indigo-200/10"
          >
            <f.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-slate-600 dark:text-slate-400">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <Footer />
    </motion.div>
  );
};

export default About;