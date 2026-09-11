'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { NetworkBackground } from '@/components/NetworkBackground';
import { DashboardView } from '@/components/DashboardView';
import { LiveMonitorView } from '@/components/LiveMonitorView';
import { ToolRegistryView } from '@/components/ToolRegistryView';
import { ThreatsView } from '@/components/ThreatsView';
import { SimulationsView } from '@/components/SimulationsView';
import { AgentConsoleView } from '@/components/AgentConsoleView';
import { PoliciesView } from '@/components/PoliciesView';
import { AuditLogView } from '@/components/AuditLogView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { CommandPalette } from '@/components/CommandPalette';
import { ToastProvider, useToast } from '@/components/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useShieldEvents } from '@/lib/hooks/useShieldEvents';
import {
  MCPToolDefinition,
  SecurityEvent,
  ThreatRecord,
  AgentPolicy,
  ApprovalRequest,
} from '@/types';

function MainAppContent() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isResetting, setIsResetting] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);

  const [metrics, setMetrics] = useState({
    protectedTools: 4,
    threatsDetected: 0,
    blockedActions: 0,
    pendingApprovals: 0,
    securityScore: 98,
  });
  const [tools, setTools] = useState<MCPToolDefinition[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [threats, setThreats] = useState<ThreatRecord[]>([]);
  const [policies, setPolicies] = useState<AgentPolicy[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setTools(data.tools || []);
        setEvents(data.events || data.recentEvents || []);
        setThreats(data.activeThreats || []);
        setPolicies(data.policies || []);
        setPendingApprovals(data.pendingApprovals || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard telemetry:', err);
    }
  }, []);

  // Subscribe to live Server-Sent Events stream
  const { latestEvent } = useShieldEvents();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (latestEvent) {
      fetchDashboardData();
    }
  }, [latestEvent, fetchDashboardData]);

  const handleResetBaseline = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/simulate/reset', { method: 'POST' });
      if (res.ok) {
        await fetchDashboardData();
        showToast('info', 'Baseline Restored', 'Database signatures reset to clean baseline.');
      }
    } catch (err) {
      console.error('Failed to reset baseline:', err);
      showToast('danger', 'Reset Failed', 'Could not restore baseline state.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      setScanPulse(true);
      setTimeout(() => setScanPulse(false), 500);
      setActiveTab(newTab);
    }
  };



  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRunSimulationFromDashboard = (type: 'attack' | 'update' | 'output') => {
    handleTabChange('simulations');
  };

  return (
    <div className="relative min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Living AI Security Network Background */}
      <NetworkBackground
        threatsActive={metrics.threatsDetected}
        securityScore={metrics.securityScore}
      />

      {/* 2. Signature Scan Line Transition */}
      <AnimatePresence>
        {scanPulse && (
          <motion.div
            initial={{ top: '-10%', opacity: 0.8 }}
            animate={{ top: '110%', opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="fixed inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 3. Floating Glassmorphic Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        securityScore={metrics.securityScore}
        pendingApprovalsCount={pendingApprovals.length}
        onReset={handleResetBaseline}
        isResetting={isResetting}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* 4. Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleTabChange}
        onResetBaseline={handleResetBaseline}
      />

      {/* 5. Main Content Living Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                tools={tools}
                recentEvents={events}
                activeThreats={threats}
                onNavigate={handleTabChange}
                onRunSimulation={handleRunSimulationFromDashboard}
              />
            )}

            {activeTab === 'monitor' && <LiveMonitorView tools={tools} />}

            {activeTab === 'registry' && (
              <ToolRegistryView tools={tools} onRefresh={fetchDashboardData} />
            )}

            {activeTab === 'threats' && (
              <ThreatsView threats={threats} onRefresh={fetchDashboardData} />
            )}

            {activeTab === 'simulations' && <SimulationsView />}

            {activeTab === 'console' && <AgentConsoleView />}

            {activeTab === 'policies' && (
              <PoliciesView
                policies={policies}
                pendingApprovals={pendingApprovals}
                onRefresh={fetchDashboardData}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView events={events} threats={threats} />
            )}

            {activeTab === 'audit' && <AuditLogView events={events} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 6. Editorial Footer */}
      <footer className="relative z-10 border-t border-[#1a243b]/80 bg-[#060a14]/90 py-6 px-6 sm:px-8 text-xs text-slate-500 font-mono mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-bold">MCP SHIELD v2.4</span>
            <span>—</span>
            <span>Zero-Trust Runtime Integrity & Threat Protection for AI Agents</span>
          </div>
          <div className="text-slate-400">
            Deterministic SHA-256 Protocol • In-Line JSON-RPC Proxy Enforcement
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
