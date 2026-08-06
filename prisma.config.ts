// Конфиг Prisma CLI (Prisma 7).
// В Prisma 7 строка подключения для Migrate задаётся здесь, а не в schema.prisma.
//
// Migrate ходит по DIRECT_URL (прямое подключение к Supabase, порт 5432), а НЕ по
// пулеру из DATABASE_URL: в transaction-режиме пулер не даёт держать advisory-лок
// и корректно применять DDL, и миграция падает или встаёт. Рантайм наоборот идёт
// через пулер — см. lib/prisma.ts.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
