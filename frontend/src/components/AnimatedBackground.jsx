import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';

// Generate random abstract connected dots for the background network effect
const createNetworkDots = () => 
  Array.from({ length: 35 }).map((_, i) => {
    return {
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      endX: Math.random() * 100,
      endY: Math.random() * 100,
      duration: 50 + Math.random() * 50,
      delay: Math.random() * 10,
    };
  });

const AnimatedBackground = () => {
  const [dots] = useState(() => createNetworkDots());

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* 
        Main overarching gradients: 
        Dark: #030712 -> #071226 -> #0B1B34 
        Light: #F7FAFF -> #EEF4FF -> #E6F0FF
      */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#F7FAFF_0%,#EEF4FF_50%,#E6F0FF_100%)] dark:bg-[linear-gradient(135deg,#030712_0%,#071226_50%,#0B1B34_100%)] transition-colors duration-700" />

      {/* Floating blurry abstract lights */}
      <Motion.div
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen"
        animate={{
          x: [0, 50, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <Motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-300/30 dark:bg-[#18C3FF]/10 rounded-full blur-[100px] mix-blend-screen"
        animate={{
          x: [0, -40, 0],
          y: [0, -40, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle network dots */}
      <div className="absolute inset-0 opacity-60 dark:opacity-40">
        {dots.map((dot) => (
          <Motion.div
            key={dot.id}
            className="absolute rounded-full bg-blue-500/50 w-1 h-1 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            initial={{
              x: `${dot.startX}vw`,
              y: `${dot.startY}vh`,
            }}
            animate={{
              x: [`${dot.startX}vw`, `${dot.endX}vw`, `${dot.startX}vw`],
              y: [`${dot.startY}vh`, `${dot.endY}vh`, `${dot.startY}vh`],
              opacity: [0.1, 0.5, 0.1]
            }}
            transition={{
              duration: dot.duration,
              delay: dot.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>
      
      {/* Overlay noise texture for premium matte feel */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDEiLz4KPHBhdGggZD0iTTAgMEwyLTRNMCA0bDItNEwyIDBMMCAwIgogIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] pointer-events-none" />

    </div>
  );
};

export default AnimatedBackground;