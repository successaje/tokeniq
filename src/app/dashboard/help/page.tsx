'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for FAQs
const FAQS = [
  {
    id: 1,
    question: 'How do I connect my wallet?',
    answer: 'To connect your wallet, click on the "Connect Wallet" button in the top right corner. We support MetaMask, WalletConnect, and other popular Web3 wallets.',
    category: 'Getting Started'
  },
  {
    id: 2,
    question: 'What are Real World Assets (RWAs)?',
    answer: 'Real World Assets (RWAs) are traditional financial assets that have been tokenized on the blockchain. This includes real estate, commodities, and other physical assets.',
    category: 'Concepts'
  },
  {
    id: 3,
    question: 'How do I tokenize my assets?',
    answer: 'To tokenize your assets, navigate to the RWA section and click on "Tokenize New Asset". Follow the step-by-step process to complete the tokenization.',
    category: 'Features'
  },
  {
    id: 4,
    question: 'What are the fees for using TokenIQ?',
    answer: 'TokenIQ charges a small percentage fee on transactions and asset management. The exact fee structure can be found in our documentation.',
    category: 'Pricing'
  },
  {
    id: 5,
    question: 'How secure is my data?',
    answer: 'We employ industry-standard security measures including encryption, multi-factor authentication, and regular security audits to protect your data.',
    category: 'Security'
  }
];

// Mock data for documentation sections
const DOCUMENTATION = [
  {
    id: 1,
    title: 'Getting Started Guide',
    description: 'Learn the basics of TokenIQ and how to get started',
    icon: BookOpenIcon
  },
  {
    id: 2,
    title: 'Asset Tokenization',
    description: 'Detailed guide on how to tokenize your assets',
    icon: DocumentTextIcon
  },
  {
    id: 3,
    title: 'API Documentation',
    description: 'Technical documentation for developers',
    icon: ArrowPathIcon
  }
];

export default function HelpPage() {
  const { address, isConnected } = useAccount();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to access help and support
        </p>
      </div>
    );
  }

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="text-muted-foreground">
            Find answers to your questions and get support
          </p>
        </div>
        <Button
          className="flex items-center"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
          Contact Support
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 rounded-lg bg-accent/20 border border-accent/30 text-foreground"
          />
          <QuestionMarkCircleIcon className="h-5 w-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      {/* Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {DOCUMENTATION.map((doc) => (
          <Card key={doc.id} className="bg-card hover:bg-accent/50 transition-colors">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <doc.icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-card-foreground">{doc.title}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{doc.description}</p>
              <Button variant="outline" className="w-full">View Guide</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* FAQs */}
      <Card className="bg-card hover:bg-accent/50 transition-colors mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-card-foreground">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.id}
                className="border border-accent/30 rounded-lg overflow-hidden"
              >
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-accent/20 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-foreground">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.category}</p>
                    </div>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="p-4 bg-accent/20 border-t border-accent/30">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Contact Support */}
      <Card className="bg-card hover:bg-accent/50 transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-card-foreground">Contact Support</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Subject</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 rounded-lg bg-accent/20 border border-accent/30 text-foreground"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea
                  className="w-full mt-1 p-2 rounded-lg bg-accent/20 border border-accent/30 text-foreground h-32"
                  placeholder="Describe your issue"
                />
              </div>
              <Button className="w-full">Send Message</Button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-accent/20 rounded-lg">
                <h3 className="font-medium text-card-foreground mb-2">Support Hours</h3>
                <p className="text-sm text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                <p className="text-sm text-muted-foreground">Saturday - Sunday: 10:00 AM - 4:00 PM EST</p>
              </div>
              <div className="p-4 bg-accent/20 rounded-lg">
                <h3 className="font-medium text-card-foreground mb-2">Response Time</h3>
                <p className="text-sm text-muted-foreground">We typically respond within 24 hours during business days.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
} 