import { EventEmitter } from 'events';
import { SecurityEvent, MCPToolExecuteResponse } from '@/types';
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../supabase/server';

class ShieldEventBus extends EventEmitter {
  private realtimeChannel: any = null;
  private isSubscribedToRealtime = false;

  constructor() {
    super();
    this.setMaxListeners(100);
    this.initRealtimeSubscription();
  }

  private initRealtimeSubscription() {
    if (this.isSubscribedToRealtime || typeof window !== 'undefined') return;
    if (!isSupabaseServerConfigured) return;

    const supabase = getSupabaseServerClient();
    if (!supabase) return;

    try {
      this.realtimeChannel = supabase
        .channel('mcp-shield-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'mcp_security_events' },
          (payload: any) => {
            if (payload.new) {
              const row = payload.new;
              const event: SecurityEvent = {
                id: row.id,
                toolId: row.tool_id,
                toolName: row.tool_name,
                agentId: row.agent_id,
                eventType: row.event_type,
                riskScore: row.risk_score,
                decision: row.decision,
                reason: row.reason,
                details: row.details,
                executed: row.executed,
                timestamp: row.timestamp,
              };
              this.emit('mcp-shield:events', {
                event,
                timestamp: new Date().toISOString(),
                source: 'supabase_realtime',
              });
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribedToRealtime = true;
            console.log('⚡ [Realtime] Supabase Realtime channel connected for mcp_security_events.');
          }
        });
    } catch (err: any) {
      console.warn('[Realtime] Supabase realtime connection deferred:', err.message);
    }
  }

  public emitShieldEvent(event: SecurityEvent, execution?: MCPToolExecuteResponse) {
    this.emit('mcp-shield:events', {
      event,
      execution,
      timestamp: new Date().toISOString(),
      source: 'local_interceptor',
    });
  }

  public onShieldEvent(listener: (data: { event: SecurityEvent; execution?: MCPToolExecuteResponse; timestamp: string; source?: string }) => void) {
    this.on('mcp-shield:events', listener);
    return () => {
      this.off('mcp-shield:events', listener);
    };
  }
}

// Global singleton across hot reloads in Next.js development
const globalForEvents = globalThis as unknown as {
  shieldEventBus?: ShieldEventBus;
};

export const shieldEventBus = globalForEvents.shieldEventBus ?? new ShieldEventBus();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.shieldEventBus = shieldEventBus;
}
