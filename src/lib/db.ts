import { prisma } from './prisma';

// Export prisma client as db for consistency with import patterns
export const db = prisma;

// Re-export prisma for backward compatibility
export { prisma };

// Export default as db
export default db;