'use client';

import { useEffect, useRef } from 'react';
import { colors } from '@/shared/lib/colors';

export function useMinimalGrid(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.005;

      // Clear canvas
      ctx.fillStyle = colors.bgBody();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid lines - architectural blueprint style
      const gridSize = 60;
      const offsetX = (Math.sin(timeRef.current * 0.1) * 2) % gridSize;
      const offsetY = (Math.cos(timeRef.current * 0.08) * 2) % gridSize;

      ctx.strokeStyle = colors.primary(0.08);
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw subtle crosshair in center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.strokeStyle = colors.primary(0.12);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(centerX - 30, centerY);
      ctx.lineTo(centerX + 30, centerY);
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX, centerY + 30);
      ctx.stroke();

      // Subtle corner markers (like technical drawings)
      const cornerSize = 20;
      ctx.strokeStyle = colors.primary(0.1);
      ctx.lineWidth = 0.8;

      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.lineTo(40 + cornerSize, 40);
      ctx.moveTo(40, 40);
      ctx.lineTo(40, 40 + cornerSize);
      ctx.stroke();

      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(canvas.width - 40, 40);
      ctx.lineTo(canvas.width - 40 - cornerSize, 40);
      ctx.moveTo(canvas.width - 40, 40);
      ctx.lineTo(canvas.width - 40, 40 + cornerSize);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasRef, containerRef]);
}
