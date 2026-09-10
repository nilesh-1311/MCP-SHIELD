import { NextRequest } from 'next/server';
import { shieldEventBus } from '@/lib/events/eventBus';
import { db } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected message & latest 20 events
      const initialEvents = db.getSecurityEvents(20);
      const initPayload = JSON.stringify({
        type: 'INIT',
        events: initialEvents,
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`data: ${initPayload}\n\n`));

      // 2. Subscribe to real-time events on shieldEventBus
      const unsubscribe = shieldEventBus.onShieldEvent((eventData) => {
        try {
          const payload = JSON.stringify({
            type: 'EVENT',
            data: eventData,
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error('Error sending SSE event:', err);
        }
      });

      // 3. Heartbeat ping every 15 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
