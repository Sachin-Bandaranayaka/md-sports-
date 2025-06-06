import '@testing-library/jest-dom';

// Mock utility functions (since we don't have actual utility files)
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (date: Date | string, format: string = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US');
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return dateObj.toLocaleTimeString('en-US');
    case 'datetime':
      return dateObj.toLocaleString('en-US');
    default:
      return dateObj.toLocaleDateString('en-US');
  }
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@\.]+(?:\.[^\s@\.]+)*@[^\s@\.]+(?:\.[^\s@\.]+)+$/;
  return emailRegex.test(email) && !email.includes('..');
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,3}[\s\-]?[\(]?[\d]{1,3}[\)]?[\s\-]?[\d]{1,4}[\s\-]?[\d]{1,4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const generateInvoiceNumber = (prefix: string = 'INV', sequence: number): string => {
  return `${prefix}-${sequence.toString().padStart(6, '0')}`;
};

const calculateTax = (amount: number, taxRate: number): number => {
  return Math.round((amount * taxRate / 100) * 100) / 100;
};

const calculateDiscount = (amount: number, discountPercent: number): number => {
  return Math.round((amount * discountPercent / 100) * 100) / 100;
};

const calculateTotal = (subtotal: number, tax: number, discount: number = 0): number => {
  return Math.round((subtotal + tax - discount) * 100) / 100;
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

const generateRandomId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
};

const parseQueryParams = (queryString: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const urlParams = new URLSearchParams(queryString);
  
  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }
  
  return params;
};

const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  
  return searchParams.toString();
};

const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

const sortArray = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  if (!isFinite(value) || !isFinite(total)) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return bytes + ' Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
};

const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      addedDays++;
    }
  }
  
  return result;
};

const maskSensitiveData = (data: string, visibleChars: number = 4, maskChar: string = '*'): string => {
  if (data.length <= visibleChars) {
    return data;
  }
  
  const visiblePart = data.slice(-visibleChars);
  const maskedPart = maskChar.repeat(data.length - visibleChars);
  
  return maskedPart + visiblePart;
};

