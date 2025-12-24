'use client';

import { useEffect, useRef } from 'react';
import { colors } from '@/shared/lib/colors';

interface MeshPoint {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  phase: number;
}

export function useSubtleMesh(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const meshRef = useRef<MeshPoint[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initMesh();
    };

    const initMesh = () => {
      meshRef.current = [];
      const spacing = 80;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          meshRef.current.push({
            x: col * spacing,
            y: row * spacing,
            baseX: col * spacing,
            baseY: row * spacing,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      timeRef.current += 0.008;

      // Clear canvas
      ctx.fillStyle = colors.bgBody();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update mesh points with subtle movement
      meshRef.current.forEach((point) => {
        const floatAmount = 1.5;
        const floatX = Math.sin(timeRef.current * 0.3 + point.phase) * floatAmount;
        const floatY = Math.cos(timeRef.current * 0.25 + point.phase) * floatAmount;

        point.x = point.baseX + floatX;
        point.y = point.baseY + floatY;

        // Subtle mouse interaction
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - point.x;
          const dy = mouseRef.current.y - point.y;
          const distSq = dx * dx + dy * dy;
          const maxDistSq = 200 * 200;
          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const force = ((200 - dist) / 200) * 0.3;
            const invDist = 1 / dist;
            point.x += dx * invDist * force;
            point.y += dy * invDist * force;
          }
        }
      });

      // Draw connections (triangular mesh)
      ctx.strokeStyle = colors.primary(0.18);
      ctx.lineWidth = 0.8;

      const spacing = 80;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const maxDist = spacing * 1.5;
      const maxDistDiag = spacing * 2;
      const invMaxDist = 1 / maxDist;
      const invMaxDistDiag = 1 / maxDistDiag;

      for (let i = 0; i < meshRef.current.length; i++) {
        const point = meshRef.current[i];
        const row = Math.floor(point.baseY / spacing);
        const col = Math.floor(point.baseX / spacing);

        // Connect to right neighbor
        if (col < cols - 1) {
          const rightIdx = row * cols + col + 1;
          if (rightIdx < meshRef.current.length) {
            const right = meshRef.current[rightIdx];
            const dx = point.x - right.x;
            const dy = point.y - right.y;
            const distSq = dx * dx + dy * dy;
            const maxDistSq = maxDist * maxDist;
            if (distSq < maxDistSq) {
              const dist = Math.sqrt(distSq);
              const opacity = (1 - dist * invMaxDist) * 0.18;
              ctx.strokeStyle = colors.primary(opacity);
              ctx.beginPath();
              ctx.moveTo(point.x, point.y);
              ctx.lineTo(right.x, right.y);
              ctx.stroke();
            }
          }
        }

        // Connect to bottom neighbor
        const bottomIdx = (row + 1) * cols + col;
        if (bottomIdx < meshRef.current.length) {
          const bottom = meshRef.current[bottomIdx];
          const dx = point.x - bottom.x;
          const dy = point.y - bottom.y;
          const distSq = dx * dx + dy * dy;
          const maxDistSq = maxDist * maxDist;
          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const opacity = (1 - dist * invMaxDist) * 0.18;
            ctx.strokeStyle = colors.primary(opacity);
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.stroke();
          }
        }

        // Connect diagonally (for triangular mesh)
        if (col < cols - 1) {
          const diagIdx = row * cols + col + 1 + cols;
          if (diagIdx < meshRef.current.length && row < Math.ceil(canvas.height / spacing)) {
            const diag = meshRef.current[diagIdx];
            const dx = point.x - diag.x;
            const dy = point.y - diag.y;
            const distSq = dx * dx + dy * dy;
            const maxDistDiagSq = maxDistDiag * maxDistDiag;
            if (distSq < maxDistDiagSq) {
              const dist = Math.sqrt(distSq);
              const opacity = (1 - dist * invMaxDistDiag) * 0.12;
              ctx.strokeStyle = colors.primary(opacity);
              ctx.beginPath();
              ctx.moveTo(point.x, point.y);
              ctx.lineTo(diag.x, diag.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw subtle points
      ctx.fillStyle = colors.primary(0.25);
      meshRef.current.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasRef, containerRef]);
}
