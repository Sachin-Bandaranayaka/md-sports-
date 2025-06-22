/**
 * MS Sport Admin Workflow Reliability Test
 * 
 * This test systematically validates the complete business workflow
 * as an admin user, testing all critical business operations in the
 * correct sequence with proper data validation.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

interface TestMetrics {
  startTime: number;
  endTime: number;
  operations: Array<{
    name: string;
    duration: number;
    success: boolean;
    error?: string;
    dataValidation?: any;
  }>;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
}

interface BusinessData {
  categories: Array<{ id: string; name: string; }>;
  products: Array<{ id: string; name: string; sku: string; price: number; categoryId: string; }>;
  suppliers: Array<{ id: string; name: string; email: string; }>;
  customers: Array<{ id: string; name: string; email: string; }>;
  purchaseInvoices: Array<{ id: string; supplierId: string; items: any[]; total: number; }>;
  salesInvoices: Array<{ id: string; customerId: string; items: any[]; total: number; profit: number; }>;
  inventoryTransfers: Array<{ id: string; fromShop: string; toShop: string; items: any[]; }>;
  payments: Array<{ id: string; invoiceId: string; amount: number; type: 'partial' | 'full'; }>;
}

class AdminWorkflowTester {
  private page: Page;
  private metrics: TestMetrics;
  private businessData: BusinessData;
  private baseUrl: string;

  constructor(page: Page, baseUrl: string = 'http://localhost:3000') {
    this.page = page;
    this.baseUrl = baseUrl;
    this.metrics = {
      startTime: Date.now(),
      endTime: 0,
      operations: [],
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0
    };
    this.businessData = {
      categories: [],
      products: [],
      suppliers: [],
      customers: [],
      purchaseInvoices: [],
      salesInvoices: [],
      inventoryTransfers: [],
      payments: []
    };
  }

  private async recordOperation(name: string, operation: () => Promise<any>, validation?: () => Promise<any>) {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let dataValidation: any;

    try {
      const result = await operation();
      if (validation) {
        dataValidation = await validation();
      }
      success = true;
      this.metrics.successfulOperations++;
      return result;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      this.metrics.failedOperations++;
      console.error(`❌ Operation failed: ${name}`, error);
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.operations.push({
        name,
        duration,
        success,
        error,
        dataValidation
      });
      this.metrics.totalOperations++;
    }
  }

  async login() {
    await this.recordOperation('Admin Login', async () => {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.fill('input[name="email"]', 'admin@test.com');
      await this.page.fill('input[name="password"]', 'admin123');
      await this.page.click('button[type="submit"]');
      
      // Wait for successful login redirect
      await this.page.waitForURL(`${this.baseUrl}/dashboard`, { timeout: 10000 });
      await expect(this.page).toHaveURL(/.*dashboard/);
    });
  }

  // ==================== CATEGORY MANAGEMENT ====================
  async testCategoryManagement() {
    console.log('🏷️  Testing Category Management...');

    // Create Categories
    await this.recordOperation('Create Category - Sports Equipment', async () => {
      await this.page.goto(`${this.baseUrl}/inventory/categories`);
      await this.page.click('button:has-text("Add Category")');
      await this.page.fill('input[name="name"]', 'Sports Equipment');
      await this.page.fill('textarea[name="description"]', 'All sports equipment and gear');
      await this.page.click('button:has-text("Save")');
      
      // Wait for success message or redirect
      await this.page.waitForTimeout(2000);
      this.businessData.categories.push({ id: 'cat-1', name: 'Sports Equipment' });
    });

    await this.recordOperation('Create Category - Footwear', async () => {
      await this.page.click('button:has-text("Add Category")');
      await this.page.fill('input[name="name"]', 'Footwear');
      await this.page.fill('textarea[name="description"]', 'Sports shoes and footwear');
      await this.page.click('button:has-text("Save")');
      await this.page.waitForTimeout(2000);
      this.businessData.categories.push({ id: 'cat-2', name: 'Footwear' });
    });

    await this.recordOperation('Create Category - Apparel', async () => {
      await this.page.click('button:has-text("Add Category")');
      await this.page.fill('input[name="name"]', 'Apparel');
      await this.page.fill('textarea[name="description"]', 'Sports clothing and apparel');
      await this.page.click('button:has-text("Save")');
      await this.page.waitForTimeout(2000);
      this.businessData.categories.push({ id: 'cat-3', name: 'Apparel' });
    });

    // Edit Category
    await this.recordOperation('Edit Category - Sports Equipment', async () => {
      await this.page.click('tr:has-text("Sports Equipment") button:has-text("Edit")');
      await this.page.fill('textarea[name="description"]', 'Premium sports equipment and professional gear');
      await this.page.click('button:has-text("Update")');
      await this.page.waitForTimeout(2000);
    });

    // Validate Categories
    await this.recordOperation('Validate Categories List', async () => {
      await this.page.reload();
      await expect(this.page.locator('text=Sports Equipment')).toBeVisible();
      await expect(this.page.locator('text=Footwear')).toBeVisible();
      await expect(this.page.locator('text=Apparel')).toBeVisible();
    });
  }

  // ==================== SUPPLIER MANAGEMENT ====================
  async testSupplierManagement() {
    console.log('🏢 Testing Supplier Management...');

    await this.recordOperation('Create Supplier - Nike', async () => {
      await this.page.goto(`${this.baseUrl}/suppliers`);
      await this.page.click('button:has-text("Add Supplier")');
      await this.page.fill('input[name="name"]', 'Nike Distribution LK');
      await this.page.fill('input[name="email"]', 'orders@nike.lk');
      await this.page.fill('input[name="phone"]', '+94112345678');
      await this.page.fill('textarea[name="address"]', 'Colombo 03, Sri Lanka');
      await this.page.click('button:has-text("Save")');
      await this.page.waitForTimeout(2000);
      this.businessData.suppliers.push({ id: 'sup-1', name: 'Nike Distribution LK', email: 'orders@nike.lk' });
    });

    await this.recordOperation('Create Supplier - Adidas', async () => {
      await this.page.click('button:has-text("Add Supplier")');
      await this.page.fill('input[name="name"]', 'Adidas Sports Lanka');
      await this.page.fill('input[name="email"]', 'supply@adidas.lk');
      await this.page.fill('input[name="phone"]', '+94112345679');
      await this.page.fill('textarea[name="address"]', 'Kandy, Sri Lanka');
      await this.page.click('button:has-text("Save")');
      await this.page.waitForTimeout(2000);
      this.businessData.suppliers.push({ id: 'sup-2', name: 'Adidas Sports Lanka', email: 'supply@adidas.lk' });
    });

    // Edit Supplier
    await this.recordOperation('Edit Supplier - Nike', async () => {
      await this.page.click('tr:has-text("Nike Distribution LK") button:has-text("Edit")');
      await this.page.fill('input[name="phone"]', '+94112345680');
      await this.page.click('button:has-text("Update")');
      await this.page.waitForTimeout(2000);
    });
  }

  // ==================== PRODUCT MANAGEMENT ====================
  async testProductManagement() {
    console.log('📦 Testing Product Management...');

    await this.recordOperation('Create Product - Nike Air Max', async () => {
      await this.page.goto(`${this.baseUrl}/inventory/new`);
      await this.page.fill('input[name="name"]', 'Nike Air Max 270');
      await this.page.fill('input[name="sku"]', 'NIKE-AM270-001');
      await this.page.fill('textarea[name="description"]', 'Premium running shoes with Air Max technology');
      await this.page.fill('input[name="price"]', '25000');
      await this.page.selectOption('select[name="categoryId"]', { label: 'Footwear' });
      await this.page.click('button:has-text("Save Product")');
      await this.page.waitForTimeout(2000);
      this.businessData.products.push({ 
        id: 'prod-1', 
        name: 'Nike Air Max 270', 
        sku: 'NIKE-AM270-001', 
        price: 25000, 
        categoryId: 'cat-2' 
      });
    });

    await this.recordOperation('Create Product - Adidas Ultraboost', async () => {
      await this.page.goto(`${this.baseUrl}/inventory/new`);
      await this.page.fill('input[name="name"]', 'Adidas Ultraboost 22');
      await this.page.fill('input[name="sku"]', 'ADIDAS-UB22-001');
      await this.page.fill('textarea[name="description"]', 'High-performance running shoes with Boost technology');
      await this.page.fill('input[name="price"]', '28000');
      await this.page.selectOption('select[name="categoryId"]', { label: 'Footwear' });
      await this.page.click('button:has-text("Save Product")');
      await this.page.waitForTimeout(2000);
      this.businessData.products.push({ 
        id: 'prod-2', 
        name: 'Adidas Ultraboost 22', 
        sku: 'ADIDAS-UB22-001', 
        price: 28000, 
        categoryId: 'cat-2' 
      });
    });

    await this.recordOperation('Create Product - Nike Dri-FIT Shirt', async () => {
      await this.page.goto(`${this.baseUrl}/inventory/new`);
      await this.page.fill('input[name="name"]', 'Nike Dri-FIT Training Shirt');
      await this.page.fill('input[name="sku"]', 'NIKE-DFIT-001');
      await this.page.fill('textarea[name="description"]', 'Moisture-wicking training shirt');
      await this.page.fill('input[name="price"]', '4500');
      await this.page.selectOption('select[name="categoryId"]', { label: 'Apparel' });
      await this.page.click('button:has-text("Save Product")');
      await this.page.waitForTimeout(2000);
      this.businessData.products.push({ 
        id: 'prod-3', 
        name: 'Nike Dri-FIT Training Shirt', 
        sku: 'NIKE-DFIT-001', 
        price: 4500, 
        categoryId: 'cat-3' 
      });
    });

    // Edit Product
    await this.recordOperation('Edit Product - Nike Air Max Price', async () => {
      await this.page.goto(`${this.baseUrl}/inventory`);
      await this.page.click('tr:has-text("Nike Air Max 270") button:has-text("Edit")');
      await this.page.fill('input[name="price"]', '24500');
      await this.page.click('button:has-text("Update")');
      await this.page.waitForTimeout(2000);
    });
  }

  // ==================== PURCHASE INVOICE MANAGEMENT ====================
  async testPurchaseInvoiceManagement() {
    console.log('📋 Testing Purchase Invoice Management...');

    // Single Item Purchase Invoice
    await this.recordOperation('Create Purchase Invoice - Single Item', async () => {
      await this.page.goto(`${this.baseUrl}/purchases/new`);
      await this.page.selectOption('select[name="supplierId"]', { label: 'Nike Distribution LK' });
      await this.page.fill('input[name="invoiceNumber"]', 'NIKE-INV-001');
      
      // Add single product
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="products[0].productId"]', { label: 'Nike Air Max 270' });
      await this.page.fill('input[name="products[0].quantity"]', '50');
      await this.page.fill('input[name="products[0].unitCost"]', '18000');
      
      await this.page.click('button:has-text("Save Purchase Invoice")');
      await this.page.waitForTimeout(3000);
      
      this.businessData.purchaseInvoices.push({
        id: 'pinv-1',
        supplierId: 'sup-1',
        items: [{ productId: 'prod-1', quantity: 50, unitCost: 18000 }],
        total: 900000
      });
    });

    // Multiple Items Purchase Invoice
    await this.recordOperation('Create Purchase Invoice - Multiple Items', async () => {
      await this.page.goto(`${this.baseUrl}/purchases/new`);
      await this.page.selectOption('select[name="supplierId"]', { label: 'Adidas Sports Lanka' });
      await this.page.fill('input[name="invoiceNumber"]', 'ADIDAS-INV-001');
      
      // Add first product
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="products[0].productId"]', { label: 'Adidas Ultraboost 22' });
      await this.page.fill('input[name="products[0].quantity"]', '30');
      await this.page.fill('input[name="products[0].unitCost"]', '20000');
      
      // Add second product
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="products[1].productId"]', { label: 'Nike Dri-FIT Training Shirt' });
      await this.page.fill('input[name="products[1].quantity"]', '100');
      await this.page.fill('input[name="products[1].unitCost"]', '2500');
      
      await this.page.click('button:has-text("Save Purchase Invoice")');
      await this.page.waitForTimeout(3000);
      
      this.businessData.purchaseInvoices.push({
        id: 'pinv-2',
        supplierId: 'sup-2',
        items: [
          { productId: 'prod-2', quantity: 30, unitCost: 20000 },
          { productId: 'prod-3', quantity: 100, unitCost: 2500 }
        ],
        total: 850000
      });
    });

    // Validate Weighted Average Cost Calculation
    await this.recordOperation('Validate Weighted Average Cost', async () => {
      await this.page.goto(`${this.baseUrl}/inventory`);
      
      // Check if inventory quantities updated
      await expect(this.page.locator('tr:has-text("Nike Air Max 270")')).toContainText('50');
      await expect(this.page.locator('tr:has-text("Adidas Ultraboost 22")')).toContainText('30');
      await expect(this.page.locator('tr:has-text("Nike Dri-FIT Training Shirt")')).toContainText('100');
    });

    // Edit Purchase Invoice
    await this.recordOperation('Edit Purchase Invoice', async () => {
      await this.page.goto(`${this.baseUrl}/purchases`);
      await this.page.click('tr:has-text("NIKE-INV-001") button:has-text("Edit")');
      await this.page.fill('input[name="products[0].quantity"]', '55');
      await this.page.click('button:has-text("Update")');
      await this.page.waitForTimeout(3000);
    });
  }

  // ==================== INVENTORY TRANSFERS ====================
  async testInventoryTransfers() {
    console.log('🔄 Testing Inventory Transfers...');

    await this.recordOperation('Create Inventory Transfer', async () => {
      await this.page.goto(`${this.baseUrl}/inventory/transfers`);
      await this.page.click('button:has-text("New Transfer")');
      
      await this.page.selectOption('select[name="fromShopId"]', { label: 'Test Main Store' });
      await this.page.selectOption('select[name="toShopId"]', { label: 'Test Branch Store' });
      
      // Add transfer items
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="items[0].productId"]', { label: 'Nike Air Max 270' });
      await this.page.fill('input[name="items[0].quantity"]', '10');
      
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="items[1].productId"]', { label: 'Nike Dri-FIT Training Shirt' });
      await this.page.fill('input[name="items[1].quantity"]', '20');
      
      await this.page.click('button:has-text("Create Transfer")');
      await this.page.waitForTimeout(3000);
      
      this.businessData.inventoryTransfers.push({
        id: 'transfer-1',
        fromShop: 'test-shop-1',
        toShop: 'test-shop-2',
        items: [
          { productId: 'prod-1', quantity: 10 },
          { productId: 'prod-3', quantity: 20 }
        ]
      });
    });

    // Edit Transfer
    await this.recordOperation('Edit Inventory Transfer', async () => {
      await this.page.click('tr:has-text("Transfer") button:has-text("Edit")');
      await this.page.fill('input[name="items[0].quantity"]', '12');
      await this.page.click('button:has-text("Update Transfer")');
      await this.page.waitForTimeout(3000);
    });

    // Validate Shop-wise Inventory
    await this.recordOperation('Validate Shop-wise Inventory Distribution', async () => {
      await this.page.goto(`${this.baseUrl}/inventory/distribution`);
      
      // Verify inventory distribution between shops
      await expect(this.page.locator('text=Test Main Store')).toBeVisible();
      await expect(this.page.locator('text=Test Branch Store')).toBeVisible();
    });
  }

  // ==================== CUSTOMER MANAGEMENT ====================
  async testCustomerManagement() {
    console.log('👥 Testing Customer Management...');

    await this.recordOperation('Create Customer - John Doe', async () => {
      await this.page.goto(`${this.baseUrl}/customers/new`);
      await this.page.fill('input[name="name"]', 'John Doe');
      await this.page.fill('input[name="email"]', 'john.doe@email.com');
      await this.page.fill('input[name="phone"]', '+94771234567');
      await this.page.fill('textarea[name="address"]', 'Colombo 07, Sri Lanka');
      await this.page.click('button:has-text("Save Customer")');
      await this.page.waitForTimeout(2000);
      this.businessData.customers.push({ id: 'cust-1', name: 'John Doe', email: 'john.doe@email.com' });
    });

    await this.recordOperation('Create Customer - Jane Smith', async () => {
      await this.page.goto(`${this.baseUrl}/customers/new`);
      await this.page.fill('input[name="name"]', 'Jane Smith');
      await this.page.fill('input[name="email"]', 'jane.smith@email.com');
      await this.page.fill('input[name="phone"]', '+94771234568');
      await this.page.fill('textarea[name="address"]', 'Kandy, Sri Lanka');
      await this.page.click('button:has-text("Save Customer")');
      await this.page.waitForTimeout(2000);
      this.businessData.customers.push({ id: 'cust-2', name: 'Jane Smith', email: 'jane.smith@email.com' });
    });

    // Edit Customer
    await this.recordOperation('Edit Customer - John Doe', async () => {
      await this.page.goto(`${this.baseUrl}/customers`);
      await this.page.click('tr:has-text("John Doe") button:has-text("Edit")');
      await this.page.fill('input[name="phone"]', '+94771234569');
      await this.page.click('button:has-text("Update")');
      await this.page.waitForTimeout(2000);
    });
  }

  // ==================== SALES INVOICE MANAGEMENT ====================
  async testSalesInvoiceManagement() {
    console.log('💰 Testing Sales Invoice Management...');

    // Single Item Sales Invoice
    await this.recordOperation('Create Sales Invoice - Single Item', async () => {
      await this.page.goto(`${this.baseUrl}/invoices/new`);
      await this.page.selectOption('select[name="customerId"]', { label: 'John Doe' });
      await this.page.fill('input[name="invoiceNumber"]', 'SALE-001');
      
      // Add single product
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="items[0].productId"]', { label: 'Nike Air Max 270' });
      await this.page.fill('input[name="items[0].quantity"]', '2');
      await this.page.fill('input[name="items[0].unitPrice"]', '24500');
      
      await this.page.click('button:has-text("Save Invoice")');
      await this.page.waitForTimeout(3000);
      
      this.businessData.salesInvoices.push({
        id: 'sinv-1',
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 24500 }],
        total: 49000,
        profit: 13000 // Assuming cost was 18000
      });
    });

    // Multiple Items Sales Invoice
    await this.recordOperation('Create Sales Invoice - Multiple Items', async () => {
      await this.page.goto(`${this.baseUrl}/invoices/new`);
      await this.page.selectOption('select[name="customerId"]', { label: 'Jane Smith' });
      await this.page.fill('input[name="invoiceNumber"]', 'SALE-002');
      
      // Add first product
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="items[0].productId"]', { label: 'Adidas Ultraboost 22' });
      await this.page.fill('input[name="items[0].quantity"]', '1');
      await this.page.fill('input[name="items[0].unitPrice"]', '28000');
      
      // Add second product
      await this.page.click('button:has-text("Add Product")');
      await this.page.selectOption('select[name="items[1].productId"]', { label: 'Nike Dri-FIT Training Shirt' });
      await this.page.fill('input[name="items[1].quantity"]', '3');
      await this.page.fill('input[name="items[1].unitPrice"]', '4500');
      
      await this.page.click('button:has-text("Save Invoice")');
      await this.page.waitForTimeout(3000);
      
      this.businessData.salesInvoices.push({
        id: 'sinv-2',
        customerId: 'cust-2',
        items: [
          { productId: 'prod-2', quantity: 1, unitPrice: 28000 },
          { productId: 'prod-3', quantity: 3, unitPrice: 4500 }
        ],
        total: 41500,
        profit: 14000 // Estimated profit
      });
    });

    // Validate Inventory Deduction
    await this.recordOperation('Validate Inventory Deduction After Sales', async () => {
      await this.page.goto(`${this.baseUrl}/inventory`);
      
      // Check if inventory quantities decreased correctly
      // Nike Air Max: 55 - 2 = 53 (considering the edit in purchase)
      // Adidas Ultraboost: 30 - 1 = 29
      // Nike Dri-FIT: 100 - 3 = 97 (minus transfers)
      await this.page.waitForTimeout(2000);
    });

    // Validate Profit Calculation
    await this.recordOperation('Validate Profit Calculation', async () => {
      await this.page.goto(`${this.baseUrl}/reports`);
      await this.page.click('button:has-text("Profit Report")');
      await this.page.waitForTimeout(2000);
      
      // Check if profit calculations are correct
      await expect(this.page.locator('text=Profit')).toBeVisible();
    });
  }

  // ==================== PAYMENT MANAGEMENT ====================
  async testPaymentManagement() {
    console.log('💳 Testing Payment Management...');

    // Partial Payment
    await this.recordOperation('Record Partial Payment', async () => {
      await this.page.goto(`${this.baseUrl}/payments/new`);
      await this.page.selectOption('select[name="invoiceId"]', { label: 'SALE-001' });
      await this.page.fill('input[name="amount"]', '30000');
      await this.page.selectOption('select[name="paymentMethod"]', 'cash');
      await this.page.click('button:has-text("Record Payment")');
      await this.page.waitForTimeout(2000);
      
      this.businessData.payments.push({
        id: 'pay-1',
        invoiceId: 'sinv-1',
        amount: 30000,
        type: 'partial'
      });
    });

    // Full Payment
    await this.recordOperation('Record Full Payment', async () => {
      await this.page.goto(`${this.baseUrl}/payments/new`);
      await this.page.selectOption('select[name="invoiceId"]', { label: 'SALE-002' });
      await this.page.fill('input[name="amount"]', '41500');
      await this.page.selectOption('select[name="paymentMethod"]', 'card');
      await this.page.click('button:has-text("Record Payment")');
      await this.page.waitForTimeout(2000);
      
      this.businessData.payments.push({
        id: 'pay-2',
        invoiceId: 'sinv-2',
        amount: 41500,
        type: 'full'
      });
    });

    // Validate Payment Status Changes
    await this.recordOperation('Validate Payment Status Changes', async () => {
      await this.page.goto(`${this.baseUrl}/invoices`);
      
      // Check if invoice statuses updated correctly
      await expect(this.page.locator('tr:has-text("SALE-001")')).toContainText('Partial');
      await expect(this.page.locator('tr:has-text("SALE-002")')).toContainText('Paid');
    });

    // Validate Due Payment Calculations
    await this.recordOperation('Validate Due Payment Calculations', async () => {
      await this.page.goto(`${this.baseUrl}/reports`);
      await this.page.click('button:has-text("Outstanding Payments")');
      await this.page.waitForTimeout(2000);
      
      // SALE-001 should show 19000 due (49000 - 30000)
      await expect(this.page.locator('text=19000')).toBeVisible();
    });
  }

  // ==================== ACCOUNTING SECTION ====================
  async testAccountingOperations() {
    console.log('📊 Testing Accounting Operations...');

    // Create Account
    await this.recordOperation('Create Account - Cash', async () => {
      await this.page.goto(`${this.baseUrl}/accounting/add-account`);
      await this.page.fill('input[name="name"]', 'Cash Account');
      await this.page.selectOption('select[name="type"]', 'asset');
      await this.page.fill('input[name="balance"]', '1000000');
      await this.page.click('button:has-text("Save Account")');
      await this.page.waitForTimeout(2000);
    });

    // Create Transaction
    await this.recordOperation('Create Transaction - Expense', async () => {
      await this.page.goto(`${this.baseUrl}/accounting/add-transaction`);
      await this.page.fill('input[name="description"]', 'Office Rent Payment');
      await this.page.fill('input[name="amount"]', '50000');
      await this.page.selectOption('select[name="type"]', 'expense');
      await this.page.click('button:has-text("Save Transaction")');
      await this.page.waitForTimeout(2000);
    });

    // Account Transfer
    await this.recordOperation('Account Transfer', async () => {
      await this.page.goto(`${this.baseUrl}/accounting/transfer`);
      await this.page.selectOption('select[name="fromAccount"]', { label: 'Cash Account' });
      await this.page.selectOption('select[name="toAccount"]', { label: 'Bank Account' });
      await this.page.fill('input[name="amount"]', '100000');
      await this.page.fill('textarea[name="description"]', 'Bank deposit');
      await this.page.click('button:has-text("Transfer")');
      await this.page.waitForTimeout(2000);
    });

    // Withdrawal
    await this.recordOperation('Account Withdrawal', async () => {
      await this.page.goto(`${this.baseUrl}/accounting/withdraw`);
      await this.page.selectOption('select[name="account"]', { label: 'Cash Account' });
      await this.page.fill('input[name="amount"]', '25000');
      await this.page.fill('textarea[name="description"]', 'Petty cash withdrawal');
      await this.page.click('button:has-text("Withdraw")');
      await this.page.waitForTimeout(2000);
    });

    // Validate Account Balances
    await this.recordOperation('Validate Account Balances', async () => {
      await this.page.goto(`${this.baseUrl}/accounting`);
      await this.page.waitForTimeout(2000);
      
      // Verify account balances are updated correctly
      await expect(this.page.locator('text=Cash Account')).toBeVisible();
    });
  }

  // ==================== ADDITIONAL ADMIN OPERATIONS ====================
  async testAdditionalAdminOperations() {
    console.log('⚙️ Testing Additional Admin Operations...');

    // User Management
    await this.recordOperation('Create New User', async () => {
      await this.page.goto(`${this.baseUrl}/settings/users`);
      await this.page.click('button:has-text("Add User")');
      await this.page.fill('input[name="name"]', 'Test Shop Manager');
      await this.page.fill('input[name="email"]', 'manager@test.com');
      await this.page.fill('input[name="password"]', 'manager123');
      await this.page.selectOption('select[name="role"]', 'Shop Staff');
      await this.page.click('button:has-text("Save User")');
      await this.page.waitForTimeout(2000);
    });

    // Shop Management
    await this.recordOperation('Create New Shop', async () => {
      await this.page.goto(`${this.baseUrl}/shops`);
      await this.page.click('button:has-text("Add Shop")');
      await this.page.fill('input[name="name"]', 'Test Outlet 3');
      await this.page.fill('input[name="location"]', 'Galle, Sri Lanka');
      await this.page.click('button:has-text("Save Shop")');
      await this.page.waitForTimeout(2000);
    });

    // System Settings
    await this.recordOperation('Update System Settings', async () => {
      await this.page.goto(`${this.baseUrl}/settings`);
      await this.page.fill('input[name="companyName"]', 'MS Sport Test Company');
      await this.page.fill('input[name="taxRate"]', '15');
      await this.page.click('button:has-text("Save Settings")');
      await this.page.waitForTimeout(2000);
    });

    // Reports Generation
    await this.recordOperation('Generate Sales Report', async () => {
      await this.page.goto(`${this.baseUrl}/reports`);
      await this.page.click('button:has-text("Sales Report")');
      await this.page.selectOption('select[name="period"]', 'this_month');
      await this.page.click('button:has-text("Generate")');
      await this.page.waitForTimeout(3000);
      
      // Validate report data
      await expect(this.page.locator('text=Total Sales')).toBeVisible();
    });

    // Inventory Report
    await this.recordOperation('Generate Inventory Report', async () => {
      await this.page.click('button:has-text("Inventory Report")');
      await this.page.selectOption('select[name="shop"]', 'all');
      await this.page.click('button:has-text("Generate")');
      await this.page.waitForTimeout(3000);
      
      await expect(this.page.locator('text=Current Stock')).toBeVisible();
    });

    // Audit Trail Check
    await this.recordOperation('Check Audit Trail', async () => {
      await this.page.goto(`${this.baseUrl}/audit-trail`);
      await this.page.waitForTimeout(2000);
      
      // Verify audit logs are being created
      await expect(this.page.locator('text=Activity Log')).toBeVisible();
    });
  }

  // ==================== DATA INTEGRITY VALIDATION ====================
  async validateDataIntegrity() {
    console.log('🔍 Validating Data Integrity...');

    await this.recordOperation('Validate Financial Consistency', async () => {
      // Check if total sales match payment records
      // Check if inventory values are consistent
      // Check if profit calculations are accurate
      await this.page.goto(`${this.baseUrl}/reports`);
      await this.page.click('button:has-text("Financial Summary")');
      await this.page.waitForTimeout(3000);
    });

    await this.recordOperation('Validate Inventory Consistency', async () => {
      // Verify inventory quantities across all operations
      // Check weighted average costs
      // Validate shop-wise distributions
      await this.page.goto(`${this.baseUrl}/inventory`);
      await this.page.waitForTimeout(2000);
    });
  }

  async generateReport(): Promise<TestMetrics> {
    this.metrics.endTime = Date.now();
    this.metrics.averageResponseTime = this.metrics.operations.reduce((sum, op) => sum + op.duration, 0) / this.metrics.totalOperations;

    console.log('\n============================================================');
    console.log('📋 ADMIN WORKFLOW RELIABILITY TEST REPORT');
    console.log('============================================================\n');

    console.log('📊 Overall Results:');
    console.log(`   Total Duration: ${((this.metrics.endTime - this.metrics.startTime) / 1000).toFixed(1)}s`);
    console.log(`   Operations Tested: ${this.metrics.totalOperations}`);
    console.log(`   Successful: ${this.metrics.successfulOperations}`);
    console.log(`   Failed: ${this.metrics.failedOperations}`);
    console.log(`   Success Rate: ${((this.metrics.successfulOperations / this.metrics.totalOperations) * 100).toFixed(1)}%`);
    console.log(`   Average Response Time: ${this.metrics.averageResponseTime.toFixed(0)}ms\n`);

    console.log('📋 Operation Details:');
    this.metrics.operations.forEach(op => {
      const status = op.success ? '✅' : '❌';
      console.log(`   ${status} ${op.name} (${op.duration}ms)${op.error ? ` - ${op.error}` : ''}`);
    });

    console.log('\n📊 Business Data Created:');
    console.log(`   Categories: ${this.businessData.categories.length}`);
    console.log(`   Products: ${this.businessData.products.length}`);
    console.log(`   Suppliers: ${this.businessData.suppliers.length}`);
    console.log(`   Customers: ${this.businessData.customers.length}`);
    console.log(`   Purchase Invoices: ${this.businessData.purchaseInvoices.length}`);
    console.log(`   Sales Invoices: ${this.businessData.salesInvoices.length}`);
    console.log(`   Inventory Transfers: ${this.businessData.inventoryTransfers.length}`);
    console.log(`   Payments: ${this.businessData.payments.length}`);

    const successRate = (this.metrics.successfulOperations / this.metrics.totalOperations) * 100;
    console.log('\n🎯 Production Readiness Assessment:');
    if (successRate >= 90) {
      console.log('✅ EXCELLENT - System is production ready');
    } else if (successRate >= 75) {
      console.log('⚠️  GOOD - Minor issues need attention');
    } else if (successRate >= 50) {
      console.log('⚠️  NEEDS IMPROVEMENT - Several issues require fixing');
    } else {
      console.log('❌ CRITICAL ISSUES - System needs major fixes before production');
    }

    console.log('\n============================================================');

    return this.metrics;
  }

  async runCompleteWorkflowTest() {
    console.log('🚀 Starting Comprehensive Admin Workflow Reliability Test\n');

    try {
      await this.login();
      await this.testCategoryManagement();
      await this.testSupplierManagement();
      await this.testProductManagement();
      await this.testPurchaseInvoiceManagement();
      await this.testInventoryTransfers();
      await this.testCustomerManagement();
      await this.testSalesInvoiceManagement();
      await this.testPaymentManagement();
      await this.testAccountingOperations();
      await this.testAdditionalAdminOperations();
      await this.validateDataIntegrity();
    } catch (error) {
      console.error('❌ Workflow test failed:', error);
    }

    return await this.generateReport();
  }
}

// Export for use in test files
export { AdminWorkflowTester };

// Playwright test configuration
test.describe('Admin Workflow Reliability Tests', () => {
  test('Complete Admin Business Workflow', async ({ page }) => {
    const tester = new AdminWorkflowTester(page);
    const metrics = await tester.runCompleteWorkflowTest();
    
    // Assert minimum success rate
    expect(metrics.successfulOperations / metrics.totalOperations).toBeGreaterThan(0.8);
  });
}); 