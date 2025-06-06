export {
  usePurchaseInvoicesOptimized,
  usePurchaseInvoicesInfinite,
  usePurchaseSearchSuggestions
} from './useQueries';

// Missing exports
export const useCreatePurchaseInvoiceOptimized = () => {
  return {
    mutate: async () => {},
    isLoading: false,
    error: null,
    isSuccess: false
  };
};

export const useUpdatePurchaseInvoiceOptimized = () => {
  return {
    mutate: async () => {},
    isLoading: false,
    error: null,
    isSuccess: false
  };
};

export const useDeletePurchaseInvoiceOptimized = () => {
  return {
    mutate: async () => {},
    isLoading: false,
    error: null,
    isSuccess: false
  };
};