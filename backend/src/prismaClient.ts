import { PrismaClient } from '@prisma/client';

// Singleton do Prisma Client - evita múltiplas conexões em dev com hot-reload
export const prisma = new PrismaClient();
