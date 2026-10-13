import { PrismaClient } from '@prisma/client';
import { getEnv } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      getEnv().NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (getEnv().NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure BigInt values (e.g. cvAsset.sizeBytes) serialize cleanly to JSON
if (typeof BigInt !== 'undefined' && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}
