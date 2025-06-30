'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function TestImports() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Import Test</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Button</h2>
          <Button>Test Button</Button>
          <p className="mt-2 text-sm text-green-600">✅ Button imported successfully</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Card</h2>
          <Card className="p-4">
            <p>Test Card Content</p>
          </Card>
          <p className="mt-2 text-sm text-green-600">✅ Card imported successfully</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Input</h2>
          <Input placeholder="Test input" />
          <p className="mt-2 text-sm text-green-600">✅ Input imported successfully</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Select</h2>
          <Select>
            <option>Option 1</option>
            <option>Option 2</option>
          </Select>
          <p className="mt-2 text-sm text-green-600">✅ Select imported successfully</p>
        </div>
      </div>
    </div>
  );
}
