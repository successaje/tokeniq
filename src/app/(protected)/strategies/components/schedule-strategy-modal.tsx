'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ScheduleStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyName: string;
  onSchedule: (date: Date, amount: string) => void;
}

export function ScheduleStrategyModal({ 
  isOpen, 
  onClose, 
  strategyName,
  onSchedule 
}: ScheduleStrategyModalProps) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [time, setTime] = useState('12:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && amount) {
      const scheduledDate = new Date(`${date}T${time}`);
      if (!isNaN(scheduledDate.getTime())) {
        onSchedule(scheduledDate, amount);
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule {strategyName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Execution Date</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full"
              />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Recurring</Label>
            <div className="flex space-x-2">
              {['None', 'Daily', 'Weekly', 'Monthly'].map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  className={cn(
                    'flex-1',
                    option === 'None' ? 'bg-primary/10 border-primary' : ''
                  )}
                  size="sm"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Strategy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
