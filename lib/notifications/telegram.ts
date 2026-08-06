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
export async function sendTelegramNewOrder(
  order: OrderNotificationData,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: buildText(order) }),
    });
  } catch {
    // Сеть/ошибка API не должны мешать оформлению заказа.
  }
}
