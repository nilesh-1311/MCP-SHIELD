import React from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function Header({ status, loading, onReconnect }) {
  const isConnected = status?.connected;

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">
          <Shield size={20} />
        </div>
        <div>
          <div className="brand-title">
            MCP SHIELD <span className="brand-badge">Client Agent</span>
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            SOC Tool-Call Enforcement Bridge
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="status-badge">
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`} />
          <span style={{ fontWeight: 600, color: isConnected ? 'var(--status-allowed)' : 'var(--status-blocked)' }}>
            {isConnected ? 'MCP Server: Connected' : 'MCP Server: Offline'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
            ({status?.serverPath ? status.serverPath.split('\\').pop() : 'mcp-shield'})
          </span>
        </div>

        <button
          onClick={onReconnect}
          disabled={loading}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            transition: 'all 0.2s'
          }}
          title="Refresh / Reconnect to MCP Server"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Reconnect
        </button>
      </div>
    </header>
  );
}
