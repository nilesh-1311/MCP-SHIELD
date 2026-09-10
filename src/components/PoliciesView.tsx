'use client';

import React, { useState } from 'react';
import {
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Shield,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AgentPolicy, ApprovalRequest } from '@/types';
import { formatFingerprint } from '@/lib/security/fingerprint';
import { useToast } from './ToastContext';

interface PoliciesViewProps {
  policies: AgentPolicy[];
  pendingApprovals: ApprovalRequest[];
  onRefresh: () => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  pendingApprovals,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'policies' | 'approvals'>('approvals');
  const [decidingId, setDecidingId] = useState<string | null>(null);

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
        onRefresh();
      }
    } catch (err) {
      console.error('Approval decision error:', err);
      showToast('danger', 'Approval Error', 'Failed to process decision.');
    } finally {
      setDecidingId(null);
    }
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
            <span>AGENT ACCESS POLICIES & APPROVALS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define Agent-to-Tool RBAC matrices and review pending human-in-the-loop authorizations.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex bg-[#070c18] border border-[#182642] rounded-xl p-1 text-xs">
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
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agent RBAC Matrix
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
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Configured Agent RBAC Matrices</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {policies.map((pol) => (
              <motion.div
                key={pol.agentId}
                whileHover={{ y: -2 }}
                className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-sm">{pol.agentName}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#070c18] text-slate-300 rounded font-mono border border-[#182642]">
                      {pol.role}
                    </span>
                  </div>

                  {/* Allowed Tools */}
                  <div className="mt-4 space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ALLOWED TOOLS:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pol.allowedTools.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-[#070c18] border border-emerald-900/50 text-emerald-300 text-[10px] font-mono rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Review Required Tools */}
                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] font-semibold text-amber-400 flex items-center space-x-1 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      <span>REQUIRES APPROVAL:</span>
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
                      <span>BLOCKED TOOLS:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pol.blockedTools.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-[#070c18] border border-rose-900/50 text-rose-300 text-[10px] font-mono rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#182642] text-[11px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Max Risk Threshold:</span>
                  <span className="font-bold text-white">{pol.maxRiskThreshold}/100</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
