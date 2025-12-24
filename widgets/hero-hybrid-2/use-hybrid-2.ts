'use client';

import { useEffect, useRef } from 'react';
import { colors } from '@/shared/lib/colors';

interface Node {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  connections: number[];
  pulsePhase: number;
}

export function useHybrid2(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);
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
      initNodes();
    };

    const initNodes = () => {
      const nodeCount = 50;
      nodesRef.current = Array.from({ length: nodeCount }, (_, i) => {
        const angle = (i / nodeCount) * Math.PI * 2;
        const radius = 200 + Math.random() * 300;
        return {
          x: canvas.width / 2 + Math.cos(angle) * radius,
          y: canvas.height / 2 + Math.sin(angle) * radius,
          z: Math.random() * 200 - 100,
          vx: (Math.random() - 0.5) * 1.0,
          vy: (Math.random() - 0.5) * 1.0,
          vz: (Math.random() - 0.5) * 1.0,
          connections: [],
          pulsePhase: Math.random() * Math.PI * 2,
        };
      });

      // Build connections
      nodesRef.current.forEach((node, i) => {
        node.connections = [];
        nodesRef.current.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              node.connections.push(j);
            }
          }
        });
      });
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
      timeRef.current += 0.03;

      // Clear canvas
      ctx.fillStyle = colors.bgBody();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cache canvas dimensions and center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Layer 1: Minimal Grid (Architectural Blueprint)
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

      // Layer 2: Neural Constellation
      // Update nodes
      nodesRef.current.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Bounce
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        if (node.z < -200 || node.z > 200) node.vz *= -1;

        // Magnetic effect
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const distSq = dx * dx + dy * dy;
          const maxDistSq = 300 * 300;
          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const force = (300 - dist) / 300;
            const invDist = 1 / dist;
            node.vx += dx * invDist * force * 0.03;
            node.vy += dy * invDist * force * 0.03;
          }
        }
      });

      // Draw connections
      const maxConnectionDist = 200;
      const invMaxConnectionDist = 1 / maxConnectionDist;

      nodesRef.current.forEach((node, i) => {
        node.connections.forEach((j) => {
          const other = nodesRef.current[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDist) {
            const opacity = (1 - dist * invMaxConnectionDist) * 0.3;
            const pulse = (Math.sin(timeRef.current * 4 + node.pulsePhase) + 1) / 2;
            ctx.strokeStyle = colors.secondary(opacity * pulse);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodesRef.current.forEach((node) => {
        const scale = 1 + node.z / 200;
        const size = Math.max(1, 3 * scale);
        const pulse = (Math.sin(timeRef.current * 5 + node.pulsePhase) + 1) / 2;
        const opacity = 0.5 + pulse * 0.5;

        // Glow with secondary color
        const glowSize = Math.max(5, size * 5);
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
        gradient.addColorStop(0, colors.secondary(opacity * 0.3));
        gradient.addColorStop(1, colors.secondary(0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Node with secondary color
        ctx.fillStyle = colors.secondary(opacity);
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
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
