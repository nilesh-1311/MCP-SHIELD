import { EventEmitter } from 'events';
import { SecurityEvent, MCPToolExecuteResponse } from '@/types';

class ShieldEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  public emitShieldEvent(event: SecurityEvent, execution?: MCPToolExecuteResponse) {
    this.emit('mcp-shield:events', {
      event,
      execution,
      timestamp: new Date().toISOString(),
    });
  }

  public onShieldEvent(listener: (data: { event: SecurityEvent; execution?: MCPToolExecuteResponse; timestamp: string }) => void) {
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
