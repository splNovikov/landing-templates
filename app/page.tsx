import Link from 'next/link';
import { HeroSparkles } from '@widgets/hero-sparkles';
import { Button } from '@/shared/ui/button';
import styles from './page.module.css';

/**
 * Home Page Component
 * Main landing page using FSD architecture with HeroSparkles component
 */
export default function HomePage() {
  return (
    <div className={styles.pageWrapper}>
      <HeroSparkles
        topLabel="Industrial Scaling"
        title="IT Solutions for the Future"
        subtitle="Architecture for millions. Technology for tomorrow."
        techFeatures={[
          { icon: '⚡', text: 'High Performance' },
          { icon: '🔐', text: 'Enterprise Grade' },
          { icon: '📈', text: 'Scalability' },
        ]}
        ctaText="Get Started"
        ctaHref="/contact"
      />
      <Link href="/heroes-demo" className={styles.demoLink}>
        <Button variant="outline" size="md">
          View All Heroes
        </Button>
      </Link>
    </div>
  );
}
