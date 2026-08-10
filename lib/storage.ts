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
 * Приметы конфигурации для сообщения об ошибке: хост и бакет — НЕ секреты,
 * их видно в публичных ссылках на фото. Ключ показываем только длиной:
 * так видно «пусто/обрезан/подставлен не тот», но сам ключ не утекает.
 */
function configHint(): string {
  const raw = process.env.SUPABASE_URL ?? "";
  let host = "(SUPABASE_URL пуст)";
  if (raw) {
    try {
      host = new URL(raw).host;
    } catch {
      host = `(SUPABASE_URL не разбирается как адрес: ${raw.slice(0, 40)})`;
    }
  }
  const keyLen = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length;
  return `хост ${host}, бакет ${BUCKET}, длина ключа ${keyLen}`;
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

  // Ошибку дополняем приметами конфигурации: без них «fetch failed» не отличить
  // от неверного ключа или несуществующего бакета, а логи хостинга владельцу
  // магазина недоступны. Сообщение видит только админ (роут под гардом).
  let error;
  try {
    ({ error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, { contentType, upsert: false }));
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`Supabase Storage недоступен: ${reason} (${configHint()})`);
  }

  if (error) {
    throw new Error(`Supabase Storage: ${error.message} (${configHint()})`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
