import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Prisma 7 retired the bundled query engine. The PrismaClient constructor
 * now requires either a driver adapter or an `accelerateUrl`. We use the
 * official Neon driver adapter (`@prisma/adapter-neon`) which transports
 * over Neon's HTTP/WebSocket serverless protocol — works on Node and Edge,
 * and handles serverless connection pooling natively.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = global.__prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;
