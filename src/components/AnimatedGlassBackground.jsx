import React, { useEffect, useRef } from 'react';

export default function AnimatedGlassBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let animationFrameId;
    let time = 0;

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      radius: Math.random() * 1.8 + 0.4,
      speedY: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.35 + 0.08,
      phase: Math.random() * Math.PI * 2,
    }));

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const getWaveY = (x, t, layer) => {
      if (layer === 0) {
        // Hero wave — smooth flowing
        const freq1 = 0.003;
        const freq2 = 0.006;
        const freq3 = 0.001;
        const base = height * 0.48;
        const y1 = Math.sin(x * freq1 + t * 1.1) * (height * 0.12);
        const y2 = Math.cos(x * freq2 - t * 0.7 + 0.8) * (height * 0.04);
        const y3 = Math.sin(x * freq3 + t * 0.55 + 2.1) * (height * 0.06);
        return base + y1 + y2 + y3;
      } else if (layer === 1) {
        // Mid wave
        const freq1 = 0.0026;
        const freq2 = 0.0052;
        const base = height * 0.54;
        const y1 = Math.sin(x * freq1 - t * 1.3 + 1.4) * (height * 0.15);
        const y2 = Math.cos(x * freq2 + t * 0.85) * (height * 0.06);
        return base + y1 + y2;
      } else {
        // Deep ambient wave
        const freq = 0.0018;
        const base = height * 0.60;
        const y = Math.sin(x * freq - t * 0.9 + 2.8) * (height * 0.16);
        return base + y;
      }
    };

    const render = () => {
      time += 0.016;

      // 1. Deep crimson base
      ctx.fillStyle = '#0a0404';
      ctx.fillRect(0, 0, width, height);

      // 2. Radial vignette
      const vignette = ctx.createRadialGradient(
        width * 0.5, height * 0.45, 60,
        width * 0.5, height * 0.45, Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, 'rgba(30, 10, 10, 0.40)');
      vignette.addColorStop(0.65, 'rgba(15, 5, 5, 0.75)');
      vignette.addColorStop(1, 'rgba(4, 1, 1, 0.98)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 3. Bottom crimson glow
      const bottomGlow = ctx.createRadialGradient(
        width * 0.5, height * 0.98, 20,
        width * 0.5, height * 0.98, width * 0.65
      );
      const pulseGlow = 0.22 + Math.sin(time * 1.3) * 0.06;
      bottomGlow.addColorStop(0, `rgba(220, 38, 38, ${pulseGlow})`);
      bottomGlow.addColorStop(0.35, `rgba(185, 28, 28, ${pulseGlow * 0.6})`);
      bottomGlow.addColorStop(0.7, `rgba(127, 29, 29, ${pulseGlow * 0.2})`);
      bottomGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, height * 0.35, width, height * 0.65);

      const step = Math.max(6, Math.floor(width / 180));

      // 4. Deep ambient wave
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-20, getWaveY(-20, time, 2));
      for (let x = 0; x <= width + 20; x += step * 2) {
        ctx.lineTo(x, getWaveY(x, time, 2));
      }
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.12)';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 25;
      ctx.stroke();
      ctx.restore();

      // 5. Mid wave with gradient fill
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-20, height);
      ctx.lineTo(-20, getWaveY(-20, time, 1));
      for (let x = 0; x <= width + 20; x += step) {
        ctx.lineTo(x, getWaveY(x, time, 1));
      }
      ctx.lineTo(width + 20, height);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, height * 0.35, 0, height);
      waveGrad.addColorStop(0, 'rgba(220, 38, 38, 0.12)');
      waveGrad.addColorStop(0.4, 'rgba(185, 28, 28, 0.06)');
      waveGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = waveGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(248, 113, 113, 0.2)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();

      // 6. Hero wave — multi-pass glow
      const buildHeroWavePath = () => {
        ctx.beginPath();
        ctx.moveTo(-20, getWaveY(-20, time, 0));
        for (let x = 0; x <= width + 20; x += step) {
          ctx.lineTo(x, getWaveY(x, time, 0));
        }
      };

      // Pass A: Broad diffuse glow
      ctx.save();
      buildHeroWavePath();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.28)';
      ctx.lineWidth = 16;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 45;
      ctx.stroke();
      ctx.restore();

      // Pass B: Intense mid-core
      ctx.save();
      buildHeroWavePath();
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.restore();

      // Pass C: Sharp luminous core
      ctx.save();
      buildHeroWavePath();
      ctx.strokeStyle = '#fef2f2';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // 7. Tracking nodes
      const nodeFractions = [0.15, 0.32, 0.50, 0.68, 0.85];
      nodeFractions.forEach((fraction, idx) => {
        const nx = width * fraction;
        const ny = getWaveY(nx, time, 0);
        const isApex = idx === 2;

        // Vertical guideline
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.moveTo(nx, ny + (isApex ? 12 : 8));
        ctx.lineTo(nx, height * 0.88);
        const guideGrad = ctx.createLinearGradient(nx, ny, nx, height * 0.88);
        guideGrad.addColorStop(0, isApex ? 'rgba(239, 68, 68, 0.4)' : 'rgba(248, 113, 113, 0.22)');
        guideGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.06)');
        guideGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = guideGrad;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Node glow & core
        ctx.save();
        const pulse = Math.sin(time * 3 + idx) * (isApex ? 2.2 : 1.2);
        const radius = isApex ? 9 + pulse : 5 + pulse;

        // Outer aura
        const aura = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius * (isApex ? 4.5 : 3.2));
        aura.addColorStop(0, isApex ? 'rgba(239, 68, 68, 0.8)' : 'rgba(248, 113, 113, 0.55)');
        aura.addColorStop(0.4, isApex ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.18)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(nx, ny, radius * (isApex ? 4.5 : 3.2), 0, Math.PI * 2);
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fillStyle = isApex ? '#ffffff' : '#fecaca';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = isApex ? 22 : 12;
        ctx.fill();

        // White rim
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isApex ? 2 : 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // 8. Micro-particles
      ctx.save();
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = p.alpha * (0.6 + Math.sin(time * 2 + p.phase) * 0.4);
        ctx.fillStyle = `rgba(252, 165, 165, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

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
