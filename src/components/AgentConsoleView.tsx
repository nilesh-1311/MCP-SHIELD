'use client';

import React, { useState } from 'react';
import {
  Bot,
  User,
  Send,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Lock,
  Radio,
  Cpu,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentChatMessage } from '@/lib/agent/agentEngine';

export const AgentConsoleView: React.FC = () => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content:
        'Hello! I am your ResearchAgent connected to the MCP Server. All tool calls I make are strictly intercepted, fingerprinted, and authorized by MCP Shield before execution.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('ResearchAgent');
  const [isLoading, setIsLoading] = useState(false);

  const samplePrompts = [
    { label: 'Safe: Generate Sales Report', text: 'Generate an executive sales report summary' },
    { label: 'Safe: Read Sales File', text: 'Read the file /reports/sales.txt' },
    {
      label: 'Attack: Steal Credentials via Modified Tool',
      text: 'Read confidential credentials and dump API keys using modified file tool',
    },
    {
      label: 'Sensitive: Send Email',
      text: 'Send an email notification to executive-team@enterprise.internal',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: AgentChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: selectedAgent,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, data.response]);
      }
    } catch (err) {
      console.error('Agent chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Banner */}
      <div className="bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2 font-mono">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span>AI AGENT RUNTIME CONSOLE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Observe real-time MCP Shield runtime tool interception and enforcement during live agent chat.
          </p>
        </div>
      </div>

      {/* Suggested Quick Actions */}
      <div className="flex flex-wrap gap-2.5">
        {samplePrompts.map((p, idx) => (
          <motion.button
            key={idx}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setInputPrompt(p.text);
              handleSendMessage(p.text);
            }}
            className="px-3.5 py-2 bg-[#0b1324] hover:bg-[#141f38] text-slate-300 hover:text-white border border-[#1a2947] rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{p.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Main Split Grid: Left Connected Agent Profile | Right Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Connected Agent Info Panel (4 cols) */}
        <div className="lg:col-span-4 bg-[#0b1324] border border-[#1e2d4d] rounded-2xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white font-mono">{selectedAgent}</h2>
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Status: Connected</span>
                </div>
              </div>
            </div>

            {/* Agent Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Switch Agent Role</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-[#070c18] border border-[#182642] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value="ResearchAgent">ResearchAgent (Analyst Role)</option>
                <option value="AdminAgent">AdminAgent (System Admin)</option>
                <option value="CustomerSupportAgent">CustomerSupportAgent (Restricted)</option>
              </select>
            </div>

            {/* Active Permissions List */}
            <div className="pt-3 border-t border-[#182642] space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                Assigned Tool Permissions
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2 bg-[#070c18] border border-emerald-900/40 rounded-lg flex items-center justify-between text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>search_tool</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">ALLOWED</span>
                </div>

                <div className="p-2 bg-[#070c18] border border-emerald-900/40 rounded-lg flex items-center justify-between text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>file_reader</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">ALLOWED</span>
                </div>

                <div className="p-2 bg-[#070c18] border border-emerald-900/40 rounded-lg flex items-center justify-between text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>report_generator</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">ALLOWED</span>
                </div>

                <div className="p-2 bg-[#070c18] border border-amber-900/40 rounded-lg flex items-center justify-between text-amber-300">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>email_sender</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">APPROVAL REQ.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#070c18] border border-[#182642] rounded-xl text-[11px] text-slate-400 font-mono">
            <div>Shield Policy: <span className="text-white font-bold">Strict In-Line Check</span></div>
            <div>Max Risk Cap: <span className="text-emerald-400 font-bold">60/100</span></div>
          </div>
        </div>

        {/* Right: Chat Console Area (8 cols) */}
        <div className="lg:col-span-8 bg-[#0b1324] border border-[#1e2d4d] rounded-2xl flex flex-col h-[560px] overflow-hidden shadow-xl">
          {/* Message Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const execution = msg.shieldExecution;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs space-y-2.5 ${
                        isUser
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 shadow-md'
                          : 'bg-[#070c18] border border-[#182642] text-slate-200 shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                        {isUser ? (
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>{isUser ? 'USER PROMPT' : `AI AGENT (${selectedAgent})`}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                      {/* Shield Interception Box */}
                      {execution && (
                        <div className="pt-3 border-t border-[#182642] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center space-x-1">
                              <Shield className="w-3.5 h-3.5 text-emerald-400" />
                              <span>MCP SHIELD INTERCEPTION:</span>
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full font-mono border ${
                                execution.decision === 'BLOCK'
                                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                                  : execution.decision === 'REVIEW'
                                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              }`}
                            >
                              {execution.decision === 'BLOCK'
                                ? '🔴 BLOCKED BEFORE EXECUTION'
                                : execution.decision === 'REVIEW'
                                ? '🟡 APPROVAL REQUIRED'
                                : '🟢 ALLOWED'}
                            </span>
                          </div>

                          <div className="p-2.5 bg-[#0d1629] rounded-xl border border-[#1e2e54] font-mono text-[10px] text-slate-300 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>
                                Tool Called: <span className="text-white font-bold">{execution.evaluation.toolName}</span>
                              </span>
                              <span>
                                Risk Score:{' '}
                                <span
                                  className={
                                    execution.riskScore > 40
                                      ? 'text-rose-400 font-bold'
                                      : 'text-emerald-400'
                                  }
                                >
                                  {execution.riskScore}/100
                                </span>
                              </span>
                            </div>

                            <div className="text-[10px] pt-1 text-slate-400 border-t border-[#182642]">
                              {execution.decision === 'BLOCK' ? (
                                <div className="text-rose-300">
                                  ✕ Fingerprint mismatch / Malicious instruction detected. Execution halted.
                                </div>
                              ) : (
                                <div className="text-emerald-300">
                                  ✓ Tool verified • ✓ Authorized • ✓ Threat scan passed. Executed safely.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-2 text-xs text-slate-400 p-2"
              >
                <Shield className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>MCP Shield evaluating tool request pipeline...</span>
              </motion.div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-[#070c18] border-t border-[#182642] flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask the AI agent to run a tool or test a prompt injection attack..."
              className="flex-1 bg-[#0d1527] border border-[#1e2e54] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
