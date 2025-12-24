'use client';

import { useState } from 'react';
import { HeroSparkles } from '@widgets/hero-sparkles';
import { HeroNeuralConstellation } from '@widgets/hero-neural-constellation';
import { cn } from '@/shared/lib/utils';
import styles from './HeroesDemo.module.css';

const heroes = [
  { id: 'sparkles', name: 'Hero Sparkles', component: HeroSparkles },
  { id: 'neural', name: 'Neural Constellation', component: HeroNeuralConstellation },
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
