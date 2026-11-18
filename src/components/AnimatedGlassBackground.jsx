import React, { useEffect, useRef } from 'react';

export default function AnimatedGlassBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let animationFrameId;
    let time = 0;

    // 4 drifting gradient mesh nodes with slow Lissajous harmonic trajectories
    const blobs = [
      {
        baseX: 0.25,
        baseY: 0.35,
        radiusMult: 0.55,
        freqX: 0.00045,
        freqY: 0.00035,
        ampX: 0.18,
        ampY: 0.14,
        colorStart: 'rgba(59, 130, 246, 0.07)',  // Electric blue
        colorMid: 'rgba(37, 99, 235, 0.03)',
        colorEnd: 'rgba(9, 9, 11, 0)'
      },
      {
        baseX: 0.75,
        baseY: 0.3,
        radiusMult: 0.6,
        freqX: 0.00038,
        freqY: 0.00048,
        ampX: 0.16,
        ampY: 0.16,
        colorStart: 'rgba(99, 102, 241, 0.06)',  // Indigo
        colorMid: 'rgba(79, 70, 229, 0.025)',
        colorEnd: 'rgba(9, 9, 11, 0)'
      },
      {
        baseX: 0.5,
        baseY: 0.75,
        radiusMult: 0.65,
        freqX: 0.00032,
        freqY: 0.0004,
        ampX: 0.2,
        ampY: 0.12,
        colorStart: 'rgba(14, 165, 233, 0.045)', // Sky / Cyan
        colorMid: 'rgba(56, 189, 248, 0.02)',
        colorEnd: 'rgba(9, 9, 11, 0)'
      },
      {
        baseX: 0.8,
        baseY: 0.8,
        radiusMult: 0.5,
        freqX: 0.0004,
        freqY: 0.0003,
        ampX: 0.14,
        ampY: 0.15,
        colorStart: 'rgba(148, 163, 184, 0.035)', // Slate
        colorMid: 'rgba(100, 116, 139, 0.015)',
        colorEnd: 'rgba(9, 9, 11, 0)'
      }
    ];

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      time = timestamp || 0;

      // 1. Base dark background (neutral zinc-950)
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      const maxDim = Math.max(width, height);

      // 2. Render drifting soft gradient mesh blobs
      blobs.forEach((blob) => {
        const cx = (blob.baseX + Math.sin(time * blob.freqX) * blob.ampX) * width;
        const cy = (blob.baseY + Math.cos(time * blob.freqY) * blob.ampY) * height;
        const radius = maxDim * blob.radiusMult;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, blob.colorStart);
        grad.addColorStop(0.5, blob.colorMid);
        grad.addColorStop(1, blob.colorEnd);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      // 3. Subtle edge vignette to keep content focused and premium
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        maxDim * 0.25,
        width * 0.5,
        height * 0.5,
        maxDim * 0.75
      );
      vignette.addColorStop(0, 'rgba(9, 9, 11, 0)');
      vignette.addColorStop(0.7, 'rgba(9, 9, 11, 0.35)');
      vignette.addColorStop(1, 'rgba(9, 9, 11, 0.75)');

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
