import { useState } from 'react';
import { useTokenizedVault } from '@/hooks/useTokenizedVault';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { useToast } from './ui/use-toast';

export function TokenizeVaultForm() {
  const { toast } = useToast();
  const { tokenizeVaultPosition, isLoading, error } = useTokenizedVault();
  
  const [formData, setFormData] = useState({
    tokenName: 'Aave Vault Token',
    tokenSymbol: 'AVT',
    amount: '1',
    depositFee: 10, // 0.1%
    withdrawalFee: 10, // 0.1%
    performanceFee: 2000, // 20%
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeeChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await tokenizeVaultPosition({
      tokenName: formData.tokenName,
      tokenSymbol: formData.tokenSymbol,
      amount: formData.amount,
      feeConfig: {
        depositFeeBasisPoints: formData.depositFee,
        withdrawalFeeBasisPoints: formData.withdrawalFee,
        performanceFeeBasisPoints: formData.performanceFee,
      },
      onSuccess: (txHash) => {
        toast({
          title: 'Success!',
          description: `Tokenization transaction submitted: ${txHash}`,
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Tokenize Aave Vault Position</CardTitle>
        <CardDescription>
          Create an ERC20 token that represents your position in the Aave Vault
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tokenName">Token Name</Label>
              <Input
                id="tokenName"
                name="tokenName"
                value={formData.tokenName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokenSymbol">Token Symbol</Label>
              <Input
                id="tokenSymbol"
                name="tokenSymbol"
                value={formData.tokenSymbol}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Deposit</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.000000000000000001"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <div className="flex justify-between">
                <Label>Deposit Fee: {(formData.depositFee / 100).toFixed(2)}%</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.depositFee} basis points
                </span>
              </div>
              <Slider
                value={[formData.depositFee]}
                onValueChange={([value]) => handleFeeChange('depositFee', value)}
                min={0}
                max={1000} // 10% max
                step={1}
                className="py-4"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <Label>Withdrawal Fee: {(formData.withdrawalFee / 100).toFixed(2)}%</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.withdrawalFee} basis points
                </span>
              </div>
              <Slider
                value={[formData.withdrawalFee]}
                onValueChange={([value]) => handleFeeChange('withdrawalFee', value)}
                min={0}
                max={1000} // 10% max
                step={1}
                className="py-4"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <Label>Performance Fee: {(formData.performanceFee / 100).toFixed(2)}%</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.performanceFee} basis points
                </span>
              </div>
              <Slider
                value={[formData.performanceFee]}
                onValueChange={([value]) => handleFeeChange('performanceFee', value)}
                min={0}
                max={5000} // 50% max
                step={10}
                className="py-4"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Tokenize Position'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
