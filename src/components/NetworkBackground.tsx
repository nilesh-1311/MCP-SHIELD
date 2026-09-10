'use client';

import React, { useEffect, useRef } from 'react';

interface NetworkBackgroundProps {
  threatsActive?: number;
  securityScore?: number;
}

export const NetworkBackground: React.FC<NetworkBackgroundProps> = ({
  threatsActive = 0,
  securityScore = 98,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle / Node network
    const numNodes = Math.min(36, Math.floor(width / 45));
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseColor: string;
      pulse: number;
      pulseSpeed: number;
    }> = [];

    const isAlert = threatsActive > 0;

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 1,
        baseColor: isAlert && i % 4 === 0 ? '#f43f5e' : '#10b981',
        pulse: Math.random() * Math.PI,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      });
    }

    // Packet pulses traveling along edges
    const packets: Array<{
      fromIdx: number;
      toIdx: number;
      progress: number;
      speed: number;
      color: string;
    }> = [];

    const addPacket = () => {
      if (nodes.length < 2) return;
      const fromIdx = Math.floor(Math.random() * nodes.length);
      let toIdx = Math.floor(Math.random() * nodes.length);
      if (toIdx === fromIdx) toIdx = (fromIdx + 1) % nodes.length;

      packets.push({
        fromIdx,
        toIdx,
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        color: isAlert && Math.random() > 0.6 ? '#f43f5e' : '#38bdf8',
      });
    };

    let packetInterval = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(30, 45, 77, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        node.pulse += node.pulseSpeed;
        const currentAlpha = 0.25 + Math.sin(node.pulse) * 0.15;

        // Draw connections between nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.18;
            ctx.strokeStyle =
              isAlert && (i % 4 === 0 || j % 4 === 0)
                ? `rgba(244, 63, 94, ${lineAlpha})`
                : `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.baseColor;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Spawn periodic packet pulses
      packetInterval++;
      if (packetInterval % 75 === 0 && packets.length < 12) {
        addPacket();
      }

      // Update & render packets
      for (let p = packets.length - 1; p >= 0; p--) {
        const pkt = packets[p];
        pkt.progress += pkt.speed;

        const from = nodes[pkt.fromIdx];
        const to = nodes[pkt.toIdx];

        if (from && to && pkt.progress <= 1) {
          const px = from.x + (to.x - from.x) * pkt.progress;
          const py = from.y + (to.y - from.y) * pkt.progress;

          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = pkt.color;
          ctx.shadowColor = pkt.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          packets.splice(p, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [threatsActive, securityScore]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full opacity-45" />
      {/* Deep atmospheric ambient radial gradients */}
      <div className="absolute -top-40 left-1/4 w-[650px] h-[650px] bg-emerald-500/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-sky-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-indigo-500/6 rounded-full blur-[180px] pointer-events-none" />
      {threatsActive > 0 && (
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none transition-opacity duration-1000 animate-pulse" />
      )}
    </div>
  );
};
