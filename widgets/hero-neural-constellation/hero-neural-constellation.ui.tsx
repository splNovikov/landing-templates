'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { useNeuralConstellation } from './use-neural-constellation';
import styles from './hero-neural-constellation.module.css';

export interface HeroNeuralConstellationProps {
  topLabel?: string;
  title: string;
  subtitle: string;
  techFeatures?: Array<{
    icon: string;
    text: string;
  }>;
  ctaText?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  speed?: {
    nodeVelocity?: number;
    timeIncrement?: number;
    magneticForce?: number;
    connectionPulse?: number;
    nodePulse?: number;
  };
}

export function HeroNeuralConstellation({
  topLabel,
  title,
  subtitle,
  techFeatures,
  ctaText = 'Get Started',
  ctaHref,
  ctaOnClick,
  speed,
}: HeroNeuralConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useNeuralConstellation(canvasRef, containerRef, speed);

  const handleCtaClick = ctaOnClick || undefined;

  return (
    <div ref={containerRef} className={styles.heroContainer}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.content}>
        {topLabel && <div className={styles.topLabel}>{topLabel}</div>}
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {techFeatures && techFeatures.length > 0 && (
          <div className={styles.techFeatures}>
            {techFeatures.map((feature, index) => (
              <div key={index} className={styles.feature}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <div className={styles.featureText}>{feature.text}</div>
              </div>
            ))}
          </div>
        )}
        {ctaHref ? (
          <Link href={ctaHref} className={styles.ctaLink}>
            <Button variant="primary" size="lg">
              {ctaText}
            </Button>
          </Link>
        ) : (
          <Button variant="primary" size="lg" onClick={handleCtaClick}>
            {ctaText}
          </Button>
        )}
      </div>
    </div>
  );
}
