'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Edit3,
  Shield,
  Save,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentPolicy, ApprovalRequest } from '@/types';
import { formatFingerprint } from '@/lib/security/fingerprint';
import { useToast } from './ToastContext';

const FALLBACK_POLICIES: AgentPolicy[] = [
  {
    agentId: 'ResearchAgent',
    agentName: 'Research & Intelligence Agent',
    role: 'ANALYST',
    allowedTools: ['file_reader', 'search_tool', 'report_generator'],
    reviewRequiredTools: ['email_sender'],
    blockedTools: ['destructive_tool', 'bash_executor', 'credential_dumper'],
    maxRiskThreshold: 60,
    allowDynamicUpdates: false,
  },
  {
    agentId: 'AdminAgent',
    agentName: 'System Administrator Agent',
    role: 'ADMIN',
    allowedTools: ['file_reader', 'search_tool', 'report_generator', 'email_sender'],
    reviewRequiredTools: ['destructive_tool'],
    blockedTools: ['credential_dumper'],
    maxRiskThreshold: 85,
    allowDynamicUpdates: true,
  },
  {
    agentId: 'CustomerSupportAgent',
    agentName: 'Customer Support Bot',
    role: 'SUPPORT',
    allowedTools: ['search_tool', 'report_generator'],
    reviewRequiredTools: ['email_sender'],
    blockedTools: ['file_reader', 'destructive_tool', 'bash_executor'],
    maxRiskThreshold: 40,
    allowDynamicUpdates: false,
  },
];

const KNOWN_TOOLS = [
  { id: 'file_reader', name: 'file_reader', capability: 'read-only' },
  { id: 'report_generator', name: 'report_generator', capability: 'write' },
  { id: 'search_tool', name: 'search_tool', capability: 'read-only' },
  { id: 'email_sender', name: 'email_sender', capability: 'exfiltration-capable' },
  { id: 'destructive_tool', name: 'destructive_tool', capability: 'destructive' },
  { id: 'bash_executor', name: 'bash_executor', capability: 'destructive' },
  { id: 'credential_dumper', name: 'credential_dumper', capability: 'exfiltration-capable' },
];

