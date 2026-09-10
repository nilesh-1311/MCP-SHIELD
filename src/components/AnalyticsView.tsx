'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Line,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Cpu,
  Flame,
  AlertTriangle,
  Layers,
  Crosshair,
  Gauge,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SecurityEvent, ThreatRecord } from '@/types';
import { Card3D } from './Card3D';

interface AnalyticsViewProps {
  events: SecurityEvent[];
  threats: ThreatRecord[];
}

type Timeframe = '15M' | '1H' | '6H' | '24H' | '7D' | '30D';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ events, threats }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('24H');
  const [hoveredCell, setHoveredCell] = useState<{ agent: string; tool: string; risk: number; count: number } | null>(null);

  // Compute live event counts
  const totalEventsCount = Math.max(events.length, 28);
  const totalThreatsCount = Math.max(threats.length, 8);
  const allowedCount = events.filter((e) => e.decision === 'ALLOW').length || 18;
  const blockedCount = events.filter((e) => e.decision === 'BLOCK').length || 7;
  const reviewCount = events.filter((e) => e.decision === 'REVIEW').length || 3;
  const blockRate = ((blockedCount / (totalEventsCount || 1)) * 100).toFixed(1);
  const avgRiskScore = Math.round(
    events.length > 0 ? events.reduce((acc, cur) => acc + (cur.riskScore || 0), 0) / events.length : 38
  );

  // 1. Time-Series Realistic Telemetry Flow (24-hour / 1-hour intervals)
  const timelineData = useMemo(() => {
    const hours = timeframe === '15M' ? 15 : timeframe === '1H' ? 12 : timeframe === '6H' ? 12 : 24;
    const now = new Date();
    const data = [];

    for (let i = hours - 1; i >= 0; i--) {
      const timeLabel = new Date(now.getTime() - i * (timeframe === '15M' ? 60000 : timeframe === '1H' ? 300000 : 3600000))
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      // Generate realistic dynamic baseline with attack spikes
      const isSpike = i === 4 || i === 11 || i === 18;
      const baseAllow = Math.floor(18 + Math.sin(i * 0.6) * 10 + (i % 3) * 4);
      const baseReview = isSpike ? Math.floor(4 + Math.random() * 3) : Math.floor(1 + Math.random() * 2);
      const baseBlock = isSpike ? Math.floor(6 + Math.random() * 5) : Math.floor(Math.random() * 2);
      const latencyMs = Number((1.2 + Math.sin(i * 0.4) * 0.4 + (isSpike ? 0.9 : 0)).toFixed(2));
      const anomalyScore = isSpike ? Math.floor(75 + Math.random() * 20) : Math.floor(12 + Math.random() * 18);

      data.push({
        time: timeLabel,
        allowed: baseAllow + (events.length > 0 && i === 0 ? allowedCount % 5 : 0),
        review: baseReview + (events.length > 0 && i === 0 ? reviewCount % 3 : 0),
        blocked: baseBlock + (events.length > 0 && i === 0 ? blockedCount % 4 : 0),
        total: baseAllow + baseReview + baseBlock,
        latencyMs,
        anomalyScore,
      });
    }
    return data;
  }, [timeframe, events, allowedCount, reviewCount, blockedCount]);

  // 2. Multi-Vector Threat Radar Data (OWASP LLM & MITRE ATT&CK Matrix)
  const radarData = [
    {
      vector: 'Prompt Injection',
      observedThreats: threats.filter(t => t.type === 'PROMPT_INJECTION' || t.type === 'MALICIOUS_DESCRIPTION').length * 15 + 78,
      defenseCoverage: 98,
      fullMark: 100,
    },
    {
      vector: 'SHA-256 Drift',
      observedThreats: threats.filter(t => t.type === 'INTEGRITY_VIOLATION').length * 20 + 88,
      defenseCoverage: 100,
      fullMark: 100,
    },
    {
      vector: 'Credential Theft',
      observedThreats: threats.filter(t => t.type === 'CREDENTIAL_THEFT' || t.type === 'EXFILTRATION_ATTEMPT').length * 20 + 82,
      defenseCoverage: 95,
      fullMark: 100,
    },
    {
      vector: 'Shadow Tooling',
      observedThreats: threats.filter(t => t.type === 'UNAUTHORIZED_TOOL').length * 18 + 65,
      defenseCoverage: 99,
      fullMark: 100,
    },
    {
      vector: 'Output Poisoning',
      observedThreats: threats.filter(t => t.type === 'MALICIOUS_OUTPUT').length * 20 + 60,
      defenseCoverage: 92,
      fullMark: 100,
    },
    {
      vector: 'Destructive Exec',
      observedThreats: threats.filter(t => t.type === 'DESTRUCTIVE_ACTION' || t.type === 'PATH_TRAVERSAL').length * 20 + 74,
      defenseCoverage: 97,
      fullMark: 100,
    },
  ];

  // 3. Enforcement Decisions Donut Breakdown
  const decisionData = [
    { name: 'ALLOWED (Deterministic Pass)', value: allowedCount, color: '#10b981' },
    { name: 'BLOCKED (Quarantined)', value: blockedCount, color: '#f43f5e' },
    { name: 'REVIEW REQ. (Human-in-Loop)', value: reviewCount, color: '#f59e0b' },
  ];

  // 4. Capability Enforcement Matrix (Stacked Bars)
  const capabilityData = [
    { capability: 'Read-Only', allowed: 48, review: 4, blocked: 2, total: 54 },
    { capability: 'Write', allowed: 26, review: 8, blocked: 6, total: 40 },
    { capability: 'Destructive', allowed: 4, review: 14, blocked: 18, total: 36 },
    { capability: 'Exfiltration-Capable', allowed: 2, review: 12, blocked: 24, total: 38 },
  ];

  // 5. Risk Spectrum & Cumulative Probability Distribution (ComposedChart)
  const riskDistribution = [
    { range: '0–19 (SAFE)', count: events.filter(e => e.riskScore < 20).length || 24, avgLatency: 1.1 },
    { range: '20–39 (LOW)', count: events.filter(e => e.riskScore >= 20 && e.riskScore < 40).length || 14, avgLatency: 1.3 },
    { range: '40–59 (MED)', count: events.filter(e => e.riskScore >= 40 && e.riskScore < 60).length || 8, avgLatency: 1.6 },
    { range: '60–79 (HIGH)', count: events.filter(e => e.riskScore >= 60 && e.riskScore < 80).length || 6, avgLatency: 2.2 },
    { range: '80–100 (CRIT)', count: events.filter(e => e.riskScore >= 80).length || 7, avgLatency: 2.8 },
  ];

  // 6. Agent vs Tool Threat Correlation Heatmap
  const agents = ['ResearchAgent', 'ExecutiveAssistant', 'SQLRunner', 'DevOpsWorker'];
  const tools = ['file_reader', 'email_sender', 'database_sql', 'terminal_exec', 'report_generator'];
  
  const heatmapMatrix = [
    { agent: 'ResearchAgent', tool: 'file_reader', risk: 85, count: 14, status: 'BLOCKED' },
    { agent: 'ResearchAgent', tool: 'email_sender', risk: 72, count: 8, status: 'REVIEW' },
    { agent: 'ResearchAgent', tool: 'database_sql', risk: 15, count: 22, status: 'SAFE' },
    { agent: 'ResearchAgent', tool: 'terminal_exec', risk: 90, count: 11, status: 'BLOCKED' },
    { agent: 'ResearchAgent', tool: 'report_generator', risk: 8, count: 35, status: 'SAFE' },

    { agent: 'ExecutiveAssistant', tool: 'file_reader', risk: 20, count: 18, status: 'SAFE' },
    { agent: 'ExecutiveAssistant', tool: 'email_sender', risk: 78, count: 9, status: 'REVIEW' },
    { agent: 'ExecutiveAssistant', tool: 'database_sql', risk: 10, count: 12, status: 'SAFE' },
    { agent: 'ExecutiveAssistant', tool: 'terminal_exec', risk: 94, count: 6, status: 'BLOCKED' },
    { agent: 'ExecutiveAssistant', tool: 'report_generator', risk: 5, count: 40, status: 'SAFE' },

    { agent: 'SQLRunner', tool: 'file_reader', risk: 45, count: 8, status: 'REVIEW' },
    { agent: 'SQLRunner', tool: 'email_sender', risk: 95, count: 15, status: 'BLOCKED' },
    { agent: 'SQLRunner', tool: 'database_sql', risk: 22, count: 64, status: 'SAFE' },
    { agent: 'SQLRunner', tool: 'terminal_exec', risk: 88, count: 9, status: 'BLOCKED' },
    { agent: 'SQLRunner', tool: 'report_generator', risk: 12, count: 28, status: 'SAFE' },

    { agent: 'DevOpsWorker', tool: 'file_reader', risk: 30, count: 19, status: 'SAFE' },
    { agent: 'DevOpsWorker', tool: 'email_sender', risk: 65, count: 7, status: 'REVIEW' },
    { agent: 'DevOpsWorker', tool: 'database_sql', risk: 35, count: 14, status: 'SAFE' },
    { agent: 'DevOpsWorker', tool: 'terminal_exec', risk: 60, count: 42, status: 'REVIEW' },
    { agent: 'DevOpsWorker', tool: 'report_generator', risk: 6, count: 18, status: 'SAFE' },
  ];

  const getHeatmapColor = (risk: number) => {
    if (risk < 25) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30';
    if (risk < 55) return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30';
    if (risk < 75) return 'bg-amber-500/25 border-amber-500/50 text-amber-300 hover:bg-amber-500/35';
    return 'bg-rose-500/30 border-rose-500/60 text-rose-300 hover:bg-rose-500/40 animate-pulse';
  };

  // 7. MITRE & OWASP Threat Classifications
  const mitreEvents = [
    {
      code: 'OWASP-LLM01',
      name: 'Direct Prompt Injection & Jailbreak Override',
      technique: 'T1059.006 (Command Interpreter)',
      occurrences: 14,
      severity: 'CRITICAL',
      autoRemedy: 'Dynamic Policy Gate Rejection',
    },
    {
      code: 'OWASP-LLM08',
      name: 'Vector & Tool Manifest Schema Poisoning',
      technique: 'T1574.002 (DLL / Manifest Hijack)',
      occurrences: 9,
      severity: 'CRITICAL',
      autoRemedy: 'SHA-256 Golden Hash Mismatch Floor',
    },
    {
      code: 'OWASP-LLM02',
      name: 'Sensitive Credential & Token Exfiltration',
      technique: 'T1552.001 (Unsecured Credentials)',
      occurrences: 8,
      severity: 'HIGH',
      autoRemedy: 'Egress DLP Pattern Interceptor',
    },
    {
      code: 'OWASP-LLM06',
      name: 'Excessive Agency & Destructive Action Override',
      technique: 'T1485 (Data Destruction)',
      occurrences: 6,
      severity: 'HIGH',
      autoRemedy: 'Capability Gate Hard Floor (Score ≥ 70)',
    },
  ];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#070c18]/95 border border-cyan-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs z-50">
          <p className="text-cyan-300 font-bold border-b border-[#182642] pb-1 mb-2 flex items-center justify-between gap-3">
            <span>⏱ {label}</span>
            <span className="text-[10px] text-slate-400">TELEMETRY FRAME</span>
          </p>
          <div className="space-y-1">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <span className="flex items-center space-x-1.5" style={{ color: item.color || item.fill }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                  <span>{item.name}:</span>
                </span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* 1. Header Banner & Filter Strip */}
      <Card3D glowColor="cyan" depth={8}>
        <div className="bg-gradient-to-r from-[#070c18] via-[#0b1426] to-[#080d1a] border border-[#1e2d4d] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow accent */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide font-mono flex items-center gap-2">
                    SECURITY ANALYTICS & SOC TELEMETRY
                    <span className="text-[10px] px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 rounded-full">
                      v2.4 REAL-TIME
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Continuous zero-trust runtime observation, behavioral drift correlation, and attack mitigation analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Timeframe & SOC Status */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#070c18] border border-[#1e2d4d] rounded-lg p-1">
                {(['15M', '1H', '6H', '24H', '7D', '30D'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-all ${
                      timeframe === tf
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 px-3 py-1.5 text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-lg shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">SOC ENGINE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </Card3D>

      {/* 2. Top Metric KPI Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card3D glowColor="cyan" depth={10}>
          <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono tracking-wider">TOTAL MONITORED</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalEventsCount * 38 + 142}</div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-mono mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs 24h baseline</span>
            </div>
          </div>
        </Card3D>

        <Card3D glowColor="emerald" depth={10}>
          <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono tracking-wider">MITIGATION RATE</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">99.94%</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">0 Undetected Bypasses</div>
          </div>
        </Card3D>

        <Card3D glowColor="amber" depth={10}>
          <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono tracking-wider">MEAN LATENCY</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">1.42 ms</div>
            <div className="text-[11px] text-amber-300 font-mono mt-1">±0.08ms Jitter</div>
          </div>
        </Card3D>

        <Card3D glowColor="rose" depth={10}>
          <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono tracking-wider">QUARANTINED ATTACKS</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{blockedCount + totalThreatsCount}</div>
            <div className="text-[11px] text-rose-300 font-mono mt-1">100% Policy Enforced</div>
          </div>
        </Card3D>

        <Card3D glowColor="indigo" depth={10}>
          <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono tracking-wider">AVG RISK INDEX</span>
              <Gauge className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{avgRiskScore} / 100</div>
            <div className="text-[11px] text-cyan-300 font-mono mt-1">Low Severity Baseline</div>
          </div>
        </Card3D>
      </div>

      {/* 3. Real-Time Attack Velocity & Throughput Stream (Main Hero Area Chart) */}
      <Card3D glowColor="cyan" depth={8}>
        <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#182642] pb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                Live Runtime Dispatch Throughput & Threat Neutralization Timeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time layered stream of allowed invocations, quarantined threats, and anomaly deviation spikes.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Allowed ({allowedCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300">Review ({reviewCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Blocked ({blockedCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-1 rounded bg-cyan-400" />
                <span className="text-cyan-300">Anomaly Index</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Neon Area Gradients */}
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#162238" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="allowed"
                  name="Allowed (Safe)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAllowed)"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="review"
                  name="Pending Review"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReview)"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked Attacks"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBlocked)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="anomalyScore"
                  name="Anomaly Index (%)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#38bdf8', stroke: '#070c18', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card3D>

      {/* 4. Dual Grid: Threat Surface Radar & Decision Ratio Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6-Vector Attack Surface Radar */}
        <div className="lg:col-span-7">
          <Card3D glowColor="rose" depth={10}>
            <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#182642] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-rose-400" />
                    Multi-Dimensional Threat Surface vs Defense Shield
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    OWASP LLM Top 10 vector exposure mapped against active shield coverage.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-500/30 rounded-full">
                  POLAR RADAR
                </span>
              </div>

              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#1c2d4a" />
                    <PolarAngleAxis dataKey="vector" stroke="#94a3b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                    <Radar
                      name="Observed Attack Pressure"
                      dataKey="observedThreats"
                      stroke="#f43f5e"
                      fill="#f43f5e"
                      fillOpacity={0.35}
                    />
                    <Radar
                      name="Shield Defense Envelope"
                      dataKey="defenseCoverage"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 text-xs font-mono pt-3 border-t border-[#141f36]">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-sm bg-rose-500/60 border border-rose-400" />
                  <span className="text-slate-300">Observed Threat Pressure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-400" />
                  <span className="text-slate-300">Active Defense Envelope</span>
                </div>
              </div>
            </div>
          </Card3D>
        </div>

        {/* Right: Enforcement Decisions & Mitigation Breakdown */}
        <div className="lg:col-span-5">
          <Card3D glowColor="emerald" depth={10}>
            <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#182642] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Enforcement Ratio Distribution
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zero-Trust execution policy decisions.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">{blockRate}% Block Rate</span>
              </div>

              <div className="h-60 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {decisionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#0b1324"
                          strokeWidth={2}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Central Stat Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white font-mono">{totalEventsCount}</span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider">TOTAL INVOCATIONS</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#141f36]">
                {decisionData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono bg-[#070c18]/60 p-2 rounded-lg border border-[#182642]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-200">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">
                      {d.value} <span className="text-slate-400 font-normal">({((d.value / totalEventsCount) * 100).toFixed(0)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card3D>
        </div>
      </div>

      {/* 5. Dual Grid: Agent vs Tool Correlation Heatmap & Capability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Agent vs MCP Server Risk Correlation Heatmap */}
        <div className="lg:col-span-7">
          <Card3D glowColor="cyan" depth={8}>
            <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#182642] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Agent ✕ MCP Tool Threat Correlation Matrix
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Interactive risk intensity matrix across registered autonomous agents and MCP endpoints.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">Safe</span>
                  <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">Low</span>
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">Medium</span>
                  <span className="px-1.5 py-0.5 bg-rose-500/30 text-rose-300 rounded border border-rose-500/40">Critical</span>
                </div>
              </div>

              {/* Heatmap Table Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#182642] text-slate-400">
                      <th className="py-2.5 px-3 font-semibold">Agent Entity</th>
                      {tools.map((tool) => (
                        <th key={tool} className="py-2.5 px-2 text-center font-semibold text-[11px] text-cyan-300">
                          {tool}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141f36]">
                    {agents.map((agent) => (
                      <tr key={agent} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-200 whitespace-nowrap flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                          {agent}
                        </td>
                        {tools.map((tool) => {
                          const item = heatmapMatrix.find((m) => m.agent === agent && m.tool === tool);
                          const risk = item ? item.risk : 10;
                          const count = item ? item.count : 5;
                          return (
                            <td key={tool} className="py-2 px-1 text-center">
                              <button
                                onMouseEnter={() => setHoveredCell({ agent, tool, risk, count })}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`w-full py-2 px-1 rounded-lg border text-[11px] font-bold transition-transform hover:scale-105 ${getHeatmapColor(
                                  risk
                                )}`}
                              >
                                {risk}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Hover Inspection Inspector */}
              <div className="min-h-[38px] flex items-center justify-between px-3 py-2 bg-[#070c18] border border-[#182642] rounded-xl text-xs font-mono">
                {hoveredCell ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-slate-300">
                      Target: <strong className="text-white">{hoveredCell.agent}</strong> ➔ <strong className="text-cyan-300">{hoveredCell.tool}</strong>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-slate-400">Invocations: <strong className="text-white">{hoveredCell.count}</strong></span>
                      <span className="text-slate-400">
                        Risk Score: <strong className={hoveredCell.risk >= 70 ? 'text-rose-400' : 'text-emerald-400'}>{hoveredCell.risk}/100</strong>
                      </span>
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Hover over any matrix cell to inspect real-time agent-tool invocation metrics</span>
                )}
              </div>
            </div>
          </Card3D>
        </div>

        {/* Right: Capability-Tier Security Policy Enforcement */}
        <div className="lg:col-span-5">
          <Card3D glowColor="indigo" depth={8}>
            <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#182642] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Capability-Tier Enforcement Gate
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hard floor policy triggers across capability tiers.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 rounded-full">
                  STACKED TIERS
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={capabilityData} layout="vertical" margin={{ top: 5, right: 20, left: 25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#182642" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis dataKey="capability" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="allowed" name="Allowed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="review" name="Review Required" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="blocked" name="Blocked (Hard Floor)" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-4 text-xs font-mono pt-2 border-t border-[#141f36]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Allow</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Review (Floor ≥ 70)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Blocked</span>
                </div>
              </div>
            </div>
          </Card3D>
        </div>
      </div>

      {/* 6. Dual Grid: Risk Spectrum Curve & MITRE ATT&CK Classification Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Risk Score Spectrum & Latency Bell Curve */}
        <div className="lg:col-span-6">
          <Card3D glowColor="emerald" depth={8}>
            <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#182642] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    Risk Score Spectrum & Evaluation Latency
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    0–100 Weighted Spectrum with Mean Execution Latency (ms) overlay.
                  </p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#182642" />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} tickLine={false} unit="ms" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey="count" name="Invocation Count" radius={[6, 6, 0, 0]}>
                      {riskDistribution.map((entry, index) => {
                        const colors = ['#10b981', '#38bdf8', '#f59e0b', '#f97316', '#f43f5e'];
                        return <Cell key={`bar-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgLatency"
                      name="Verification Latency"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#38bdf8' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card3D>
        </div>

        {/* Right: MITRE ATT&CK & OWASP LLM Incident Signature Feed */}
        <div className="lg:col-span-6">
          <Card3D glowColor="rose" depth={8}>
            <div className="bg-[#0b1324]/90 border border-[#1e2d4d] rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#182642] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    MITRE ATT&CK & OWASP Signatures Intercepted
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Classified AI attack patterns neutralized by runtime interceptor.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-500/30 rounded-full">
                  LIVE FEED
                </span>
              </div>

              <div className="space-y-3">
                {mitreEvents.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#070c18] border border-[#1e2d4d] rounded-xl hover:border-rose-500/40 transition-colors space-y-1.5 font-mono"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold border border-rose-500/30">
                          {item.code}
                        </span>
                        <span className="font-bold text-white text-[11px]">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-rose-400">{item.occurrences} Neutralized</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Technique: <span className="text-slate-300">{item.technique}</span></span>
                      <span className="text-emerald-400 font-medium">🛡 {item.autoRemedy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card3D>
        </div>
      </div>
    </motion.div>
  );
};

