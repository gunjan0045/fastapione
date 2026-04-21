/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
const FeatureCard = ({ icon: Icon, title, description, index = 0 }) => {
  const shouldReduceMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isDesktopTilt, setIsDesktopTilt] = useState(false);

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const update = () => {
      setIsDesktopTilt(!shouldReduceMotion && hoverQuery.matches && !mobileQuery.matches);
    };

    update();

    const add = (query, handler) => {
      if (query.addEventListener) query.addEventListener('change', handler);
      else query.addListener(handler);
    };

    const remove = (query, handler) => {
      if (query.removeEventListener) query.removeEventListener('change', handler);
      else query.removeListener(handler);
    };

    add(hoverQuery, update);
    add(mobileQuery, update);

    return () => {
      remove(hoverQuery, update);
      remove(mobileQuery, update);
    };
  }, [shouldReduceMotion]);

  const handleMouseMove = (e) => {
    if (!isDesktopTilt) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 12;
    const rotateX = (0.5 - py) * 12;
    setTilt({ x: rotateX, y: rotateY });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div 
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : isDesktopTilt ? 26 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.25, margin: "-50px" }}
      transition={{ duration: shouldReduceMotion ? 0.01 : isDesktopTilt ? 0.52 : 0.38, delay: shouldReduceMotion ? 0 : index * 0.08 }}
      whileHover={isDesktopTilt ? { y: -12 } : undefined}
      animate={{ rotateX: isDesktopTilt ? tilt.x : 0, rotateY: isDesktopTilt ? tilt.y : 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{ transformStyle: 'preserve-3d' }}
      className="group p-8 rounded-3xl border border-slate-200/70 dark:border-indigo-200/10 bg-white/70 dark:bg-slate-900/65 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer backdrop-blur-xl"
    >
      <div style={{ transform: 'translateZ(34px)' }} className="w-14 h-14 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-cyan-300 rounded-xl mb-6 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/30 transition-all duration-300 shadow-[0_0_25px_rgba(62,215,255,0.22)]">
        <Icon className="w-7 h-7" />
      </div>
      <h3 style={{ transform: 'translateZ(26px)' }} className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">{title}</h3>
      <p style={{ transform: 'translateZ(20px)' }} className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;
