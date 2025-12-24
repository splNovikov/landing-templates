'use client';

import { useEffect, useRef } from 'react';
import { colors } from '@/shared/lib/colors';

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  layer: number;
  isHub: boolean;
  phase: number;
  pulsePhase: number;
  clusterPhase: number;
  size: number;
  baseSize: number;
  opacity: number;
  active: boolean;
  connections: number[];
  clusterId: number;
  activity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  opacity: number;
}

interface DataWave {
  nodeA: Node;
  nodeB: Node;
  progress: number;
}

interface DataFlow {
  source: Node;
  target: Node;
  progress: number;
  intensity: number;
}

interface LightRay {
  targetX: number;
  targetY: number;
  intensity: number;
}

export function useHexagonalNetwork(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const networkRef = useRef<HexagonalNetwork | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const network = new HexagonalNetwork(canvasRef.current, containerRef.current);
    networkRef.current = network;

    return () => {
      network.destroy();
    };
  }, [canvasRef, containerRef]);
}

class HexagonalNetwork {
  private canvas: HTMLCanvasElement;
  private container: HTMLDivElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private particles: Particle[] = [];
  private dataWaves: DataWave[] = [];
  private dataFlows: DataFlow[] = [];
  private lightRays: LightRay[] = [];
  private hubNodes: number[] = [];
  private mouse = { x: 0, y: 0, active: false, vx: 0, vy: 0, lastMoveTime: 0 };
  private time = 0;
  private animationId: number | null = null;
  private effectIntensity = 1.0;
  private eventCleanup: (() => void) | null = null;

  // Configuration
  private readonly hexSize = 70;
  private readonly connectionDistance = 140;
  private readonly connectionDistanceSq = 140 * 140;
  private readonly layers = 3;
  private readonly layerDepth = 50;
  private readonly parallaxStrength = 0.3;
  private readonly maxHubNodes = 5;
  private readonly maxParticles = 30;
  private readonly maxRays = 12;
  private readonly maxDataFlows = 20;
  private readonly intensityDecayRate = 0.02;
  private readonly intensityRecoveryRate = 0.05;
  private readonly mouseMovementThreshold = 0.5;

  private width = 0;
  private height = 0;
  private centerX = 0;
  private centerY = 0;

  constructor(canvas: HTMLCanvasElement, container: HTMLDivElement) {
    this.canvas = canvas;
    this.container = container;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;

    this.setup();
    this.initHexGrid();
    this.bindEvents();
    this.animate();
  }

