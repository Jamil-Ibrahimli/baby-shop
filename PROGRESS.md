# PROGRESS.md

Снимок состояния проекта для новой сессии. Дата: 2026-07-30.
Полные правила и стек — в `CLAUDE.md`, продукт — в `SPECIFICATION.md`.

---

## 1. Полностью готово

Всё собирается без ошибок/варнингов линтера, двуязычно (ru+az), mobile-first, проверено.

- **Каталог** `/[locale]/catalog` — фильтры (категория/размер/состав/цена) через URL, скелетоны, пустое состояние. → `lib/catalog.ts`, `lib/catalog-shared.ts`, `components/catalog/*`
- **Страница товара** `/[locale]/product/[slug]` — галерея, выбор варианта (размер+цвет, учёт остатка), таблица размеров, состав/уход/безопасность, комплекты, 404. → `lib/product.ts`, `lib/product-types.ts`, `components/product/*`
- **Отзывы** — создание/редактирование/удаление своего (1 на товар), только авторизованный; гостю приглашение войти; средняя оценка. → `lib/review-actions.ts`, `components/product/review-form.tsx`, `product-reviews.tsx`
- **Корзина** `/[locale]/cart` — гостевая (кука `cart_session`) ИЛИ по `userId`; учёт остатка; граничные случаи (нет в наличии / цена изменилась / пусто). → `lib/cart.ts`, `lib/cart-actions.ts`, `components/cart/*`
- **Аутентификация** — Credentials (email+пароль, bcrypt) + JWT; роли customer/admin; кабинет `/account` (профиль + заказы + адреса); слияние гостевой корзины при входе. → `auth.ts`, `lib/auth-actions.ts`, `app/api/auth/[...nextauth]`, `components/auth/*`, `types/next-auth.d.ts`
- **Checkout + заказ** `/[locale]/checkout` → заказ до статуса «создан», снапшот `OrderItem`, списание остатка в транзакции, очистка корзины. Онлайн-оплаты нет (`paymentStatus`/`paymentMethod` — задел под Stripe). → `lib/order-actions.ts`, `components/checkout/*`
- **Уведомления** — при новом заказе in-app админу + Telegram (молча без `TELEGRAM_*`). Клиенту — in-app в кабинете при смене статуса, только ключевые (`Принят`/`Отправлен`/`Доставлен`). Колокольчик в шапке: админ → лента, клиент → кабинет. → `lib/notifications`, `lib/notification-actions.ts`, `components/admin/*`
- **Админка — заказы** `/[locale]/admin/orders` (+`/[id]`) — таблица всех заказов (клиентов и гостей) + фильтр по статусу; карточка заказа: состав, клиент (телефон/адрес), смена статуса по цепочке + отмена, **история статусов**. Модель `OrderStatusHistory`. Клиент/админ жёстко разделены. → `lib/admin/orders.ts`, `lib/admin/order-status-actions.ts`, `lib/admin/guard.ts`, `components/admin/order-*`, хелперы в `lib/constants.ts`
- **Админка — товары/категории** — товары CRUD (варианты размер+цвет+цена+остаток, ru/az, состав/уход/безопасность, комплект, **загрузка фото файлами** через `app/api/admin/upload` → `public/uploads`); категории CRUD с иерархией. → `lib/admin/products.ts`/`product-actions.ts`/`categories.ts`/`category-actions.ts`, `components/admin/product-form.tsx` (+ variant-editor/image-uploader/color-images-editor/category-manager)
- **Фото по цветам** — фото сопоставляются с вариантами **по цвету** (не size+color): выбор цвета переключает галерею на его фото, откат к общим; размер на фото не влияет. Ключ `lib/color.ts`, контекст `components/product/color-selection.tsx`. Схема не менялась (`ProductImage.variantId` + матч по значению цвета). Админ грузит фото один раз на цвет.
- **Кабинет клиента** `/[locale]/account` — все свои заказы (кликабельны), лента уведомлений о статусах, колокольчик; менять статус нельзя.
- **Дизайн админки (оболочка + уведомления + главная)** — витрина вынесена в route group `app/[locale]/(shop)/*` (её `layout.tsx` держит `SiteHeader`), админка — отдельная панель: сайдбар на десктопе / sheet на мобильном (`components/admin/admin-sidebar.tsx`, `admin-nav.tsx`, `admin-user-card.tsx`), 10 разделов (нереализованные — «скоро»), карточка с маскотом-мишкой, подложка `bg-surface` (новый токен), подвал поддержки. Уведомления: бейдж «N новых» (ICU-плюрал), «отметить все прочитанными» / «очистить прочитанные», табы `?filter=all|unread|orders|system` со счётчиками, группировка по дням, карточки с полосой-маркером, иконкой, номером заказа, клиентом, суммой, меню «⋯» (прочитать/удалить). Главная админки — 4 плитки-сводки + последние 5 заказов. URL не менялись. → `app/[locale]/admin/*`, `components/admin/notification*`, `lib/notifications-shared.ts`
- **Дизайн (каталог + глобальный стиль)** — палитра **бирюза `#6FAFA8` + пыльно-розовый `#D6A3AC`** на белом фоне (всё из `config/brand.ts` + доп. токены), шрифт заголовков **Nunito**, логотип+маскот (`components/brand/*`), переключатель языка сегмент RU/AZ, аккаунт иконкой. Каталог: крошки, заголовок с маскотом, **сортировка** (`?sort=`), **чипсы фильтров**, сворачиваемые секции, **плашка доверия**, карточки (крупное фото, бейджи, избранное через localStorage, **рейтинг 5 звёзд**, задел под скидки). → `components/catalog/*`, `components/brand/*`

