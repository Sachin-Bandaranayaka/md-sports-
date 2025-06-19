import prisma from '@/lib/prisma';

// Export prisma client as db for consistency with import patterns
export const db = prisma;

// Re-export prisma for backward compatibility
export { prisma };

// Export db as default for backward compatibility
export default prisma;
