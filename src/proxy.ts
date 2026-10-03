// Next.js 16 переименовал middleware → proxy. Здесь:
//  1) i18n-мидлвар next-intl (локаль, cookie языка, префикс /ru|/az);
//  2) выдача session-токена гостевой корзины (cart_session), если его ещё нет.
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { CART_COOKIE } from "./lib/cart-types";

const handleI18n = createMiddleware(routing);
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 дней

export default function proxy(request: NextRequest) {
  const response = handleI18n(request);

  if (!request.cookies.get(CART_COOKIE)) {
    response.cookies.set(CART_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  // Пропускаем внутренние пути Next, API и файлы со статикой (содержат точку).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
