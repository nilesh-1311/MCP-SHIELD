'use client';

import React from 'react';
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
  Radio,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0,
  isOpen = true,
  onClose,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { id: 'monitor', label: 'Live Monitor', icon: Activity },
    { id: 'registry', label: 'Tool Registry', icon: Database },
    { id: 'threats', label: 'Threat Center', icon: ShieldAlert },
    { id: 'simulations', label: 'Attack Lab', icon: Flame },
    { id: 'console', label: 'AI Agent Console', icon: Bot },
    {
      id: 'policies',
      label: 'Policies & Approvals',
      icon: Lock,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'analytics', label: 'Analytics & Trends', icon: TrendingUp },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#080d1a] border-r border-[#1a243b] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Logo & Product Brand */}
        <div className="h-16 px-5 border-b border-[#1a243b] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40"
            >
              <Shield className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base font-extrabold tracking-wider text-white font-mono">MCP</span>
                <span className="text-base font-extrabold tracking-wider text-emerald-400 font-mono">SHIELD</span>
              </div>
              <div className="text-[9px] font-bold tracking-widest text-slate-400 uppercase font-mono">
                Runtime Security
              </div>
            </div>
          </div>

          {/* Close for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-[#11192e] transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Category */}
        <div className="px-3.5 py-4">
          <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono px-3 mb-2.5">
            Security Operations
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#11192e]/60'
                  }`}
                >
                  {/* Animated Active Nav Indicator with layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-950/70 via-emerald-950/40 to-transparent border border-emerald-500/40 rounded-xl shadow-sm shadow-emerald-950/60"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center space-x-3">
                    <IconComp
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="relative z-10 px-1.5 py-0.2 text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom System Status Widget */}
      <div className="p-4 border-t border-[#1a243b] bg-[#060a14]">
        <div className="p-3 bg-[#0d1527] border border-[#1e2d4d] rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-white font-mono">System Status</span>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
              v2.4
            </span>
          </div>

          <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
            <span>● Protection Active</span>
          </div>

          <div className="text-[10px] text-slate-400 leading-tight">
            Zero-Trust Runtime Interceptor is actively enforcing SHA-256 tool integrity.
          </div>
        </div>
      </div>
    </aside>
  );
};