---

## 2. Исправлено — БАГ со страницей «Заказ принят» (2026-07-26)

**Было:** страница `/order/[orderNumber]` не показывалась гостю и обычному покупателю (404), админу — показывалась. Заказ в БД создавался нормально.

**Причина (подтверждена эмпирически):** сама проверка доступа в `app/[locale]/order/[orderNumber]/page.tsx` корректна — прямой запрос страницы **без** куки `last_order` даёт 404, **с** кукой — 200 (и ru, и az). Проблема была в доставке доступа: кука `last_order` ставилась в Server Action `placeOrder`, а переход на страницу подтверждения делался на **клиенте** через `router.replace` в `useEffect` (`components/checkout/checkout-form.tsx`). `Set-Cookie` из ответа Server Action не успевал примениться к запросу soft-навигации → страница рендерилась без куки → 404. Покупателя это задевало по той же причине (ветка по `userId` вторична, а куку он тоже не получал вовремя). Админ проходил по `isAdmin` и потому не замечал баг. `order.userId` у залогиненных покупателей проставляется корректно (проверено по БД).

**Фикс:** `placeOrder` после `cookies().set("last_order", ...)` делает **серверный** `redirect(`/${locale}/order/${orderNumber}`)` (`next/navigation`, как в `account`/`admin`). `Set-Cookie` и редирект уходят одним ответом → кука гарантированно на месте при рендере. Из `checkout-form.tsx` убраны клиентский `router.replace`/`useEffect`; форма теперь ловит только `state.error`. Тип `PlaceOrderState` упрощён до `{ error?: string }`.

**Проверено:** прямой доступ к странице (curl) — 404 без куки / 200 с кукой (ru+az); серверный `set-cookie + redirect` одним ответом воспроизведён и приводит к 200; `npm run lint` и `npm run build` чистые.

---

## 3. Ключевые технические детали (важно новой сессии)

- **Стек (свежий, отличается от обучающих данных):** Next 16.2.11 (middleware → `proxy.ts`; `params`/`searchParams` — Promise, нужен `await`; React Compiler вкл.), React 19.2.4 (нельзя setState в useEffect → паттерн `key`-ремоунта), Prisma 7.9.0 (`url` НЕ в schema, а в `prisma.config.ts`; рантайму нужен driver adapter; клиент в `lib/generated/prisma`), **PostgreSQL (Supabase) и в dev, и в prod** — адаптер `@prisma/adapter-pg`; приложение через пулер (`DATABASE_URL`, 6543), миграции через прямое подключение (`DIRECT_URL`, 5432); фото — Supabase Storage (`lib/storage.ts`), next-intl 4.13, Tailwind v4 (CSS-конфиг в `globals.css`), shadcn пресет **base-nova** (примитивы `@base-ui/react`, НЕ Radix: полиморфизм через `render`, не `asChild`; `GroupLabel` меню только внутри `Group`).
- **Решения:** enum'ов нет (наследие SQLite, на Postgres оставили осознанно) → строки + `lib/constants.ts`; локализованный контент — колонки `*Ru`/`*Az`; деньги — целые в минорных единицах (`lib/format.ts`); палитра бренда → CSS-переменные из `config/brand.ts` (инлайн на `<html>`); server-only модули (`lib/cart.ts`, `lib/product.ts`, `lib/notifications`) нельзя импортировать в tsx-скрипты.
- **Где что:** маршруты `app/[locale]/*`; серверная логика — Server Actions в `lib/*-actions.ts`; данные — `lib/*.ts`; переводы `messages/{ru,az}.json`; схема `prisma/schema.prisma`; сид `prisma/seed.ts`.
- **Проверка:** после каждого шага `npm run lint` + `npm run build` (должны быть чистыми), затем `npm run dev` и клик по сценарию.
- **Демо-входы (сид):** `admin@example.com` / `admin1234` (admin); `customer@example.com` / `password`, `customer2@example.com` / `password` (customer).

---

## 4. Следующие шаги

Сделано с прошлого снимка: ~~фикс бага «заказ принят»~~, ~~полноценная админка (заказы + товары/категории)~~, ~~фото по цветам~~, ~~дизайн каталога + глобальный стиль~~, ~~дизайн админки: оболочка с сайдбаром + уведомления + главная~~.

1. **Дизайн остальных страниц** под новый стиль (главная, товар, корзина, checkout, кабинет) — каталог, глобальные токены/шапка и админ-оболочка готовы, остальное подхватило палитру/шрифт, но вёрстку под макет не подтягивали. Внутри админки заказы/товары/категории получили белые карточки на подложке, но детально не переверстаны.
2. **Скидки** — вёрстка карточки готова (бейдж «−%» + старая цена рендерятся при наличии данных); нужно поле в схеме (напр. `compareAtPrice` у варианта) + админка + расчёт.
3. **Полноценное «Избранное»** — сейчас localStorage-заглушка на карточке (без страницы/счётчика/БД). Делать по желанию.
4. **Telegram** — довести до рабочих (`TELEGRAM_BOT_TOKEN`/`CHAT_ID` в `.env`; код готов, молча пропускает без токена).
5. **SEO/продажа + деплой** — `sitemap.xml`/`robots`, Open Graph, README «как переодеть под бренд», Vercel (+ прод-Postgres: `provider` + `@prisma/adapter-pg`; **загрузку фото вынести в Blob/S3** — на Vercel FS эфемерна, `public/uploads` не переживёт деплой).
6. **Онлайн-оплата (Stripe)** — отложено.
