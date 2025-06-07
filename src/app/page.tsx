import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  BeakerIcon, 
  ChartBarIcon, 
  CubeTransparentIcon 
} from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">TokenIQ X</div>
            <div className="flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white">
                Features
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">
                Dashboard
              </Link>
              <Link href="https://docs.tokeniq.com" className="text-gray-300 hover:text-white">
                Docs
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              The Next Generation of DeFi Asset Management
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Harness the power of AI and blockchain technology to optimize your digital asset portfolio
              across multiple chains.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/dashboard">
                <Button size="lg" leftIcon={<ChartBarIcon className="w-5 h-5" />}>
                  Launch App
                </Button>
              </Link>
              <Link href="https://docs.tokeniq.com">
                <Button size="lg" variant="outline">
                  Read Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600 rounded-full opacity-30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-800 rounded-full opacity-30 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-800/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powered by Advanced Technology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-gray-800 hover:bg-gray-750 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-primary-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 mb-4 md:mb-0">
              © 2024 TokenIQ X. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <Link href="https://docs.tokeniq.com" className="text-gray-300 hover:text-white">
                Documentation
              </Link>
              <Link href="https://github.com/tokeniq" className="text-gray-300 hover:text-white">
                GitHub
              </Link>
              <Link href="https://chain.link" className="text-gray-300 hover:text-white">
                Chainlink
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <div className="bg-red-500 text-white p-10">
        If you see a red background, Tailwind is working!
      </div>
    </div>
  );
}
