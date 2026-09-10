'use client';

import React from 'react';
import {
  Shield,
  Activity,
  RefreshCw,
  Radio,
  Menu,
  Sparkles,
  Search,
  Command,
} from 'lucide-react';

interface HeaderProps {
  securityScore?: number;
  onReset: () => void;
  isResetting?: boolean;
  onToggleMobileMenu?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  securityScore = 98,
  onReset,
  isResetting = false,
  onToggleMobileMenu,
  onOpenCommandPalette,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080d1a]/90 backdrop-blur-md border-b border-[#1a243b] px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Brand Context */}
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg bg-[#11192e] text-slate-300 hover:text-white border border-[#1a243b]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm sm:text-base font-bold text-white font-mono tracking-tight">
              MCP SHIELD
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">—</span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Runtime Protection
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono hidden md:block">
            Secure the Tools Your AI Trusts
          </div>
        </div>
      </div>

      {/* Center: Live Enforcement Badge & Quick Search Trigger */}
      <div className="hidden lg:flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0d1629] border border-emerald-500/30 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase">
            LIVE
          </span>
          <span className="text-[11px] font-semibold text-emerald-400">
            ● In-Line Enforcement Active
          </span>
        </div>

        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0d1629] hover:bg-[#14203b] border border-[#1a243b] text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer font-mono"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search commands & tabs...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#111a2e] border border-[#1a243b] text-[10px] text-slate-300">
              Ctrl+K
            </kbd>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* SOC Health Score */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0d1629] border border-[#1a243b]">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">SOC Health:</span>
          <span
            className={`text-xs font-mono font-bold ${
              securityScore > 80
                ? 'text-emerald-400'
                : securityScore > 50
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {securityScore}%
          </span>
        </div>

        {/* Reset Baseline Button */}
        <button
          onClick={onReset}
          disabled={isResetting}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#11192e] hover:bg-[#1a2645] active:bg-[#0c1324] text-slate-200 border border-[#1a243b] rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
          title="Reset database and tool signatures to clean baseline state"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Baseline</span>
        </button>
      </div>
    </header>
  );
};