  private setup() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }

  private initHexGrid() {
    this.nodes = [];
    this.hubNodes = [];
    const hexHeight = this.hexSize * Math.sqrt(3);
    const hexWidth = this.hexSize * 2;

    const cols = Math.ceil(this.width / (hexWidth * 0.75)) + 2;
    const rows = Math.ceil(this.height / hexHeight) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * hexWidth * 0.75;
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);

        if (x > -50 && x < this.width + 50 && y > -50 && y < this.height + 50) {
          const dx = x - this.centerX;
          const dy = y - this.centerY;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(this.width * this.width + this.height * this.height) / 2;
          const centerRatio = 1 - distFromCenter / maxDist;

          const layer = Math.floor(centerRatio * this.layers);
          const isHub = centerRatio > 0.7 && Math.random() < 0.15;
          const baseSize = isHub ? 6 + Math.random() * 2 : 3 + Math.random() * 1.5;

          const node: Node = {
            x,
            y,
            baseX: x,
            baseY: y,
            layer,
            isHub,
            phase: Math.random() * Math.PI * 2,
            pulsePhase: Math.random() * Math.PI * 2,
            clusterPhase: Math.random() * Math.PI * 2,
            size: baseSize,
            baseSize,
            opacity: 0.3 + Math.random() * 0.4,
            active: false,
            connections: [],
            clusterId: Math.floor(Math.random() * 5),
            activity: 0,
          };

          this.nodes.push(node);
          if (isHub && this.hubNodes.length < this.maxHubNodes) {
            this.hubNodes.push(this.nodes.length - 1);
          }
        }
      }
    }

    this.buildConnections();
  }

  private buildConnections() {
    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].connections = [];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].baseX - this.nodes[j].baseX;
        const dy = this.nodes[i].baseY - this.nodes[j].baseY;
        const distSq = dx * dx + dy * dy;

        if (distSq < this.connectionDistanceSq) {
          this.nodes[i].connections.push(j);
          this.nodes[j].connections.push(i);
        }
      }
    }
  }

  private bindEvents() {
    let lastMouseX = 0;
    let lastMouseY = 0;

    const updateMousePosition = (e: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      const isInHero =
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right;

      if (!isInHero) {
        this.mouse.active = false;
        return;
      }

      this.mouse.vx = e.clientX - lastMouseX;
      this.mouse.vy = e.clientY - lastMouseY;
      const movementSpeed = Math.sqrt(
        this.mouse.vx * this.mouse.vx + this.mouse.vy * this.mouse.vy
      );

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
      this.mouse.lastMoveTime = this.time;

      if (movementSpeed > this.mouseMovementThreshold) {
        this.emitParticles(this.mouse.x, this.mouse.y);
      }
    };

    const handleMouseLeave = () => {
      this.mouse.active = false;
    };

    const handleResize = () => this.handleResize();

    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Store cleanup functions
    this.eventCleanup = () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }

  private handleResize() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.setup();
    this.initHexGrid();
    this.animate();
  }

  private updateEffectIntensity() {
    if (!this.mouse.active) {
      this.effectIntensity = Math.max(0, this.effectIntensity - this.intensityDecayRate * 2);
      return;
    }

    const timeSinceLastMove = this.time - this.mouse.lastMoveTime;
    const isMoving = timeSinceLastMove < 100;

    if (isMoving) {
      this.effectIntensity = Math.min(1.0, this.effectIntensity + this.intensityRecoveryRate);
    } else {
      this.effectIntensity = Math.max(0, this.effectIntensity - this.intensityDecayRate);
    }
  }

  private updateNodes() {
    const mouseDistSq = 200 * 200;
    const parallaxX = this.mouse.active ? (this.mouse.x - this.centerX) * this.parallaxStrength : 0;
    const parallaxY = this.mouse.active ? (this.mouse.y - this.centerY) * this.parallaxStrength : 0;

    for (let node of this.nodes) {
      const layerOffsetX = parallaxX * (node.layer / this.layers);
      const layerOffsetY = parallaxY * (node.layer / this.layers);

      const floatAmount = node.isHub ? 1 : 2;
      const floatX = Math.sin(this.time * 0.001 + node.phase) * floatAmount;
      const floatY = Math.cos(this.time * 0.001 + node.phase) * floatAmount;

      node.x = node.baseX + floatX + layerOffsetX;
      node.y = node.baseY + floatY + layerOffsetY;

      const pulseAmount = node.isHub ? 0.15 : 0.1;
      const clusterPulse = Math.sin(this.time * 0.002) * pulseAmount;
      const clusterPulseOffset = Math.sin(this.time * 0.0015 + node.clusterPhase) * clusterPulse;
      node.x += Math.cos(node.clusterPhase) * clusterPulseOffset;
      node.y += Math.sin(node.clusterPhase) * clusterPulseOffset;

      const baseOpacity = node.isHub ? 0.5 : 0.3;
      const opacityVariation = node.isHub ? 0.4 : 0.3;
      node.opacity = baseOpacity + Math.sin(this.time * 0.003 + node.pulsePhase) * opacityVariation;

      node.activity *= 0.95;

      if (this.mouse.active) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouseDistSq) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / 200) * 0.3;
          node.x += (dx / dist) * force;
          node.y += (dy / dist) * force;
          node.active = true;
          node.opacity = Math.min(1, node.opacity + 0.2);
          node.activity = Math.min(1, node.activity + 0.1);
        } else {
          node.active = false;
        }
      } else {
        node.active = false;
      }
    }
  }

  private emitParticles(x: number, y: number) {
    if (this.particles.length >= this.maxParticles || this.effectIntensity < 0.3) return;

    const count = Math.floor((2 + Math.floor(Math.random() * 3)) * this.effectIntensity);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        size: 1 + Math.random() * 2,
        opacity: 0.6 + Math.random() * 0.4,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= p.decay;

      if (p.life <= 0 || p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateDataWaves() {
    for (let i = this.dataWaves.length - 1; i >= 0; i--) {
      const wave = this.dataWaves[i];
      wave.progress += 0.02;
      if (wave.progress >= 1) {
        this.dataWaves.splice(i, 1);
      }
    }

    if (this.mouse.active && Math.random() < 0.15 * this.effectIntensity) {
      for (let i = 0; i < this.nodes.length && this.dataWaves.length < 10; i++) {
        const nodeA = this.nodes[i];
        if (nodeA.active && nodeA.connections.length > 0) {
          const connIdx = Math.floor(Math.random() * nodeA.connections.length);
          const nodeB = this.nodes[nodeA.connections[connIdx]];
          if (nodeB && (nodeA.active || nodeB.active)) {
            this.dataWaves.push({
              nodeA,
              nodeB,
              progress: 0,
            });
          }
        }
      }
    }
  }

  private updateDataFlows() {
    for (let i = this.dataFlows.length - 1; i >= 0; i--) {
      const flow = this.dataFlows[i];
      flow.progress += 0.015;
      if (flow.progress >= 1) {
        this.dataFlows.splice(i, 1);
      }
    }

    if (this.effectIntensity > 0.5 && this.dataFlows.length < this.maxDataFlows) {
      const sourceNodes =
        this.hubNodes.length > 0 && Math.random() < 0.7
          ? this.hubNodes.map((idx) => this.nodes[idx])
          : this.nodes.filter((n) => n.active || n.isHub);

      if (sourceNodes.length > 0 && Math.random() < 0.1) {
        const source = sourceNodes[Math.floor(Math.random() * sourceNodes.length)];
        if (source.connections.length > 0) {
          const targetIdx =
            source.connections[Math.floor(Math.random() * source.connections.length)];
          const target = this.nodes[targetIdx];
          if (target) {
            this.dataFlows.push({
              source,
              target,
              progress: 0,
              intensity: 0.6 + Math.random() * 0.4,
            });
          }
        }
      }
    }
  }

  private updateLightRays() {
    if (!this.mouse.active || this.effectIntensity < 0.1) {
      this.lightRays = [];
      return;
    }

    const nearestNodes: Array<{ node: Node; distSq: number }> = [];
    const rayDistSq = 250 * 250;

    for (let node of this.nodes) {
      const dx = this.mouse.x - node.x;
      const dy = this.mouse.y - node.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < rayDistSq) {
        nearestNodes.push({ node, distSq });
      }
    }

    nearestNodes.sort((a, b) => a.distSq - b.distSq);
    const rayCount = Math.floor(this.maxRays * this.effectIntensity);
    const selectedNodes = nearestNodes.slice(0, rayCount);

    this.lightRays = selectedNodes.map(({ node }) => ({
      targetX: node.x,
      targetY: node.y,
      intensity:
        Math.max(
          0.3,
          1 - Math.sqrt((this.mouse.x - node.x) ** 2 + (this.mouse.y - node.y) ** 2) / 250
        ) * this.effectIntensity,
    }));
  }

  private drawConnections() {
    for (let layer = this.layers - 1; layer >= 0; layer--) {
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();

      const drawnConnections = new Set<string>();
      const layerOpacity = 0.3 + (layer / this.layers) * 0.7;

      for (let i = 0; i < this.nodes.length; i++) {
        const nodeA = this.nodes[i];
        if (nodeA.layer !== layer) continue;

        for (let j of nodeA.connections) {
          const nodeB = this.nodes[j];
          if (nodeB.layer !== layer) continue;

          const connKey = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (drawnConnections.has(connKey)) continue;
          drawnConnections.add(connKey);

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < this.connectionDistanceSq) {
            const dist = Math.sqrt(distSq);
            const baseOpacity = 0.15 * layerOpacity;
            const activeOpacity = nodeA.active || nodeB.active ? 0.25 : 0;
            const distanceOpacity = (1 - dist / this.connectionDistance) * 0.15;
            const opacity = baseOpacity + activeOpacity + distanceOpacity;

            const pulse = Math.sin(this.time * 0.005 + i * 0.1) * 0.5 + 0.5;
            const finalOpacity = opacity * pulse * layerOpacity;

            this.ctx.globalAlpha = finalOpacity;
            this.ctx.strokeStyle = colors.primary(1);
            this.ctx.moveTo(nodeA.x, nodeA.y);
            this.ctx.lineTo(nodeB.x, nodeB.y);
          }
        }
      }

      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1.0;
    this.drawDataFlows();
    this.drawDataWaves();
  }

  private drawDataFlows() {
    for (let flow of this.dataFlows) {
      const source = flow.source;
      const target = flow.target;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const flowX = source.x + dx * flow.progress;
      const flowY = source.y + dy * flow.progress;

      const segmentLength = Math.min(30, dist * 0.2);
      const segmentStart = flow.progress - segmentLength / dist;
      const startX = source.x + dx * Math.max(0, segmentStart);
      const startY = source.y + dy * Math.max(0, segmentStart);

      const flowOpacity = flow.intensity * (1 - flow.progress) * 0.6;

      this.ctx.save();
      this.ctx.globalAlpha = flowOpacity;
      this.ctx.strokeStyle = colors.secondary(1);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(flowX, flowY);
      this.ctx.stroke();

      const angle = Math.atan2(dy, dx);
      const arrowSize = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(flowX, flowY);
      this.ctx.lineTo(
        flowX - arrowSize * Math.cos(angle - Math.PI / 6),
        flowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      this.ctx.moveTo(flowX, flowY);
      this.ctx.lineTo(
        flowX - arrowSize * Math.cos(angle + Math.PI / 6),
        flowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      this.ctx.stroke();

      const glowGradient = this.ctx.createRadialGradient(flowX, flowY, 0, flowX, flowY, 8);
      glowGradient.addColorStop(0, colors.secondary(flowOpacity * 0.8));
      glowGradient.addColorStop(1, colors.secondary(0));
      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(flowX, flowY, 8, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private drawDataWaves() {
    for (let wave of this.dataWaves) {
      const nodeA = wave.nodeA;
      const nodeB = wave.nodeB;
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;

      const waveX = nodeA.x + dx * wave.progress;
      const waveY = nodeA.y + dy * wave.progress;

      const waveSize = 8 * (1 - wave.progress);
      const waveOpacity = (1 - wave.progress) * 0.6 * this.effectIntensity;

      this.ctx.save();
      this.ctx.globalAlpha = waveOpacity;

      const gradient = this.ctx.createRadialGradient(waveX, waveY, 0, waveX, waveY, waveSize * 2);
      gradient.addColorStop(0, colors.secondary(0.8));
      gradient.addColorStop(0.5, colors.secondary(0.3));
      gradient.addColorStop(1, colors.secondary(0));

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(waveX, waveY, waveSize * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = colors.secondary(0.9);
      this.ctx.beginPath();
      this.ctx.arc(waveX, waveY, waveSize * 0.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private drawLightRays() {
    if (!this.mouse.active || this.lightRays.length === 0) return;

    this.ctx.save();
    this.ctx.globalAlpha = 0.4 * this.effectIntensity;

    for (let ray of this.lightRays) {
      const gradient = this.ctx.createLinearGradient(
        this.mouse.x,
        this.mouse.y,
        ray.targetX,
        ray.targetY
      );

      const darkTeal = colors.secondary(ray.intensity * 0.6);
      gradient.addColorStop(0, darkTeal);
      gradient.addColorStop(0.5, colors.secondary(ray.intensity * 0.3));
      gradient.addColorStop(1, colors.secondary(0));

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.mouse.x, this.mouse.y);
      this.ctx.lineTo(ray.targetX, ray.targetY);
      this.ctx.stroke();

      const targetGradient = this.ctx.createRadialGradient(
        ray.targetX,
        ray.targetY,
        0,
        ray.targetX,
        ray.targetY,
        15
      );
      targetGradient.addColorStop(0, colors.secondary(ray.intensity * 0.8));
      targetGradient.addColorStop(1, colors.secondary(0));

      this.ctx.fillStyle = targetGradient;
      this.ctx.beginPath();
      this.ctx.arc(ray.targetX, ray.targetY, 15, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawParticles() {
    for (let p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity * p.life * this.effectIntensity;
      this.ctx.fillStyle = colors.secondary(1);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      const glowGradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      glowGradient.addColorStop(0, colors.secondary(p.life * 0.3 * this.effectIntensity));
      glowGradient.addColorStop(1, colors.secondary(0));
      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private drawNodes() {
    for (let layer = this.layers - 1; layer >= 0; layer--) {
      const layerOpacity = 0.4 + (layer / this.layers) * 0.6;

      for (let node of this.nodes) {
        if (node.layer !== layer) continue;

        const size = node.active ? node.size * 1.5 : node.size;
        const baseOpacity = node.active ? Math.min(1, node.opacity + 0.3) : node.opacity;
        const opacity = baseOpacity * layerOpacity;

        const hubMultiplier = node.isHub ? 1.3 : 1.0;
        const finalSize = size * hubMultiplier;

        this.ctx.save();
        this.ctx.translate(node.x, node.y);

        if (node.activity > 0.1) {
          const activityGlow = node.activity * 0.2;
          this.ctx.globalAlpha = activityGlow * layerOpacity;
          this.ctx.fillStyle = colors.secondary(1);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, finalSize * 4, 0, Math.PI * 2);
          this.ctx.fill();
        }

        if (node.active || node.isHub) {
          const glowOpacity = (node.active ? 0.15 : 0.08) * layerOpacity;
          this.ctx.globalAlpha = glowOpacity;
          this.ctx.fillStyle = colors.secondary(1);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, finalSize * 3, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.globalAlpha = opacity;

        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = Math.cos(angle) * finalSize;
          const y = Math.sin(angle) * finalSize;
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.closePath();

        const fillColor = node.isHub ? colors.primary(1) : colors.primary(1);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();

        const strokeWidth = node.isHub ? 2 : node.active ? 2 : 1;
        this.ctx.strokeStyle = node.isHub ? colors.secondary(0.6) : colors.primary(0.8);
        this.ctx.lineWidth = strokeWidth;
        this.ctx.stroke();

        const dotSize = node.isHub ? 0.4 : 0.3;
        this.ctx.fillStyle = node.isHub ? colors.secondary(0.8) : colors.primary(1);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, finalSize * dotSize, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
      }
    }

    this.ctx.globalAlpha = 1.0;
  }

  private drawMouseEffect() {
    if (!this.mouse.active) return;

    const gradient = this.ctx.createRadialGradient(
      this.mouse.x,
      this.mouse.y,
      0,
      this.mouse.x,
      this.mouse.y,
      250
    );
    gradient.addColorStop(0, colors.secondary(0.12 * this.effectIntensity));
    gradient.addColorStop(0.3, colors.secondary(0.06 * this.effectIntensity));
    gradient.addColorStop(0.6, colors.secondary(0.02 * this.effectIntensity));
    gradient.addColorStop(1, colors.secondary(0));

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.mouse.x - 250, this.mouse.y - 250, 500, 500);

    const pulseSize = (8 + Math.sin(this.time * 0.01) * 3) * this.effectIntensity;
    const centerGradient = this.ctx.createRadialGradient(
      this.mouse.x,
      this.mouse.y,
      0,
      this.mouse.x,
      this.mouse.y,
      pulseSize
    );
    centerGradient.addColorStop(0, colors.secondary(0.6 * this.effectIntensity));
    centerGradient.addColorStop(1, colors.secondary(0));

    this.ctx.fillStyle = centerGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, pulseSize, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private animate() {
    this.time += 16;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = colors.bgBody();
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.updateEffectIntensity();
    this.updateNodes();
    this.updateParticles();
    this.updateDataWaves();
    this.updateDataFlows();
    this.updateLightRays();

    this.drawConnections();
    this.drawLightRays();
    this.drawMouseEffect();
    this.drawParticles();
    this.drawNodes();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.eventCleanup) {
      this.eventCleanup();
      this.eventCleanup = null;
    }
  }
}
