'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Database,
  Terminal,
  Activity,
  FileText,
  TrendingUp,
  RefreshCw,
  Zap,
  Play,
  ArrowRight,
  X,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onResetBaseline?: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Simulations';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onResetBaseline,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Security Overview Dashboard',
        subtitle: 'System health, server status & runtime flow',
        icon: <LayoutDashboard className="w-4 h-4 text-sky-400" />,
        action: () => {
          onNavigate('dashboard');
          onClose();
        },
      },
      {
        id: 'nav-monitor',
        category: 'Navigation',
        title: 'Live Interception Monitor',
        subtitle: 'Real-time JSON-RPC payload & proxy traffic',
        icon: <Activity className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onNavigate('monitor');
          onClose();
        },
      },
      {
        id: 'nav-registry',
        category: 'Navigation',
        title: 'MCP Tool Registry & Fingerprints',
        subtitle: 'Canonical SHA-256 signatures & baselines',
        icon: <Database className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onNavigate('registry');
          onClose();
        },
      },
      {
        id: 'nav-threats',
        category: 'Navigation',
        title: 'Active Threat Center',
        subtitle: 'Detected anomalies, prompt injections & diffs',
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        action: () => {
          onNavigate('threats');
          onClose();
        },
      },
      {
        id: 'nav-simulations',
        category: 'Navigation',
        title: 'Attack Simulation Lab',
        subtitle: '9-scenario zero-trust attack test suite',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        action: () => {
          onNavigate('simulations');
          onClose();
        },
      },
      {
        id: 'nav-console',
        category: 'Navigation',
        title: 'AI Agent Console',
        subtitle: 'Interactive agent chat with real MCP proxy',
        icon: <Terminal className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onNavigate('console');
          onClose();
        },
      },
      {
        id: 'nav-policies',
        category: 'Navigation',
        title: 'Policies & Developer Approvals',
        subtitle: 'RBAC, approval workflows & diff inspect',
        icon: <Sliders className="w-4 h-4 text-purple-400" />,
        action: () => {
          onNavigate('policies');
          onClose();
        },
      },
      {
        id: 'nav-audit',
        category: 'Navigation',
        title: 'Security Audit Log',
        subtitle: 'Immutable forensic execution records',
        icon: <FileText className="w-4 h-4 text-slate-400" />,
        action: () => {
          onNavigate('audit');
          onClose();
        },
      },
      {
        id: 'nav-analytics',
        category: 'Navigation',
        title: 'Analytics & SOC Risk Scoring',
        subtitle: 'Attack vectors, severity & execution stats',
        icon: <TrendingUp className="w-4 h-4 text-teal-400" />,
        action: () => {
          onNavigate('analytics');
          onClose();
        },
      },
      {
        id: 'action-reset',
        category: 'Actions',
        title: 'Reset Baseline Signatures',
        subtitle: 'Restore database to clean trusted state',
        icon: <RefreshCw className="w-4 h-4 text-sky-400" />,
        action: () => {
          if (onResetBaseline) onResetBaseline();
          onClose();
        },
      },
      {
        id: 'action-sim-suite',
        category: 'Simulations',
        title: 'Open 9-Scenario Attack Suite',
        subtitle: 'Launch full attack and mitigation demo',
        icon: <Play className="w-4 h-4 text-amber-400" />,
        action: () => {
          onNavigate('simulations');
          onClose();
        },
      },
    ],
    [onNavigate, onClose, onResetBaseline]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    },
    [isOpen, onClose, filtered, selectedIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-[#0b1324] border border-[#1e2d4d] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1a243b] bg-[#0d1629]">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, tool, or view (e.g. 'threats', 'reset', 'monitor')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or navigation routes found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-[#152238] border border-sky-500/30 text-white'
                      : 'hover:bg-[#111a2e] text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-[#1c2c49]' : 'bg-[#0e172a]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0e172a] text-slate-400 border border-[#1a243b]">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                      isSelected ? 'opacity-100 text-sky-400' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#080d1a] border-t border-[#1a243b] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#111a2e] border border-[#1a243b] text-slate-300 text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#111a2e] border border-[#1a243b] text-slate-300 text-[10px]">
                Enter
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#111a2e] border border-[#1a243b] text-slate-300 text-[10px]">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className="text-[10px] text-sky-400">MCP SHIELD Command Bar</span>
        </div>
      </div>
    </div>
  );
};
