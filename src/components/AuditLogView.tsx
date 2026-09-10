'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Code,
  Shield,
  Clock,
  Terminal,
  Filter,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SecurityEvent } from '@/types';
import { useToast } from './ToastContext';
import { useShieldEvents } from '@/lib/hooks/useShieldEvents';

interface AuditLogViewProps {
  events?: SecurityEvent[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ events: initialEvents }) => {
  const { showToast } = useToast();
  const [logEvents, setLogEvents] = useState<SecurityEvent[]>(initialEvents || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecision, setSelectedDecision] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { latestEvent, isConnected } = useShieldEvents();

  // Fetch directly from /api/events on mount and refresh
  const fetchAllEvents = React.useCallback(async (showNotification = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/events?limit=200');
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          setLogEvents(data.events);
          if (showNotification) {
            showToast('info', 'Logs Refreshed', `Synchronized ${data.events.length} security events.`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Sync with prop
  React.useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setLogEvents(initialEvents);
    }
  }, [initialEvents]);

  // Periodic auto-polling every 2.5 seconds to guarantee live updates
  React.useEffect(() => {
    fetchAllEvents(false);
    const interval = setInterval(() => {
      fetchAllEvents(false);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchAllEvents]);

  // Append/update real-time SSE events immediately
  React.useEffect(() => {
    if (latestEvent?.event) {
      const newEvt = latestEvent.event;
      setLogEvents((prev) => {
        const exists = prev.some((e) => e.id === newEvt.id);
        if (exists) {
          return prev.map((e) => (e.id === newEvt.id ? newEvt : e));
        }
        return [newEvt, ...prev];
      });
    }
  }, [latestEvent]);

  const filteredEvents = logEvents.filter((e) => {
    const matchesSearch =
      (e.toolName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.agentId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDecision = selectedDecision === 'ALL' || e.decision === selectedDecision;

    return matchesSearch && matchesDecision;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const exportLogsAsJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mcp_shield_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('info', 'Export Successful', 'Audit logs exported as JSON.');
  };

  const exportLogsAsCsv = () => {
    const headers = ['Timestamp', 'Agent', 'Tool', 'Decision', 'RiskScore', 'Reason'];
    const rows = logEvents.map((e) => [
      `"${e.timestamp}"`,
      `"${e.agentId}"`,
      `"${e.toolName}"`,
      `"${e.decision}"`,
      `"${e.riskScore}"`,
      `"${(e.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `mcp_shield_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('info', 'Export Successful', 'Audit logs exported as CSV.');
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1224] via-[#080e1d] to-[#050811] border border-[#1e2d4d] p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-950/70 border border-sky-800">
                IMMUTABLE FORENSIC AUDIT TRAIL
              </span>
              <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE FEED ACTIVE</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-sans tracking-tight">
              SECURITY TIMELINE & LOG
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Chronological ledger of every verification, hash evaluation, runtime block, and human approval decision. ({logEvents.length} recorded events)
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchAllEvents(true)}
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-950/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'SYNCING...' : 'REFRESH LOGS'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportLogsAsCsv}
              className="px-4 py-2.5 bg-[#141e36] hover:bg-[#1a2745] text-slate-200 border border-[#23355b] rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV EXPORT</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportLogsAsJson}
              className="px-4 py-2.5 bg-[#141e36] hover:bg-[#1a2745] text-slate-200 border border-[#23355b] rounded-xl text-xs font-bold font-mono flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON EXPORT →</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tool name, agent ID, or violation keyword..."
            className="w-full bg-[#070c18] border border-[#182642] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Decision:</span>
          <select
            value={selectedDecision}
            onChange={(e) => setSelectedDecision(e.target.value)}
            className="bg-[#070c18] border border-[#182642] rounded-xl px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Decisions ({logEvents.length})</option>
            <option value="ALLOW">ALLOWED</option>
            <option value="REVIEW">REVIEW REQUIRED</option>
            <option value="BLOCK">BLOCKED</option>
          </select>
        </div>
      </div>

      {/* Expandable Forensic Timeline Table */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#070c18] border-b border-[#182642] text-slate-400 uppercase tracking-wider text-[10px] font-mono">
              <tr>
                <th className="py-4 px-5 w-10"></th>
                <th className="py-4 px-5">TIMESTAMP</th>
                <th className="py-4 px-5">CALLING AGENT</th>
                <th className="py-4 px-5">TARGET TOOL</th>
                <th className="py-4 px-5">REASON / INCIDENT</th>
                <th className="py-4 px-5">RISK</th>
                <th className="py-4 px-5 text-right">DECISION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182642]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 font-mono">
                    No audit records matching search filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  let badge = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                  if (evt.decision === 'BLOCK') badge = 'bg-rose-950 text-rose-400 border-rose-800';
                  if (evt.decision === 'REVIEW') badge = 'bg-amber-950 text-amber-400 border-amber-800';

                  const date = new Date(evt.timestamp);
                  const timeStr = `${date.toLocaleTimeString()}`;
                  const isExpanded = expandedId === evt.id;

                  return (
                    <React.Fragment key={evt.id}>
                      <tr
                        onClick={() => toggleExpand(evt.id)}
                        className={`hover:bg-[#0f1a30]/60 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-[#0e182e]' : ''
                        }`}
                      >
                        <td className="py-4 px-5 text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-sky-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {timeStr}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap font-mono text-slate-300">
                          {evt.agentId}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap font-mono font-bold text-white">
                          {evt.toolName}
                        </td>
                        <td className="py-4 px-5 max-w-xs truncate text-slate-300">
                          {evt.reason}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap font-mono">
                          <span
                            className={
                              evt.riskScore > 40 ? 'text-rose-400 font-bold' : 'text-slate-400'
                            }
                          >
                            {evt.riskScore}/100
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap text-right">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${badge}`}>
                            {evt.decision}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Forensic Deep-Dive Row */}
                      {isExpanded && (
                        <tr className="bg-[#080e1c] border-b border-[#182642]">
                          <td colSpan={7} className="p-6">
                            <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-5 space-y-4 text-xs font-mono">
                              <div className="flex items-center justify-between pb-3 border-b border-[#182642]">
                                <span className="font-bold text-white flex items-center space-x-2">
                                  <Code className="w-4 h-4 text-sky-400" />
                                  <span>Forensic Record: {evt.id}</span>
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Timestamp: {evt.timestamp}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                                <div className="p-3 bg-[#070c18] rounded-xl border border-[#182642]">
                                  <span className="text-slate-500 block text-[9px]">Event Type:</span>
                                  <span className="text-white font-bold">{evt.eventType}</span>
                                </div>
                                <div className="p-3 bg-[#070c18] rounded-xl border border-[#182642]">
                                  <span className="text-slate-500 block text-[9px]">Forwarded to MCP Server:</span>
                                  <span
                                    className={
                                      evt.decision === 'BLOCK'
                                        ? 'text-rose-400 font-bold'
                                        : 'text-emerald-400 font-bold'
                                    }
                                  >
                                    {evt.decision === 'BLOCK' ? 'NO (0%)' : 'YES'}
                                  </span>
                                </div>
                                <div className="p-3 bg-[#070c18] rounded-xl border border-[#182642]">
                                  <span className="text-slate-500 block text-[9px]">Actual Server Execution:</span>
                                  <span
                                    className={
                                      evt.decision === 'BLOCK'
                                        ? 'text-emerald-400 font-bold'
                                        : 'text-white font-bold'
                                    }
                                  >
                                    {evt.decision === 'BLOCK' ? '0 on Block' : '1 (Allowed)'}
                                  </span>
                                </div>
                                <div className="p-3 bg-[#070c18] rounded-xl border border-[#182642]">
                                  <span className="text-slate-500 block text-[9px]">Evaluation Pipeline:</span>
                                  <span className="text-sky-400 font-bold">SHA-256 + RBAC + PROMPT</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">
                                  Interception Reason & Findings:
                                </span>
                                <div className="p-3 bg-[#070c18] rounded-xl border border-[#182642] text-slate-200 text-xs">
                                  {evt.reason}
                                </div>
                              </div>

                              {evt.details && (
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-1">
                                    Raw Payload Telemetry:
                                  </span>
                                  <pre className="p-3 bg-[#070c18] rounded-xl border border-[#182642] text-slate-300 text-[10px] overflow-x-auto max-h-40">
                                    {JSON.stringify(evt.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
