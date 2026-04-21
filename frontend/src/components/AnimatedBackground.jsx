import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';

// Small drifting dust particles for a premium matte-metal backdrop.
const createNetworkDots = () =>
  Array.from({ length: 56 }).map((_, i) => {
    return {
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      endX: Math.random() * 100,
      endY: Math.random() * 100,
      size: Math.random() * 1.7 + 0.6,
      duration: 65 + Math.random() * 70,
      delay: Math.random() * 10,
    };
  });

const AnimatedBackground = () => {
  const [dots] = useState(() => createNetworkDots());

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(155deg,#1b1b1e_0%,#141416_46%,#0f1012_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_18%_8%,rgba(255,255,255,0.09),transparent_62%),radial-gradient(900px_500px_at_85%_72%,rgba(255,255,255,0.04),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,transparent_42%,rgba(0,0,0,0.28)_100%)]" />
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(rgba(255,255,255,0.7)_0.8px,transparent_0.9px)] bg-size-[4px_4px]" />

      <Motion.div
        className="absolute -top-[26%] -left-[14%] w-[58vw] h-[58vw] rounded-full bg-white/8 blur-[125px]"
        animate={{
          x: [0, 34, 0],
          y: [0, 24, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Motion.div
        className="absolute -bottom-[14%] -right-[12%] w-[46vw] h-[46vw] rounded-full bg-white/6 blur-[115px]"
        animate={{
          x: [0, -26, 0],
          y: [0, -18, 0],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Motion.div
        className="absolute top-[26%] right-[30%] w-[24vw] h-[24vw] rounded-full bg-white/[0.035] blur-[90px]"
        animate={{
          x: [0, -15, 0],
          y: [0, 14, 0],
        }}
        transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 opacity-70">
        {dots.map((dot) => (
          <Motion.div
            key={dot.id}
            className="absolute rounded-full bg-white/45"
            style={{ width: `${dot.size}px`, height: `${dot.size}px` }}
            initial={{
              x: `${dot.startX}vw`,
              y: `${dot.startY}vh`,
            }}
            animate={{
              x: [`${dot.startX}vw`, `${dot.endX}vw`, `${dot.startX}vw`],
              y: [`${dot.startY}vh`, `${dot.endY}vh`, `${dot.startY}vh`],
              opacity: [0.1, 0.45, 0.1]
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

      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.06)_50%,transparent_100%)] bg-size-[100%_3px]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(rgba(255,255,255,0.85)_0.55px,transparent_0.7px)] bg-size-[3px_3px] pointer-events-none" />

    </div>
  );
};

export default AnimatedBackground;