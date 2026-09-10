'use client';

import { useState, useEffect } from 'react';
import { SecurityEvent, MCPToolExecuteResponse } from '@/types';

export interface LiveStreamPayload {
  event: SecurityEvent;
  execution?: MCPToolExecuteResponse;
  timestamp: string;
}

type Listener = (payload: {
  events: SecurityEvent[];
  latestEvent: LiveStreamPayload | null;
  isConnected: boolean;
}) => void;

// Shared Client-Side Singleton Hub (Only 1 HTTP Connection across all components)
class SSEHub {
  private eventSource: EventSource | null = null;
  private listeners: Set<Listener> = new Set();
  private events: SecurityEvent[] = [];
  private latestEvent: LiveStreamPayload | null = null;
  private isConnected = false;
  private reconnectTimer: any = null;
  private connectDelayTimer: any = null;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Send immediate current state
    listener({
      events: this.events,
      latestEvent: this.latestEvent,
      isConnected: this.isConnected,
    });

    if (this.listeners.size === 1 && typeof window !== 'undefined') {
      // Connect after window has finished initial paint
      if (this.connectDelayTimer) clearTimeout(this.connectDelayTimer);
      this.connectDelayTimer = setTimeout(() => this.connect(), 800);
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({
        events: this.events,
        latestEvent: this.latestEvent,
        isConnected: this.isConnected,
      });
    }
  }

  private connect() {
    if (typeof window === 'undefined' || this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/events/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notify();
      };

      this.eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'INIT' && Array.isArray(parsed.events)) {
            this.events = parsed.events;
            this.notify();
          } else if (parsed.type === 'EVENT' && parsed.data?.event) {
            const streamData: LiveStreamPayload = parsed.data;
            this.latestEvent = streamData;
            this.events = [streamData.event, ...this.events.filter((x) => x.id !== streamData.event.id)].slice(0, 100);
            this.notify();
          }
        } catch (err) {
          console.warn('Failed to parse SSE message:', err);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.disconnect();
        if (this.listeners.size > 0) {
          this.reconnectTimer = setTimeout(() => this.connect(), 5000);
        }
        this.notify();
      };
    } catch {
      this.isConnected = false;
      this.notify();
    }
  }

  private disconnect() {
    if (this.connectDelayTimer) clearTimeout(this.connectDelayTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}

const sseHub = new SSEHub();

export function useShieldEvents(initialEvents: SecurityEvent[] = []) {
  const [events, setEvents] = useState<SecurityEvent[]>(initialEvents);
  const [latestEvent, setLatestEvent] = useState<LiveStreamPayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = sseHub.subscribe((state) => {
      if (state.events.length > 0) {
        setEvents(state.events);
      }
      setLatestEvent(state.latestEvent);
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return { events, latestEvent, isConnected };
}

