'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Vault } from './vault-list';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import { erc20Abi } from 'viem';
import AaveVault from '@/abis/AaveVault.json';
import { useContracts } from '@/contexts/ContractContext';

interface VaultDepositDialogProps {
  vault: Vault | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultDepositDialog({ vault, open, onOpenChange }: VaultDepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: vault?.assetAddress,
  });

  const { refetchVaults } = useContracts();

  useEffect(() => {
    if (isConfirmed) {
      if (!isApproved) {
        setIsApproved(true);
      } else {
        onOpenChange(false);
        refetchVaults();
      }
    }
  }, [isConfirmed, isApproved, onOpenChange, refetchVaults]);

  const handleApprove = async () => {
    if (!vault || !amount) return;
    writeContract({
      address: vault.assetAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [vault.vaultAddress, parseEther(amount)],
    });
  };

  const handleDeposit = async () => {
    if (!vault || !amount) return;
    writeContract({
      address: vault.vaultAddress,
      abi: AaveVault.abi,
      functionName: 'deposit',
      args: [parseEther(amount)],
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
    if (!isOpen) {
      setAmount('');
      setIsApproved(false);
    }
  };

  if (!vault) return null;

  const isProcessing = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit to {vault.asset} Vault</DialogTitle>
          <DialogDescription>
            Enter the amount you want to deposit into the vault.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount ({vault.asset})</Label>
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
          {!isApproved ? (
            <Button 
              className="w-full" 
              onClick={handleApprove}
              disabled={!amount || isProcessing}
            >
              {isPending ? 'Check Wallet...' : isConfirming ? 'Approving...' : `Approve ${vault.asset}`}
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleDeposit}
              disabled={!amount || isProcessing}
            >
              {isPending ? 'Check Wallet...' : isConfirming ? 'Processing...' : 'Deposit'}
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
