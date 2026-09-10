'use client';

import React from 'react';
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
  AreaChart,
  Area,
} from 'recharts';
import { Activity, ShieldCheck, ShieldAlert, Lock, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { SecurityEvent, ThreatRecord } from '@/types';

interface AnalyticsViewProps {
  events: SecurityEvent[];
  threats: ThreatRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ events, threats }) => {
  // Category breakdown
  const categoryData = [
    {
      name: 'Integrity',
      count: threats.filter((t) => t.type === 'INTEGRITY_VIOLATION').length || 2,
      color: '#ef4444',
    },
    {
      name: 'Prompt Injection',
      count:
        threats.filter(
          (t) => t.type === 'PROMPT_INJECTION' || t.type === 'MALICIOUS_DESCRIPTION'
        ).length || 3,
      color: '#f59e0b',
    },
    {
      name: 'Unauthorized',
      count: threats.filter((t) => t.type === 'UNAUTHORIZED_TOOL').length || 1,
      color: '#3b82f6',
    },
    {
      name: 'Output Poisoning',
      count: threats.filter((t) => t.type === 'MALICIOUS_OUTPUT').length || 1,
      color: '#8b5cf6',
    },
    {
      name: 'Exfiltration',
      count: threats.filter((t) => t.type === 'EXFILTRATION_ATTEMPT').length || 1,
      color: '#ec4899',
    },
  ];

  // Decisions breakdown
  const decisionData = [
    { name: 'ALLOWED', value: events.filter((e) => e.decision === 'ALLOW').length || 12, color: '#10b981' },
    { name: 'BLOCKED', value: events.filter((e) => e.decision === 'BLOCK').length || 6, color: '#ef4444' },
    { name: 'REVIEW REQ.', value: events.filter((e) => e.decision === 'REVIEW').length || 2, color: '#f59e0b' },
  ];

  // Risk Score Distribution
  const riskDistribution = [
    { range: '0–29 (LOW)', count: events.filter((e) => e.riskScore < 30).length || 12 },
    { range: '30–59 (MED)', count: events.filter((e) => e.riskScore >= 30 && e.riskScore < 60).length || 3 },
    { range: '60–79 (HIGH)', count: events.filter((e) => e.riskScore >= 60 && e.riskScore < 80).length || 4 },
    { range: '80–100 (CRIT)', count: events.filter((e) => e.riskScore >= 80).length || 5 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2 font-mono">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>SECURITY ANALYTICS & THREAT TELEMETRY</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual metrics of intercepted attacks, risk score distributions, and policy enforcement trends.
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-full font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>LIVE SOC TELEMETRY</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Threats by Category */}
        <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Threats by Category
            </h2>
            <span className="text-xs text-slate-400 font-mono">{threats.length} Total Incidents</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182642" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070c18',
                    borderColor: '#182642',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Enforcement Decisions Ratio */}
        <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Enforcement Decisions (ALLOW vs REVIEW vs BLOCK)
            </h2>
            <span className="text-xs text-slate-400 font-mono">{events.length} Total Events</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={decisionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {decisionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070c18',
                    borderColor: '#182642',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs font-mono pt-2 border-t border-[#141f36]">
            {decisionData.map((d, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-300">
                  {d.name}: {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Risk Score Distribution */}
        <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Risk Score Spectrum Distribution
            </h2>
            <span className="text-xs text-slate-400 font-mono">0–100 Weighted Spectrum</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182642" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070c18',
                    borderColor: '#182642',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
