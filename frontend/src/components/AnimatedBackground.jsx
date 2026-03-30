import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  User,
  Users,
  Briefcase,
  FileText,
  Coffee,
  MessageSquare,
  Cpu,
  Zap,
  Activity
} from 'lucide-react';

// ✅ Removed Lightning (it does NOT exist)
const icons = [
  User,
  Users,
  Briefcase,
  FileText,
  Coffee,
  MessageSquare,
  Cpu,
  Zap,
  Activity
];

// ✅ Cleaner + optimized animation generator
const createAnimatedElements = () =>
  Array.from({ length: 12 }).map((_, i) => { // reduced from 18 → 12
    const Icon = icons[Math.floor(Math.random() * icons.length)];

    const startX = Math.random() * 100;
    const startY = Math.random() * 100;

    // smoother movement
    const xOffset = (Math.random() - 0.5) * 20;
    const yOffset = (Math.random() - 0.5) * 20;

    return {
      id: i,
      Icon,
      startX,
      startY,
      endX: startX + xOffset,
      endY: startY + yOffset,
      duration: 25 + Math.random() * 20,
      delay: Math.random() * 4,
      size: 16 + Math.random() * 20,
      opacity: 0.05 + Math.random() * 0.1,
    };
  });

const AnimatedBackground = () => {
  const [elements] = useState(() => createAnimatedElements());

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

      {/* 🌈 Soft gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-cyan-100/30 via-transparent to-indigo-100/30 dark:from-slate-900/40 dark:to-indigo-950/40 blur-[2px]" />

      {/* 🔵 Center glowing orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Motion.div
          className="h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* ✨ Floating icons */}
      {elements.map((el) => (
        <Motion.div
          key={el.id}
          className="absolute text-slate-200/70 dark:text-slate-500/70"
          initial={{
            x: `${el.startX}vw`,
            y: `${el.startY}vh`,
            opacity: 0,
          }}
          animate={{
            x: [`${el.startX}vw`, `${el.endX}vw`, `${el.startX}vw`],
            y: [`${el.startY}vh`, `${el.endY}vh`, `${el.startY}vh`],
            opacity: [0, el.opacity, 0],
            rotate: [0, 30, 0],
          }}
          transition={{
            duration: el.duration,
            delay: el.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <el.Icon size={el.size} strokeWidth={1} />
        </Motion.div>
      ))}

      {/* 🤖 AI core ring */}
      <Motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-10 rounded-full border border-white/10 backdrop-blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Cpu className="text-cyan-300/60" size={60} />
      </Motion.div>

    </div>
  );
};

export default AnimatedBackground;