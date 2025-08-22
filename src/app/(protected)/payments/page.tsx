'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from 'wagmi';

type PaymentMethod = 'crypto' | 'card' | 'bank';

export default function PaymentsPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('crypto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !amount) return;
    
    setIsProcessing(true);
    try {
      // TODO: Integrate with Yei Finance SDK/API
      // This is a placeholder for the actual integration
      console.log('Processing payment via Yei Finance:', {
        amount,
        paymentMethod,
        walletAddress: address
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would get this from the Yei Finance response
      setTransactionHash(`0x${Math.random().toString(16).substr(2, 64)}`);
      
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Send and receive payments with Yei Finance integration</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
            <CardDescription>Send payments using Yei Finance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={!isConnected || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Send Payment'}
              </Button>
              
              {!isConnected && (
                <p className="text-sm text-destructive text-center">
                  Please connect your wallet to make a payment
                </p>
              )}
              
              {transactionHash && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    Payment successful! Transaction hash: 
                    <a 
                      href={`https://testnet.bscscan.com/tx/${transactionHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline ml-1"
                    >
                      {`${transactionHash.substring(0, 10)}...${transactionHash.substring(58)}`}
                    </a>
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="font-medium">YEI Payment</p>
                  <p className="text-sm text-muted-foreground">Processing</p>
                </div>
                <div className="text-right">
                  <p className="font-mono">$0.00</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
              
              <div className="text-center py-6 text-muted-foreground">
                <p>No recent transactions</p>
                <p className="text-xs mt-1">Your payment history will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Yei Finance Integration</CardTitle>
            <CardDescription>
              Powered by Yei Finance - The next generation payment infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                Yei Finance provides seamless payment solutions with low fees and fast settlement.
                Our integration allows you to send and receive payments in multiple currencies.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Low transaction fees</li>
                <li>Fast settlement times</li>
                <li>Multiple payment methods</li>
                <li>Secure and compliant</li>
              </ul>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <a href="https://yei.finance" target="_blank" rel="noopener noreferrer">
                    Learn more about Yei Finance
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
