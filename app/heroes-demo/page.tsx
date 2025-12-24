'use client';

import { useState } from 'react';
import { HeroSparkles } from '@widgets/hero-sparkles';
import { HeroNeuralConstellation } from '@widgets/hero-neural-constellation';
import { HeroMinimalGrid } from '@widgets/hero-minimal-grid';
import { HeroSubtleMesh } from '@widgets/hero-subtle-mesh';
import { HeroMonochromeTexture } from '@widgets/hero-monochrome-texture';
import { HeroAnimatedLines } from '@widgets/hero-animated-lines';
import { HeroHybrid } from '@widgets/hero-hybrid';
import { HeroHybrid2 } from '@widgets/hero-hybrid-2';
import { cn } from '@/shared/lib/utils';
import styles from './HeroesDemo.module.css';

const heroes = [
  { id: 'sparkles', name: 'Hero Sparkles', component: HeroSparkles },
  { id: 'neural', name: 'Neural Constellation', component: HeroNeuralConstellation },
  { id: 'minimal-grid', name: 'Minimal Grid', component: HeroMinimalGrid },
  { id: 'subtle-mesh', name: 'Subtle Mesh', component: HeroSubtleMesh },
  { id: 'monochrome-texture', name: 'Monochrome Texture', component: HeroMonochromeTexture },
  { id: 'animated-lines', name: 'Animated Lines', component: HeroAnimatedLines },
  { id: 'hybrid', name: 'Hybrid', component: HeroHybrid },
  { id: 'hybrid-2', name: 'Hybrid 2', component: HeroHybrid2 },
] as const;

const commonProps = {
  topLabel: 'Next Generation',
  title: 'IT Solutions for the Future',
  subtitle: 'Architecture for millions. Technology for tomorrow.',
  techFeatures: [
    { icon: '⚡', text: 'High Performance' },
    { icon: '🔐', text: 'Enterprise Grade' },
    { icon: '📈', text: 'Scalability' },
  ],
  ctaText: 'Get Started',
  ctaHref: '/contact',
};

export default function HeroesDemoPage() {
  const [currentHero, setCurrentHero] = useState(0);

  const CurrentHero = heroes[currentHero].component;

  return (
    <div className={styles.container}>
      <CurrentHero {...commonProps} />

      <div className={styles.selector}>
        {heroes.map((hero, index) => (
          <button
            key={hero.id}
            onClick={() => setCurrentHero(index)}
            className={cn(styles.button, currentHero === index && styles.buttonActive)}
          >
            {hero.name}
          </button>
        ))}
      </div>
    </div>
  );
}
