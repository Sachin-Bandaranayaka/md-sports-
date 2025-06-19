/**
 * Real-time updates hook for Vercel deployment
 * Replaces Socket.IO with polling-based approach
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface RealtimeUpdate {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  shopId?: string;
}

interface RealtimeState {
  updates: RealtimeUpdate[];
  isConnected: boolean;
  lastPoll: number;
  error: string | null;
}

interface UseRealtimeOptions {
  types?: string[];
  interval?: number;
  enabled?: boolean;
  onUpdate?: (update: RealtimeUpdate) => void;
}

// Global singleton state to prevent multiple polling instances
class RealtimeManager {
  private static instance: RealtimeManager;
  private intervalRef: NodeJS.Timeout | null = null;
  private lastPollRef = Date.now();
  private retryCountRef = 0;
  private maxRetries = 5;
  private baseInterval = 5000;
  private subscribers = new Set<(state: RealtimeState) => void>();
  private state: RealtimeState = {
    updates: [],
    isConnected: false,
    lastPoll: Date.now(),
    error: null
  };
  private currentOptions: UseRealtimeOptions = {};
  private accessToken: string | null = null;
  private enabled = false;

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  subscribe(callback: (state: RealtimeState) => void): () => void {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.state);
    return () => {
      this.subscribers.delete(callback);
      // If no more subscribers, stop polling
      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  private setState(newState: Partial<RealtimeState>) {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  updateOptions(options: UseRealtimeOptions, accessToken: string | null) {
    const shouldRestart = 
      this.accessToken !== accessToken ||
      this.enabled !== (options.enabled ?? true) ||
      JSON.stringify(this.currentOptions.types) !== JSON.stringify(options.types);

    this.currentOptions = options;
    this.accessToken = accessToken;
    this.enabled = options.enabled ?? true;
    this.baseInterval = options.interval ?? 5000;

    if (shouldRestart && this.enabled && this.accessToken && this.subscribers.size > 0) {
      this.startPolling();
    } else if (!this.enabled || !this.accessToken) {
      this.stopPolling();
    }
  }

  private async poll() {
    if (!this.accessToken || !this.enabled || this.subscribers.size === 0) return;

    try {
      const types = this.currentOptions.types || ['inventory', 'invoice', 'transfer', 'notification'];
      const params = new URLSearchParams({
        lastPoll: this.lastPollRef.toString(),
        types: types.join(',')
      });

      const response = await fetch(`/api/realtime?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.lastPollRef = data.timestamp;

      // Reset retry count on successful request
      this.retryCountRef = 0;

      this.setState({
        updates: [...data.updates, ...this.state.updates].slice(0, 100), // Keep last 100
        isConnected: true,
        lastPoll: data.timestamp,
        error: null
      });

      // Call onUpdate for each new update
      if (this.currentOptions.onUpdate && data.updates.length > 0) {
        data.updates.forEach(this.currentOptions.onUpdate);
      }

    } catch (error) {
      console.error('Realtime polling error:', error);
      this.retryCountRef++;
      
      // If we've exceeded max retries, stop polling to prevent resource exhaustion
      if (this.retryCountRef >= this.maxRetries) {
        console.warn('Max retries exceeded, stopping realtime polling to prevent resource exhaustion');
        this.stopPolling();
        this.setState({
          isConnected: false,
          error: 'Connection failed after multiple retries. Please refresh the page.'
        });
        return;
      }
      
      this.setState({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private startPolling() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }

    // Reset retry count when starting fresh
    this.retryCountRef = 0;

    // Initial poll
    this.poll();

    // Set up interval with exponential backoff if there are retries
    const currentInterval = this.retryCountRef > 0 
      ? Math.min(this.baseInterval * Math.pow(2, this.retryCountRef), 60000) // Max 60 seconds
      : this.baseInterval;
    
    this.intervalRef = setInterval(() => this.poll(), currentInterval);
  }

  private stopPolling() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    this.setState({ isConnected: false });
  }

  restartPolling() {
    this.retryCountRef = 0;
    this.startPolling();
  }

  async publishUpdate(type: string, data: any, shopId?: string) {
    if (!this.accessToken) return;

    try {
      await fetch('/api/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data, shopId })
      });
    } catch (error) {
      console.error('Failed to publish update:', error);
    }
  }

  clearUpdates() {
    this.setState({ updates: [] });
  }

  getUpdatesByType(type: string) {
    return this.state.updates.filter(update => update.type === type);
  }
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [state, setState] = useState<RealtimeState>({
    updates: [],
    isConnected: false,
    lastPoll: Date.now(),
    error: null
  });

  const manager = RealtimeManager.getInstance();

  // Subscribe to manager state changes
  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  // Update manager options when they change
  useEffect(() => {
    if (isAuthenticated) {
      manager.updateOptions(options, accessToken);
    }
  }, [manager, options, accessToken, isAuthenticated]);

  const publishUpdate = useCallback(async (type: string, data: any, shopId?: string) => {
    return manager.publishUpdate(type, data, shopId);
  }, [manager]);

  const clearUpdates = useCallback(() => {
    manager.clearUpdates();
  }, [manager]);

  const getUpdatesByType = useCallback((type: string) => {
    return manager.getUpdatesByType(type);
  }, [manager]);

  const startPolling = useCallback(() => {
    manager.updateOptions(options, accessToken);
  }, [manager, options, accessToken]);

  const stopPolling = useCallback(() => {
    manager.updateOptions({ ...options, enabled: false }, accessToken);
  }, [manager, options, accessToken]);

  const restartPolling = useCallback(() => {
    manager.restartPolling();
  }, [manager]);

  return {
    updates: state.updates,
    isConnected: state.isConnected,
    lastPoll: state.lastPoll,
    error: state.error,
    publishUpdate,
    clearUpdates,
    getUpdatesByType,
    startPolling,
    stopPolling,
    restartPolling
  };
}

// Specialized hooks for different update types
export function useInventoryUpdates(options?: Omit<UseRealtimeOptions, 'types'>) {
  return useRealtime({ ...options, types: ['inventory'] });
}

export function useInvoiceUpdates(options?: Omit<UseRealtimeOptions, 'types'>) {
  return useRealtime({ ...options, types: ['invoice'] });
}

export function useNotifications(options?: Omit<UseRealtimeOptions, 'types'>) {
  return useRealtime({ ...options, types: ['notification'] });
}

export function useTransferUpdates(options?: Omit<UseRealtimeOptions, 'types'>) {
  return useRealtime({ ...options, types: ['transfer'] });
}

export function usePurchaseUpdates(options?: Omit<UseRealtimeOptions, 'types'>) {
  return useRealtime({ ...options, types: ['purchase'] });
}

export function useSupplierUpdates(options?: Omit<UseRealtimeOptions, 'types'>) {
  return useRealtime({ ...options, types: ['supplier'] });
}