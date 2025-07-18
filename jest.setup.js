// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import { cleanupCache } from './src/lib/cache';

// Mock Next.js Request and Response for API route testing
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
    this._formData = null;
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  async formData() {
    return this._formData || new FormData();
  }

  headers = {
    get: (key) => this.headers.get(key) || null,
  };
};

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
};

// Mock FormData for file upload tests
global.FormData = class MockFormData extends Map {
  append(key, value) {
    this.set(key, value);
  }

  get(key) {
    return super.get(key);
  }
};

// Mock File constructor for testing
global.File = class MockFile {
  constructor(parts, name, options = {}) {
    this.name = name;
    this.size = parts.reduce((total, part) => total + part.length, 0);
    this.type = options.type || '';
    this.lastModified = Date.now();
  }
};

// Mock fetch globally for component tests
global.fetch = jest.fn();

// Mock window.open for template download tests
Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true,
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Suppress console.warn for React act warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '12h';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock console.log to reduce noise during tests
// console.log = jest.fn();
// global.console = {
//   ...console,
//   log: jest.fn(),
// };

// Temporarily enable console.log for debugging
console.log = console.log;

// Mock cache module
jest.mock('./src/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    generateKey: jest.fn(),
    invalidatePattern: jest.fn(),
  },
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    generateKey: jest.fn(),
    invalidatePattern: jest.fn(),
  },
  cleanupCache: jest.fn(),
  CACHE_CONFIG: {
    KEYS: {
      USER_SESSION: 'user_session',
      TOKEN_VALIDATION: 'token_validation',
    },
    TTL: {
      USER_SESSION: 3600,
      TOKEN_VALIDATION: 1800,
    },
  },
}));

// Mock Prisma client for testing
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    auditLog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    refreshToken: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    }
  }))
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    auditLog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    refreshToken: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    }
  }
}));

// Mock Sequelize models for testing
jest.mock('@/lib/models', () => ({
  Product: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Customer: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Invoice: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  AuditLog: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Clean up cache after all tests
afterAll(() => {
  cleanupCache();
});