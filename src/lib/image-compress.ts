// Сжатие фото ПЕРЕД отправкой на сервер — прямо в браузере, через canvas.
// Владелец грузит снимки с телефона по 2–5 МБ: они долго летят в хранилище,
// занимают место и не проходят в превью ссылок в мессенджерах (у WhatsApp лимит
// на картинку ~600 КБ). Уменьшаем сторону и переводим в WebP: типичные 2 МБ
// превращаются в ~150 КБ без заметной потери качества.
//
// Внешних библиотек не добавляем — всё есть в браузере. Работает только на
// клиенте (нужен document/canvas).

const MAX_SIDE = 1600; // достаточно для карточки товара и зума на телефоне
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  // GIF пропускаем: canvas сохранил бы только первый кадр и убил анимацию.
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(
      1,
      MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    // Если легче не стало (фото уже оптимизировано) — отправляем оригинал.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.webp`, { type: "image/webp" });
  } catch {
    // Любая осечка (битый файл, нет canvas) не должна ломать загрузку.
    return file;
  }
}

// Через <img>, а не createImageBitmap: браузер сам применяет поворот из EXIF,
// иначе фото с телефона легло бы набок.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_load_failed"));
    };
    image.src = url;
  });
}
