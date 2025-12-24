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

interface SpeedConfig {
  nodeVelocity?: number;
  timeIncrement?: number;
  magneticForce?: number;
  connectionPulse?: number;
  nodePulse?: number;
}

const DEFAULT_SPEED: Required<SpeedConfig> = {
  nodeVelocity: 1.0,
  timeIncrement: 0.03,
  magneticForce: 0.03,
  connectionPulse: 4,
  nodePulse: 5,
};

export function useNeuralConstellation(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>,
  speed?: SpeedConfig
) {
  const speedConfig = { ...DEFAULT_SPEED, ...speed };
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
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

    // Initialize nodes
    const nodeCount = 50;
    nodesRef.current = Array.from({ length: nodeCount }, (_, i) => {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 200 + Math.random() * 300;
      return {
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        z: Math.random() * 200 - 100,
        vx: (Math.random() - 0.5) * speedConfig.nodeVelocity,
        vy: (Math.random() - 0.5) * speedConfig.nodeVelocity,
        vz: (Math.random() - 0.5) * speedConfig.nodeVelocity,
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
      timeRef.current += speedConfig.timeIncrement;
      ctx.fillStyle = colors.bgBody();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 300) {
            const force = (300 - dist) / 300;
            node.vx += (dx / dist) * force * speedConfig.magneticForce;
            node.vy += (dy / dist) * force * speedConfig.magneticForce;
          }
        }
      });

      // Draw connections
      nodesRef.current.forEach((node, i) => {
        node.connections.forEach((j) => {
          const other = nodesRef.current[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            const opacity = (1 - dist / 200) * 0.3;
            const pulse =
              (Math.sin(timeRef.current * speedConfig.connectionPulse + node.pulsePhase) + 1) / 2;
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
        const pulse = (Math.sin(timeRef.current * speedConfig.nodePulse + node.pulsePhase) + 1) / 2;
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

        // Node with primary black color
        ctx.fillStyle = colors.primary(opacity);
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
  }, [canvasRef, containerRef, speed]);
}
