'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface NetworkBackgroundProps {
  threatsActive?: number;
  securityScore?: number;
}

export const NetworkBackground: React.FC<NetworkBackgroundProps> = ({
  threatsActive = 0,
  securityScore = 98,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  // Mouse coordinates for 3D parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 60, damping: 25 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Background 3D Parallax transforms
  const bgTranslateX = useTransform(smoothX, [-0.5, 0.5], ['20px', '-20px']);
  const bgTranslateY = useTransform(smoothY, [-0.5, 0.5], ['20px', '-20px']);
  const bgRotateX = useTransform(smoothY, [-0.5, 0.5], ['4deg', '-4deg']);
  const bgRotateY = useTransform(smoothX, [-0.5, 0.5], ['-4deg', '4deg']);

  useEffect(() => {
    let ticking = false;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          const xPct = e.clientX / width - 0.5;
          const yPct = e.clientY / height - 0.5;

          mouseX.set(xPct);
          mouseY.set(yPct);
          if (spotlightRef.current) {
            spotlightRef.current.style.background = `radial-gradient(650px circle at ${e.clientX}px ${e.clientY}px, rgba(56, 189, 248, 0.12), transparent 80%)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

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

    // Dynamic Nodes Constellation
    const numNodes = Math.min(48, Math.floor(width / 35));
    const isAlert = threatsActive > 0;

    const nodes: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      pulse: number;
      pulseSpeed: number;
      tag?: string;
    }> = [];

    const tags = ['SHA-256', '0x8F4A', 'MCP:OK', 'GATEWAY', 'RBAC', 'INTEGRITY', 'TRUST_V2'];

    for (let i = 0; i < numNodes; i++) {
      const z = Math.random() * 0.8 + 0.2; // depth
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: (Math.random() - 0.5) * 0.4 * z,
        vy: (Math.random() - 0.5) * 0.4 * z,
        radius: (Math.random() * 2.2 + 1.2) * z,
        color: isAlert && i % 4 === 0 ? '#f43f5e' : i % 3 === 0 ? '#38bdf8' : '#10b981',
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        tag: i % 7 === 0 ? tags[i % tags.length] : undefined,
      });
    }

    // Packet Pulses along connections
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
        speed: 0.01 + Math.random() * 0.015,
        color: isAlert && Math.random() > 0.6 ? '#f43f5e' : '#38bdf8',
      });
    };

    let packetTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle cyber grid
      ctx.strokeStyle = isAlert ? 'rgba(244, 63, 94, 0.05)' : 'rgba(56, 189, 248, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 56;
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

      // Update and connect nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        node.pulse += node.pulseSpeed;

        // Proximity lines
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 140 * ((node.z + other.z) / 2);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.22 * node.z;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = isAlert && (i % 3 === 0 || j % 3 === 0)
              ? `rgba(244, 63, 94, ${alpha * 1.5})`
              : `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1 * node.z;
            ctx.stroke();
          }
        }
      }

      // Spawn & Draw Packets
      packetTimer++;
      if (packetTimer % 35 === 0 && packets.length < 16) {
        addPacket();
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }

        const from = nodes[p.fromIdx];
        const to = nodes[p.toIdx];
        if (!from || !to) continue;

        const currX = from.x + (to.x - from.x) * p.progress;
        const currY = from.y + (to.y - from.y) * p.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulseFactor = 0.8 + Math.sin(node.pulse) * 0.35;
        const radius = node.radius * pulseFactor;

        // Outer glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = node.color === '#f43f5e'
          ? 'rgba(244, 63, 94, 0.12)'
          : 'rgba(56, 189, 248, 0.12)';
        ctx.fill();

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Holographic hash tag
        if (node.tag) {
          ctx.font = `${Math.floor(9 * node.z)}px monospace`;
          ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.fillText(node.tag, node.x + 8, node.y - 6);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [threatsActive]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#030712]"
      style={{ perspective: 1000 }}
    >
      {/* 1. Cyber Network Image with 3D Parallax & Motion Feature */}
      <motion.div
        style={{
          x: bgTranslateX,
          y: bgTranslateY,
          rotateX: bgRotateX,
          rotateY: bgRotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: [1.05, 1.09, 1.05],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -inset-16 bg-cover bg-center opacity-65 mix-blend-screen transition-opacity duration-700"
      >
        <div
          className="w-full h-full bg-cover bg-center filter saturate-150 contrast-125"
          style={{
            backgroundImage: `url('/cyber-bg.jpg')`,
          }}
        />
      </motion.div>

      {/* 2. Interactive Spotlight / Flashlight Cursor Glow */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
      />

      {/* 3. Deep Vignette & Holographic Cyber Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/70 via-transparent to-[#030712]/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/25 via-transparent to-[#030712]/80" />

      {/* 4. Live Threat Alert Ripple Overlay */}
      {threatsActive > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.18)_0%,transparent_70%)] pointer-events-none"
        />
      )}

      {/* 5. Live WebGL / Canvas Constellation Particles & Node Pulses */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* 6. Scanlines & Cyber CRT Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40 pointer-events-none" />
    </div>
  );
};
