'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, Lock, Zap, Cpu, Server, Bot, Activity } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface ShieldCoreProps {
  securityScore: number;
  threatsDetected: number;
  blockedActions: number;
  onRunDemo?: () => void;
  className?: string;
}

export const ShieldCore: React.FC<ShieldCoreProps> = ({
  securityScore = 98,
  threatsDetected = 0,
  blockedActions = 0,
  onRunDemo,
  className = '',
}) => {
  const isCompromised = threatsDetected > 0 || securityScore < 80;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Top Agent Indicator */}
      <div className="flex flex-col items-center mb-3">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0d1629]/90 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-300 shadow-lg">
          <Bot className="w-3.5 h-3.5 text-sky-400" />
          <span>AI AGENTS (AUTONOMOUS CALLS)</span>
        </div>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-0.5 h-6 bg-gradient-to-b from-sky-400 to-emerald-400 my-1 opacity-75"
        />
      </div>

      {/* Main Core Visual Object */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Orbital Ring 1: Outer Dashed Counter-Clockwise */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed border-emerald-500/20"
        />

        {/* Orbital Ring 2: Mid Precision Ring Clockwise */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
          className="absolute inset-3 rounded-full border border-emerald-500/30"
          style={{
            borderTopColor: isCompromised ? '#f43f5e' : '#10b981',
            borderRightColor: 'transparent',
            borderBottomColor: '#38bdf8',
            borderLeftColor: 'transparent',
          }}
        />

        {/* Orbital Ring 3: Subtle Pulse Ring */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className={`absolute inset-7 rounded-full border ${
            isCompromised ? 'border-rose-500/40 bg-rose-500/5' : 'border-emerald-500/40 bg-emerald-500/5'
          } blur-xs`}
        />

        {/* Central Core Holographic Container */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className={`relative z-10 w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-[#0e1b36]/95 via-[#091122]/95 to-[#060b17]/95 border-2 ${
            isCompromised ? 'border-rose-500/70 shadow-rose-950/60' : 'border-emerald-500/70 shadow-emerald-950/60'
          } p-5 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-xl`}
        >
          {/* Status Icon */}
          <div className="mb-1">
            {isCompromised ? (
              <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            )}
          </div>

          <div className="text-[10px] font-extrabold tracking-widest font-mono text-slate-400 uppercase">
            MCP SHIELD CORE
          </div>

          <div className="flex items-baseline space-x-0.5 my-0.5">
            <span
              className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                isCompromised ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              <AnimatedCounter value={securityScore} />
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold">/100</span>
          </div>

          <div className="text-[9px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center space-x-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCompromised ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>{isCompromised ? 'THREAT INTERCEPTED' : 'SYSTEM TRUSTED'}</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom MCP Servers Flow Indicator */}
      <div className="flex flex-col items-center mt-3">
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-0.5 h-6 bg-gradient-to-b from-emerald-400 to-purple-400 my-1 opacity-75"
        />
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0d1629]/90 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300 shadow-lg">
          <Server className="w-3.5 h-3.5 text-purple-400" />
          <span>MCP SERVERS (ALLOWED ONLY)</span>
        </div>
      </div>
    </div>
  );
};
