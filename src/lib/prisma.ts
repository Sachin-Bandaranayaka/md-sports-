import { PrismaClient } from '@prisma/client';

// Use a single instance of Prisma Client across the entire app
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://localhost:5432/mssport',
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 