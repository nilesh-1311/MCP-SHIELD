'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'emerald' | 'cyan' | 'rose' | 'amber' | 'indigo';
  depth?: number;
  interactiveGlare?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  glowColor = 'emerald',
  depth = 12,
  interactiveGlare = true,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position in relative percentage [-0.5 to 0.5]
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for rotation
  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [depth, -depth]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-depth, depth]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const glowStyles = {
    emerald: 'hover:shadow-[0_20px_50px_rgba(16,185,129,0.22)] hover:border-emerald-500/50',
    cyan: 'hover:shadow-[0_20px_50px_rgba(56,189,248,0.22)] hover:border-cyan-500/50',
    rose: 'hover:shadow-[0_20px_50px_rgba(244,63,94,0.25)] hover:border-rose-500/50',
    amber: 'hover:shadow-[0_20px_50px_rgba(245,158,11,0.22)] hover:border-amber-500/50',
    indigo: 'hover:shadow-[0_20px_50px_rgba(99,102,241,0.22)] hover:border-indigo-500/50',
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.012, z: 20 }}
        transition={{ duration: 0.2 }}
        className={`relative transition-shadow duration-300 ${glowStyles[glowColor]} ${className}`}
      >
        {/* Dynamic Specular Glare Layer */}
        {interactiveGlare && isHovered && (
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.12) 0%, transparent 60%)`,
            }}
            className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 transition-opacity duration-300"
          />
        )}

        {/* 3D Depth Content */}
        <div style={{ transform: 'translateZ(15px)' }} className="relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
