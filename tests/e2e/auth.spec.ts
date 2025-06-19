import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login form', async ({ page }: { page: Page }) => {
    // Check if login form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }: { page: Page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }: { page: Page }) => {
    // Fill in valid credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    
    // Check if user is logged in (look for logout button or user menu)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }: { page: Page }) => {
    // Login first
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/');
    
    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing protected route', async ({ page }: { page: Page }) => {
    // Try to access a protected route without logging in
    await page.goto('/inventory');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should remember user session', async ({ page, context }: { page: Page; context: BrowserContext }) => {
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await expect(page).toHaveURL('/');
    
    // Create new page in same context
    const newPage = await context.newPage();
    await newPage.goto('/');
    
    // Should still be logged in
    await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle session expiry', async ({ page }: { page: Page }) => {
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await expect(page).toHaveURL('/');
    
    // Simulate session expiry by clearing cookies
    await page.context().clearCookies();
    
    // Try to access a protected route
    await page.goto('/inventory');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });


});

// Helper function for login
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}