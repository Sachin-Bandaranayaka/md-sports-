import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

// Visual regression test configuration
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

const PAGES_TO_TEST = [
  {
    name: 'login',
    url: '/login',
    description: 'Login page with form and branding',
    waitFor: 'form[data-testid="login-form"]',
  },
  {
    name: 'dashboard',
    url: '/dashboard',
    description: 'Main dashboard with stats and charts',
    waitFor: '[data-testid="dashboard-stats"]',
    requiresAuth: true,
  },
  {
    name: 'products-list',
    url: '/products',
    description: 'Products listing page with filters',
    waitFor: '[data-testid="products-grid"]',
    requiresAuth: true,
  },
  {
    name: 'product-detail',
    url: '/products/1',
    description: 'Individual product detail page',
    waitFor: '[data-testid="product-details"]',
    requiresAuth: true,
  },
  {
    name: 'inventory',
    url: '/inventory',
    description: 'Inventory management interface',
    waitFor: '[data-testid="inventory-table"]',
    requiresAuth: true,
  },
  {
    name: 'sales',
    url: '/sales',
    description: 'Sales dashboard and transactions',
    waitFor: '[data-testid="sales-dashboard"]',
    requiresAuth: true,
  },
  {
    name: 'reports',
    url: '/reports',
    description: 'Reports and analytics page',
    waitFor: '[data-testid="reports-container"]',
    requiresAuth: true,
  },
  {
    name: 'settings',
    url: '/settings',
    description: 'Application settings page',
    waitFor: '[data-testid="settings-form"]',
    requiresAuth: true,
  },
];

