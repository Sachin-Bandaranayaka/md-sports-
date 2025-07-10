/**
 * @jest-environment node
 */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';

// Mock external dependencies BEFORE importing route handlers

// 1. next/server (NextResponse)
// Mock NextResponse (and any other exports we need) BEFORE importing route handlers
jest.mock('next/server', () => {
  const mockNextResponse = {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  };
  return {
    NextResponse: mockNextResponse,
  };
});

// 2. auth utilities – stub verifyToken to avoid ESM 'jose' parsing issues
jest.mock('@/lib/auth', () => {
  return {
    verifyToken: jest.fn(async (token: string) => {
      if (token === 'dev-token') {
        return {
          sub: 'test-user',
          shopId: 'shopA',
          permissions: ['inventory:transfer', 'shop:manage'],
        };
      }
      return null;
    }),
  };
});

// 3. Permission middleware – bypass actual permission checks
jest.mock('@/lib/utils/middleware', () => {
  return {
    requirePermission: (_permission: string) => {
      return async () => null; // Always grant
    },
  };
});

// Polyfill minimal global Request/Headers so route modules that rely on them do not crash in Node
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof global.Headers === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Headers, Request } = require('node-fetch');
  // @ts-ignore
  global.Headers = Headers;
  // @ts-ignore
  global.Request = Request;
}

// Import route handlers AFTER the mocks
import { POST as createTransferHandler } from '@/app/api/inventory/transfers/route';
import { DELETE as deleteTransferHandler } from '@/app/api/inventory/transfers/[id]/route';
import { POST as batchTransferHandler } from '@/app/api/inventory/transfers/batch/route';

// Simple mock NextRequest / NextResponse similar to existing integration tests
interface MockRequest {
  method: string;
  url: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
}

const createMockRequest = (url: string, opts: { method?: string; body?: any; headers?: Record<string, string> } = {}): MockRequest => {
  const { method = 'GET', body, headers = {} } = opts;
  return {
    method,
    url,
    headers: new Headers(headers),
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as MockRequest;
};

// Use the shared Prisma singleton from the application codebase instead of instantiating a new client

const DEV_HEADERS = {
  authorization: 'Bearer dev-token',
  'content-type': 'application/json',
};

describe('Inventory transfer reservation flow', () => {
  let shopAId: string;
  let shopBId: string;
  let productId: number;

  beforeAll(async () => {
    console.log('Prisma client keys in test:', Object.keys(prisma));
    console.log('prisma.shop is', typeof (prisma as any).shop);
    // create two shops & product
    // Provide explicit string IDs for shops to satisfy Prisma string primary key type
    const shopA = await prisma.shop.create({ data: { id: 'shopA', name: 'Shop A', location: 'X' }, select: { id: true } });
    const shopB = await prisma.shop.create({ data: { id: 'shopB', name: 'Shop B', location: 'Y' }, select: { id: true } });
    shopAId = shopA.id;
    shopBId = shopB.id;

    const product = await prisma.product.create({
      data: { name: 'Product A', price: 15, weightedAverageCost: 10.0 },
      select: { id: true },
    });
    productId = product.id;

    // add inventory 50 to shop A
    await prisma.inventoryItem.create({ data: { productId, shopId: shopAId, quantity: 50, shopSpecificCost: 10 } });
  });

  afterAll(async () => {
    await prisma.inventoryItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.shop.deleteMany({});
    await prisma.$disconnect();
  });

  test('reservation, cancel, complete flow', async () => {
    // 1. Create transfer 30 units pending
    const createReq = createMockRequest('http://localhost/api/inventory/transfers', {
      method: 'POST',
      headers: DEV_HEADERS,
      body: {
        sourceShopId: shopAId,
        destinationShopId: shopBId,
        items: [{ productId, quantity: 30 }],
      },
    });

    const createRes: any = await createTransferHandler(createReq as any);
    expect(createRes.status).toBe(201);
    const resBody = await createRes.json();
    const transferId = resBody.data.id;

    // verify source qty decreased to 20
    const sourceInventoryAfter = await prisma.inventoryItem.findFirst({ where: { productId, shopId: shopAId } });
    expect(sourceInventoryAfter?.quantity).toBe(20);

    // 2. Cancel transfer -> qty back to 50
    const deleteReq = createMockRequest(`http://localhost/api/inventory/transfers/${transferId}`, {
      method: 'DELETE',
      headers: DEV_HEADERS,
    });
    const deleteRes: any = await deleteTransferHandler(deleteReq as any, { params: Promise.resolve({ id: String(transferId) }) } as any);
    expect(deleteRes.status).toBe(200);

    const srcAfterCancel = await prisma.inventoryItem.findFirst({ where: { productId, shopId: shopAId } });
    expect(srcAfterCancel?.quantity).toBe(50);

    // 3. Re-create transfer and complete it
    const createReq2 = createMockRequest('http://localhost/api/inventory/transfers', {
      method: 'POST',
      headers: DEV_HEADERS,
      body: {
        sourceShopId: shopAId,
        destinationShopId: shopBId,
        items: [{ productId, quantity: 30 }],
      },
    });
    const createRes2: any = await createTransferHandler(createReq2 as any);
    const newTransferId = (await createRes2.json()).data.id;

    // batch complete
    const batchReq = createMockRequest('http://localhost/api/inventory/transfers/batch', {
      method: 'POST',
      headers: DEV_HEADERS,
      body: { transferIds: [newTransferId], action: 'complete' },
    });
    const batchRes: any = await batchTransferHandler(batchReq as any);
    expect(batchRes.status).toBe(200);

    // verify source qty remains 20, dest qty 30
    const srcFinal = await prisma.inventoryItem.findFirst({ where: { productId, shopId: shopAId } });
    expect(srcFinal?.quantity).toBe(20);

    const destInv = await prisma.inventoryItem.findFirst({ where: { productId, shopId: shopBId } });
    expect(destInv?.quantity).toBe(30);
  });
}); 