describe('Utility Functions Testing', () => {
  describe('Currency Formatting', () => {
    test('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    test('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56');
      expect(formatCurrency(1234.56, 'GBP')).toContain('1,234.56');
    });

    test('should handle negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });
  });

  describe('Date Formatting', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    test('should format dates in different formats', () => {
      expect(formatDate(testDate, 'short')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatDate(testDate, 'long')).toContain('January');
      expect(formatDate(testDate, 'time')).toMatch(/\d{1,2}:\d{2}/);
      expect(formatDate(testDate, 'datetime')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}.*\d{1,2}:\d{2}/);
    });

    test('should handle string dates', () => {
      expect(formatDate('2024-01-15', 'short')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    test('should default to short format', () => {
      expect(formatDate(testDate)).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('Validation Functions', () => {
    describe('Email Validation', () => {
      test('should validate correct email addresses', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.uk')).toBe(true);
        expect(validateEmail('user+tag@example.org')).toBe(true);
      });

      test('should reject invalid email addresses', () => {
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('test..test@example.com')).toBe(false);
      });
    });

    describe('Phone Validation', () => {
      test('should validate correct phone numbers', () => {
        expect(validatePhone('+1234567890')).toBe(true);
        expect(validatePhone('1234567890')).toBe(true);
        expect(validatePhone('+1 (234) 567-8900')).toBe(true);
      });

      test('should reject invalid phone numbers', () => {
        expect(validatePhone('123')).toBe(false);
        expect(validatePhone('abc123')).toBe(false);
        expect(validatePhone('')).toBe(false);
      });
    });
  });

  describe('Business Logic Functions', () => {
    test('should generate invoice numbers correctly', () => {
      expect(generateInvoiceNumber('INV', 1)).toBe('INV-000001');
      expect(generateInvoiceNumber('SALE', 123)).toBe('SALE-000123');
      expect(generateInvoiceNumber('', 999999)).toBe('-999999');
    });

    test('should calculate tax correctly', () => {
      expect(calculateTax(100, 10)).toBe(10);
      expect(calculateTax(123.45, 8.25)).toBe(10.18);
      expect(calculateTax(0, 10)).toBe(0);
    });

    test('should calculate discount correctly', () => {
      expect(calculateDiscount(100, 10)).toBe(10);
      expect(calculateDiscount(250, 15)).toBe(37.5);
      expect(calculateDiscount(100, 0)).toBe(0);
    });

    test('should calculate total correctly', () => {
      expect(calculateTotal(100, 10, 5)).toBe(105);
      expect(calculateTotal(100, 10)).toBe(110);
      expect(calculateTotal(123.45, 10.18, 12.34)).toBe(121.29);
    });
  });

  describe('Performance Utilities', () => {
    test('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('test3');
        done();
      }, 150);
    });

    test('should throttle function calls', (done) => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn('test1');
      throttledFn('test2');
      throttledFn('test3');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test1');
      
      setTimeout(() => {
        throttledFn('test4');
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenCalledWith('test4');
        done();
      }, 150);
    });
  });

  describe('Object Utilities', () => {
    test('should deep clone objects correctly', () => {
      const original = {
        name: 'Test',
        nested: {
          value: 123,
          array: [1, 2, { deep: true }]
        },
        date: new Date('2024-01-01')
      };
      
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.array).not.toBe(original.nested.array);
      expect(cloned.date).not.toBe(original.date);
    });

    test('should handle primitive values in deep clone', () => {
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
      expect(deepClone(123)).toBe(123);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
    });
  });

  describe('String Utilities', () => {
    test('should generate random IDs', () => {
      const id1 = generateRandomId();
      const id2 = generateRandomId();
      const id3 = generateRandomId(12);
      
      expect(id1).toHaveLength(8);
      expect(id2).toHaveLength(8);
      expect(id3).toHaveLength(12);
      expect(id1).not.toBe(id2);
      expect(/^[A-Za-z0-9]+$/.test(id1)).toBe(true);
    });

    test('should slugify text correctly', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test & Special Characters!')).toBe('test-special-characters');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('Already-slugified')).toBe('already-slugified');
    });

    test('should capitalize text correctly', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('tEST')).toBe('Test');
      expect(capitalize('')).toBe('');
    });

    test('should truncate text correctly', () => {
      expect(truncateText('Short text', 20)).toBe('Short text');
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
      expect(truncateText('Custom suffix', 8, '---')).toBe('Custo---');
    });

    test('should mask sensitive data', () => {
      expect(maskSensitiveData('1234567890', 4)).toBe('******7890');
      expect(maskSensitiveData('secret', 2)).toBe('****et');
      expect(maskSensitiveData('abc', 4)).toBe('abc');
      expect(maskSensitiveData('password', 3, '#')).toBe('#####ord');
    });
  });

  describe('URL and Query Utilities', () => {
    test('should parse query parameters correctly', () => {
      const params = parseQueryParams('?name=John&age=30&city=New%20York');
      
      expect(params).toEqual({
        name: 'John',
        age: '30',
        city: 'New York'
      });
    });

    test('should build query string correctly', () => {
      const params = {
        name: 'John',
        age: 30,
        active: true,
        empty: '',
        nullValue: null,
        undefinedValue: undefined
      };
      
      const queryString = buildQueryString(params);
      
      expect(queryString).toContain('name=John');
      expect(queryString).toContain('age=30');
      expect(queryString).toContain('active=true');
      expect(queryString).not.toContain('empty=');
      expect(queryString).not.toContain('nullValue=');
      expect(queryString).not.toContain('undefinedValue=');
    });
  });

  describe('JSON Utilities', () => {
    test('should validate JSON correctly', () => {
      expect(isValidJSON('{"name": "John"}')).toBe(true);
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
      expect(isValidJSON('123')).toBe(true);
      expect(isValidJSON('true')).toBe(true);
      
      expect(isValidJSON('invalid json')).toBe(false);
      expect(isValidJSON('{name: "John"}')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('Array Utilities', () => {
    const testData = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Los Angeles' },
      { name: 'Bob', age: 35, city: 'New York' }
    ];

    test('should sort array correctly', () => {
      const sortedByAge = sortArray(testData, 'age');
      expect(sortedByAge[0].age).toBe(25);
      expect(sortedByAge[2].age).toBe(35);
      
      const sortedByAgeDesc = sortArray(testData, 'age', 'desc');
      expect(sortedByAgeDesc[0].age).toBe(35);
      expect(sortedByAgeDesc[2].age).toBe(25);
      
      const sortedByName = sortArray(testData, 'name');
      expect(sortedByName[0].name).toBe('Bob');
      expect(sortedByName[2].name).toBe('John');
    });

    test('should group array correctly', () => {
      const grouped = groupBy(testData, 'city');
      
      expect(grouped['New York']).toHaveLength(2);
      expect(grouped['Los Angeles']).toHaveLength(1);
      expect(grouped['New York'][0].name).toBe('John');
      expect(grouped['New York'][1].name).toBe('Bob');
    });
  });

  describe('Math Utilities', () => {
    test('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33.33);
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(100, 0)).toBe(0);
    });

    test('should format file size correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('Date Business Logic', () => {
    test('should identify business days correctly', () => {
      const monday = new Date('2024-01-15'); // Monday
      const saturday = new Date('2024-01-13'); // Saturday
      const sunday = new Date('2024-01-14'); // Sunday
      
      expect(isBusinessDay(monday)).toBe(true);
      expect(isBusinessDay(saturday)).toBe(false);
      expect(isBusinessDay(sunday)).toBe(false);
    });

    test('should add business days correctly', () => {
      const friday = new Date('2024-01-12'); // Friday
      const nextBusinessDay = addBusinessDays(friday, 1);
      const threeDaysLater = addBusinessDays(friday, 3);
      
      expect(nextBusinessDay.getDay()).toBe(1); // Monday
      expect(threeDaysLater.getDay()).toBe(3); // Wednesday
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(() => formatCurrency(NaN)).not.toThrow();
      expect(() => formatDate(new Date('invalid'))).not.toThrow();
      expect(() => calculateTax(-100, 10)).not.toThrow();
      expect(() => slugify('')).not.toThrow();
    });

    test('should handle edge cases', () => {
      expect(calculatePercentage(Infinity, 100)).toBe(0);
      expect(formatFileSize(-1)).toBe('-1 Bytes');
      expect(truncateText('', 10)).toBe('');
      expect(maskSensitiveData('', 4)).toBe('');
    });
  });
});