// Test utilities
class VisualTestUtils {
  static async authenticateUser(page: Page) {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify authentication
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  static async waitForPageLoad(page: Page, waitFor?: string) {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    // Wait for specific element if provided
    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 10000 });
    }
    
    // Wait for any loading spinners to disappear
    await page.waitForFunction(() => {
      const spinners = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
      return spinners.length === 0;
    }, { timeout: 5000 }).catch(() => {
      // Ignore timeout - some pages might not have loading indicators
    });
    
    // Additional wait for animations to complete
    await page.waitForTimeout(500);
  }

  static async hideVolatileElements(page: Page) {
    // Hide elements that change frequently and would cause false positives
    await page.addStyleTag({
      content: `
        [data-testid*="timestamp"],
        [data-testid*="time"],
        .timestamp,
        .current-time,
        .last-updated,
        .real-time-data,
        .chart-tooltip,
        .loading-animation,
        .pulse,
        .blink {
          visibility: hidden !important;
        }
        
        /* Hide scrollbars for consistent screenshots */
        ::-webkit-scrollbar {
          display: none;
        }
        
        /* Disable animations for consistent screenshots */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  }

  static async mockDynamicData(page: Page) {
    // Mock API responses to ensure consistent data
    await page.route('**/api/dashboard/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalSales: 125000,
          totalProducts: 1250,
          lowStockItems: 15,
          pendingOrders: 8,
          salesGrowth: 12.5,
          inventoryValue: 450000,
        }),
      });
    });

    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 1,
              name: 'Nike Air Max 270',
              price: 150.00,
              stock: 25,
              category: 'Footwear',
              image: '/images/sample-product.jpg',
            },
            {
              id: 2,
              name: 'Adidas Ultraboost 22',
              price: 180.00,
              stock: 18,
              category: 'Footwear',
              image: '/images/sample-product-2.jpg',
            },
          ],
          total: 2,
          page: 1,
          limit: 20,
        }),
      });
    });

    await page.route('**/api/sales**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sales: [
            {
              id: 1,
              date: '2024-01-15',
              amount: 299.99,
              customer: 'John Doe',
              status: 'completed',
            },
          ],
          total: 1,
        }),
      });
    });
  }

  static getScreenshotOptions(viewport: string) {
    return {
      fullPage: true,
      animations: 'disabled' as const,
      clip: viewport === 'mobile' ? { x: 0, y: 0, width: 375, height: 667 } : undefined,
      threshold: 0.2, // Allow 20% pixel difference
      maxDiffPixels: 1000, // Allow up to 1000 different pixels
    };
  }
}

// Main visual regression tests
test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up consistent test environment
    await VisualTestUtils.mockDynamicData(page);
    
    // Set consistent timezone
    await page.addInitScript(() => {
      // Mock Date to return consistent timestamps
      const mockDate = new Date('2024-01-15T10:00:00Z');
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...args);
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;
    });
  });

  // Test each page across different viewports
  Object.entries(VIEWPORTS).forEach(([viewportName, viewport]) => {
    test.describe(`${viewportName} viewport (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport);
      });

      PAGES_TO_TEST.forEach(({ name, url, description, waitFor, requiresAuth }) => {
        test(`${name} page should match visual baseline`, async ({ page }) => {
          // Authenticate if required
          if (requiresAuth) {
            await VisualTestUtils.authenticateUser(page);
          }

          // Navigate to page
          await page.goto(url);

          // Wait for page to load completely
          await VisualTestUtils.waitForPageLoad(page, waitFor);

          // Hide volatile elements
          await VisualTestUtils.hideVolatileElements(page);

          // Take screenshot and compare
          await expect(page).toHaveScreenshot(
            `${name}-${viewportName}.png`,
            VisualTestUtils.getScreenshotOptions(viewportName)
          );
        });
      });
    });
  });

  test.describe('Component Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await VisualTestUtils.authenticateUser(page);
    });

    test('navigation menu states', async ({ page }) => {
      await page.goto('/dashboard');
      await VisualTestUtils.waitForPageLoad(page);
      await VisualTestUtils.hideVolatileElements(page);

      // Test collapsed navigation
      await expect(page.locator('[data-testid="navigation"]')).toHaveScreenshot(
        'navigation-collapsed.png'
      );

      // Test expanded navigation (if applicable)
      const expandButton = page.locator('[data-testid="nav-expand"]');
      if (await expandButton.isVisible()) {
        await expandButton.click();
        await page.waitForTimeout(300); // Wait for animation
        
        await expect(page.locator('[data-testid="navigation"]')).toHaveScreenshot(
          'navigation-expanded.png'
        );
      }
    });

    test('modal dialogs', async ({ page }) => {
      await page.goto('/products');
      await VisualTestUtils.waitForPageLoad(page);
      
      // Open add product modal
      const addButton = page.locator('[data-testid="add-product-button"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForSelector('[data-testid="product-modal"]');
        
        await expect(page.locator('[data-testid="product-modal"]')).toHaveScreenshot(
          'add-product-modal.png'
        );
      }
    });

    test('form validation states', async ({ page }) => {
      await page.goto('/login');
      await VisualTestUtils.waitForPageLoad(page);
      
      // Test empty form validation
      await page.click('[data-testid="login-button"]');
      await page.waitForTimeout(500); // Wait for validation messages
      
      await expect(page.locator('form[data-testid="login-form"]')).toHaveScreenshot(
        'login-form-validation-errors.png'
      );
      
      // Test partially filled form
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="login-button"]');
      await page.waitForTimeout(500);
      
      await expect(page.locator('form[data-testid="login-form"]')).toHaveScreenshot(
        'login-form-partial-validation.png'
      );
    });

    test('data table states', async ({ page }) => {
      await page.goto('/products');
      await VisualTestUtils.waitForPageLoad(page, '[data-testid="products-grid"]');
      await VisualTestUtils.hideVolatileElements(page);
      
      // Test default table state
      await expect(page.locator('[data-testid="products-grid"]')).toHaveScreenshot(
        'products-table-default.png'
      );
      
      // Test sorted table (if sortable)
      const sortButton = page.locator('[data-testid="sort-name"]');
      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(500);
        
        await expect(page.locator('[data-testid="products-grid"]')).toHaveScreenshot(
          'products-table-sorted.png'
        );
      }
      
      // Test filtered table (if filterable)
      const filterInput = page.locator('[data-testid="search-input"]');
      if (await filterInput.isVisible()) {
        await filterInput.fill('Nike');
        await page.waitForTimeout(500);
        
        await expect(page.locator('[data-testid="products-grid"]')).toHaveScreenshot(
          'products-table-filtered.png'
        );
      }
    });

    test('loading states', async ({ page }) => {
      // Intercept API calls to simulate loading
      await page.route('**/api/products**', async route => {
        // Delay response to capture loading state
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      await page.goto('/products');
      
      // Capture loading state
      await expect(page.locator('[data-testid="products-container"]')).toHaveScreenshot(
        'products-loading-state.png',
        { timeout: 1000 }
      );
    });

    test('empty states', async ({ page }) => {
      // Mock empty responses
      await page.route('**/api/products**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            products: [],
            total: 0,
            page: 1,
            limit: 20,
          }),
        });
      });
      
      await page.goto('/products');
      await VisualTestUtils.waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="products-container"]')).toHaveScreenshot(
        'products-empty-state.png'
      );
    });

    test('error states', async ({ page }) => {
      // Mock error responses
      await page.route('**/api/products**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });
      
      await page.goto('/products');
      await page.waitForTimeout(2000); // Wait for error to appear
      
      await expect(page.locator('[data-testid="products-container"]')).toHaveScreenshot(
        'products-error-state.png'
      );
    });
  });

  test.describe('Theme and Dark Mode', () => {
    test('light theme consistency', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await VisualTestUtils.authenticateUser(page);
      
      // Ensure light theme is active
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      
      await page.goto('/dashboard');
      await VisualTestUtils.waitForPageLoad(page);
      await VisualTestUtils.hideVolatileElements(page);
      
      await expect(page).toHaveScreenshot('dashboard-light-theme.png');
    });

    test('dark theme consistency', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await VisualTestUtils.authenticateUser(page);
      
      // Enable dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      
      await page.goto('/dashboard');
      await VisualTestUtils.waitForPageLoad(page);
      await VisualTestUtils.hideVolatileElements(page);
      
      await expect(page).toHaveScreenshot('dashboard-dark-theme.png');
    });
  });

  test.describe('Print Styles', () => {
    test('print layout for reports', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await VisualTestUtils.authenticateUser(page);
      
      await page.goto('/reports');
      await VisualTestUtils.waitForPageLoad(page);
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      await expect(page).toHaveScreenshot('reports-print-layout.png', {
        fullPage: true,
      });
    });

    test('print layout for invoices', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await VisualTestUtils.authenticateUser(page);
      
      // Mock invoice data
      await page.route('**/api/invoices/1', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            number: 'INV-001',
            date: '2024-01-15',
            customer: 'John Doe',
            items: [
              { name: 'Nike Air Max', quantity: 1, price: 150.00 },
            ],
            total: 150.00,
          }),
        });
      });
      
      await page.goto('/invoices/1');
      await VisualTestUtils.waitForPageLoad(page);
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      await expect(page).toHaveScreenshot('invoice-print-layout.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Accessibility Visual Tests', () => {
    test('high contrast mode', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await VisualTestUtils.authenticateUser(page);
      
      // Enable high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              filter: contrast(150%) !important;
            }
          }
        `
      });
      
      await page.goto('/dashboard');
      await VisualTestUtils.waitForPageLoad(page);
      await VisualTestUtils.hideVolatileElements(page);
      
      await expect(page).toHaveScreenshot('dashboard-high-contrast.png');
    });

    test('focus indicators visibility', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/login');
      await VisualTestUtils.waitForPageLoad(page);
      
      // Focus on email input
      await page.focus('[data-testid="email-input"]');
      
      await expect(page.locator('form[data-testid="login-form"]')).toHaveScreenshot(
        'login-form-focus-email.png'
      );
      
      // Focus on password input
      await page.focus('[data-testid="password-input"]');
      
      await expect(page.locator('form[data-testid="login-form"]')).toHaveScreenshot(
        'login-form-focus-password.png'
      );
      
      // Focus on submit button
      await page.focus('[data-testid="login-button"]');
      
      await expect(page.locator('form[data-testid="login-form"]')).toHaveScreenshot(
        'login-form-focus-button.png'
      );
    });
  });
});

// Performance visual tests
test.describe('Performance Visual Tests', () => {
  test('layout stability during loading', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    
    // Slow down network to observe loading behavior
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    await page.goto('/dashboard');
    
    // Take screenshots at different loading stages
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dashboard-loading-stage-1.png');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('dashboard-loading-stage-2.png');
    
    await VisualTestUtils.waitForPageLoad(page);
    await expect(page).toHaveScreenshot('dashboard-loading-complete.png');
  });

  test('responsive image loading', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await VisualTestUtils.authenticateUser(page);
    
    await page.goto('/products');
    await VisualTestUtils.waitForPageLoad(page);
    
    // Check that images are properly sized for mobile
    await expect(page.locator('[data-testid="products-grid"]')).toHaveScreenshot(
      'products-mobile-images.png'
    );
    
    // Switch to desktop and verify images scale appropriately
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(500); // Wait for responsive changes
    
    await expect(page.locator('[data-testid="products-grid"]')).toHaveScreenshot(
      'products-desktop-images.png'
    );
  });
});