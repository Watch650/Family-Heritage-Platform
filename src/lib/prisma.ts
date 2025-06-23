import { PrismaClient } from '@prisma/client'

// Prevent multiple PrismaClient instances in development
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

// Reuse existing client or create a new one
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
