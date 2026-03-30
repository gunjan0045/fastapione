import React from 'react';
import { Users, BrainCircuit, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
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
    <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
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
            viewport={{ once: true }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-200 dark:border-slate-800"
          >
            <f.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-slate-600 dark:text-slate-400">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default About;