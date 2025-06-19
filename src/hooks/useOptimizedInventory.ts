// Re-export from useQueries for compatibility
export { useOptimizedInventory } from './useQueries';

// Missing exports
export const useInventoryAnalytics = (_shopId?: number) => {
  // Return a placeholder implementation for now
  return {
    data: {
      totalItems: 0,
      newItemsThisMonth: 0,
      totalValue: 0,
      valueChange: 0
    },
    isLoading: false
  };
};

export const useLowStockAlerts = (_shopId?: number) => {
  // Return a placeholder implementation for now
  return {
    data: [],
    isLoading: false
  };
};