'use client';

import React, { useState } from 'react';
import {
  FileCode,
  ShieldCheck,
  Plus,
  RefreshCw,
  Code,
  CheckCircle2,
  Lock,
  Eye,
  XCircle,
  AlertTriangle,
  Search,
  Server,
  Layers,
  Copy,
  Check,
  ChevronRight,
  Database,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCPToolDefinition } from '@/types';
import { formatFingerprint } from '@/lib/security/fingerprint';
import { useToast } from './ToastContext';

interface ToolRegistryProps {
  tools: MCPToolDefinition[];
  onRefresh: () => void;
}

export const ToolRegistryView: React.FC<ToolRegistryProps> = ({ tools, onRefresh }) => {
  const { showToast } = useToast();
  const [selectedTool, setSelectedTool] = useState<MCPToolDefinition | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Tool Form State
  const [newToolName, setNewToolName] = useState('');
  const [newToolVersion, setNewToolVersion] = useState('1.0.0');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolPermissions, setNewToolPermissions] = useState('filesystem:read_approved');
  const [newToolRisk, setNewToolRisk] = useState('SAFE');

  // Update Tool Form State
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');
  const [updateAuthor, setUpdateAuthor] = useState('Lead Developer <developer@enterprise.internal>');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.author || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegisterTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newToolName,
          version: newToolVersion,
          description: newToolDesc,
          permissions: newToolPermissions.split(',').map((s) => s.trim()),
          riskClassification: newToolRisk,
        }),
      });
      if (res.ok) {
        setShowRegisterModal(false);
        setNewToolName('');
        setNewToolDesc('');
        showToast('success', 'Tool Registered', `Tool '${newToolName}' registered with SHA-256 fingerprint baseline.`);
        onRefresh();
      }
    } catch (err) {
      console.error('Error registering tool:', err);
      showToast('danger', 'Registration Error', 'Failed to register tool.');
    }
  };

  const handleUpdateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const res = await fetch('/api/tools/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTool.name,
          version: updateVersion || selectedTool.version,
          description: updateDesc || selectedTool.description,
          approvedBy: updateAuthor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUpdateError(data.error || 'Failed to update tool');
        showToast('danger', 'Update Rejected', data.error || 'Failed to update tool');
      } else {
        setUpdateSuccess(data.message);
        showToast('success', 'Tool Baseline Updated', `Version ${updateVersion || selectedTool.version} approved.`);
        setTimeout(() => {
          setShowUpdateModal(false);
          onRefresh();
        }, 1000);
      }
    } catch (err: any) {
      setUpdateError(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFingerprint(true);
    showToast('info', 'Copied to Clipboard', 'SHA-256 fingerprint hash copied.');
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1224] via-[#080e1d] to-[#050811] border border-[#1e2d4d] p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800">
              CRYPTOGRAPHIC FINGERPRINT REGISTRY
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-sans tracking-tight">
              TOOL REGISTRY & BASANCE
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Deterministic SHA-256 signatures, JSON schema validation, and authenticated developer update gates.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowRegisterModal(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono tracking-wide flex items-center space-x-2 shadow-xl shadow-emerald-950/60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>REGISTER NEW MCP TOOL →</span>
            </motion.button>
          </div>
        </div>

        {/* Visual Story: Legitimate Version Evolution Pipeline */}
        <div className="mt-8 pt-6 border-t border-[#182642] space-y-2">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Legitimate Developer Evolution Lifecycle:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono text-center">
            <div className="p-2.5 bg-[#070c18] border border-emerald-900/50 rounded-xl text-emerald-400">
              <span className="block font-bold">1. v1.0 BASELINE</span>
              <span className="text-[9px] text-slate-400">Trusted</span>
            </div>
            <div className="p-2.5 bg-[#070c18] border border-[#182642] rounded-xl text-slate-300">
              <span className="block font-bold">2. DEV UPDATE</span>
              <span className="text-[9px] text-slate-400">Code edited</span>
            </div>
            <div className="p-2.5 bg-[#070c18] border border-amber-900/50 rounded-xl text-amber-400">
              <span className="block font-bold">3. NEW HASH</span>
              <span className="text-[9px] text-slate-400">Drift detected</span>
            </div>
            <div className="p-2.5 bg-[#070c18] border border-sky-900/50 rounded-xl text-sky-400">
              <span className="block font-bold">4. SEC REVIEW</span>
              <span className="text-[9px] text-slate-400">Human in loop</span>
            </div>
            <div className="p-2.5 bg-[#070c18] border border-emerald-900/50 rounded-xl text-emerald-400">
              <span className="block font-bold">5. SIGNATURE</span>
              <span className="text-[9px] text-slate-400">Verified</span>
            </div>
            <div className="p-2.5 bg-[#070c18] border border-emerald-500/50 rounded-xl text-emerald-300 bg-emerald-950/40 font-bold">
              <span className="block">6. v1.1 TRUSTED</span>
              <span className="text-[9px] text-emerald-400">Enforced</span>
            </div>
          </div>
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
            placeholder="Search verified tools by name, description, or author..."
            className="w-full bg-[#070c18] border border-[#182642] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono shrink-0">
          Showing <span className="text-emerald-400 font-bold">{filteredTools.length}</span> Verified Tools
        </span>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTools.map((tool) => (
          <motion.div
            key={tool.id}
            whileHover={{ y: -3 }}
            onClick={() => setSelectedTool(tool)}
            className="bg-[#0b1324] border border-[#182642] hover:border-[#2b416e] rounded-3xl p-6 shadow-xl transition-colors flex flex-col justify-between cursor-pointer space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shadow-md">
                    MCP
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{tool.name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                      <span>v{tool.version}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">{tool.trustLevel}</span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {tool.status}
                </span>
              </div>

              <p className="mt-3.5 text-xs text-slate-300 leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#141f36]">
              {/* Fingerprint preview */}
              <div className="flex items-center justify-between p-2.5 bg-[#070c18] rounded-xl border border-[#141f36] text-[10px] font-mono">
                <span className="text-slate-500">SHA-256:</span>
                <span className="text-emerald-400 font-bold truncate max-w-[240px]">
                  {tool.trustedFingerprint ? tool.trustedFingerprint.slice(0, 28) : 'calculating...'}...
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] text-slate-400">
                    {tool.permissions.length} Scoped Permissions
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTool(tool);
                  }}
                  className="px-3 py-1.5 bg-[#141e36] hover:bg-[#1a2745] text-slate-200 rounded-xl text-xs font-medium flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Manifest →</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Inspect Tool Manifest Modal */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#182642]">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    {selectedTool.name} (v{selectedTool.version})
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">Author: {selectedTool.author || 'SecOps Lead'}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTool(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Fingerprint Full Hash Box */}
              <div className="p-4 bg-[#070c18] border border-[#182642] rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Deterministic Canonical SHA-256 Signature
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedTool.trustedFingerprint)}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 text-[10px]"
                  >
                    {copiedFingerprint ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedFingerprint ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-emerald-400 break-all bg-[#0b1324] p-2.5 rounded-xl border border-[#182642]">
                  {selectedTool.trustedFingerprint}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Registered Manifest Description
                </label>
                <div className="p-3.5 bg-[#070c18] border border-[#182642] rounded-xl text-slate-200 text-xs font-sans leading-relaxed">
                  {selectedTool.description}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Approved Permissions Matrix
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTool.permissions.map((perm, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#070c18] border border-[#182642] text-slate-300 text-[11px]"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Input Schema Preview */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  JSON-RPC Input Schema Specification
                </label>
                <pre className="p-3.5 bg-[#070c18] border border-[#182642] rounded-xl text-[11px] text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedTool.inputSchema, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-[#182642] flex justify-between items-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setUpdateVersion(selectedTool.version);
                  setUpdateDesc(selectedTool.description);
                  setShowUpdateModal(true);
                }}
                className="px-4 py-2.5 bg-[#141e36] hover:bg-[#1a2745] text-slate-200 text-xs font-bold font-mono rounded-xl flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Legitimate Developer Update Gate →</span>
              </motion.button>

              <button
                onClick={() => setSelectedTool(null)}
                className="px-4 py-2 bg-[#0d1629] hover:bg-[#14203b] text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Tool Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRegisterTool}
            className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#182642]">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Register Trusted MCP Tool</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tool Name</label>
                <input
                  type="text"
                  required
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  placeholder="e.g. data_exporter"
                  className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Initial Version</label>
                <input
                  type="text"
                  required
                  value={newToolVersion}
                  onChange={(e) => setNewToolVersion(e.target.value)}
                  className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={newToolDesc}
                  onChange={(e) => setNewToolDesc(e.target.value)}
                  placeholder="Accurate description of what this tool performs..."
                  className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Permissions (comma separated)
                </label>
                <input
                  type="text"
                  value={newToolPermissions}
                  onChange={(e) => setNewToolPermissions(e.target.value)}
                  className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#182642] flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 bg-[#141e36] text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                Save & Calculate Baseline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Legitimate Developer Update Modal */}
      {showUpdateModal && selectedTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateTool}
            className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#182642]">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Legitimate Tool Update: {selectedTool.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {updateError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {updateError}
              </div>
            )}
            {updateSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs">
                {updateSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">New Version</label>
                <input
                  type="text"
                  required
                  value={updateVersion}
                  onChange={(e) => setUpdateVersion(e.target.value)}
                  className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Updated Description</label>
                <textarea
                  required
                  rows={3}
                  value={updateDesc}
                  onChange={(e) => setUpdateDesc(e.target.value)}
                  className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Developer Signature / Approved By
                </label>
                <input
                  type="text"
                  required
                  value={updateAuthor}
                  onChange={(e) => setUpdateAuthor(e.target.value)}
                  className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#182642] flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 bg-[#141e36] text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                Approve & Update Baseline
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