interface PoliciesViewProps {
  policies?: AgentPolicy[];
  pendingApprovals?: ApprovalRequest[];
  onRefresh?: () => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies: propPolicies,
  pendingApprovals: propApprovals,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'policies' | 'approvals'>('policies');
  const [policies, setPolicies] = useState<AgentPolicy[]>(
    propPolicies && propPolicies.length > 0 ? propPolicies : FALLBACK_POLICIES
  );
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>(
    propApprovals || []
  );
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // Policy Editing State
  const [editingPolicy, setEditingPolicy] = useState<AgentPolicy | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/policies');
      if (res.ok) {
        const data = await res.json();
        if (data.policies && data.policies.length > 0) {
          setPolicies(data.policies);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch policies from API:', e);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.policies && data.policies.length > 0) {
          setPolicies(data.policies);
        }
        if (data.pendingApprovals) {
          setPendingApprovals(data.pendingApprovals);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch dashboard data:', e);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchDashboardData();
    const interval = setInterval(() => {
      if (!editingPolicy) {
        fetchPolicies();
        fetchDashboardData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [editingPolicy]);

  useEffect(() => {
    if (propPolicies && propPolicies.length > 0) {
      setPolicies(propPolicies);
    }
  }, [propPolicies]);

  useEffect(() => {
    if (propApprovals) {
      setPendingApprovals(propApprovals);
    }
  }, [propApprovals]);

  const handleApprovalDecision = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setDecidingId(approvalId);
    try {
      const res = await fetch('/api/shield/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          decision,
          decidedBy: 'SecOps Lead Admin',
        }),
      });

      if (res.ok) {
        showToast(
          decision === 'APPROVED' ? 'success' : 'danger',
          `Request ${decision}`,
          `Approval ${approvalId} processed by SecOps Lead.`
        );
        fetchDashboardData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Approval decision error:', err);
      showToast('danger', 'Approval Error', 'Failed to process decision.');
    } finally {
      setDecidingId(null);
    }
  };

  const handleEditClick = (policy: AgentPolicy) => {
    setEditingPolicy(JSON.parse(JSON.stringify(policy)));
  };

  const handleSavePolicy = async () => {
    if (!editingPolicy) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: editingPolicy.agentId,
          agentName: editingPolicy.agentName,
          role: editingPolicy.role,
          allowedTools: editingPolicy.allowedTools,
          reviewRequiredTools: editingPolicy.reviewRequiredTools,
          blockedTools: editingPolicy.blockedTools,
          maxRiskThreshold: editingPolicy.maxRiskThreshold,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('success', 'Policy Saved', `Updated access matrix for ${editingPolicy.agentName}`);
        if (data.policies && Array.isArray(data.policies)) {
          setPolicies(data.policies);
        } else if (data.policy) {
          setPolicies((prev) =>
            prev.map((p) => (p.agentId === data.policy.agentId ? data.policy : p))
          );
        }
        setEditingPolicy(null);
        if (onRefresh) onRefresh();
        fetchPolicies();
      } else {
        const data = await res.json();
        showToast('danger', 'Save Failed', data.error || 'Could not update policy');
      }
    } catch (err: any) {
      showToast('danger', 'Error', err.message || 'Network error saving policy');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleToolInState = (toolName: string, category: 'allowed' | 'review' | 'blocked') => {
    if (!editingPolicy) return;

    let allowed = [...editingPolicy.allowedTools];
    let review = [...editingPolicy.reviewRequiredTools];
    let blocked = [...editingPolicy.blockedTools];

    // Remove tool from all categories first
    allowed = allowed.filter((t) => t !== toolName);
    review = review.filter((t) => t !== toolName);
    blocked = blocked.filter((t) => t !== toolName);

    // Add to the selected category
    if (category === 'allowed') {
      allowed.push(toolName);
    } else if (category === 'review') {
      review.push(toolName);
    } else if (category === 'blocked') {
      blocked.push(toolName);
    }

    setEditingPolicy({
      ...editingPolicy,
      allowedTools: allowed,
      reviewRequiredTools: review,
      blockedTools: blocked,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2 font-mono">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>AGENT ACCESS POLICIES & RBAC GATE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define Agent-to-Tool RBAC matrices, configure risk thresholds, and review pending human-in-the-loop authorizations.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex bg-[#070c18] border border-[#182642] rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agent RBAC Matrix ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Review Queue</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Review Queue Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Pending Authorization Requests ({pendingApprovals.length})</span>
          </h2>

          {pendingApprovals.length === 0 ? (
            <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <div>All pending tool reviews resolved. Zero items in queue.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.map((req) => (
                <motion.div
                  key={req.id}
                  whileHover={{ y: -2 }}
                  className="bg-[#0b1324] border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white font-mono">{req.toolName}</span>
                          <span className="px-2 py-0.5 text-[10px] bg-[#070c18] text-slate-300 font-mono rounded">
                            v{req.version}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Requested By: {req.requestedBy}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 rounded font-mono">
                        APPROVAL REQ.
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-[#070c18] border border-[#182642] rounded-xl text-xs text-slate-300">
                      <div className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase">
                        Reason for Pause:
                      </div>
                      <div>{req.changesSummary}</div>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-slate-400">
                      Proposed Fingerprint:{' '}
                      <span className="text-slate-300">
                        {formatFingerprint(req.proposedFingerprint, true)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#182642] flex items-center justify-end space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApprovalDecision(req.id, 'REJECTED')}
                      disabled={decidingId === req.id}
                      className="px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApprovalDecision(req.id, 'APPROVED')}
                      disabled={decidingId === req.id}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Trust</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Policies Matrix Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Configured Agent RBAC Matrices</span>
            </h2>
            <button
              onClick={() => {
                fetchPolicies();
                showToast('info', 'Synced', 'Policies refreshed from live store.');
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {policies.map((pol) => (
              <motion.div
                key={pol.agentId}
                whileHover={{ y: -2 }}
                className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-white text-sm">{pol.agentName}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {pol.agentId}</div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#070c18] text-emerald-400 rounded font-mono border border-emerald-900/50">
                      {pol.role}
                    </span>
                  </div>

                  {/* Allowed Tools */}
                  <div className="mt-4 space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ALLOWED TOOLS ({pol.allowedTools.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pol.allowedTools.length === 0 ? (
                        <span className="text-[10px] text-slate-500">None</span>
                      ) : (
                        pol.allowedTools.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-[#070c18] border border-emerald-900/50 text-emerald-300 text-[10px] font-mono rounded"
                          >
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Review Required Tools */}
                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] font-semibold text-amber-400 flex items-center space-x-1 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      <span>REQUIRES APPROVAL ({pol.reviewRequiredTools.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pol.reviewRequiredTools.length === 0 ? (
                        <span className="text-[10px] text-slate-500">None</span>
                      ) : (
                        pol.reviewRequiredTools.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-[#070c18] border border-amber-900/50 text-amber-300 text-[10px] font-mono rounded"
                          >
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Blocked Tools */}
                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] font-semibold text-rose-400 flex items-center space-x-1 font-mono">
                      <XCircle className="w-3 h-3" />
                      <span>BLOCKED TOOLS ({pol.blockedTools.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pol.blockedTools.length === 0 ? (
                        <span className="text-[10px] text-slate-500">None</span>
                      ) : (
                        pol.blockedTools.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-[#070c18] border border-rose-900/50 text-rose-300 text-[10px] font-mono rounded"
                          >
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#182642] space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Max Risk Threshold:</span>
                    <span className={`font-bold ${pol.maxRiskThreshold > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pol.maxRiskThreshold}/100
                    </span>
                  </div>

                  <button
                    onClick={() => handleEditClick(pol)}
                    className="w-full py-1.5 bg-[#070c18] hover:bg-emerald-950/40 border border-[#1e2d4d] hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 rounded-xl text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit RBAC Policy</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Edit Modal */}
      <AnimatePresence>
        {editingPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#182642] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Edit RBAC Matrix: {editingPolicy.agentName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Agent ID: {editingPolicy.agentId} | Role: {editingPolicy.role}
                  </p>
                </div>
                <button
                  onClick={() => setEditingPolicy(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Max Risk Threshold Slider */}
              <div className="bg-[#070c18] border border-[#182642] p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-semibold flex items-center space-x-1">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Max Risk Threshold</span>
                  </span>
                  <span className="text-emerald-400 font-bold">{editingPolicy.maxRiskThreshold}/100</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={editingPolicy.maxRiskThreshold}
                  onChange={(e) =>
                    setEditingPolicy({
                      ...editingPolicy,
                      maxRiskThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Any tool call resulting in a combined risk score exceeding this threshold is automatically blocked or held for review.
                </p>
              </div>

              {/* Tool Matrix Selection */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Tool Permission Assignments
                </div>
                <div className="space-y-2">
                  {KNOWN_TOOLS.map((tool) => {
                    const isAllowed = editingPolicy.allowedTools.includes(tool.name);
                    const isReview = editingPolicy.reviewRequiredTools.includes(tool.name);
                    const isBlocked = editingPolicy.blockedTools.includes(tool.name);

                    return (
                      <div
                        key={tool.id}
                        className="bg-[#070c18] border border-[#182642] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-mono font-bold text-white flex items-center space-x-2">
                            <span>{tool.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-700 text-slate-400 rounded">
                              {tool.capability}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 text-xs font-mono">
                          <button
                            type="button"
                            onClick={() => toggleToolInState(tool.name, 'allowed')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              isAllowed
                                ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/50'
                                : 'bg-[#0b1324] border border-[#1e2d4d] text-slate-400 hover:text-white'
                            }`}
                          >
                            Allow
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleToolInState(tool.name, 'review')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              isReview
                                ? 'bg-amber-600 text-slate-950 font-bold shadow-sm shadow-amber-900/50'
                                : 'bg-[#0b1324] border border-[#1e2d4d] text-slate-400 hover:text-white'
                            }`}
                          >
                            Require Review
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleToolInState(tool.name, 'blocked')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              isBlocked
                                ? 'bg-rose-600 text-white font-bold shadow-sm shadow-rose-900/50'
                                : 'bg-[#0b1324] border border-[#1e2d4d] text-slate-400 hover:text-white'
                            }`}
                          >
                            Block
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#182642]">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="px-4 py-2 bg-[#070c18] border border-[#182642] hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePolicy}
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Policy'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

