import * as XLSX from 'xlsx';

// Mock the authentication and database modules
jest.mock('@/lib/auth', () => ({
  validateTokenPermission: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    shop: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryItem: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Bulk Import Business Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Excel File Processing', () => {
    const createTestExcelBuffer = (data: any[]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    };

    it('should parse Excel file correctly', () => {
      const testData = [
        {
          Name: 'Test Product',
          SKU: 'TP001',
          RetailPrice: 100,
          CostPrice: 80,
        },
      ];

      const buffer = createTestExcelBuffer(testData);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      expect(jsonData).toHaveLength(1);
      expect(jsonData[0]).toEqual(expect.objectContaining({
        Name: 'Test Product',
        SKU: 'TP001',
        RetailPrice: 100,
        CostPrice: 80,
      }));
    });

    it('should handle empty Excel files', () => {
      const testData: any[] = [];
      const buffer = createTestExcelBuffer(testData);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      expect(jsonData).toHaveLength(0);
    });

    it('should parse different data types correctly', () => {
      const testData = [
        {
          Name: 'Product 1',
          SKU: 'P001',
          RetailPrice: '100.50', // String number
          CostPrice: 80.25,      // Actual number
          InitialQuantity: '25', // String number
        },
      ];

      const buffer = createTestExcelBuffer(testData);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const product = jsonData[0] as any;
      expect(parseFloat(String(product.RetailPrice))).toBe(100.5);
      expect(product.CostPrice).toBe(80.25);
      expect(parseInt(String(product.InitialQuantity))).toBe(25);
    });
  });

  describe('Data Validation Logic', () => {
    const validateProduct = (product: any) => {
      const errors: string[] = [];

      // Name validation
      if (!product.Name?.trim()) {
        errors.push('Product Name is required');
      }

      // Price validation
      const price = parseFloat(String(product.RetailPrice));
      if (!product.RetailPrice || isNaN(price) || price < 0) {
        errors.push('Invalid or missing Retail Price');
      }

      // SKU validation
      if (product.SKU && typeof product.SKU !== 'string') {
        errors.push('SKU must be a string');
      }

      // Initial quantity and shop validation
      const initialQuantity = product.InitialQuantity ? parseInt(String(product.InitialQuantity)) : 0;
      if (initialQuantity > 0 && !product.ShopName?.trim()) {
        errors.push('Shop Name is required when Initial Quantity is greater than 0');
      }

      return {
        isValid: errors.length === 0,
        errors,
        parsedData: {
          name: product.Name?.trim(),
          sku: product.SKU?.trim() || null,
          price,
          initialQuantity,
          shopName: product.ShopName?.trim() || null,
        },
      };
    };

    it('should validate required fields correctly', () => {
      const validProduct = {
        Name: 'Valid Product',
        RetailPrice: 100,
      };

      const invalidProduct = {
        Name: '',
        RetailPrice: 'invalid',
      };

      const validResult = validateProduct(validProduct);
      const invalidResult = validateProduct(invalidProduct);

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Product Name is required');
      expect(invalidResult.errors).toContain('Invalid or missing Retail Price');
    });

    it('should validate InitialQuantity and ShopName relationship', () => {
      const productWithQuantityNoShop = {
        Name: 'Test Product',
        RetailPrice: 100,
        InitialQuantity: 50,
        ShopName: '',
      };

      const productWithQuantityAndShop = {
        Name: 'Test Product',
        RetailPrice: 100,
        InitialQuantity: 50,
        ShopName: 'Test Shop',
      };

      const result1 = validateProduct(productWithQuantityNoShop);
      const result2 = validateProduct(productWithQuantityAndShop);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Shop Name is required when Initial Quantity is greater than 0');

      expect(result2.isValid).toBe(true);
      expect(result2.errors).toHaveLength(0);
    });

    it('should handle numeric string parsing', () => {
      const product = {
        Name: 'Test Product',
        RetailPrice: '123.45',
        CostPrice: '67.89',
        InitialQuantity: '10',
        ShopName: 'Test Shop', // Required since InitialQuantity > 0
      };

      const result = validateProduct(product);

      expect(result.isValid).toBe(true);
      expect(result.parsedData.price).toBe(123.45);
      expect(result.parsedData.initialQuantity).toBe(10);
    });
  });

  describe('Duplicate Detection Logic', () => {
    const detectDuplicateSKUs = (products: any[]) => {
      const skuMap = new Map<string, number[]>();
      const duplicates: { sku: string; rows: number[] }[] = [];

      products.forEach((product, index) => {
        const sku = product.SKU?.trim();
        if (sku) {
          if (!skuMap.has(sku)) {
            skuMap.set(sku, []);
          }
          skuMap.get(sku)!.push(index + 2); // +2 for Excel row numbering (header + 1-based)
        }
      });

      skuMap.forEach((rows, sku) => {
        if (rows.length > 1) {
          duplicates.push({ sku, rows });
        }
      });

      return duplicates;
    };

    it('should detect duplicate SKUs within batch', () => {
      const products = [
        { Name: 'Product 1', SKU: 'P001', RetailPrice: 100 },
        { Name: 'Product 2', SKU: 'P002', RetailPrice: 200 },
        { Name: 'Product 3', SKU: 'P001', RetailPrice: 300 }, // Duplicate
        { Name: 'Product 4', SKU: 'P003', RetailPrice: 400 },
        { Name: 'Product 5', SKU: 'P002', RetailPrice: 500 }, // Duplicate
      ];

      const duplicates = detectDuplicateSKUs(products);

      expect(duplicates).toHaveLength(2);
      expect(duplicates.find(d => d.sku === 'P001')?.rows).toEqual([2, 4]);
      expect(duplicates.find(d => d.sku === 'P002')?.rows).toEqual([3, 6]);
    });

    it('should handle products without SKUs', () => {
      const products = [
        { Name: 'Product 1', RetailPrice: 100 }, // No SKU
        { Name: 'Product 2', SKU: 'P002', RetailPrice: 200 },
        { Name: 'Product 3', SKU: '', RetailPrice: 300 }, // Empty SKU
      ];

      const duplicates = detectDuplicateSKUs(products);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('Batch Processing Logic', () => {
    const processBatch = async (products: any[]) => {
      const results: Array<{ index: number; success: boolean; message: string; productName?: string }> = [];
      let successCount = 0;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const rowIndex = i + 2; // Excel row numbering

        try {
          // Simulate validation
          if (!product.Name || !product.RetailPrice) {
            throw new Error('Missing required fields');
          }

          // Simulate successful processing
          results.push({
            index: rowIndex,
            success: true,
            message: 'Product processed successfully',
            productName: product.Name,
          });
          successCount++;
        } catch (error) {
          results.push({
            index: rowIndex,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            productName: product.Name,
          });
        }
      }

      return {
        success: successCount > 0,
        totalProcessed: products.length,
        successCount,
        failureCount: products.length - successCount,
        results,
      };
    };

    it('should process mixed valid and invalid products', async () => {
      const products = [
        { Name: 'Valid Product 1', RetailPrice: 100 },
        { Name: '', RetailPrice: 200 }, // Invalid: no name
        { Name: 'Valid Product 2', RetailPrice: 300 },
        { Name: 'Invalid Product', RetailPrice: null }, // Invalid: no price
      ];

      const result = await processBatch(products);

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(4);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(2);
      expect(result.results).toHaveLength(4);

      const successfulResults = result.results.filter(r => r.success);
      const failedResults = result.results.filter(r => !r.success);

      expect(successfulResults).toHaveLength(2);
      expect(failedResults).toHaveLength(2);
    });

    it('should handle empty batch', async () => {
      const result = await processBatch([]);

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('File Type Validation', () => {
    const validateFileType = (fileName: string, fileType: string) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
      ];

      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      const extension = fileName.toLowerCase().split('.').pop();

      return {
        isValidType: allowedTypes.includes(fileType),
        isValidExtension: allowedExtensions.includes(`.${extension}`),
        isValid: allowedTypes.includes(fileType) && allowedExtensions.includes(`.${extension}`),
      };
    };

    it('should validate Excel file types', () => {
      const xlsxResult = validateFileType(
        'products.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      const xlsResult = validateFileType(
        'products.xls',
        'application/vnd.ms-excel'
      );
      const csvResult = validateFileType(
        'products.csv',
        'text/csv'
      );

      expect(xlsxResult.isValid).toBe(true);
      expect(xlsResult.isValid).toBe(true);
      expect(csvResult.isValid).toBe(true);
    });

    it('should reject invalid file types', () => {
      const txtResult = validateFileType('products.txt', 'text/plain');
      const pdfResult = validateFileType('products.pdf', 'application/pdf');

      expect(txtResult.isValid).toBe(false);
      expect(pdfResult.isValid).toBe(false);
    });
  });
}); 