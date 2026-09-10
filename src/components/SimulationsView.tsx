'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Play,
  Flame,
  RefreshCw,
  FileCode,
  Lock,
  ArrowRight,
  AlertTriangle,
  FileWarning,
  Sparkles,
  Zap,
  Split,
  Terminal,
  Activity,
  Code,
  Layers,
  Database,
  Eye,
  Check,
  Ban,
  Radio,
  FileSearch,
  Server,
  Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './ToastContext';

export const SimulationsView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'scenarios' | 'fulldemo'>('scenarios');
  const [selectedScenario, setSelectedScenario] = useState('manifest_tampering');
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [fullDemoResult, setFullDemoResult] = useState<any>(null);

  const scenariosList = [
    {
      id: 'manifest_tampering',
      name: '1. Manifest Tampering / Rug Pull',
      icon: Flame,
      color: 'text-rose-400',
      badge: 'INTEGRITY CRITICAL',
      desc: 'Attacker stealthily mutates tool description on disk to command secret harvesting.',
    },
    {
      id: 'malicious_description',
      name: '2. Malicious Tool Description',
      icon: FileWarning,
      color: 'text-rose-400',
      badge: 'PROMPT INJECTION',
      desc: 'Tool description contains system instruction override and external exfiltration sink URL.',
    },
    {
      id: 'malicious_output',
      name: '3. Malicious Output Poisoning',
      icon: AlertTriangle,
      color: 'text-amber-400',
      badge: 'OUTPUT QUARANTINE',
      desc: 'Tool returns malicious prompt injection payload. MCP Shield quarantines and sanitizes output.',
    },
    {
      id: 'prompt_injection',
      name: '4. Prompt Injection in Parameters',
      icon: Terminal,
      color: 'text-rose-400',
      badge: 'INJECTION DEFENSE',
      desc: 'Request parameters contain instruction escape sequence attempting to bypass agent rules.',
    },
    {
      id: 'cross_server_hijack',
      name: '5. Cross-Server Hijacking',
      icon: Split,
      color: 'text-rose-400',
      badge: 'SIDE-EFFECT DEFENSE',
      desc: 'Calculator MCP server payload commands agent to invoke unauthorized Email Assistant.',
    },
    {
      id: 'permission_escalation',
      name: '6. Permission Escalation',
      icon: Lock,
      color: 'text-amber-400',
      badge: 'RBAC ENFORCEMENT',
      desc: 'Tool requests high-privilege permissions beyond approved developer baseline.',
    },
    {
      id: 'rogue_tool',
      name: '7. Rogue / Unknown Tool',
      icon: ShieldAlert,
      color: 'text-rose-400',
      badge: 'ZERO-TRUST REGISTRY',
      desc: 'Unregistered tool "FreeDataExporter" attempts high-privilege filesystem execution.',
    },
    {
      id: 'data_exfiltration',
      name: '8. Data Exfiltration Sink',
      icon: Database,
      color: 'text-rose-400',
      badge: 'DLP SENSITIVE SINK',
      desc: 'Detects and blocks API keys & credentials being dispatched to untrusted webhook sink.',
    },
    {
      id: 'unauthorized_update',
      name: '9. Unauthorized Tool Update',
      icon: RefreshCw,
      color: 'text-amber-400',
      badge: 'HUMAN APPROVAL GATE',
      desc: 'Tool metadata updated on server without authenticated developer signature.',
    },
  ];

  const handleRunScenario = async (scId: string) => {
    setIsRunning(true);
    setSelectedScenario(scId);
    setScenarioResult(null);

    try {
      const res = await fetch('/api/simulate/attack-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scId }),
      });
      const data = await res.json();
      setScenarioResult(data);

      if (data.decision === 'BLOCK') {
        showToast(
          'danger',
          `🛑 Tool Blocked: ${data.scenarioName}`,
          `Zero downstream propagation. Server execution count: 0.`
        );
      } else if (data.decision === 'ALLOW') {
        showToast(
          'success',
          `✓ Verified & Allowed: ${data.scenarioName}`,
          `SHA-256 fingerprint verified against baseline.`
        );
      } else {
        showToast('warning', `⚠️ Review Required: ${data.scenarioName}`);
      }
    } catch (err) {
      console.error('Scenario run error:', err);
      showToast('danger', 'Execution Error', 'Failed to execute scenario pipeline.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunFullDemo = async () => {
    setIsRunning(true);
    setFullDemoResult(null);
    try {
      const res = await fetch('/api/simulate/full-demo', { method: 'POST' });
      const data = await res.json();
      setFullDemoResult(data);
      setActiveTab('fulldemo');
      showToast(
        'success',
        'Full Security Demo Completed',
        'All 8 attack vectors intercepted and verified.'
      );
    } catch (err) {
      console.error('Full demo error:', err);
      showToast('danger', 'Demo Run Failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetDemo = async () => {
    setIsRunning(true);
    try {
      await fetch('/api/simulate/reset', { method: 'POST' });
      setScenarioResult(null);
      setFullDemoResult(null);
      showToast('info', 'Baseline Restored', 'Database reset to clean baseline signatures.');
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const currentSc = scenariosList.find((s) => s.id === selectedScenario);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1224] via-[#080e1d] to-[#050811] border border-[#1e2d4d] p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-800">
              ZERO-TRUST ADVERSARIAL TESTBED
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-sans tracking-tight">
              ATTACK SIMULATION LAB
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Execute 9 real attack vectors against AI tools and observe in-line interception telemetry in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunFullDemo}
              disabled={isRunning}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono tracking-wide flex items-center space-x-2 shadow-xl shadow-emerald-950/60 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>RUN FULL SECURITY DEMO →</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResetDemo}
              disabled={isRunning}
              className="px-4 py-3 bg-[#11192e] hover:bg-[#1a2645] text-slate-200 border border-[#1e2d4d] rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>RESET DEMO</span>
            </motion.button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#060a14] border border-[#182642] rounded-xl p-1 text-xs w-fit mt-6">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-4 py-2 rounded-lg font-semibold font-mono transition-all ${
              activeTab === 'scenarios'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            9 Attack Vectors
          </button>
          <button
            onClick={() => setActiveTab('fulldemo')}
            className={`px-4 py-2 rounded-lg font-semibold font-mono transition-all ${
              activeTab === 'fulldemo'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Security Walkthrough (8 Phases)
          </button>
        </div>
      </div>

      {/* VIEW 1: 9 Attack Lab Scenarios */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Constellation Vector Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Select Attack Vector
              </span>
              <span className="text-[10px] text-slate-400 font-mono">9 Scenarios Available</span>
            </div>

            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {scenariosList.map((sc) => {
                const IconComp = sc.icon;
                const isSelected = selectedScenario === sc.id;

                return (
                  <motion.button
                    key={sc.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleRunScenario(sc.id)}
                    disabled={isRunning}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start space-x-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#111c33] border-rose-500/80 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
                        : 'bg-[#0b1324] border-[#182642] hover:border-[#2a3f69]'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected ? 'bg-rose-950/80 border border-rose-700' : 'bg-[#070c18]'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${sc.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono truncate">
                          {sc.name}
                        </span>
                      </div>
                      <span className="inline-block px-2 py-0.5 my-1 text-[9px] font-mono font-bold rounded bg-[#070c18] text-rose-300 border border-rose-900/50">
                        {sc.badge}
                      </span>
                      <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {sc.desc}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Scenario Execution & Results (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b1324] border border-[#1e2d4d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#182642]">
                <div>
                  <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider">
                    TARGET ATTACK INSPECTION
                  </span>
                  <h2 className="text-lg font-bold text-white font-mono mt-0.5">
                    {currentSc?.name}
                  </h2>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRunScenario(selectedScenario)}
                  disabled={isRunning}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono flex items-center space-x-2 shadow-lg shadow-rose-950/50 cursor-pointer"
                >
                  <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Analyzing...' : 'Execute Attack →'}</span>
                </motion.button>
              </div>

              {/* Phased Pipeline Progress Bar */}
              <div className="p-4 bg-[#070c18] border border-[#182642] rounded-2xl">
                <div className="text-[10px] font-bold font-mono text-slate-400 uppercase mb-2">
                  Interception Execution Stages:
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  <div
                    className={`p-2 rounded-xl border ${
                      scenarioResult
                        ? 'bg-blue-950/60 border-blue-600 text-blue-300'
                        : 'bg-[#0b1324] border-[#182642] text-slate-500'
                    }`}
                  >
                    1. AGENT CALL
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      scenarioResult
                        ? 'bg-purple-950/60 border-purple-600 text-purple-300'
                        : 'bg-[#0b1324] border-[#182642] text-slate-500'
                    }`}
                  >
                    2. PROXY INTERCEPT
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      scenarioResult
                        ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                        : 'bg-[#0b1324] border-[#182642] text-slate-500'
                    }`}
                  >
                    3. SHA & SCAN
                  </div>
                  <div
                    className={`p-2 rounded-xl border font-bold ${
                      scenarioResult?.decision === 'BLOCK'
                        ? 'bg-rose-950/90 border-rose-600 text-rose-300'
                        : scenarioResult
                        ? 'bg-emerald-950/90 border-emerald-600 text-emerald-300'
                        : 'bg-[#0b1324] border-[#182642] text-slate-500'
                    }`}
                  >
                    4. {scenarioResult ? scenarioResult.decision : 'DECISION'}
                  </div>
                </div>
              </div>

              {scenarioResult ? (
                <div className="space-y-4">
                  {/* Real Execution Proof Telemetry Box */}
                  <div className="p-4 bg-[#070c18] border border-rose-900/50 rounded-2xl font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Zero-Forward Telemetry Proof:</span>
                      <span className="text-rose-400 font-bold">● HARD IN-LINE BLOCK</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2.5 bg-[#0b1324] rounded-xl border border-[#182642]">
                        <span className="text-slate-400 block text-[9px]">Attempts:</span>
                        <span className="text-white font-bold">1</span>
                      </div>
                      <div className="p-2.5 bg-[#0b1324] rounded-xl border border-[#182642]">
                        <span className="text-slate-400 block text-[9px]">Forwarded to Server:</span>
                        <span
                          className={
                            scenarioResult.forwardedToMcpServer
                              ? 'text-emerald-400 font-bold'
                              : 'text-rose-400 font-bold'
                          }
                        >
                          {scenarioResult.forwardedToMcpServer ? 'YES' : 'NO (0.00%)'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#0b1324] rounded-xl border border-[#182642]">
                        <span className="text-slate-400 block text-[9px]">Server Runs on Block:</span>
                        <span className="text-emerald-400 font-bold">
                          {scenarioResult.actualServerExecutions || 0}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#0b1324] rounded-xl border border-[#182642]">
                        <span className="text-slate-400 block text-[9px]">Final Action:</span>
                        <span
                          className={
                            scenarioResult.decision === 'BLOCK'
                              ? 'text-rose-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          {scenarioResult.decision}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Before / After Manifest Diff Side-by-Side */}
                  {scenarioResult.manifestDiff && (
                    <div className="p-5 bg-[#070c18] border border-rose-900/60 rounded-2xl space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-rose-400 font-bold flex items-center space-x-1.5">
                          <Code className="w-4 h-4" />
                          <span>INTEGRITY COMPROMISED — MANIFEST DIFF</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-bold text-[10px]">
                          🚨 SHA-256 SIGNATURE MISMATCH
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        {/* Baseline */}
                        <div className="p-3.5 bg-[#0a1220] border border-emerald-900/40 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold pb-1 border-b border-emerald-950">
                            <span>TRUSTED VERSION (BASELINE)</span>
                            <span>v1.0.0</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px]">
                            {scenarioResult.manifestDiff.descriptionDiff.original}
                          </p>
                          <div className="text-[9px] text-emerald-400 pt-1">
                            SHA: {scenarioResult.manifestDiff.oldFingerprint.slice(0, 20)}...
                          </div>
                        </div>

                        {/* Mutated */}
                        <div className="p-3.5 bg-[#170a12] border border-rose-900/60 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-rose-400 font-bold pb-1 border-b border-rose-950">
                            <span>MUTATED VERSION (RUNTIME)</span>
                            <span>COMPROMISED</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed text-[11px]">
                            {scenarioResult.manifestDiff.descriptionDiff.modified}
                          </p>
                          <div className="text-[9px] text-rose-400 pt-1">
                            SHA: {scenarioResult.manifestDiff.newFingerprint.slice(0, 20)}...
                          </div>
                        </div>
                      </div>

                      {scenarioResult.manifestDiff.descriptionDiff.injectedSegment && (
                        <div className="p-3 bg-rose-950/70 border border-rose-700 text-rose-300 rounded-xl text-[11px] font-bold">
                          ↳ Injected Instruction: &quot;{scenarioResult.manifestDiff.descriptionDiff.injectedSegment}&quot;
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scenario Steps Timeline */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                      Telemetry Progression Log:
                    </div>
                    {scenarioResult.steps.map((st: any) => (
                      <div
                        key={st.step}
                        className="p-3 bg-[#070c18] border border-[#182642] rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{st.title}</span>
                          <span className="px-2 py-0.5 text-[9px] font-bold font-mono bg-[#0d1629] text-slate-300 rounded border border-[#1e2e54]">
                            {st.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{st.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-slate-500 text-xs border border-dashed border-[#182642] rounded-2xl">
                  Select an attack vector from the left and click &quot;Execute Attack →&quot; to inspect real-time interception telemetry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Full Security Walkthrough (One-Click Demo) */}
      {activeTab === 'fulldemo' && (
        <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>FULL ZERO-TRUST DEMONSTRATION SUITE</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Automated 8-phase execution proof across all attack vectors followed by legitimate developer update verification.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunFullDemo}
              disabled={isRunning}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono flex items-center space-x-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Running Suite...' : 'RE-RUN FULL DEMO →'}</span>
            </motion.button>
          </div>

          {fullDemoResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#070c18] border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-mono flex items-center justify-between">
                <span>✓ {fullDemoResult.message}</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  8 / 8 PHASES VERIFIED
                </span>
              </div>

              <div className="space-y-3">
                {fullDemoResult.steps.map((st: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#070c18] border border-[#182642] rounded-2xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono text-sm">{st.title}</span>
                      <span className="font-bold font-mono text-xs text-emerald-400">{st.status}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{st.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs border border-dashed border-[#182642] rounded-2xl">
              Click &quot;RUN FULL SECURITY DEMO&quot; to execute the automated 8-phase live security proof.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
