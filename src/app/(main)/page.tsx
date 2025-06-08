import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  BeakerIcon, 
  ChartBarIcon, 
  CubeTransparentIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
  {
    title: 'AI-Powered Analytics',
    description: 'Advanced machine learning algorithms analyze market trends and suggest optimal strategies.',
    icon: BeakerIcon,
  },
  {
    title: 'Cross-Chain Integration',
    description: 'Seamlessly manage assets across multiple blockchain networks from a single dashboard.',
    icon: CubeTransparentIcon,
  },
  {
    title: 'Tokenized Assets',
    description: 'Convert real-world assets into digital tokens for enhanced liquidity and trading.',
    icon: ChartBarIcon,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24">
        <div className="container px-6 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Next Generation DeFi Asset Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              AI-powered platform for managing tokenized real-world assets with institutional-grade security and performance.
            </p>
            <div className="flex items-center justify-center gap-4 mt-10">
              <Link href="/dashboard">
                <Button className="group">
                  Get Started
                  <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powered by Advanced Technology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-background hover:bg-background/90 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-primary-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/90">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to take control of your digital assets?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
              Join thousands of investors already using TokenIQ X to manage their
              DeFi portfolios
            </p>
            <div className="mt-8">
              <Link href="/dashboard">
                <Button className="bg-background text-foreground hover:bg-background/90">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container px-6 py-12 mx-auto">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TokenIQ X. All rights reserved.
            </div>
            <div className="flex mt-4 space-x-6 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">GitHub</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Discord</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.319 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.1 13.107 13.107 0 01-1.872-2.767.077.077 0 01.041-.106c.7-.25 1.37-.553 2.008-.907a.077.077 0 01.077 0c.32.23.65.44.99.62a.078.078 0 01.033.04 13.08 13.08 0 0111.96 0 .077.077 0 01.032-.04c.34-.18.67-.39.99-.62a.077.077 0 01.078 0c.638.354 1.308.657 2.008.907a.077.077 0 01.041.106 13.11 13.11 0 01-1.872 2.767.077.077 0 00-.041.1c.36.7.775 1.362 1.226 1.993a.077.077 0 00.084.028 19.9 19.9 0 005.993-3.03.077.077 0 00.031-.057c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.956 2.42-2.157 2.42z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
