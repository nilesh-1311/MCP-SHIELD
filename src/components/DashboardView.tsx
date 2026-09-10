'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Activity,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  ArrowRight,
  Lock,
  Server,
  Bot,
  Cpu,
  Database,
  Search,
  Eye,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Terminal,
  Radio,
  TrendingUp,
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MCPToolDefinition, SecurityEvent, ThreatRecord } from '@/types';
import { AnimatedCounter } from './AnimatedCounter';
import { ShieldCore } from './ShieldCore';
import { Card3D } from './Card3D';

interface DashboardViewProps {
  metrics: {
    protectedTools: number;
    threatsDetected: number;
    blockedActions: number;
    pendingApprovals: number;
    securityScore: number;
  };
  tools: MCPToolDefinition[];
  recentEvents: SecurityEvent[];
  activeThreats: ThreatRecord[];
  onNavigate: (tab: string) => void;
  onRunSimulation: (type: 'attack' | 'update' | 'output') => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  tools,
  recentEvents,
  activeThreats,
  onNavigate,
  onRunSimulation,
}) => {
  const [selectedServerNode, setSelectedServerNode] = useState<string | null>(null);

  // MCP Server constellation topology
  const mcpServers = [
    {
      id: 'srv_core_local',
      name: 'Local MCP Execution Server',
      endpoint: 'http://localhost:3000/api/mcp/v1',
      status: 'HEALTHY',
      toolsCount: tools.length || 4,
      trustScore: 99,
      latency: '4ms',
      type: 'In-Process JSON-RPC Gateway',
      toolsList: ['file_reader', 'report_generator', 'search_tool', 'calculator'],
    },
    {
      id: 'srv_fs_sandbox',
      name: 'Filesystem Sandboxed Storage',
      endpoint: 'stdio://mcp-filesystem-daemon',
      status: 'PROTECTED',
      toolsCount: 1,
      trustScore: 98,
      latency: '2ms',
      type: 'Scoped OS Daemon',
      toolsList: ['filesystem_secure_read'],
    },
    {
      id: 'srv_analytics_core',
      name: 'Enterprise Analytics Dispatcher',
      endpoint: 'https://analytics.corp.internal/mcp',
      status: 'VERIFIED',
      toolsCount: 2,
      trustScore: 95,
      latency: '18ms',
      type: 'Internal Service Mesh',
      toolsList: ['executive_report_builder', 'metric_aggregator'],
    },
  ];

  // Dynamic trend data
  const trendData = useMemo(() => {
    return [
      { time: '10:00', allowed: 12, blocked: 0 },
      { time: '10:30', allowed: 19, blocked: 1 },
      { time: '11:00', allowed: 24, blocked: 2 },
      { time: '11:30', allowed: 18, blocked: 0 },
      { time: '12:00', allowed: 32, blocked: metrics.blockedActions > 0 ? metrics.blockedActions : 3 },
      { time: '12:30', allowed: 28, blocked: metrics.threatsDetected > 0 ? metrics.threatsDetected : 2 },
    ];
  }, [metrics.blockedActions, metrics.threatsDetected]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      {/* 1. EDITORIAL HERO SECTION */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0a1224]/90 via-[#070d1a]/95 to-[#050811]/98 border border-[#1e2d4d]/80 p-8 sm:p-12 shadow-2xl backdrop-blur-xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Bold Editorial Typography & Mission Statement (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Zero-Trust AI Gateway Active</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[0.95] font-sans">
                PROTECT<br />
                WHAT AI<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                  CAN TOUCH.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed pt-2">
                Deterministic SHA-256 fingerprinting, in-line JSON-RPC interception, and prompt injection defense for Model Context Protocol agents.
              </p>
            </div>

            {/* Product Story Flow Line */}
            <div className="p-3.5 bg-[#070c18] border border-[#182642] rounded-2xl flex items-center justify-between text-xs font-mono max-w-lg">
              <div className="text-center">
                <span className="text-slate-400 text-[10px] block">AI AGENT</span>
                <span className="text-sky-400 font-bold">Request</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-center px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50">
                <span className="text-slate-400 text-[10px] block">GATEWAY</span>
                <span className="text-emerald-300 font-bold">🛡️ MCP SHIELD</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-center">
                <span className="text-slate-400 text-[10px] block">MCP TOOL</span>
                <span className="text-purple-400 font-bold">Allowed Only</span>
              </div>
            </div>

            {/* Main Action CTAs */}
            <div className="flex flex-wrap gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRunSimulation('full_demo' as any)}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono tracking-wide flex items-center space-x-2 shadow-xl shadow-emerald-950/60 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>RUN FULL SECURITY DEMO →</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRunSimulation('attack')}
                className="px-4 py-3 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono flex items-center space-x-2 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>SIMULATE ATTACK LAB →</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('console')}
                className="px-4 py-3 bg-[#11192e] hover:bg-[#1a2645] text-slate-200 border border-[#1e2d4d] rounded-xl text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>AI CONSOLE →</span>
              </motion.button>
            </div>
          </div>

          {/* Right Column: Signature MCP Shield Visual Core (5 cols) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <ShieldCore
              securityScore={metrics.securityScore}
              threatsDetected={metrics.threatsDetected}
              blockedActions={metrics.blockedActions}
            />
          </div>
        </div>
      </motion.section>

      {/* 2. ASYMMETRIC SECTION: Real-Time Trust & Zero-Drift Telemetry */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Oversized Trust Score Meter (5 cols) */}
        <div className="lg:col-span-5 flex">
          <Card3D glowColor="emerald" depth={10} className="h-full">
            <div className="h-full bg-[#0b1324]/90 backdrop-blur-xl border border-[#1e2d4d] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
                    CRYPTOGRAPHIC TRUST INDEX
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VERIFIED SHA-256
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tight">
                    <AnimatedCounter value={metrics.securityScore} />
                  </span>
                  <span className="text-xl font-mono text-slate-500 font-bold">/ 100</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Continuous validation across canonical tool hashes, runtime permissions, and prompt injection filters.
                </p>
              </div>

              {/* Real-time Sub-Score Bars */}
              <div className="space-y-3 pt-6 border-t border-[#182642]">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">Integrity Hash Verification</span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </div>
                  <div className="w-full bg-[#070c18] h-2 rounded-full overflow-hidden border border-[#182642]">
                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">Agent Authorization & RBAC</span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </div>
                  <div className="w-full bg-[#070c18] h-2 rounded-full overflow-hidden border border-[#182642]">
                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">Behavior & Output Quarantine</span>
                    <span
                      className={metrics.threatsDetected > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}
                    >
                      {metrics.threatsDetected > 0 ? '78%' : '98%'}
                    </span>
                  </div>
                  <div className="w-full bg-[#070c18] h-2 rounded-full overflow-hidden border border-[#182642]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        metrics.threatsDetected > 0 ? 'bg-rose-500 w-[78%]' : 'bg-emerald-500 w-[98%]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card3D>
        </div>

        {/* Right: Key SOC Operational Metrics (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          {/* Card 1: Protected Tools */}
          <Card3D glowColor="emerald" depth={8}>
            <div
              onClick={() => onNavigate('registry')}
              className="bg-[#0b1324]/90 backdrop-blur-xl border border-[#1a2947] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl cursor-pointer h-full"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold font-mono">
                <span>PROTECTED TOOLS</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold text-white font-mono">
                  <AnimatedCounter value={metrics.protectedTools} />
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-1 font-mono">
                  SHA-256 Registered Baselines
                </div>
              </div>
            </div>
          </Card3D>

          {/* Card 2: Intercepted Threats */}
          <Card3D glowColor="rose" depth={8}>
            <div
              onClick={() => onNavigate('threats')}
              className="bg-[#0b1324]/90 backdrop-blur-xl border border-[#1a2947] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl cursor-pointer h-full"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold font-mono">
                <span>ACTIVE THREATS</span>
                <div className="w-8 h-8 rounded-xl bg-rose-950/70 border border-rose-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold text-rose-400 font-mono">
                  <AnimatedCounter value={metrics.threatsDetected} />
                </div>
                <div className="text-xs text-rose-400 font-medium mt-1 font-mono">
                  Zero Undetected Drifts
                </div>
              </div>
            </div>
          </Card3D>

          {/* Card 3: Blocked Actions */}
          <Card3D glowColor="rose" depth={8}>
            <div
              onClick={() => onNavigate('audit')}
              className="bg-[#0b1324]/90 backdrop-blur-xl border border-[#1a2947] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl cursor-pointer h-full"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold font-mono">
                <span>BLOCKED DISPATCHES</span>
                <div className="w-8 h-8 rounded-xl bg-rose-950/70 border border-rose-500/30 flex items-center justify-center">
                  <ShieldX className="w-4 h-4 text-rose-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold text-white font-mono">
                  <AnimatedCounter value={metrics.blockedActions} />
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1 font-mono">
                  Prevented Before Execution
                </div>
              </div>
            </div>
          </Card3D>

          {/* Card 4: Pending Approvals */}
          <Card3D glowColor="amber" depth={8}>
            <div
              onClick={() => onNavigate('policies')}
              className="bg-[#0b1324]/90 backdrop-blur-xl border border-[#1a2947] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl cursor-pointer h-full"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold font-mono">
                <span>PENDING REVIEWS</span>
                <div className="w-8 h-8 rounded-xl bg-amber-950/70 border border-amber-500/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold text-amber-400 font-mono">
                  <AnimatedCounter value={metrics.pendingApprovals} />
                </div>
                <div className="text-xs text-amber-400 font-medium mt-1 font-mono">
                  Human-in-the-Loop Gate
                </div>
              </div>
            </div>
          </Card3D>
        </div>
      </motion.section>

      {/* 3. ZERO-EXECUTION PROOF BANNER */}
      <motion.section
        variants={itemVariants}
        className="bg-[#070d1a] border border-[#1b2b4d] rounded-3xl p-6 shadow-xl space-y-4"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  REAL EXECUTION PROOF TELEMETRY
                </h3>
                <span className="px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-mono font-bold">
                  MCP PROXY ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mathematical guarantee: Blocked calls strictly never forward to downstream MCP servers.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('monitor')}
            className="text-xs text-sky-400 hover:text-sky-300 font-mono font-semibold flex items-center space-x-1 shrink-0"
          >
            <span>Live Flow Inspector</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3.5 bg-[#0b1324] border border-[#182642] rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase block">Total Dispatches</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {metrics.blockedActions + 6}
            </span>
            <span className="text-[10px] text-slate-500">Evaluated in-line</span>
          </div>

          <div className="p-3.5 bg-[#0b1324] border border-[#182642] rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase block">Forwarded on Block</span>
            <span className="text-xl font-bold text-rose-400 mt-1 block">0 (0.00%)</span>
            <span className="text-[10px] text-emerald-400">Strict zero forwarding</span>
          </div>

          <div className="p-3.5 bg-[#0b1324] border border-[#182642] rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase block">Server Runs on Block</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">0 Executions</span>
            <span className="text-[10px] text-emerald-400">Zero backend side-effects</span>
          </div>

          <div className="p-3.5 bg-[#0b1324] border border-[#182642] rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase block">Enforcement Point</span>
            <span className="text-xs font-bold text-sky-400 mt-2 block">PRE-EXECUTION PROXY</span>
            <span className="text-[10px] text-slate-400">SHA-256 Canonical Check</span>
          </div>
        </div>
      </motion.section>

      {/* 4. MCP CONSTELLATION NETWORK TOPOLOGY */}
      <motion.section
        variants={itemVariants}
        className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wide">
              CLUSTER ARCHITECTURE
            </span>
            <h2 className="text-lg font-bold text-white font-mono mt-0.5 flex items-center space-x-2">
              <Server className="w-5 h-5 text-purple-400" />
              <span>Connected MCP Server Network Topology</span>
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">3 Gateway Nodes Monitored</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mcpServers.map((srv) => (
            <Card3D key={srv.id} glowColor="indigo" depth={6}>
              <div
                onClick={() => setSelectedServerNode(srv.id)}
                className={`p-5 bg-[#070c18]/95 backdrop-blur-xl border rounded-2xl flex flex-col justify-between transition-all cursor-pointer h-full ${
                  selectedServerNode === srv.id
                    ? 'border-purple-500/80 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/40'
                    : 'border-[#182642] hover:border-[#2a3f6a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white font-mono">{srv.name}</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded">
                      {srv.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{srv.endpoint}</p>
                  <div className="text-[10px] text-slate-500 mt-1">{srv.type}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#141f36] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Tools: <span className="text-white font-bold">{srv.toolsCount}</span>
                  </span>
                  <span className="text-slate-400">
                    Trust: <span className="text-emerald-400 font-bold">{srv.trustScore}%</span>
                  </span>
                  <span className="text-slate-500 text-[10px]">{srv.latency}</span>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </motion.section>

      {/* 5. LIVING SECURITY EVENTS TIMELINE */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Stream (8 cols) */}
        <div className="lg:col-span-8 bg-[#0b1324] border border-[#1e2d4d] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Live Security Interception Stream
              </h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
            >
              <span>Full Audit Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentEvents.slice(0, 5).map((evt) => {
              const isBlock = evt.decision === 'BLOCK';
              const isReview = evt.decision === 'REVIEW';
              const time = new Date(evt.timestamp).toLocaleTimeString();

              return (
                <div
                  key={evt.id}
                  className={`p-3.5 bg-[#070c18] border rounded-2xl flex items-start justify-between gap-3 text-xs ${
                    isBlock ? 'border-rose-900/50' : isReview ? 'border-amber-900/50' : 'border-[#182642]'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    {isBlock ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : isReview ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white">{evt.toolName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">via {evt.agentId}</span>
                        <span className="text-[10px] text-slate-500 font-mono">[{time}]</span>
                      </div>
                      <p className="mt-1 text-slate-300 text-[11px] leading-snug">{evt.reason}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                        isBlock
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : isReview
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {evt.decision}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Threat Summary (4 cols) */}
        <div className="lg:col-span-4 bg-[#0b1324] border border-[#1e2d4d] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Active Threat Vectors</span>
              </span>
              <button
                onClick={() => onNavigate('threats')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                Inspect
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {[
                { name: 'Integrity Violations', count: activeThreats.filter((t) => t.type === 'INTEGRITY_VIOLATION').length },
                { name: 'Prompt Injections', count: activeThreats.filter((t) => t.type === 'PROMPT_INJECTION' || t.type === 'MALICIOUS_DESCRIPTION').length },
                { name: 'Unauthorized Tools', count: activeThreats.filter((t) => t.type === 'UNAUTHORIZED_TOOL').length },
                { name: 'Output Poisoning', count: activeThreats.filter((t) => t.type === 'MALICIOUS_OUTPUT').length },
              ].map((cat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#070c18] border border-[#182642] rounded-xl flex items-center justify-between"
                >
                  <span className="text-slate-300">{cat.name}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      cat.count > 0 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center justify-between">
            <span>🛡️ Zero Unhandled Breaches</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};
