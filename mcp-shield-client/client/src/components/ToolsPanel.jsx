import React from 'react';
import { Cpu, Terminal, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ToolsPanel({ tools, loading, onSelectTool }) {
  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Cpu size={16} color="var(--accent-cyan)" />
          Available MCP Tools
        </div>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
          [{tools ? tools.length : 0} registered]
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {loading && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            Fetching tools schema from MCP server...
          </div>
        )}

        {!loading && tools && tools.length === 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            No tools reported by connected server.
          </div>
        )}

        {tools &&
          tools.map((tool) => (
            <div
              key={tool.name}
              onClick={() => onSelectTool && onSelectTool(tool)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.65rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  {tool.name}
                </span>
                <ShieldCheck size={14} color="var(--status-allowed)" />
              </div>
              {tool.description && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {tool.description}
                </div>
              )}
              {tool.inputSchema && tool.inputSchema.properties && (
                <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Params: {Object.keys(tool.inputSchema.properties).join(', ') || 'none'}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
