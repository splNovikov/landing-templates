import { Button } from '@/shared/ui';

/**
 * Home Page Component
 * Main landing page using FSD architecture
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg-body">
      <div className="max-w-content w-full text-center">
        <h1 className="text-4xl font-bold mb-6 text-text-primary">Welcome to Landing Templates</h1>
        <p className="text-text-secondary mb-8 text-lg">
          Modern landing page templates built with Next.js, TypeScript, Tailwind CSS, and
          Feature-Sliced Design architecture.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button variant="primary" size="lg" className="shadow-secondary-glow">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
        {/* Secondary color usage examples */}
        <div className="mt-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-text-primary">
              Secondary Color Usage (Electric Blue)
            </h2>
            <p className="text-text-secondary mb-6">
              Secondary color is used for decorative effects: shadows, highlights, gradients, and
              accents
            </p>
          </div>

          {/* Shadows */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-primary">Shadows</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="p-6 rounded-lg bg-bg-surface shadow-secondary-sm">
                Secondary Shadow SM
              </div>
              <div className="p-6 rounded-lg bg-bg-surface shadow-secondary-md">
                Secondary Shadow MD
              </div>
              <div className="p-6 rounded-lg bg-bg-surface shadow-secondary-lg">
                Secondary Shadow LG
              </div>
              <div className="p-6 rounded-lg bg-bg-surface shadow-secondary-xl">
                Secondary Shadow XL
              </div>
              <div className="p-6 rounded-lg bg-bg-surface shadow-secondary-glow">
                Secondary Glow
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-primary">Highlights & Borders</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="p-6 rounded-lg bg-bg-surface border-2 border-secondary">
                Border Highlight
              </div>
              <div className="p-6 rounded-lg bg-bg-surface border-l-4 border-secondary">
                Left Border Highlight
              </div>
              <div className="p-6 rounded-lg bg-bg-surface ring-2 ring-secondary ring-offset-2">
                Ring Highlight
              </div>
            </div>
          </div>

          {/* Gradients */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-primary">Gradients</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="p-6 rounded-lg bg-gradient-to-r from-secondary to-secondary-hover text-white">
                Gradient (Secondary)
              </div>
              <div className="p-6 rounded-lg bg-gradient-to-br from-secondary-light via-secondary to-secondary-hover text-white">
                Multi-stop Gradient
              </div>
              <div className="p-6 rounded-lg bg-gradient-to-r from-transparent via-secondary/20 to-transparent">
                Subtle Gradient Overlay
              </div>
            </div>
          </div>

          {/* Combined Effects */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-primary">Combined Effects</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="p-6 rounded-lg bg-bg-surface border border-secondary/30 shadow-secondary-md">
                Shadow + Border
              </div>
              <div className="p-6 rounded-lg bg-gradient-to-br from-secondary-light to-bg-surface border-l-4 border-secondary shadow-secondary-glow">
                Gradient + Border + Glow
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
