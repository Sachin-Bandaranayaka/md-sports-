/**
 * Health check endpoint optimized for Vercel serverless
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache-vercel';

// Vercel serverless optimizations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Check cache health
    const cacheKey = 'health:check';
    const timestamp = Date.now();
    await cache.set(cacheKey, timestamp, 60);
    const cachedValue = await cache.get(cacheKey);
    
    // Check database health
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;
    
    const totalTime = Date.now() - start;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy',
          responseTime: `${dbTime}ms`
        },
        cache: {
          status: cachedValue === timestamp ? 'healthy' : 'degraded',
          responseTime: 'N/A'
        }
      },
      environment: {
        runtime: 'vercel-serverless',
        region: process.env.VERCEL_REGION || 'unknown',
        nodeVersion: process.version
      },
      performance: {
        totalResponseTime: `${totalTime}ms`
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        totalResponseTime: `${Date.now() - start}ms`
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}