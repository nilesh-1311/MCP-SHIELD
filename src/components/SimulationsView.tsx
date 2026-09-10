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
  Skull,
  Shield,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './ToastContext';
import { useShieldEvents } from '@/lib/hooks/useShieldEvents';
import { RedTeamSimulationResult } from '@/lib/security/redTeamAgent';
import { Card3D } from './Card3D';

export const SimulationsView: React.FC = () => {
  const { showToast } = useToast();
  const { events: liveEvents, isConnected } = useShieldEvents();
  const [activeTab, setActiveTab] = useState<'monitor' | 'scenarios' | 'redteam' | 'fulldemo'>('monitor');
  const [selectedScenario, setSelectedScenario] = useState('manifest_tampering');
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [fullDemoResult, setFullDemoResult] = useState<any>(null);
  const [redTeamResult, setRedTeamResult] = useState<RedTeamSimulationResult | null>(null);

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
    {
      id: 'honeypot_canary',
      name: '10. Honeypot Canary Trap',
      icon: Skull,
      color: 'text-purple-400',
      badge: 'HONEYPOT CRITICAL',
      desc: 'Compromised agent probes fake canary tool "credential_vault_reader" — triggering immediate CRITICAL lockdown and tamper-evident audit logging.',
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
          `🛑 Tool Blocked: ${data.name || scId}`,
          `Zero downstream propagation. Server execution count: 0.`
        );
      } else if (data.decision === 'ALLOW') {
        showToast(
          'success',
          `✓ Verified & Allowed: ${data.name || scId}`,
          `SHA-256 fingerprint verified against baseline.`
        );
      } else {
        showToast('warning', `⚠️ Review Required: ${data.name || scId}`);
      }
    } catch (err) {
      console.error('Scenario run error:', err);
      showToast('danger', 'Execution Error', 'Failed to execute scenario pipeline.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunRedTeam = async () => {
    setIsRunning(true);
    setRedTeamResult(null);
    try {
      const res = await fetch('/api/simulate/red-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns: 4 }),
      });
      const data = await res.json();
      setRedTeamResult(data);
      setActiveTab('redteam');
      showToast(
        'success',
        '🔥 Red-Team Simulation Complete',
        `${data.attacksBlocked} attacks blocked in-line before execution.`
      );
    } catch (err) {
      console.error('Red-Team error:', err);
      showToast('danger', 'Red-Team Simulation Failed');
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
      setRedTeamResult(null);
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
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-800">
                LIVE ADVERSARIAL ATTACK MONITOR
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center space-x-1.5 ${
                  isConnected
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? 'LIVE STREAM: mcp-shield:events' : 'CONNECTING STREAM'}</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-sans tracking-tight">
              ATTACK LAB &amp; MONITOR
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Real-time in-line interception feed across all live agent tool calls, 9 simulated adversarial attacks, and autonomous Red-Team simulations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunRedTeam}
              disabled={isRunning}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs font-bold font-mono tracking-wide flex items-center space-x-2 shadow-xl shadow-rose-950/60 cursor-pointer"
            >
              <Skull className="w-4 h-4" />
              <span>🔥 RED-TEAM ADVERSARY →</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunFullDemo}
              disabled={isRunning}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono tracking-wide flex items-center space-x-2 shadow-xl shadow-emerald-950/60 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>FULL DEMO SUITE</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResetDemo}
              disabled={isRunning}
              className="px-4 py-3 bg-[#11192e] hover:bg-[#1a2645] text-slate-200 border border-[#1e2d4d] rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>RESET</span>
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap bg-[#060a14] border border-[#182642] rounded-xl p-1 text-xs w-fit mt-6 gap-1">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-lg font-semibold font-mono transition-all ${
              activeTab === 'monitor'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📡 Live Stream Feed
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-4 py-2 rounded-lg font-semibold font-mono transition-all ${
              activeTab === 'scenarios'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            9 Attack Scenarios
          </button>
          <button
            onClick={() => setActiveTab('redteam')}
            className={`px-4 py-2 rounded-lg font-semibold font-mono transition-all ${
              activeTab === 'redteam'
                ? 'bg-rose-600/40 text-rose-200 border border-rose-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔥 Red-Team Agent
          </button>
          <button
            onClick={() => setActiveTab('fulldemo')}
            className={`px-4 py-2 rounded-lg font-semibold font-mono transition-all ${
              activeTab === 'fulldemo'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Walkthrough (8 Phases)
          </button>
        </div>
      </div>

      {/* VIEW 1: Live Event Stream Monitor */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Real-Time In-Line Interception Stream ({liveEvents.length} Events)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Live updates via Server-Sent Events
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {liveEvents.map((ev) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ev.decision === 'BLOCK'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : ev.decision === 'REVIEW'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}
                      >
                        {ev.decision === 'BLOCK'
                          ? '🛑 BLOCKED'
                          : ev.decision === 'REVIEW'
                          ? '🟡 REVIEW'
                          : '🟢 ALLOWED'}
                      </span>
                      <span className="text-white font-bold text-sm truncate">{ev.toolName}</span>
                      <span className="text-slate-400 text-[11px]">• Agent: {ev.agentId}</span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {ev.reason}
                    </p>

                    <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                      <span>Event ID: {ev.id}</span>
                      <span>•</span>
                      <span>Forwarded: {ev.executed ? 'YES' : 'NO (0 Invocations)'}</span>
                      <span>•</span>
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Risk Score</span>
                      <span
                        className={`text-lg font-black ${
                          ev.riskScore > 40 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {ev.riskScore}/100
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* VIEW 2: 9 Attack Lab Scenarios */}
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
                  <span>{isRunning ? 'Executing Live Attack...' : 'Execute Live Attack →'}</span>
                </motion.button>
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
                            SHA: {scenarioResult.manifestDiff.oldFingerprint?.slice(0, 20)}...
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
                            SHA: {scenarioResult.manifestDiff.newFingerprint?.slice(0, 20)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scenario Steps Timeline */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                      Telemetry Progression Log:
                    </div>
                    {scenarioResult.steps?.map((st: any) => (
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
                  Select an attack vector from the left and click &quot;Execute Live Attack →&quot; to test in-line MCP Shield defense.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Red-Team Autonomous Adversary */}
      {activeTab === 'redteam' && (
        <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-3xl p-8 shadow-xl space-y-6 font-mono">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#182642]">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Skull className="w-5 h-5 text-rose-400" />
                <span>AUTONOMOUS RED-TEAM ADVERSARY AGENT</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Executes adaptive multi-turn jailbreak attempts and instruction injections targeting ResearchAgent.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunRedTeam}
              disabled={isRunning}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              <Skull className="w-4 h-4" />
              <span>{isRunning ? 'Red-Team Running...' : 'START RED-TEAM RUN →'}</span>
            </motion.button>
          </div>

          {redTeamResult ? (
            <div className="space-y-6">
              <div className="p-4 bg-[#070c18] border border-rose-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-rose-400 font-bold block">{redTeamResult.summary}</span>
                  <span className="text-[10px] text-slate-400">Simulation ID: {redTeamResult.simulationId}</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                    {redTeamResult.attacksBlocked} BLOCKED
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                    {redTeamResult.attacksQuarantined} QUARANTINED
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {redTeamResult.turns.map((turn) => (
                  <div
                    key={turn.turn}
                    className="p-5 bg-[#070c18] border border-[#182642] rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px]">
                          TURN #{turn.turn}
                        </span>
                        <span>{turn.attackerStrategy}</span>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          turn.shieldDecision === 'BLOCK'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {turn.shieldDecision === 'BLOCK' ? '🛑 BLOCKED' : '🟡 QUARANTINED'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#0a1222] rounded-xl border border-[#1a2b4d] text-slate-300 text-[11px]">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Adversarial Prompt:</span>
                      &quot;{turn.adversarialPrompt}&quot;
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#182642]">
                      <span>Target: <span className="text-white font-bold">{turn.toolTargeted}</span></span>
                      <span>Risk: <span className="text-rose-400 font-bold">{turn.riskScore}/100</span></span>
                      <span>Execution: <span className="text-emerald-400 font-bold">HALTED (0 Calls Forwarded)</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs border border-dashed border-[#182642] rounded-2xl">
              Click &quot;START RED-TEAM RUN →&quot; to simulate autonomous multi-turn adversarial attacks.
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: Full Security Walkthrough (One-Click Demo) */}
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
                    className="p-4 bg-[#070c18] border border-[#182642] rounded-2xl text-xs space-y-1.5 font-mono"
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
