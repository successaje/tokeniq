'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Vault } from './vault-list';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import AaveVault from '@/abis/AaveVault.json';
import { useContracts } from '@/contexts/ContractContext';

interface VaultWithdrawDialogProps {
  vault: Vault | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultWithdrawDialog({ vault, open, onOpenChange }: VaultWithdrawDialogProps) {
  const [amount, setAmount] = useState('');
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: vault?.vaultAddress as `0x${string}` | undefined,
  });

  const { refetchVaults } = useContracts();

  useEffect(() => {
    if (isConfirmed) {
      onOpenChange(false);
      refetchVaults();
    }
  }, [isConfirmed, onOpenChange, refetchVaults]);

  const handleWithdraw = async () => {
    if (!vault || !amount) return;
    writeContract({
      address: vault.vaultAddress,
      abi: AaveVault.abi,
      functionName: 'withdraw',
      args: [parseEther(amount)],
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
    if (!isOpen) {
      setAmount('');
    }
  };

  if (!vault) return null;

  const isProcessing = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw from {vault.asset} Vault</DialogTitle>
          <DialogDescription>
            Enter the amount of shares you want to withdraw from the vault.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount (Shares)</Label>
              {balance && (
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setAmount(balance.formatted)}
                  disabled={isProcessing}
                >
                  Balance: {Number(balance.formatted).toFixed(4)}
                </button>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">APY</span>
              <span className="font-medium">{vault.apy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">TVL</span>
              <span className="font-medium">{vault.tvl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Risk</span>
              <span className="font-medium capitalize">{vault.risk}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            Error: {error.shortMessage || error.message}
          </div>
        )}

        <DialogFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full" 
            onClick={handleWithdraw}
            disabled={!amount || isProcessing}
          >
            {isPending ? 'Check Wallet...' : isConfirming ? 'Processing...' : 'Withdraw'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
