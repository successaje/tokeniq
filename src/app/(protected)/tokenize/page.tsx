import { Metadata } from 'next';
import { TokenizeForm } from './components/tokenize-form';
import { TokenizeHeader } from './components/tokenize-header';

export const metadata: Metadata = {
  title: 'Tokenize Assets',
  description: 'Tokenize real-world assets on the blockchain',
};

export default function TokenizePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <TokenizeHeader />
      <div className="mt-8">
        <TokenizeForm />
      </div>
    </div>
  );
}
