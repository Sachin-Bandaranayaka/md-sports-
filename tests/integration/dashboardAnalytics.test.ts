import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Dashboard and Analytics System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock user with dashboard permissions
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Dashboard User',
        email: 'dashboard@test.com',
        permissions: ['dashboard:view', 'analytics:view', 'reports:view', 'sales:view', 'inventory:view']
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      hasPermission: jest.fn((permission) => {
        const userPermissions = ['dashboard:view', 'analytics:view', 'reports:view', 'sales:view', 'inventory:view'];
        return userPermissions.includes(permission);
      })
    });
  });

  describe('Sales Analytics', () => {
    test('should calculate sales metrics correctly', () => {
      const calculateSalesMetrics = (salesData: any[]) => {
        const totalRevenue = salesData.reduce((sum, sale) => sum + sale.amount, 0);
        const totalTransactions = salesData.length;
        const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        
        const today = new Date();
        const todaySales = salesData.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate.toDateString() === today.toDateString();
        });
        
        const thisMonth = salesData.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
        });
        
        return {
          totalRevenue,
          totalTransactions,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          todayRevenue: todaySales.reduce((sum, sale) => sum + sale.amount, 0),
          monthlyRevenue: thisMonth.reduce((sum, sale) => sum + sale.amount, 0),
          todayTransactions: todaySales.length,
          monthlyTransactions: thisMonth.length
        };
      };

      const salesData = [
        { id: 1, amount: 1000, date: new Date().toISOString() }, // Today
        { id: 2, amount: 1500, date: new Date().toISOString() }, // Today
        { id: 3, amount: 800, date: new Date(Date.now() - 86400000).toISOString() }, // Yesterday
        { id: 4, amount: 1200, date: new Date(Date.now() - 172800000).toISOString() } // 2 days ago
      ];

      const metrics = calculateSalesMetrics(salesData);
      
      expect(metrics.totalRevenue).toBe(4500);
      expect(metrics.totalTransactions).toBe(4);
      expect(metrics.averageOrderValue).toBe(1125);
      expect(metrics.todayRevenue).toBe(2500);
      expect(metrics.todayTransactions).toBe(2);
    });

    test('should calculate growth rates', () => {
      const calculateGrowthRate = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100 * 100) / 100;
      };

      const comparePerformance = (currentPeriod: any[], previousPeriod: any[]) => {
        const currentRevenue = currentPeriod.reduce((sum, sale) => sum + sale.amount, 0);
        const previousRevenue = previousPeriod.reduce((sum, sale) => sum + sale.amount, 0);
        
        const revenueGrowth = calculateGrowthRate(currentRevenue, previousRevenue);
        const transactionGrowth = calculateGrowthRate(currentPeriod.length, previousPeriod.length);
        
        return {
          currentRevenue,
          previousRevenue,
          revenueGrowth,
          transactionGrowth,
          trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable'
        };
      };

      const currentMonth = [
        { amount: 1000 },
        { amount: 1500 },
        { amount: 800 }
      ];
      
      const previousMonth = [
        { amount: 900 },
        { amount: 1100 }
      ];

      const performance = comparePerformance(currentMonth, previousMonth);
      
      expect(performance.currentRevenue).toBe(3300);
      expect(performance.previousRevenue).toBe(2000);
      expect(performance.revenueGrowth).toBe(65);
      expect(performance.transactionGrowth).toBe(50);
      expect(performance.trend).toBe('up');
    });

    test('should generate sales by category data', () => {
      const generateCategoryAnalysis = (salesData: any[]) => {
        const categoryTotals = salesData.reduce((acc, sale) => {
          const category = sale.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + sale.amount;
          return acc;
        }, {} as Record<string, number>);
        
        const totalRevenue = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        
        return Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: Math.round((amount / totalRevenue) * 100 * 100) / 100
          }))
          .sort((a, b) => b.amount - a.amount);
      };

      const salesData = [
        { category: 'Electronics', amount: 2000 },
        { category: 'Clothing', amount: 1500 },
        { category: 'Electronics', amount: 1000 },
        { category: 'Books', amount: 500 },
        { category: 'Clothing', amount: 800 }
      ];

      const analysis = generateCategoryAnalysis(salesData);
      
      expect(analysis[0]).toEqual({
        category: 'Electronics',
        amount: 3000,
        percentage: 51.72
      });
      expect(analysis[1]).toEqual({
        category: 'Clothing',
        amount: 2300,
        percentage: 39.66
      });
    });
  });

  describe('Inventory Analytics', () => {
    test('should calculate inventory turnover', () => {
      const calculateInventoryTurnover = (costOfGoodsSold: number, averageInventoryValue: number) => {
        if (averageInventoryValue === 0) return 0;
        return Math.round((costOfGoodsSold / averageInventoryValue) * 100) / 100;
      };

      const calculateDaysInInventory = (inventoryTurnover: number) => {
        if (inventoryTurnover === 0) return 0;
        return Math.round((365 / inventoryTurnover) * 100) / 100;
      };

      const turnover = calculateInventoryTurnover(120000, 20000);
      const daysInInventory = calculateDaysInInventory(turnover);
      
      expect(turnover).toBe(6);
      expect(daysInInventory).toBe(60.83);
    });

    test('should identify slow-moving inventory', () => {
      const identifySlowMovingItems = (inventoryItems: any[], salesData: any[], daysThreshold: number = 90) => {
        const itemSales = salesData.reduce((acc, sale) => {
          sale.items.forEach((item: any) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
          });
          return acc;
        }, {} as Record<string, number>);
        
        const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);
        
        return inventoryItems.filter(item => {
          const lastSaleQuantity = itemSales[item.id] || 0;
          const lastUpdated = new Date(item.lastUpdated);
          
          return lastSaleQuantity === 0 || lastUpdated < cutoffDate;
        }).map(item => ({
          ...item,
          daysSinceLastSale: Math.floor((Date.now() - new Date(item.lastUpdated).getTime()) / (24 * 60 * 60 * 1000)),
          totalSales: itemSales[item.id] || 0
        }));
      };

      const inventoryItems = [
        { id: 'item1', name: 'Product A', lastUpdated: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'item2', name: 'Product B', lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'item3', name: 'Product C', lastUpdated: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() }
      ];
      
      const salesData = [
        { items: [{ productId: 'item2', quantity: 5 }] }
      ];

      const slowMoving = identifySlowMovingItems(inventoryItems, salesData, 90);
      
      expect(slowMoving).toHaveLength(2); // item1 and item3
      expect(slowMoving.find(item => item.id === 'item1')?.daysSinceLastSale).toBe(100);
    });

    test('should calculate stock level alerts', () => {
      const generateStockAlerts = (inventoryItems: any[]) => {
        return inventoryItems.map(item => {
          const stockLevel = item.currentStock;
          const reorderPoint = item.reorderPoint || 0;
          const maxStock = item.maxStock || 0;
          
          let alertType = 'normal';
          let alertMessage = '';
          
          if (stockLevel <= 0) {
            alertType = 'critical';
            alertMessage = 'Out of stock';
          } else if (stockLevel <= reorderPoint) {
            alertType = 'warning';
            alertMessage = 'Low stock - reorder needed';
          } else if (stockLevel >= maxStock && maxStock > 0) {
            alertType = 'info';
            alertMessage = 'Overstock';
          }
          
          return {
            ...item,
            alertType,
            alertMessage,
            stockPercentage: maxStock > 0 ? Math.round((stockLevel / maxStock) * 100) : 0
          };
        }).filter(item => item.alertType !== 'normal');
      };

      const inventoryItems = [
        { id: 'item1', name: 'Product A', currentStock: 0, reorderPoint: 10, maxStock: 100 },
        { id: 'item2', name: 'Product B', currentStock: 5, reorderPoint: 10, maxStock: 100 },
        { id: 'item3', name: 'Product C', currentStock: 50, reorderPoint: 10, maxStock: 100 },
        { id: 'item4', name: 'Product D', currentStock: 120, reorderPoint: 10, maxStock: 100 }
      ];

      const alerts = generateStockAlerts(inventoryItems);
      
      expect(alerts).toHaveLength(3);
      expect(alerts.find(alert => alert.id === 'item1')?.alertType).toBe('critical');
      expect(alerts.find(alert => alert.id === 'item2')?.alertType).toBe('warning');
      expect(alerts.find(alert => alert.id === 'item4')?.alertType).toBe('info');
    });
  });

  describe('Financial Analytics', () => {
    test('should calculate profit margins', () => {
      const calculateProfitMargins = (salesData: any[]) => {
        return salesData.map(sale => {
          const revenue = sale.amount;
          const cost = sale.cost || 0;
          const profit = revenue - cost;
          const marginPercentage = revenue > 0 ? Math.round((profit / revenue) * 100 * 100) / 100 : 0;
          
          return {
            ...sale,
            profit,
            marginPercentage,
            profitCategory: marginPercentage >= 30 ? 'high' : marginPercentage >= 15 ? 'medium' : 'low'
          };
        });
      };

      const salesData = [
        { id: 1, amount: 1000, cost: 600 },
        { id: 2, amount: 1500, cost: 1200 },
        { id: 3, amount: 800, cost: 400 }
      ];

      const margins = calculateProfitMargins(salesData);
      
      expect(margins[0].profit).toBe(400);
      expect(margins[0].marginPercentage).toBe(40);
      expect(margins[0].profitCategory).toBe('high');
      
      expect(margins[1].marginPercentage).toBe(20);
      expect(margins[1].profitCategory).toBe('medium');
      
      expect(margins[2].marginPercentage).toBe(50);
      expect(margins[2].profitCategory).toBe('high');
    });

    test('should calculate cash flow projections', () => {
      const calculateCashFlow = (transactions: any[], projectionDays: number = 30) => {
        const today = new Date();
        const projectionDate = new Date(today.getTime() + projectionDays * 24 * 60 * 60 * 1000);
        
        const inflows = transactions
          .filter(t => t.type === 'income' && new Date(t.dueDate) <= projectionDate)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const outflows = transactions
          .filter(t => t.type === 'expense' && new Date(t.dueDate) <= projectionDate)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const netCashFlow = inflows - outflows;
        
        return {
          projectionPeriod: projectionDays,
          expectedInflows: inflows,
          expectedOutflows: outflows,
          netCashFlow,
          cashFlowStatus: netCashFlow > 0 ? 'positive' : netCashFlow < 0 ? 'negative' : 'neutral'
        };
      };

      const transactions = [
        { type: 'income', amount: 5000, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'income', amount: 3000, dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'expense', amount: 2000, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'expense', amount: 1500, dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() } // Outside 30-day window
      ];

      const cashFlow = calculateCashFlow(transactions, 30);
      
      expect(cashFlow.expectedInflows).toBe(8000);
      expect(cashFlow.expectedOutflows).toBe(2000);
      expect(cashFlow.netCashFlow).toBe(6000);
      expect(cashFlow.cashFlowStatus).toBe('positive');
    });
  });

  describe('Customer Analytics', () => {
    test('should calculate customer lifetime value', () => {
      const calculateCustomerLTV = (customer: any, averageOrderValue: number, purchaseFrequency: number, customerLifespan: number) => {
        return Math.round(averageOrderValue * purchaseFrequency * customerLifespan * 100) / 100;
      };

      const segmentCustomers = (customers: any[]) => {
        return customers.map(customer => {
          const totalSpent = customer.orders.reduce((sum: number, order: any) => sum + order.amount, 0);
          const orderCount = customer.orders.length;
          const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
          
          // Calculate days since first order
          const firstOrderDate = new Date(Math.min(...customer.orders.map((o: any) => new Date(o.date).getTime())));
          const daysSinceFirst = Math.floor((Date.now() - firstOrderDate.getTime()) / (24 * 60 * 60 * 1000));
          const purchaseFrequency = daysSinceFirst > 0 ? orderCount / (daysSinceFirst / 365) : 0;
          
          const ltv = calculateCustomerLTV(customer, avgOrderValue, purchaseFrequency, 2); // 2 year lifespan
          
          let segment = 'low-value';
          if (ltv >= 5000) segment = 'high-value';
          else if (ltv >= 2000) segment = 'medium-value';
          
          return {
            ...customer,
            totalSpent,
            orderCount,
            avgOrderValue: Math.round(avgOrderValue * 100) / 100,
            purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
            ltv,
            segment
          };
        });
      };

      const customers = [
        {
          id: 'cust1',
          name: 'High Value Customer',
          orders: [
            { amount: 1000, date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() },
            { amount: 1500, date: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString() },
            { amount: 2000, date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        },
        {
          id: 'cust2',
          name: 'Low Value Customer',
          orders: [
            { amount: 100, date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      ];

      const segmented = segmentCustomers(customers);
      
      expect(segmented[0].totalSpent).toBe(4500);
      expect(segmented[0].orderCount).toBe(3);
      expect(segmented[0].segment).toBe('high-value');
      
      expect(segmented[1].totalSpent).toBe(100);
      expect(segmented[1].segment).toBe('low-value');
    });

    test('should identify customer churn risk', () => {
      const identifyChurnRisk = (customers: any[], daysSinceLastOrder: number = 90) => {
        const cutoffDate = new Date(Date.now() - daysSinceLastOrder * 24 * 60 * 60 * 1000);
        
        return customers.map(customer => {
          const lastOrderDate = new Date(Math.max(...customer.orders.map((o: any) => new Date(o.date).getTime())));
          const daysSinceLast = Math.floor((Date.now() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000));
          
          let churnRisk = 'low';
          if (daysSinceLast > daysSinceLastOrder * 2) churnRisk = 'high';
          else if (daysSinceLast > daysSinceLastOrder) churnRisk = 'medium';
          
          return {
            ...customer,
            lastOrderDate: lastOrderDate.toISOString(),
            daysSinceLastOrder: daysSinceLast,
            churnRisk
          };
        }).filter(customer => customer.churnRisk !== 'low');
      };

      const customers = [
        {
          id: 'cust1',
          orders: [{ date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString() }] // 200 days ago
        },
        {
          id: 'cust2',
          orders: [{ date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() }] // 50 days ago
        }
      ];

      const atRisk = identifyChurnRisk(customers, 90);
      
      expect(atRisk).toHaveLength(1);
      expect(atRisk[0].id).toBe('cust1');
      expect(atRisk[0].churnRisk).toBe('high');
    });
  });

  describe('Dashboard API Integration', () => {
    test('should fetch dashboard data', async () => {
      const fetchDashboardData = async (dateRange: string = '30d') => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              sales: {
                totalRevenue: 125000,
                totalTransactions: 450,
                averageOrderValue: 277.78,
                growth: 15.5
              },
              inventory: {
                totalItems: 1250,
                lowStockItems: 23,
                outOfStockItems: 5,
                inventoryValue: 85000
              },
              customers: {
                totalCustomers: 890,
                newCustomers: 45,
                activeCustomers: 234,
                churnRate: 5.2
              }
            }
          })
        });

        const response = await fetch(`/api/dashboard?range=${dateRange}`, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return response.json();
      };

      const result = await fetchDashboardData('30d');
      
      expect(result.success).toBe(true);
      expect(result.data.sales.totalRevenue).toBe(125000);
      expect(result.data.inventory.totalItems).toBe(1250);
      expect(result.data.customers.totalCustomers).toBe(890);
    });

    test('should fetch chart data for different periods', async () => {
      const fetchChartData = async (chartType: string, period: string) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            chartData: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
              datasets: [{
                label: 'Revenue',
                data: [12000, 15000, 18000, 16000, 20000]
              }]
            }
          })
        });

        const response = await fetch(`/api/analytics/charts/${chartType}?period=${period}`, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return response.json();
      };

      const result = await fetchChartData('revenue', '6m');
      
      expect(result.success).toBe(true);
      expect(result.chartData.labels).toHaveLength(5);
      expect(result.chartData.datasets[0].data).toEqual([12000, 15000, 18000, 16000, 20000]);
    });
  });

  describe('Real-time Updates', () => {
    test('should handle real-time dashboard updates', () => {
      const createDashboardUpdater = () => {
        let subscribers: Array<(data: any) => void> = [];
        
        const subscribe = (callback: (data: any) => void) => {
          subscribers.push(callback);
          return () => {
            subscribers = subscribers.filter(sub => sub !== callback);
          };
        };
        
        const broadcast = (data: any) => {
          subscribers.forEach(callback => callback(data));
        };
        
        return { subscribe, broadcast };
      };

      const updater = createDashboardUpdater();
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      const unsubscribe1 = updater.subscribe(mockCallback1);
      const unsubscribe2 = updater.subscribe(mockCallback2);
      
      const updateData = { type: 'sales_update', value: 1000 };
      updater.broadcast(updateData);
      
      expect(mockCallback1).toHaveBeenCalledWith(updateData);
      expect(mockCallback2).toHaveBeenCalledWith(updateData);
      
      unsubscribe1();
      updater.broadcast({ type: 'another_update', value: 2000 });
      
      expect(mockCallback1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(mockCallback2).toHaveBeenCalledTimes(2); // Should be called again
    });

    test('should throttle frequent updates', () => {
      const createThrottledUpdater = (delay: number = 1000) => {
        let lastUpdate = 0;
        let pendingData: any = null;
        let timeoutId: NodeJS.Timeout | null = null;
        
        const update = (data: any, callback: (data: any) => void) => {
          const now = Date.now();
          pendingData = data;
          
          if (now - lastUpdate >= delay) {
            lastUpdate = now;
            callback(data);
            pendingData = null;
          } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
              if (pendingData) {
                lastUpdate = Date.now();
                callback(pendingData);
                pendingData = null;
              }
              timeoutId = null;
            }, delay - (now - lastUpdate));
          }
        };
        
        return { update };
      };

      const mockCallback = jest.fn();
      const updater = createThrottledUpdater(100);
      
      // First update should go through immediately
      updater.update({ value: 1 }, mockCallback);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      // Subsequent updates within delay should be throttled
      updater.update({ value: 2 }, mockCallback);
      updater.update({ value: 3 }, mockCallback);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still only called once
    });
  });
});