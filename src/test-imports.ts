// Test file to verify module resolution
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

// Log the imports to verify they work
const results = {
  Button: typeof Button !== 'undefined',
  Card: typeof Card !== 'undefined',
  Input: typeof Input !== 'undefined',
  Select: typeof Select !== 'undefined',
};

console.log('Import test results:');
Object.entries(results).forEach(([name, success]) => {
  console.log(`  ${name}: ${success ? '✅' : '❌'} ${success ? 'Imported successfully' : 'Failed to import'}`);
});

// Export to ensure tree-shaking doesn't remove the imports
export { Button, Card, Input, Select };
