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

export function useHybrid(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const imageDataRef = useRef<ImageData | null>(null);
  const noiseSeedRef = useRef(Math.random() * 1000);
  const meshRef = useRef<MeshPoint[]>([]);
  const connectionPointsRef = useRef<ConnectionPoint[]>([]);
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
      generateNoise();
      initMesh();
      initConnections();
    };

    // Monochrome Texture: Generate noise
    const generateNoise = () => {
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.createImageData(width, height);
      imageDataRef.current = imageData;
    };

    // Subtle Mesh: Initialize mesh points
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

    // Animated Lines: Initialize connection points
    const initConnections = () => {
      const pointCount = 8;
      connectionPointsRef.current = [];

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

        connectionPointsRef.current.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }

      connectionsRef.current = [];
      for (let i = 0; i < connectionPointsRef.current.length; i++) {
        for (let j = i + 1; j < connectionPointsRef.current.length; j++) {
          const p1 = connectionPointsRef.current[i];
          const p2 = connectionPointsRef.current[j];
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
      timeRef.current += 0.008;

      // Clear canvas
      ctx.fillStyle = colors.bgBody();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Layer 1: Monochrome Texture (noise)
      if (imageDataRef.current) {
        noiseSeedRef.current += 0.1;
        const width = canvas.width;
        const height = canvas.height;
        const data = imageDataRef.current.data;

        for (let i = 0; i < data.length; i += 4) {
          const x = (i / 4) % width;
          const y = Math.floor(i / 4 / width);

          // Perlin-like noise using multiple octaves for subtle texture
          let noiseValue = 0;
          noiseValue += Math.sin((x + noiseSeedRef.current) * 0.01) * 0.3;
          noiseValue += Math.sin((y + noiseSeedRef.current) * 0.015) * 0.3;
          noiseValue += Math.sin((x + y + noiseSeedRef.current) * 0.005) * 0.4;

          // Convert to grayscale with very low opacity
          const gray = 128 + noiseValue * 5;
          const alpha = 0.08;

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
          data[i + 3] = alpha * 255;
        }

        ctx.putImageData(imageDataRef.current, 0, 0);
      }

      // Layer 2: Subtle Mesh
      // Update mesh points with subtle movement
      meshRef.current.forEach((point) => {
        const floatAmount = 1.5;
        const floatX = Math.sin(timeRef.current * 0.3 + point.phase) * floatAmount;
        const floatY = Math.cos(timeRef.current * 0.25 + point.phase) * floatAmount;

        point.x = point.baseX + floatX;
        point.y = point.baseY + floatY;
      });

      // Draw mesh connections (triangular mesh)
      ctx.strokeStyle = colors.primary(0.18);
      ctx.lineWidth = 0.8;

      const spacing = 80;
      const cols = Math.ceil(canvas.width / spacing) + 1;

      for (let i = 0; i < meshRef.current.length; i++) {
        const point = meshRef.current[i];
        const row = Math.floor(point.baseY / spacing);
        const col = Math.floor(point.baseX / spacing);

        // Connect to right neighbor
        if (col < cols - 1) {
          const rightIdx = row * cols + col + 1;
          if (rightIdx < meshRef.current.length) {
            const right = meshRef.current[rightIdx];
            const dist = Math.sqrt(Math.pow(point.x - right.x, 2) + Math.pow(point.y - right.y, 2));
            if (dist < spacing * 1.5) {
              const opacity = (1 - dist / (spacing * 1.5)) * 0.18;
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
          const dist = Math.sqrt(Math.pow(point.x - bottom.x, 2) + Math.pow(point.y - bottom.y, 2));
          if (dist < spacing * 1.5) {
            const opacity = (1 - dist / (spacing * 1.5)) * 0.18;
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
            const dist = Math.sqrt(Math.pow(point.x - diag.x, 2) + Math.pow(point.y - diag.y, 2));
            if (dist < spacing * 2) {
              const opacity = (1 - dist / (spacing * 2)) * 0.12;
              ctx.strokeStyle = colors.primary(opacity);
              ctx.beginPath();
              ctx.moveTo(point.x, point.y);
              ctx.lineTo(diag.x, diag.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw mesh points
      ctx.fillStyle = colors.primary(0.25);
      meshRef.current.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 3: Animated Lines
      // Update connection points with animated motion towards center
      // Cache canvas dimensions and center
      const minDimension = Math.min(canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const minRadius = minDimension * 0.12;
      const maxConnectionDist = minDimension * 0.6;

      connectionPointsRef.current.forEach((point) => {
        const floatAmount = 15;
        const floatX = Math.sin(timeRef.current * 0.2 + point.phase) * floatAmount;
        const floatY = Math.cos(timeRef.current * 0.15 + point.phase) * floatAmount;

        // Update base position with velocity
        point.baseX += point.vx;
        point.baseY += point.vy;

        // Attraction to center, but stop at minimum radius
        const dx = centerX - point.baseX;
        const dy = centerY - point.baseY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distFromCenter > minRadius) {
          const force = (distFromCenter - minRadius) / minRadius;
          const invDist = 1 / distFromCenter;
          point.vx += dx * invDist * force * 0.002;
          point.vy += dy * invDist * force * 0.002;
        } else if (distFromCenter > 0) {
          const pushForce = ((minRadius - distFromCenter) / minRadius) * 0.001;
          const invDist = 1 / distFromCenter;
          point.vx -= dx * invDist * pushForce;
          point.vy -= dy * invDist * pushForce;
        }

        point.vx *= 0.97;
        point.vy *= 0.97;

        point.x = point.baseX + floatX;
        point.y = point.baseY + floatY;
      });

      // Draw animated connection lines
      ctx.lineWidth = 1;
      const maxConnectionDistance = maxConnectionDist;
      const invMaxConnectionDist = 1 / maxConnectionDistance;

      connectionsRef.current.forEach((conn) => {
        conn.progress += conn.speed;
        if (conn.progress > 1) conn.progress = 0;

        const dx = conn.to.x - conn.from.x;
        const dy = conn.to.y - conn.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

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
      connectionPointsRef.current.forEach((point) => {
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
