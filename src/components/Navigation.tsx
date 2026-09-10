'use client';

import React, { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  Activity,
  Database,
  ShieldAlert,
  Flame,
  Bot,
  Lock,
  FileText,
  TrendingUp,
  Search,
  RefreshCw,
  Menu,
  X,
  Sparkles,
  Command,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  securityScore?: number;
  pendingApprovalsCount?: number;
  onReset: () => void;
  isResetting?: boolean;
  onOpenCommandPalette?: () => void;
  onRunFullDemo?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  securityScore = 98,
  pendingApprovalsCount = 0,
  onReset,
  isResetting = false,
  onOpenCommandPalette,
  onRunFullDemo,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'monitor', label: 'Live Flow', icon: Activity },
    { id: 'registry', label: 'Tool Registry', icon: Database },
    { id: 'threats', label: 'Threat Center', icon: ShieldAlert },
    { id: 'simulations', label: 'Attack Lab', icon: Flame },
    { id: 'console', label: 'AI Agent', icon: Bot },
    {
      id: 'policies',
      label: 'Policies',
      icon: Lock,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 pt-3 pb-2 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-[#080d1a]/85 border border-[#1e2d4d]/80 rounded-2xl px-4 sm:px-6 py-2.5 shadow-2xl backdrop-blur-xl">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            onClick={() => setActiveTab('dashboard')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-transparent border border-emerald-500/40 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <Shield className="w-5 h-5 text-emerald-400" />
          </motion.div>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer select-none"
          >
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-extrabold tracking-wider text-white font-mono">
                MCP
              </span>
              <span className="text-base font-extrabold tracking-wider text-emerald-400 font-mono">
                SHIELD
              </span>
            </div>
            <div className="text-[9px] font-bold tracking-widest text-slate-400 uppercase font-mono hidden sm:block">
              Zero-Trust AI Gateway
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar with Animated Pill */}
        <nav className="hidden xl:flex items-center space-x-1 bg-[#060a14]/90 p-1 rounded-xl border border-[#182642]">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  isActive ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="topNavActiveIndicator"
                    className="absolute inset-0 bg-emerald-950/80 border border-emerald-500/40 rounded-lg shadow-sm shadow-emerald-950/50"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <IconComp className="relative z-10 w-3.5 h-3.5" />
                <span className="relative z-10">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="relative z-10 px-1 py-0.2 text-[9px] font-mono font-bold bg-amber-500 text-slate-950 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Actions & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live Indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0d1629] border border-emerald-500/30 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-bold">LIVE SOC</span>
          </div>

          {/* Quick Search / Command Palette */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#0d1629] hover:bg-[#14203b] border border-[#1a243b] text-xs text-slate-400 hover:text-slate-200 transition-all font-mono flex items-center space-x-1.5"
              title="Quick Search & Actions (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline text-[11px]">Command</span>
              <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-[#111a2e] border border-[#1a243b] text-[9px] text-slate-400">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Reset Baseline */}
          <button
            onClick={onReset}
            disabled={isResetting}
            className="p-2 sm:px-3 sm:py-1.5 bg-[#11192e] hover:bg-[#1a2645] active:bg-[#0c1324] text-slate-200 border border-[#1a243b] rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
            title="Reset database to clean baseline signatures"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 rounded-xl bg-[#11192e] text-slate-300 hover:text-white border border-[#1a243b]"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="xl:hidden mt-2 p-3 bg-[#080d1a]/95 border border-[#1e2d4d] rounded-2xl shadow-2xl backdrop-blur-xl space-y-1"
          >
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#11192e]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
