'use client';

import { useEffect, useRef } from 'react';
import { colors } from '@/shared/lib/colors';

interface ConnectionPoint {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  phase: number;
}

interface Connection {
  from: ConnectionPoint;
  to: ConnectionPoint;
  progress: number;
  speed: number;
  opacity: number;
}

export function useAnimatedLines(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const pointsRef = useRef<ConnectionPoint[]>([]);
  const connectionsRef = useRef<Connection[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints();
    };

    const initPoints = () => {
      const pointCount = 8;
      pointsRef.current = [];

      // Cache canvas dimensions
      const minDimension = Math.min(canvas.width, canvas.height);
      const radius = minDimension * 0.3;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxConnectionDist = minDimension * 0.5;

      for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        pointsRef.current.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // Initialize connections between nearby points
      connectionsRef.current = [];
      for (let i = 0; i < pointsRef.current.length; i++) {
        for (let j = i + 1; j < pointsRef.current.length; j++) {
          const p1 = pointsRef.current[i];
          const p2 = pointsRef.current[j];
          const dx = p1.baseX - p2.baseX;
          const dy = p1.baseY - p2.baseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnectionDist * maxConnectionDist) {
            connectionsRef.current.push({
              from: p1,
              to: p2,
              progress: Math.random(),
              speed: 0.002 + Math.random() * 0.003,
              opacity: 0.08 + Math.random() * 0.04,
            });
          }
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.01;

      // Clear canvas
      ctx.fillStyle = colors.bgBody();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update points with animated motion towards center
      pointsRef.current.forEach((point) => {
        const floatAmount = 15;
        const floatX = Math.sin(timeRef.current * 0.2 + point.phase) * floatAmount;
        const floatY = Math.cos(timeRef.current * 0.15 + point.phase) * floatAmount;

        // Update base position with velocity
        point.baseX += point.vx;
        point.baseY += point.vy;

        // Attraction to center, but stop at minimum radius (don't collapse to a point)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = centerX - point.baseX;
        const dy = centerY - point.baseY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const minRadius = Math.min(canvas.width, canvas.height) * 0.12; // Minimum cluster size

        // Only attract if point is beyond minimum radius
        if (distFromCenter > minRadius) {
          // Stronger attraction force that creates visible movement
          const force = (distFromCenter - minRadius) / minRadius;
          point.vx += (dx / distFromCenter) * force * 0.002;
          point.vy += (dy / distFromCenter) * force * 0.002;
        } else if (distFromCenter > 0) {
          // If too close to center, push away to maintain minimum radius
          const pushForce = ((minRadius - distFromCenter) / minRadius) * 0.001;
          point.vx -= (dx / distFromCenter) * pushForce;
          point.vy -= (dy / distFromCenter) * pushForce;
        }

        // Light damping to allow movement
        point.vx *= 0.97;
        point.vy *= 0.97;

        // Apply floating motion to visual position
        point.x = point.baseX + floatX;
        point.y = point.baseY + floatY;
      });

      // Draw connections with slow animated flow
      ctx.lineWidth = 1;
      const minDimensionForConnections = Math.min(canvas.width, canvas.height);
      const maxConnectionDistance = minDimensionForConnections * 0.6;
      const invMaxConnectionDist = 1 / maxConnectionDistance;

      connectionsRef.current.forEach((conn) => {
        conn.progress += conn.speed;
        if (conn.progress > 1) conn.progress = 0;

        const dx = conn.to.x - conn.from.x;
        const dy = conn.to.y - conn.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only draw if points are reasonably close
        if (dist < maxConnectionDistance) {
          const distanceOpacity = (1 - dist * invMaxConnectionDist) * conn.opacity;

          // Draw base line with secondary color
          ctx.strokeStyle = colors.secondary(distanceOpacity * 0.4);
          ctx.beginPath();
          ctx.moveTo(conn.from.x, conn.from.y);
          ctx.lineTo(conn.to.x, conn.to.y);
          ctx.stroke();

          // Draw animated flow particle
          const flowX = conn.from.x + dx * conn.progress;
          const flowY = conn.from.y + dy * conn.progress;

          const pulse = (Math.sin(timeRef.current * 2 + conn.progress * Math.PI * 2) + 1) / 2;
          const flowOpacity = distanceOpacity * (1 - conn.progress) * pulse;

          // Subtle glow with secondary color
          const gradient = ctx.createRadialGradient(flowX, flowY, 0, flowX, flowY, 8);
          gradient.addColorStop(0, colors.secondary(flowOpacity * 1.5));
          gradient.addColorStop(1, colors.secondary(0));

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(flowX, flowY, 8, 0, Math.PI * 2);
          ctx.fill();

          // Small point
          ctx.fillStyle = colors.secondary(flowOpacity * 1.2);
          ctx.beginPath();
          ctx.arc(flowX, flowY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw connection points with secondary color glow
      pointsRef.current.forEach((point) => {
        // Glow effect
        const glowGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 8);
        glowGradient.addColorStop(0, colors.secondary(0.4));
        glowGradient.addColorStop(0.5, colors.secondary(0.15));
        glowGradient.addColorStop(1, colors.secondary(0));

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Point itself
        ctx.fillStyle = colors.secondary(0.8);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

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
