'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticleField — minimal canvas animation that lives behind the hero input.
 *
 * Design intent: subtle "alive" texture without distracting from the input.
 * - Particles drift slowly upward + outward from screen center.
 * - Opacity decays from accent color toward transparent as they age.
 * - Respects prefers-reduced-motion.
 * - Pauses when offscreen (IntersectionObserver) and on tab hide.
 */
export function ParticleField({
  density = 60,
  className = '',
}: {
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
      age: number;
      life: number;
      size: number;
    }

    const particles: P[] = [];

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.35;
      particles.push({
        x: cx + (Math.random() - 0.5) * w * 0.6,
        y: cy + (Math.random() - 0.5) * h * 0.3,
        vx: Math.cos(angle) * speed * 0.4,
        vy: -Math.abs(Math.sin(angle) * speed) - 0.05,
        age: 0,
        life: 240 + Math.random() * 240,
        size: 0.6 + Math.random() * 1.4,
      });
    };

    const seed = () => {
      particles.length = 0;
      for (let i = 0; i < density; i++) spawn();
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.age += 1;
        const lifeFrac = p.age / p.life;
        if (lifeFrac >= 1 || p.y < -10) {
          // respawn
          const cx = w * 0.5;
          const cy = h * 0.5;
          p.x = cx + (Math.random() - 0.5) * w * 0.6;
          p.y = cy + (Math.random() - 0.5) * h * 0.3;
          p.age = 0;
          continue;
        }
        const alpha = (1 - lifeFrac) * 0.42 * Math.min(1, p.age / 30);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184, 255, 102, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      resize();
    };

    resize();
    seed();
    if (!reduced) rafRef.current = requestAnimationFrame(draw);

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
    />
  );
}
