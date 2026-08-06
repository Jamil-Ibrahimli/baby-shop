// Единый экземпляр PrismaClient (Prisma 7 + driver adapter для PostgreSQL).
// В dev переиспользуем клиент между hot-reload, чтобы не плодить подключения.
//
// DATABASE_URL — это ПУЛЕР Supabase (Supavisor, порт 6543). На serverless-платформе
// каждый инстанс держит своё соединение, и без пулера прод-база быстро упирается
// в лимит подключений. Миграции ходят по DIRECT_URL (порт 5432) — см. prisma.config.ts:
// пулеру в transaction-режиме DDL и advisory-локи Migrate не подходят.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL не задан. Скопируйте .env.example в .env.");
}

const adapter = new PrismaPg({ connectionString: url });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
