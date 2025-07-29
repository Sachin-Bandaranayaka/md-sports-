import { test, expect, Page } from '@playwright/test';

// Helper function to login (assuming you have a login flow)
async function login(page: Page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in credentials (adjust selectors based on your login form)
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  
  // Submit login form
  await page.click('[data-testid="login-button"]');
  
  // Wait for redirect to dashboard or home page
  await page.waitForURL('**/dashboard');
}

test.describe('Audit Trail E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
    
    // Navigate to audit trail page
    await page.goto('/audit-trail');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Audit Trail');
  });

  test('should display audit trail page with filters', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Recycle Bin' })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Audit History' })).toBeVisible();
    
    // Check if filter controls are present
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('text=Entity Type')).toBeVisible();
    await expect(page.locator('text=From Date')).toBeVisible();
    await expect(page.locator('text=To Date')).toBeVisible();
  });

  test('should filter by entity type', async ({ page }) => {
    // Wait for initial data to load
    await page.waitForLoadState('networkidle');
    
    // Click on entity filter dropdown
    await page.click('[role="combobox"]');
    
    // Select 'product' option
    await page.click('[role="option"]', { hasText: 'Product' });
    
    // Wait for the API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      response.url().includes('entity=product')
    );
    
    // Verify that the filter is applied by checking the URL or table content
    // This depends on your implementation - you might check if only product entries are shown
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Check if all visible rows are product entities
      for (let i = 0; i < rowCount; i++) {
        const entityCell = tableRows.nth(i).locator('td').first();
        await expect(entityCell).toContainText('Product', { ignoreCase: true });
      }
    }
  });

  test('should filter by date range', async ({ page }) => {
    // Wait for initial data to load
    await page.waitForLoadState('networkidle');
    
    // Click on "From Date" button
    await page.click('button:has-text("From Date")');
    
    // Select a date from the calendar (this is a simplified approach)
    // In a real scenario, you'd interact with the calendar component
    await page.click('[role="gridcell"]:has-text("15")');
    
    // Click on "To Date" button
    await page.click('button:has-text("To Date")');
    
    // Select an end date
    await page.click('[role="gridcell"]:has-text("20")');
    
    // Wait for the API call with date parameters
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      response.url().includes('dateFrom=')
    );
    
    // Verify that the clear button is now visible
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();
  });

  test('should clear date filters', async ({ page }) => {
    // First set some date filters (simplified)
    await page.click('button:has-text("From Date")');
    await page.click('[role="gridcell"]:has-text("15")');
    
    await page.click('button:has-text("To Date")');
    await page.click('[role="gridcell"]:has-text("20")');
    
    // Wait for the filters to be applied
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      response.url().includes('dateFrom=')
    );
    
    // Click the clear button
    await page.click('button:has-text("Clear")');
    
    // Wait for the API call without date parameters
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      !response.url().includes('dateFrom=')
    );
    
    // Verify that the date buttons are reset
    await expect(page.locator('button:has-text("From Date")')).toBeVisible();
    await expect(page.locator('button:has-text("To Date")')).toBeVisible();
  });

  test('should combine entity and date filters', async ({ page }) => {
    // Wait for initial data to load
    await page.waitForLoadState('networkidle');
    
    // Set entity filter
    await page.click('[role="combobox"]');
    await page.click('[role="option"]', { hasText: 'Customer' });
    
    // Set date filter
    await page.click('button:has-text("From Date")');
    await page.click('[role="gridcell"]:has-text("10")');
    
    // Wait for API call with both filters
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      response.url().includes('entity=customer') &&
      response.url().includes('dateFrom=')
    );
    
    // Verify that both filters are applied
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Check if all visible rows are customer entities
      for (let i = 0; i < rowCount; i++) {
        const entityCell = tableRows.nth(i).locator('td').first();
        await expect(entityCell).toContainText('Customer', { ignoreCase: true });
      }
    }
  });

  test('should switch between tabs and maintain filters', async ({ page }) => {
    // Set a filter on the recycle bin tab
    await page.click('[role="combobox"]');
    await page.click('[role="option"]', { hasText: 'Product' });
    
    // Wait for the filter to be applied
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      response.url().includes('entity=product') &&
      response.url().includes('type=deleted')
    );
    
    // Switch to audit history tab
    await page.click('[role="tab"]', { hasText: 'Audit History' });
    
    // Wait for audit history data to load with the same filter
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      response.url().includes('entity=product') &&
      response.url().includes('type=all')
    );
    
    // Verify that the entity filter is still applied
    await expect(page.locator('[role="combobox"]')).toContainText('Product');
  });

  test('should handle pagination with filters', async ({ page }) => {
    // Set filters
    await page.click('[role="combobox"]');
    await page.click('[role="option"]', { hasText: 'Invoice' });
    
    // Wait for filtered data
    await page.waitForResponse(response => 
      response.url().includes('/api/audit-trail') && 
      response.url().includes('entity=invoice')
    );
    
    // Check if pagination controls are present (if there's enough data)
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Wait for the next page with filters maintained
      await page.waitForResponse(response => 
        response.url().includes('/api/audit-trail') && 
        response.url().includes('entity=invoice') &&
        response.url().includes('offset=')
      );
    }
  });

  test('should display error message for invalid date range', async ({ page }) => {
    // Set "To Date" before "From Date" (invalid range)
    await page.click('button:has-text("To Date")');
    await page.click('[role="gridcell"]:has-text("10")');
    
    await page.click('button:has-text("From Date")');
    await page.click('[role="gridcell"]:has-text("20")');
    
    // Check if an error message or validation appears
    // This depends on your validation implementation
    // You might check for a toast notification or inline error
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should recover items from recycle bin', async ({ page }) => {
    // Ensure we're on the recycle bin tab
    await page.click('[role="tab"]', { hasText: 'Recycle Bin' });
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    // Check if there are any recoverable items
    const recoverButtons = page.locator('button:has-text("Recover")');
    const buttonCount = await recoverButtons.count();
    
    if (buttonCount > 0) {
      // Click the first recover button
      await recoverButtons.first().click();
      
      // Confirm the recovery in the dialog
      await page.click('button:has-text("Confirm")');
      
      // Wait for the recovery API call
      await page.waitForResponse(response => 
        response.url().includes('/api/audit-trail') && 
        response.request().method() === 'POST'
      );
      
      // Verify success message
      await expect(page.locator('text=successfully recovered')).toBeVisible();
    }
  });

  test('should search within filtered results', async ({ page }) => {
    // Set entity filter
    await page.click('[role="combobox"]');
    await page.click('[role="option"]', { hasText: 'Product' });
    
    // Wait for filtered data
    await page.waitForLoadState('networkidle');
    
    // Enter search term
    await page.fill('input[placeholder*="Search"]', 'test');
    
    // Wait for search to be applied (this might be debounced)
    await page.waitForTimeout(500);
    
    // Verify that both entity filter and search are applied
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Check if results contain the search term and are of the correct entity type
      for (let i = 0; i < rowCount; i++) {
        const row = tableRows.nth(i);
        const entityCell = row.locator('td').first();
        await expect(entityCell).toContainText('Product', { ignoreCase: true });
        
        // Check if the row contains the search term somewhere
        await expect(row).toContainText('test', { ignoreCase: true });
      }
    }
  });
});