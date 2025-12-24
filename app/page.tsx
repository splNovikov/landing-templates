import { HeroSparkles } from '@widgets/hero-sparkles';

/**
 * Home Page Component
 * Main landing page using FSD architecture with HeroSparkles component
 *
 * This is a Server Component for better SEO - the HeroSparkles component
 * handles its own client-side interactivity
 */
export default function HomePage() {
  return (
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
  );
}
