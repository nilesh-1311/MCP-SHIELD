import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ToolsPanel from './components/ToolsPanel';
import ChatView from './components/ChatView';
import LogViewer from './components/LogViewer';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState({ connected: false, serverPath: '', error: null });
  const [tools, setTools] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);

  // Check backend & MCP connection status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        fetchTools();
      }
    } catch (err) {
      setStatus({
        connected: false,
        serverPath: '',
        error: 'Backend API server unreachable (localhost:3005)'
      });
    }
  };

  // Fetch available tools from MCP server
  const fetchTools = async () => {
    setToolsLoading(true);
    try {
      const res = await fetch('/api/tools');
      const data = await res.json();
      if (data.tools) {
        setTools(data.tools);
      }
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    } finally {
      setToolsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reconnect', { method: 'POST' });
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        await fetchTools();
      }
    } catch (err) {
      console.error('Reconnect failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTool = async (toolName, toolArgs) => {
    setLoading(true);
    try {
      const res = await fetch('/api/call-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, arguments: toolArgs })
      });
      const data = await res.json();

      // Add to log trail
      const newLog = {
        time: new Date().toLocaleTimeString(),
        toolName,
        status: data.status || (data.success ? 'ALLOWED' : 'BLOCKED'),
        reason: data.reason || data.error || 'Execution completed'
      };
      setLogs((prev) => [newLog, ...prev]);

      return data;
    } catch (err) {
      const errorLog = {
        time: new Date().toLocaleTimeString(),
        toolName,
        status: 'BLOCKED',
        reason: `Network/Proxy Error: ${err.message}`
      };
      setLogs((prev) => [errorLog, ...prev]);
      return { status: 'BLOCKED', reason: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle human-in-the-loop approval decision (Approve / Reject)
  const handleApproveDecision = async (requestId, approved) => {
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approved })
      });
      const data = await res.json();

      // Log decision to security audit trail
      const decisionLog = {
        time: new Date().toLocaleTimeString(),
        toolName: 'human_approval',
        status: data.status || (approved ? 'ALLOWED' : 'BLOCKED'),
        reason: data.result || data.reason || `Human decision: ${approved ? 'APPROVED' : 'REJECTED'}`
      };
      setLogs((prev) => [decisionLog, ...prev]);

      return data;
    } catch (err) {
      console.error('Approval request failed:', err);
      return {
        status: approved ? 'ALLOWED' : 'BLOCKED',
        result: approved ? 'Human approval granted. Action executed.' : 'Human approval rejected.',
        reason: err.message
      };
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header status={status} loading={loading} onReconnect={handleReconnect} />

      {/* Red Connection Error Banner */}
      {!status.connected && (
        <div className="error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertOctagon size={18} />
            <span>
              <strong>MCP Server Connection Failed:</strong> {status.error || 'Unable to connect to Stdio MCP Server.'}
            </span>
          </div>
          <button
            onClick={handleReconnect}
            style={{
              background: 'var(--status-blocked)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.25rem 0.65rem',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* Tools Panel */}
          <ToolsPanel
            tools={tools}
            loading={toolsLoading}
            onSelectTool={(tool) => {
              let defaultArgs = { filepath: '/reports/sales.txt' };
              if (tool.name === 'report_generator') defaultArgs = { topic: 'Security Audit' };
              if (tool.name === 'email_sender') defaultArgs = { recipient: 'admin@company.com', subject: 'Alert', body: 'Test notification' };
              handleExecuteTool(tool.name, defaultArgs);
            }}
          />

          {/* Audit Log Panel */}
          <LogViewer logs={logs} />
        </aside>

        {/* Main Content Chat View */}
        <main className="content-area">
          <ChatView
            onExecuteTool={handleExecuteTool}
            onApproveDecision={handleApproveDecision}
            loading={loading}
            isConnected={status.connected}
          />
        </main>
      </div>
    </div>
  );
}
