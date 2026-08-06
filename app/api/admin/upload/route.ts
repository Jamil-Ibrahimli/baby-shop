import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin/guard";
import { isStorageConfigured, uploadProductImage } from "@/lib/storage";

// Загрузка фото товара. ТОЛЬКО admin. Файл уходит в Supabase Storage, в ответе —
// публичный URL, который админка кладёт в ProductImage.url.
// Валидация типа и размера — здесь; сама выгрузка — в lib/storage.ts.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 МБ

export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // Отдельный код ошибки: владельцу магазина нужно понять, что дело в настройках,
  // а не в файле. Иначе «не удалось загрузить» отправляет искать проблему не туда.
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "bad_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadProductImage(buffer, file.type, ext);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
