import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// Хранилище файлов магазина — Supabase Storage.
// Раньше фото писались в public/uploads: на Vercel файловая система эфемерна,
// поэтому после деплоя или перезапуска инстанса такие файлы исчезали.
//
// Ключ SERVICE_ROLE обходит RLS и НИКОГДА не должен попасть в браузер, поэтому
// модуль server-only и клиент создаётся лениво (при импорте на клиенте — ошибка сборки).

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

/** Хранилище настроено (есть URL проекта и service-role ключ). */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не заданы — загрузка фото недоступна.",
    );
  }
  // Сессии не нужны: это серверный клиент под service-role.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Загружает фото товара и возвращает публичный URL.
 * Бакет должен быть ПУБЛИЧНЫМ — иначе getPublicUrl вернёт ссылку, которая отдаст 400.
 */
export async function uploadProductImage(
  bytes: Buffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const supabase = getClient();
  const objectPath = `products/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, bytes, { contentType, upsert: false });

  if (error) {
    throw new Error(`Supabase Storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
