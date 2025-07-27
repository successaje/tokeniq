'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';

export default function Whitepaper() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-20 bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Button asChild variant="ghost" className="mb-8 -ml-3">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                TokenIQ Whitepaper
              </h1>
              <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
                A decentralized AI-driven DeFi platform leveraging Core blockchain and Chainlink CCIP
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <a href="#abstract" className="px-6">
                    Read Abstract
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      const content = document.getElementById('whitepaper-content')?.innerText || '';
                      const blob = new Blob([content], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'tokeniq-whitepaper.md';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-6 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Markdown
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-6">
          <Card className="max-w-4xl mx-auto p-8">
            <article className="prose dark:prose-invert max-w-none" id="whitepaper-content">
              <header className="mb-12">
                <h1 className="text-4xl font-bold mb-4">TokenIQ Whitepaper</h1>
                <p className="text-foreground/80">A decentralized AI-driven DeFi platform leveraging Core blockchain and Chainlink CCIP</p>
                <div className="mt-2 text-sm text-foreground/60">
                  <span>By: TokenIQ Core Team</span>
                  <span className="mx-2">•</span>
                  <span>Last Updated: June 26, 2025</span>
                </div>
              </header>

              <section id="abstract" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Abstract</h2>
                <p className="text-lg mb-6">
                  TokenIQ is a next-generation decentralized finance (DeFi) platform that brings together Bitcoin (via BTCfi), artificial intelligence, and cross-chain infrastructure. Built on the Core blockchain and powered by Chainlink's Cross-Chain Interoperability Protocol (CCIP), TokenIQ empowers users to stake, borrow, tokenize, and grow their Bitcoin portfolios through intelligent automation and seamless user experience.
                </p>
              </section>

              <section id="vision" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Vision</h2>
                <p className="text-lg mb-6">
                  To democratize access to intelligent finance by transforming Bitcoin from a passive asset into an active financial instrument across chains, powered by AI-driven automation and strategy.
                </p>
              </section>

              <section id="core-components" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Core Components</h2>
                
                <div className="space-y-12">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">1. ElizaOS (AI Agent)</h3>
                    <p className="mb-4">An autonomous AI assistant that:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                      <li>Generates personalized strategies.</li>
                      <li>Monitors market movements.</li>
                      <li>Triggers vault rebalancing and portfolio actions.</li>
                      <li>Communicates insights in real-time through the interface.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold mb-4">2. BTCfi Vaults</h3>
                    <p className="mb-4">AI-optimized yield vaults that allow users to:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                      <li>Stake BTC for yield.</li>
                      <li>Participate in DeFi opportunities like lending/borrowing.</li>
                      <li>Automate risk-managed yield strategies.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold mb-4">3. Chainlink CCIP Bridge</h3>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                      <li>Enables secure, cross-chain BTC transfers.</li>
                      <li>Allows BTC to be represented and used across other EVM chains.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold mb-4">4. Tokenization Suite</h3>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                      <li>Convert real-world assets (RWAs), invoices, or carbon credits into on-chain assets.</li>
                      <li>Use BTC or Core assets as collateral for minting.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold mb-4">5. Borrowing & Lending Layer</h3>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                      <li>Users can borrow stablecoins against BTC collateral.</li>
                      <li>Integrated with Aave protocol.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="features" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Key Features</h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="mr-2">🧠</span>
                    <span><strong>AI-Powered Finance</strong>: Strategy generation, insights, and execution.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚡</span>
                    <span><strong>High Throughput</strong>: Built on Core Blockchain for scalability.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔗</span>
                    <span><strong>Interoperability</strong>: Powered by Chainlink CCIP.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔒</span>
                    <span><strong>Security</strong>: Smart contract audits, permissionless architecture.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">💼</span>
                    <span><strong>Portfolio Management</strong>: Full user control over assets and history.</span>
                  </li>
                </ul>
              </section>

              <section id="btcfi-use-cases" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">BTCfi Use Cases</h2>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>Stake BTC in AI-optimized vaults.</li>
                  <li>Borrow stablecoins or other assets using BTC as collateral.</li>
                  <li>Bridge BTC to other chains.</li>
                  <li>Tokenize and trade real-world assets using BTC.</li>
                  <li>Generate AI strategies tailored to market conditions.</li>
                </ol>
              </section>

              <section id="architecture" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Architecture Overview</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Core Blockchain</strong>: Settlement and execution layer.</li>
                  <li><strong>Chainlink CCIP</strong>: Cross-chain token movement and messaging.</li>
                  <li><strong>ElizaOS</strong>: AI logic layer for automation.</li>
                  <li><strong>Smart Contracts</strong>: Vaults, lending, tokenization modules.</li>
                </ul>
              </section>

              <section id="token-utility" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Token Utility (TKNIQ)</h2>
                <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic">
                  <p>To be added in Tokenomics update.</p>
                </blockquote>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Governance rights.</li>
                  <li>Staking for rewards.</li>
                  <li>Fee discounts and AI premium access.</li>
                </ul>
              </section>

              <section id="roadmap" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Roadmap</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-3 mt-1">✓</span>
                    <div>
                      <strong>Q2 2025</strong>: MVP Launch on Core Testnet
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-3 mt-1">🧪</span>
                    <div>
                      <strong>Q3 2025</strong>: BTCfi Vaults, Bridge, and Tokenization
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-3 mt-1">🚀</span>
                    <div>
                      <strong>Q4 2025</strong>: Mainnet Launch and Global Expansion
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mr-3 mt-1">📈</span>
                    <div>
                      <strong>Q1 2026</strong>: DAO Formation, Lending, and RWAs
                    </div>
                  </li>
                </ul>
              </section>

              <section id="conclusion" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-primary">Conclusion</h2>
                <p className="text-lg mb-6">
                  TokenIQ represents the convergence of AI, Bitcoin, and DeFi — unlocking the next frontier of intelligent financial autonomy. By enabling Bitcoin holders to do more than hold, TokenIQ activates capital, bridges ecosystems, and empowers users with advanced financial strategies.
                </p>
                <div className="border-t border-border/30 pt-6 mt-8">
                  <p className="text-center text-2xl font-light italic">"Built for Bitcoiners, Powered by Intelligence."</p>
                </div>
              </section>

              <footer className="pt-8 mt-12 border-t border-border/30">
                <div className="flex flex-wrap gap-2 justify-center">
                  {['#BTCfi', '#DeFiEvolved', '#AIonChain', '#CoreBlockchain', '#ChainlinkCCIP', '#CoreDAO'].map((tag) => (
                    <span key={tag} className="inline-block bg-muted text-foreground/80 rounded-full px-3 py-1 text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </footer>
            </article>
          </Card>
        </div>
      </div>
    </div>
  );
}
