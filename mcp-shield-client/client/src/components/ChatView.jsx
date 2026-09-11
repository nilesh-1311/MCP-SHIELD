import React, { useState, useEffect } from 'react';
import { Send, Terminal, CheckCircle2, XCircle, Clock, Sparkles, ThumbsUp, ThumbsDown, Mail, AlertTriangle, FileText } from 'lucide-react';

export default function ChatView({ onExecuteTool, onApproveDecision, loading, isConnected }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'system-info',
      text: '⚡ MCP Security Proxy Agent active. Test real-time enforcement: ALLOWED (Green), BLOCKED (Red), or PENDING_APPROVAL (Yellow).'
    }
  ]);

  // Keyword parser mapping typed messages to MCP tool + arguments
  const parsePromptToToolCall = (input) => {
    const text = input.trim().toLowerCase();

    // 1. Check for email intent -> PENDING_APPROVAL
    if (text.includes('email') || text.includes('mail') || text.includes('notify')) {
      return {
        toolName: 'email_sender',
        arguments: {
          recipient: 'admin@company.com',
          subject: 'Security Alert Notification',
          body: input
        }
      };
    }

    // 2. Check for destructive/delete intent -> BLOCKED
    if (text.includes('delete') || text.includes('remove') || text.includes('destroy') || text.includes('drop')) {
      let path = '/data/system.db';
      const pathMatch = input.match(/\/[a-zA-Z0-9_\-\.\/]+/);
      if (pathMatch) path = pathMatch[0];
      return {
        toolName: 'file_reader',
        arguments: { filepath: `delete ${path}` }
      };
    }

    // 3. Check for file reading intent -> ALLOWED file_reader
    if (text.includes('read') || text.includes('file') || text.includes('cat') || text.startsWith('/')) {
      let path = '/reports/sales.txt';
      const pathMatch = input.match(/\/[a-zA-Z0-9_\-\.\/]+/);
      if (pathMatch) path = pathMatch[0];
      return {
        toolName: 'file_reader',
        arguments: { filepath: path }
      };
    }

    // 4. Check for report generator intent -> ALLOWED report_generator
    if (text.includes('report') || text.includes('summary') || text.includes('generate')) {
      return {
        toolName: 'report_generator',
        arguments: { topic: input || 'Quarterly Security Audit' }
      };
    }

    // Default fallback
    return {
      toolName: 'file_reader',
      arguments: { filepath: '/reports/sales.txt' }
    };
  };

  // Automatically poll MCP Shield to check if pending approval cards were approved/rejected remotely
  useEffect(() => {
    const checkPendingApprovals = async () => {
      const pendingMsgs = messages.filter((m) => m.type === 'tool-result' && m.status === 'PENDING_APPROVAL' && !m.decisionMade);
      if (pendingMsgs.length === 0) return;

      for (const msg of pendingMsgs) {
        try {
          const res = await fetch(`/api/check-approval?requestId=${msg.requestId}`);
          const data = await res.json();
          if (data.resolved) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === msg.id) {
                  return {
                    ...m,
                    status: data.status,
                    reason: data.reason || (data.status === 'ALLOWED' ? 'Approved in MCP Shield' : 'Rejected in MCP Shield'),
                    decisionMade: true
                  };
                }
                return m;
              })
            );
          }
        } catch (e) {
          // ignore network polling errors
        }
      }
    };

    const interval = setInterval(checkPendingApprovals, 2000);
    return () => clearInterval(interval);
  }, [messages]);

  const handleSend = async (customPrompt) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim() || loading || !isConnected) return;

    const userMsgId = Date.now().toString();
    const userMsg = { id: userMsgId, type: 'user', text: textToSubmit };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setPrompt('');

    // Parse intent
    const toolCall = parsePromptToToolCall(textToSubmit);

    // Call backend API
    const response = await onExecuteTool(toolCall.toolName, toolCall.arguments);

    // Append system result card
    const systemCard = {
      id: (Date.now() + 1).toString(),
      type: 'tool-result',
      toolName: toolCall.toolName,
      arguments: toolCall.arguments,
      status: response?.status || 'BLOCKED',
      requestId: response?.requestId || `req_${Date.now()}`,
      reason: response?.reason || response?.error || 'Unknown response from security proxy',
      rawText: response?.text || '',
      decisionMade: false
    };

    setMessages((prev) => [...prev, systemCard]);
  };

  // Handle human-in-the-loop Approve or Reject decision for a pending card
  const handleApprovalClick = async (cardId, requestId, approved) => {
    const result = await onApproveDecision(requestId, approved);
    if (!result) return;

    // Update existing pending card in-place
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === cardId) {
          return {
            ...msg,
            status: result.status, // ALLOWED or BLOCKED
            reason: result.result || result.reason || (approved ? 'Approval Granted' : 'Approval Rejected'),
            decisionMade: true
          };
        }
        return msg;
      })
    );
  };

  const presets = [
    { label: '📄 Read /reports/sales.txt', text: 'read file at /reports/sales.txt', type: 'safe' },
    { label: '📊 Generate Security Report', text: 'generate report on Q3 Financial Audit', type: 'safe' },
    { label: '📧 Send Email Alert', text: 'send email to admin@company.com with security alert', type: 'warning' },
    { label: '⚠️ Delete /data/system.db', text: 'delete all files in /data/system.db', type: 'danger' }
  ];

  return (
    <div className="chat-container">
      {/* Messages List */}
      <div className="messages-list">
        {messages.map((msg) => {
          if (msg.type === 'system-info') {
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: 'center',
                  background: 'rgba(0, 242, 254, 0.05)',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  color: 'var(--accent-cyan)',
                  padding: '0.65rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={14} />
                {msg.text}
              </div>
            );
          }

          if (msg.type === 'user') {
            return (
              <div key={msg.id} className="chat-bubble-user">
                {msg.text}
              </div>
            );
          }

          if (msg.type === 'tool-result') {
            const isAllowed = msg.status === 'ALLOWED';
            const isBlocked = msg.status === 'BLOCKED';
            const isPending = msg.status === 'PENDING_APPROVAL';

            const cardClass = isAllowed ? 'allowed' : isBlocked ? 'blocked' : 'pending';

            return (
              <div key={msg.id} className={`system-card ${cardClass}`}>
                {/* Card Header */}
                <div className="card-header">
                  <div className="card-title">
                    <Terminal size={16} />
                    <span>MCP Tool Call: {msg.toolName}</span>
                  </div>
                  <span className={`badge ${cardClass}`}>
                    {isAllowed && <CheckCircle2 size={12} />}
                    {isBlocked && <XCircle size={12} />}
                    {isPending && <Clock size={12} />}
                    {isPending ? 'PENDING APPROVAL' : msg.status}
                  </span>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.35rem', fontWeight: 600 }}>
                      ARGUMENTS PASSED (STDIO PROTOCOL):
                    </div>
                    <pre className="args-box">{JSON.stringify(msg.arguments, null, 2)}</pre>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.35rem', fontWeight: 600 }}>
                      SECURITY PIPELINE DECISION & REASON:
                    </div>
                    <div className={`reason-box ${cardClass}`}>
                      {msg.reason}
                    </div>
                  </div>

                  {/* Human-in-the-Loop Action Buttons for PENDING_APPROVAL */}
                  {isPending && !msg.decisionMade && (
                    <div className="approval-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApprovalClick(msg.id, msg.requestId, true)}
                      >
                        <ThumbsUp size={14} />
                        Approve Action
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleApprovalClick(msg.id, msg.requestId, false)}
                      >
                        <ThumbsDown size={14} />
                        Reject Action
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Input Area */}
      <div className="input-area">
        {/* Preset Chips */}
        <div className="presets-container">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: '0.25rem' }}>
            DEMO SCENARIOS:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              className={`preset-chip ${preset.type === 'danger' ? 'danger' : preset.type === 'warning' ? 'warning' : ''}`}
              onClick={() => handleSend(preset.text)}
              disabled={loading || !isConnected}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input Row */}
        <div className="input-row">
          <input
            type="text"
            className="chat-input"
            placeholder={
              isConnected
                ? "Type a command e.g. 'read file /reports/sales.txt', 'send email to admin', or 'delete /data'..."
                : "MCP Server offline. Reconnect to send messages..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading || !isConnected}
          />
          <button
            className="send-btn"
            onClick={() => handleSend()}
            disabled={loading || !isConnected || !prompt.trim()}
          >
            <Send size={16} />
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
