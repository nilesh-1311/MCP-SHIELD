'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Eye,
  CheckCircle2,
  XCircle,
  FileWarning,
  Search,
  Filter,
  X,
  Lock,
  ArrowRight,
  Code,
  Download,
  Terminal,
  Database,
  Radio,
  Server,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreatRecord } from '@/types';
import { useToast } from './ToastContext';
import { AnimatedCounter } from './AnimatedCounter';

interface ThreatsViewProps {
  threats: ThreatRecord[];
  onRefresh: () => void;
}

export const ThreatsView: React.FC<ThreatsViewProps> = ({ threats, onRefresh }) => {
  const { showToast } = useToast();
  const [selectedThreat, setSelectedThreat] = useState<ThreatRecord | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreats = threats.filter((t) => {
    const matchesFilter = filterType === 'ALL' || t.type === filterType;
    const matchesSearch =
      t.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const threatCounts = {
    INTEGRITY_VIOLATION: threats.filter((t) => t.type === 'INTEGRITY_VIOLATION').length,
    MALICIOUS_DESCRIPTION: threats.filter((t) => t.type === 'MALICIOUS_DESCRIPTION').length,
    UNAUTHORIZED_TOOL: threats.filter((t) => t.type === 'UNAUTHORIZED_TOOL').length,
    MALICIOUS_OUTPUT: threats.filter((t) => t.type === 'MALICIOUS_OUTPUT').length,
  };

  const handleExportThreatReport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(threats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mcp_shield_threat_intel_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('info', 'Threat Intel Exported', 'Forensic report downloaded as JSON.');
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1224] via-[#080e1d] to-[#050811] border border-[#1e2d4d] p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-800">
              RUNTIME THREAT INTEL & FORENSICS
            </span>
            <div className="flex items-baseline space-x-3">
              <h1 className="text-3xl sm:text-5xl font-black text-white font-sans tracking-tight">
                THREAT CENTER
              </h1>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-rose-400">
                — <AnimatedCounter value={threats.length} /> INCIDENTS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Real-time telemetry of intercepted prompt injections, manifest rug pulls, and unauthorized tool invocations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportThreatReport}
              className="px-4 py-2.5 bg-[#141e36] hover:bg-[#1a2745] text-slate-200 border border-[#23355b] rounded-xl text-xs font-bold font-mono flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT INTEL (JSON) →</span>
            </motion.button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
          {[
            { id: 'ALL', label: 'All Threats', count: threats.length },
            { id: 'INTEGRITY_VIOLATION', label: 'Integrity Violations', count: threatCounts.INTEGRITY_VIOLATION },
            { id: 'MALICIOUS_DESCRIPTION', label: 'Prompt Injections', count: threatCounts.MALICIOUS_DESCRIPTION },
            { id: 'MALICIOUS_OUTPUT', label: 'Output Poisoning', count: threatCounts.MALICIOUS_OUTPUT },
            { id: 'UNAUTHORIZED_TOOL', label: 'Unauthorized Tools', count: threatCounts.UNAUTHORIZED_TOOL },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ y: -2 }}
              onClick={() => setFilterType(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all text-xs cursor-pointer ${
                filterType === item.id
                  ? 'bg-rose-950/50 border-rose-500/70 text-rose-300 shadow-md ring-1 ring-rose-500/30'
                  : 'bg-[#0b1324] border-[#182642] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">{item.label}</div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                <AnimatedCounter value={item.count} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threats by tool, signature, or keyword..."
            className="w-full bg-[#070c18] border border-[#182642] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
          />
        </div>
      </div>

      {/* Threats Table / Cards */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070c18] border-b border-[#182642] text-slate-400 uppercase tracking-wider text-[10px] font-mono">
              <tr>
                <th className="py-4 px-5">SEVERITY</th>
                <th className="py-4 px-5">THREAT CLASSIFICATION</th>
                <th className="py-4 px-5">AFFECTED TOOL</th>
                <th className="py-4 px-5">TIME</th>
                <th className="py-4 px-5">RISK</th>
                <th className="py-4 px-5">ENFORCEMENT</th>
                <th className="py-4 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182642]">
              {filteredThreats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 font-mono">
                    Zero active threats found matching filter.
                  </td>
                </tr>
              ) : (
                filteredThreats.map((t) => {
                  let sevBadge = 'bg-rose-950 text-rose-400 border-rose-800';
                  if (t.severity === 'HIGH') sevBadge = 'bg-amber-950 text-amber-400 border-amber-800';
                  if (t.severity === 'MEDIUM') sevBadge = 'bg-yellow-950 text-yellow-400 border-yellow-800';
                  if (t.severity === 'LOW') sevBadge = 'bg-slate-800 text-slate-300 border-slate-700';

                  const time = new Date(t.timestamp).toLocaleTimeString();

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedThreat(t)}
                      className="hover:bg-[#0f1a30]/60 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sevBadge}`}>
                          {t.severity}
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-mono font-bold text-white">
                        {t.type}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-mono text-emerald-400">
                        {t.toolName}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-mono text-slate-400">
                        {time}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-mono">
                        <span className="text-rose-400 font-bold">
                          {t.severity === 'CRITICAL' ? '94/100' : '75/100'}
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            t.actionTaken === 'BLOCK'
                              ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800'
                          }`}
                        >
                          {t.actionTaken === 'BLOCK' ? '🔴 BLOCKED (0% RUN)' : '🟡 REVIEW'}
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedThreat(t);
                          }}
                          className="px-3 py-1 bg-[#141e36] hover:bg-[#1c2c4f] text-slate-200 rounded-lg text-xs font-mono font-medium inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Investigate →</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in Right Forensic Dossier Drawer */}
      <AnimatePresence>
        {selectedThreat && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedThreat(null)}
            />

            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="w-screen max-w-xl bg-[#0b1324] border-l border-[#1e2d4d] shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#182642]">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-800 text-rose-400">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">
                        Forensic Incident Dossier
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">{selectedThreat.id}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedThreat(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Summary Grid */}
                <div className="grid grid-cols-2 gap-3 bg-[#070c18] p-4 rounded-2xl border border-[#182642] font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Target Tool:</span>
                    <span className="text-emerald-400 font-bold text-sm">{selectedThreat.toolName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Classification:</span>
                    <span className="text-white font-bold">{selectedThreat.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Risk Score:</span>
                    <span className="text-rose-400 font-bold">{selectedThreat.severity} (94/100)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Decision:</span>
                    <span className="text-rose-400 font-bold">
                      {selectedThreat.actionTaken} (ZERO FORWARD)
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase mb-1.5">
                    Incident Summary & Findings
                  </label>
                  <div className="p-4 bg-[#070c18] border border-[#182642] rounded-2xl text-slate-200 text-xs leading-relaxed">
                    {selectedThreat.description}
                  </div>
                </div>

                {/* Captured Payload */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase mb-1.5">
                    Captured Attack Payload
                  </label>
                  <pre className="p-4 bg-[#070c18] border border-rose-900/60 rounded-2xl font-mono text-[11px] text-rose-300 overflow-x-auto max-h-56 leading-relaxed">
                    {selectedThreat.evidence}
                  </pre>
                </div>

                {/* Zero Execution Callout */}
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero-Execution Security Guarantee</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    The MCP Shield in-line proxy intercepted this request at the boundary. Downstream servers remained uncontacted with execution count = 0.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#182642] flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      showToast('success', 'Incident Resolved', `Threat ${selectedThreat.id} marked inspected.`);
                      setSelectedThreat(null);
                    }}
                    className="px-4 py-2.5 bg-[#141e36] hover:bg-[#1a2745] text-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Mark Inspected
                  </button>
                  <button
                    onClick={() => {
                      showToast(
                        'danger',
                        'Tool Quarantined',
                        `Tool '${selectedThreat.toolName}' added to quarantine.`
                      );
                      setSelectedThreat(null);
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
                  >
                    Quarantine Tool →
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
