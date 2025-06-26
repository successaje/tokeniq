import { useState, useEffect, useCallback, useMemo } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useVaults } from './useVaults';
import { useVaultPositions } from './useVaultPositions';
import { useVaultStaking } from './useVaultStaking';
import { useVaultGovernance } from './useVaultGovernance';

// Types for notifications
export type NotificationType = 
  | 'deposit'
  | 'withdrawal'
  | 'harvest'
  | 'strategy_update'
  | 'governance_proposal'
  | 'governance_vote'
  | 'staking_rewards'
  | 'price_alert'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  vaultAddress?: Address;
  txHash?: `0x${string}`;
  link?: string;
  data?: Record<string, any>;
}

type UseVaultNotificationsProps = {
  vaultAddress?: Address; // If provided, only show notifications for this vault
  types?: NotificationType[]; // If provided, only show notifications of these types
  unreadOnly?: boolean; // If true, only show unread notifications
  limit?: number; // Maximum number of notifications to return
  refreshInterval?: number; // in milliseconds
};

export function useVaultNotifications({
  vaultAddress,
  types,
  unreadOnly = false,
  limit = 50,
  refreshInterval = 60000, // 1 minute
}: UseVaultNotificationsProps = {}) {
  const { address } = useAccount();
  const { allVaults, getUserVaultTransactions } = useVaults();
  const { getPosition } = useVaultPositions();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Generate a unique ID for notifications
  const generateId = useCallback(() => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }, []);
  
  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!address) {
      setNotifications([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch notifications from an API or indexer
      // For now, we'll generate mock notifications based on user's vault activity
      
      // Get all vaults or the specified vault
      const targetVaults = vaultAddress 
        ? allVaults.filter(v => v.address.toLowerCase() === vaultAddress.toLowerCase())
        : allVaults;
      
      // Generate notifications based on user's vault activity
      const generatedNotifications: Notification[] = [];
      
      // Check each vault for activity
      for (const vault of targetVaults) {
        // Get user's position in the vault
        const position = getPosition(vault.address);
        if (!position || position.balance <= 0) continue;
        
        // Get recent transactions for the vault
        const transactions = await getUserVaultTransactions(vault.address);
        
        // Generate notifications from transactions
        for (const tx of transactions.slice(0, 10)) { // Limit to 10 most recent
          let type: NotificationType = 'system';
          let title = 'Vault Activity';
          let message = '';
          
          switch (tx.type) {
            case 'deposit':
              type = 'deposit';
              title = 'Deposit Confirmed';
              message = `You deposited ${formatAmount(tx.amount, 18)} ${vault.symbol} into ${vault.name}`;
              break;
              
            case 'withdraw':
              type = 'withdrawal';
              title = 'Withdrawal Processed';
              message = `You withdrew ${formatAmount(tx.amount, 18)} ${vault.symbol} from ${vault.name}`;
              break;
              
            case 'harvest':
              type = 'harvest';
              title = 'Harvest Complete';
              message = `Harvested rewards from ${vault.name}`;
              break;
              
            case 'strategy_update':
              type = 'strategy_update';
              title = 'Strategy Updated';
              message = `Strategy for ${vault.name} has been updated`;
              break;
              
            default:
              continue; // Skip unknown transaction types
          }
          
          generatedNotifications.push({
            id: `tx-${tx.txHash}`,
            type,
            title,
            message,
            timestamp: tx.timestamp || Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400), // Random time in last 24h
            read: false,
            vaultAddress: vault.address,
            txHash: tx.txHash as `0x${string}`,
            data: {
              amount: tx.amount,
              token: vault.asset,
            },
          });
        }
        
        // Generate price alert notifications (example)
        if (Math.random() > 0.7) { // 30% chance of a price alert
          const change = (Math.random() * 10) - 3; // -3% to +7% change
          if (Math.abs(change) > 5) { // Only notify for significant changes
            generatedNotifications.push({
              id: `price-${vault.address}-${Date.now()}`,
              type: 'price_alert',
              title: 'Price Alert',
              message: `${vault.symbol} price ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(2)}%`,
              timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600), // Random time in last hour
              read: false,
              vaultAddress: vault.address,
              data: {
                change,
                direction: change > 0 ? 'up' : 'down',
              },
            });
          }
        }
      }
      
      // Add some system notifications (example)
      if (generatedNotifications.length === 0 || Math.random() > 0.7) {
        const systemMessages = [
          'New vault strategies are now available',
          'Scheduled maintenance this weekend',
          'Governance proposal #42 is now live',
          'New features released: Check out the dashboard updates',
        ];
        
        generatedNotifications.push({
          id: `system-${Date.now()}`,
          type: 'system',
          title: 'System Update',
          message: systemMessages[Math.floor(Math.random() * systemMessages.length)],
          timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // Random time in last 2 days
          read: false,
        });
      }
      
      // Sort by timestamp (newest first)
      const sortedNotifications = generatedNotifications.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply limit
      const limitedNotifications = limit ? sortedNotifications.slice(0, limit) : sortedNotifications;
      
      setNotifications(limitedNotifications);
      setLastUpdated(Date.now());
      
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  }, [address, vaultAddress, allVaults, limit, getPosition, getUserVaultTransactions]);
  
  // Format amount with decimals
  const formatAmount = (amount: bigint, decimals: number): string => {
    const value = Number(amount) / (10 ** decimals);
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };
  
  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true } 
          : notif
      )
    );
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({
        ...notif,
        read: true,
      }))
    );
  }, []);
  
  // Delete a notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []); 
  
  // Filter notifications based on props
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      // Filter by vault address if provided
      if (vaultAddress && notif.vaultAddress?.toLowerCase() !== vaultAddress.toLowerCase()) {
        return false;
      }
      
      // Filter by type if provided
      if (types && types.length > 0 && !types.includes(notif.type)) {
        return false;
      }
      
      // Filter by read status if unreadOnly is true
      if (unreadOnly && notif.read) {
        return false;
      }
      
      return true;
    });
  }, [notifications, vaultAddress, types, unreadOnly]);
  
  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);
  
  // Get notifications by type
  const notificationsByType = useMemo(() => {
    return filteredNotifications.reduce((acc, notif) => {
      if (!acc[notif.type]) {
        acc[notif.type] = [];
      }
      acc[notif.type].push(notif);
      return acc;
    }, {} as Record<NotificationType, Notification[]>);
  }, [filteredNotifications]);
  
  // Get recent notifications (last 7 days)
  const recentNotifications = useMemo(() => {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    return filteredNotifications.filter(notif => notif.timestamp >= sevenDaysAgo);
  }, [filteredNotifications]);
  
  // Set up polling for data refresh
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Set up interval for polling
    const intervalId = setInterval(fetchNotifications, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchNotifications, refreshInterval]);
  
  return {
    // State
    notifications: filteredNotifications,
    loading,
    error,
    lastUpdated,
    
    // Derived data
    unreadCount,
    notificationsByType,
    recentNotifications,
    
    // Actions
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Helpers
    hasUnread: unreadCount > 0,
    isEmpty: filteredNotifications.length === 0,
  };
}
