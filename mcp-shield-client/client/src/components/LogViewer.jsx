import React from 'react';
import { ShieldAlert, ShieldCheck, Activity } from 'lucide-react';

export default function LogViewer({ logs }) {
  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0 }}>
      <div className="panel-header">
        <div className="panel-title">
          <Activity size={16} color="var(--accent-blue)" />
          Security Audit Trail
        </div>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Real-time
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {(!logs || logs.length === 0) && (
          <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem 0' }}>
            No security logs recorded yet. Execute a tool call to monitor enforcement.
          </div>
        )}

        {logs &&
          logs.map((log, index) => {
            const isBlocked = log.status === 'BLOCKED';
            return (
              <div
                key={index}
                style={{
                  background: isBlocked ? 'var(--status-blocked-bg)' : 'var(--status-allowed-bg)',
                  border: `1px solid ${isBlocked ? 'var(--status-blocked-border)' : 'var(--status-allowed-border)'}`,
                  borderRadius: '6px',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                    {isBlocked ? (
                      <ShieldAlert size={14} color="var(--status-blocked)" />
                    ) : (
                      <ShieldCheck size={14} color="var(--status-allowed)" />
                    )}
                    <span style={{ color: isBlocked ? 'var(--status-blocked)' : 'var(--status-allowed)' }}>
                      {log.status}
                    </span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                    {log.time}
                  </span>
                </div>
                <div className="font-mono" style={{ color: 'var(--text-main)', fontSize: '0.725rem' }}>
                  tool: <span style={{ color: 'var(--accent-cyan)' }}>{log.toolName}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.reason}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
