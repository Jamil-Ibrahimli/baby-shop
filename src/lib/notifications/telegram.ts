import "server-only";
import { formatMoney } from "@/lib/format";
import type { OrderNotificationData } from "./index";

// Текст сообщения владельцу (RU). Номер, товары, размеры, сумма, контакт, адрес, подарок, коммент.
function buildText(o: OrderNotificationData): string {
  const lines: string[] = [];
  lines.push(`🧸 Новый заказ ${o.orderNumber}`);
  lines.push("");
  for (const it of o.items) {
    lines.push(
      `• ${it.productNameRu} — ${it.sizeLabelRu}, ${it.colorRu} × ${it.quantity} — ${formatMoney(
        it.lineTotal,
        o.currency,
        "ru",
      )}`,
    );
  }
  lines.push("");
  lines.push(`Сумма: ${formatMoney(o.total, o.currency, "ru")}`);
  lines.push(
    `Покупатель: ${o.customerName}, ${o.customerPhone}` +
      (o.customerEmail ? `, ${o.customerEmail}` : ""),
  );
  lines.push(
    `Адрес: ${[o.shipPostalCode, o.shipCity, o.shipLine1, o.shipLine2]
      .filter(Boolean)
      .join(", ")}`,
  );
  if (o.isGift) {
    lines.push(`🎁 Подарок${o.giftMessage ? `: ${o.giftMessage}` : ""}`);
  }
  if (o.comment) lines.push(`Комментарий: ${o.comment}`);
  return lines.join("\n");
}

// Отправка в Telegram. Если TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы — пропуск без ошибки.
//
// Ответ API ОБЯЗАТЕЛЬНО проверяем: fetch не считает ошибкой ни 401 (неверный токен),
// ни 400 («chat not found»), поэтому раньше такие сбои были полностью невидимы —
// заказ оформлялся, а владелец просто не получал уведомление и не знал почему.
// Ошибку логируем и глотаем: оформление заказа она ломать не должна.
// Токен в лог не попадает никогда — только код и описание ошибки от Telegram.
export async function sendTelegramNewOrder(
  order: OrderNotificationData,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: buildText(order) }),
      },
    );

    const body = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error_code?: number;
      description?: string;
    } | null;

    if (!res.ok || !body?.ok) {
      console.warn(
        `[telegram] уведомление о заказе ${order.orderNumber} НЕ отправлено:`,
        {
          httpStatus: res.status,
          errorCode: body?.error_code,
          description: body?.description,
          hint:
            body?.error_code === 401
              ? "неверный или отозванный TELEGRAM_BOT_TOKEN — возьмите заново у @BotFather"
              : body?.error_code === 400
                ? "проверьте TELEGRAM_CHAT_ID и то, что вы писали боту хотя бы раз"
                : undefined,
        },
      );
      return;
    }

    console.info(
      `[telegram] уведомление о заказе ${order.orderNumber} отправлено`,
    );
  } catch (e) {
    // Сеть не должна мешать оформлению заказа, но и молчать о сбое нельзя.
    console.warn(
      `[telegram] уведомление о заказе ${order.orderNumber} НЕ отправлено (сетевая ошибка):`,
      e instanceof Error ? e.message : String(e),
    );
  }
}
