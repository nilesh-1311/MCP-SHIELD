'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  Unlock,
  Key,
  Flame,
  Check,
  Copy,
  Link as LinkIcon,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SecurityEvent, AuditChainVerificationResult } from '@/types';
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<AuditChainVerificationResult | null>(null);

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

  // Run cryptographic verification on the audit chain
  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      if (res.ok) {
        const result: AuditChainVerificationResult = await res.json();
        setVerificationResult(result);
        if (result.valid) {
          showToast(
            'success',
            'Audit Chain Verified',
            `All ${result.totalEntries} events cryptographically intact. Zero tampering detected.`
          );
        } else {
          showToast(
            'danger',
            'Tampering Detected!',
            result.reason || `Chain broken at entry index #${result.brokenIndex}`
          );
        }
      }
    } catch (err: any) {
      console.error('Failed to verify audit chain:', err);
      showToast('danger', 'Verification Failed', err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Simulate unauthorized database modification
  const handleSimulateTamper = async () => {
    setIsTampering(true);
    try {
      const res = await fetch('/api/audit/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tamper' }),
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data.verification);
        await fetchAllEvents(false);
        showToast(
          'warning',
          'Database Row Tampered',
          `Direct database modification simulated on event ${data.tamperedEventId}. Verify chain to inspect broken link.`
        );
      }
    } catch (err: any) {
      console.error('Tamper simulation error:', err);
      showToast('danger', 'Tamper Error', err.message);
    } finally {
      setIsTampering(false);
    }
  };

  // Restore clean cryptographic baseline
  const handleRestoreBaseline = async () => {
    try {
      const res = await fetch('/api/audit/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data.verification);
        await fetchAllEvents(false);
        showToast('success', 'Baseline Restored', 'Re-established valid cryptographic hash chain.');
      }
    } catch (err: any) {
      console.error('Restore error:', err);
    }
  };

  // Initial verification on mount
  useEffect(() => {
    handleVerifyChain();
  }, []);

  // Sync with prop
  React.useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setLogEvents(initialEvents);
    }
  }, [initialEvents]);

  // Periodic auto-polling every 3.5 seconds
  React.useEffect(() => {
    fetchAllEvents(false);
    const interval = setInterval(() => {
      fetchAllEvents(false);
    }, 3500);
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
      (e.agentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.entryHash || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDecision = selectedDecision === 'ALL' || e.decision === selectedDecision;

    return matchesSearch && matchesDecision;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 1800);
    showToast('info', 'Hash Copied', 'SHA-256 block hash copied to clipboard.');
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
    showToast('info', 'Export Successful', 'Audit logs exported as JSON with cryptographic hashes.');
  };

  const exportLogsAsCsv = () => {
    const headers = ['Timestamp', 'Agent', 'Tool', 'Decision', 'RiskScore', 'EntryHash', 'PrevHash', 'Reason'];
    const rows = logEvents.map((e) => [
      `"${e.timestamp}"`,
      `"${e.agentId}"`,
      `"${e.toolName}"`,
      `"${e.decision}"`,
      `"${e.riskScore}"`,
      `"${e.entryHash || ''}"`,
      `"${e.prevHash || ''}"`,
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
    <div className="space-y-6">
      {/* 2. CRYPTOGRAPHIC HASH CHAIN INTEGRITY PROOF BANNER */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 transition-all shadow-xl ${
          verificationResult?.valid
            ? 'bg-gradient-to-r from-emerald-950/40 via-[#07181c]/60 to-[#070c18] border-emerald-500/40 shadow-emerald-950/20'
            : verificationResult && !verificationResult.valid
            ? 'bg-gradient-to-r from-rose-950/60 via-[#1e0d16]/70 to-[#070c18] border-rose-500/60 shadow-rose-950/30 animate-pulse'
            : 'bg-[#0b1324] border-[#1e2d4d]'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`p-2.5 rounded-xl border ${
                verificationResult?.valid
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                  : verificationResult && !verificationResult.valid
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {verificationResult?.valid ? (
                <ShieldCheck className="w-6 h-6" />
              ) : verificationResult && !verificationResult.valid ? (
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold tracking-wider text-white">
                  {verificationResult?.valid
                    ? 'CRYPTOGRAPHIC AUDIT CHAIN VERIFIED • ZERO TAMPERING DETECTED'
                    : verificationResult && !verificationResult.valid
                    ? '🚨 AUDIT LOG TAMPERING DETECTED • CHAIN BROKEN'
                    : 'TAMPER-EVIDENT HASH CHAIN'}
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                    verificationResult?.valid
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : verificationResult && !verificationResult.valid
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-600 text-slate-300'
                  }`}
                >
                  {verificationResult?.valid ? 'SHA-256 Intact' : verificationResult ? 'Integrity Failed' : 'Ready'}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 max-w-2xl font-sans">
                {verificationResult?.valid
                  ? `Every audit log entry is mathematically bound to its preceding entry via SHA-256(canonicalPayload + prevHash). All ${verificationResult.totalEntries} events verified from genesis zero-block.`
                  : verificationResult && !verificationResult.valid
                  ? verificationResult.reason || 'Cryptographic signature mismatch found in sequence!'
                  : 'Deterministic hash chaining prevents unauthorized post-facto database tampering, deletions, or insertions.'}
              </p>

              {verificationResult?.valid && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-slate-400">
                  <span>Genesis: <span className="text-slate-200">0000000000000000...</span></span>
                  <span>•</span>
                  <span>Latest Tip: <span className="text-emerald-300">{verificationResult.latestHash.substring(0, 16)}...</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'VERIFYING...' : 'VERIFY INTEGRITY'}</span>
            </motion.button>

            {verificationResult?.valid ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSimulateTamper}
                disabled={isTampering}
                className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>SIMULATE DB TAMPER</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRestoreBaseline}
                className="px-3 py-2 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RESTORE BASELINE</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Forensic Tamper Detail Box */}
        {verificationResult && !verificationResult.valid && (
          <div className="mt-4 p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl text-xs font-mono text-rose-200 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-rose-300">
              <AlertTriangle className="w-4 h-4" />
              <span>FORENSIC TAMPER ANALYSIS:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Corrupted Entry Index:</span>
                <span className="text-white font-bold">#{verificationResult.brokenIndex} (ID: {verificationResult.brokenEventId})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Failure Reason:</span>
                <span className="text-rose-300">{verificationResult.reason}</span>
              </div>
              {verificationResult.expectedHash && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[10px]">Expected SHA-256 Hash:</span>
                  <span className="text-emerald-400 break-all">{verificationResult.expectedHash}</span>
                </div>
              )}
              {verificationResult.actualHash && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[10px]">Actual Altered Hash in Record:</span>
                  <span className="text-rose-400 break-all">{verificationResult.actualHash}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tool name, agent ID, hash or violation..."
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
                <th className="py-4 px-5">HASH POINTER</th>
                <th className="py-4 px-5">RISK</th>
                <th className="py-4 px-5 text-right">DECISION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182642]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 font-mono">
                    No audit records matching search filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, idx) => {
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
                          <span className={evt.eventType === 'HONEYPOT_TRIGGERED' ? 'text-rose-400 flex items-center space-x-1' : ''}>
                            {evt.eventType === 'HONEYPOT_TRIGGERED' && <Flame className="w-3 h-3 text-rose-400 inline mr-1" />}
                            {evt.toolName}
                          </span>
                        </td>
                        <td className="py-4 px-5 max-w-xs truncate text-slate-300">
                          {evt.reason}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap font-mono text-[10px]">
                          {evt.entryHash ? (
                            <span className="px-2 py-0.5 rounded bg-[#070c18] border border-[#182642] text-sky-400 font-mono">
                              🔗 {evt.entryHash.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-slate-600">Pending</span>
                          )}
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
                          <td colSpan={8} className="p-6">
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

                              {/* Cryptographic Hash Chain Box */}
                              <div className="p-3.5 bg-[#070c18] rounded-xl border border-sky-900/50 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-sky-400 font-bold flex items-center space-x-1.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>CRYPTOGRAPHIC SHA-256 IMMUTABILITY PROOF</span>
                                  </span>
                                  <span className="text-[9px] text-slate-500">Block Sequence: Chain Node</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                  <div className="space-y-1">
                                    <span className="text-slate-500 block">Current Block Hash (entry_hash):</span>
                                    <div className="flex items-center justify-between p-2 bg-[#050811] rounded border border-[#182642]">
                                      <span className="text-emerald-300 truncate font-mono select-all">
                                        {evt.entryHash || 'Computed in realtime'}
                                      </span>
                                      {evt.entryHash && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(evt.entryHash!, `entry_${evt.id}`);
                                          }}
                                          className="text-slate-400 hover:text-white p-1 ml-1"
                                        >
                                          {copiedHash === `entry_${evt.id}` ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-500 block">Parent Block Pointer (prev_hash):</span>
                                    <div className="flex items-center justify-between p-2 bg-[#050811] rounded border border-[#182642]">
                                      <span className="text-slate-300 truncate font-mono select-all">
                                        {evt.prevHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                                      </span>
                                      {evt.prevHash && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(evt.prevHash!, `prev_${evt.id}`);
                                          }}
                                          className="text-slate-400 hover:text-white p-1 ml-1"
                                        >
                                          {copiedHash === `prev_${evt.id}` ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                                <div className="p-3 bg-[#070c18] rounded-xl border border-[#182642]">
                                  <span className="text-slate-500 block text-[9px]">Event Type:</span>
                                  <span className={`font-bold ${evt.eventType === 'HONEYPOT_TRIGGERED' ? 'text-rose-400' : 'text-white'}`}>
                                    {evt.eventType}
                                  </span>
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
