// Демо-данные, чтобы магазин сразу выглядел заполненным.
// Запуск: `npm run seed`. Идемпотентно — чистит таблицы и создаёт заново.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { SIZE_TABLE, type SizeCode } from "../src/lib/constants";

// Цены — в минорных единицах (qəpik). 1990 => 19.90 AZN.
type ColorSpec = { ru: string; az: string; hex: string };

const COLORS = {
  milk: { ru: "Молочный", az: "Süd rəngi", hex: "#F6F1E7" },
  powder: { ru: "Пудровый", az: "Pudra", hex: "#EAD7D1" },
  mint: { ru: "Мятный", az: "Nanə", hex: "#CFE3D8" },
  sky: { ru: "Голубой", az: "Mavi", hex: "#CADBE6" },
} satisfies Record<string, ColorSpec>;

// Хелпер: собрать варианты товара по списку размеров и цветов.
function buildVariants(
  skuBase: string,
  price: number,
  sizes: SizeCode[],
  colors: ColorSpec[],
) {
  return sizes.flatMap((size, si) =>
    colors.map((color, ci) => {
      const s = SIZE_TABLE[size];
      return {
        sku: `${skuBase}-${size}-${ci}`,
        sizeCode: size,
        sizeLabelRu: s.labelRu,
        sizeLabelAz: s.labelAz,
        heightMinCm: s.heightMinCm,
        heightMaxCm: s.heightMaxCm,
        colorRu: color.ru,
        colorAz: color.az,
        colorHex: color.hex,
        price,
        // Немного разный остаток; последний размер намеренно закончился (граничный случай).
        stock: si === sizes.length - 1 && ci === 0 ? 0 : 5 + si + ci,
      };
    }),
  );
}

async function main() {
  console.log("🌱 Очистка и заполнение БД…");

  // Удаление в порядке зависимостей (FK).
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // ── Пользователи ────────────────────────────────────────
  // Демо-пароли (для входа при разработке): admin — admin1234, покупатели — password.
  const adminHash = await bcrypt.hash("admin1234", 10);
  const customerHash = await bcrypt.hash("password", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Администратор",
      role: "admin",
      passwordHash: adminHash,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@example.com",
      name: "Leyla",
      role: "customer",
      passwordHash: customerHash,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "customer2@example.com",
      name: "Нигяр",
      role: "customer",
      passwordHash: customerHash,
    },
  });

  // ── Категории (иерархия) ────────────────────────────────
  const girls = await prisma.category.create({
    data: { slug: "girls", nameRu: "Девочки", nameAz: "Qızlar", sortOrder: 1 },
  });
  const boys = await prisma.category.create({
    data: { slug: "boys", nameRu: "Мальчики", nameAz: "Oğlanlar", sortOrder: 2 },
  });
  const unisex = await prisma.category.create({
    data: { slug: "unisex", nameRu: "Унисекс", nameAz: "Uniseks", sortOrder: 3 },
  });

  const bodysuits = await prisma.category.create({
    data: {
      slug: "bodysuits",
      nameRu: "Боди",
      nameAz: "Bodi",
      sortOrder: 1,
      parentId: unisex.id,
    },
  });
  const rompers = await prisma.category.create({
    data: {
      slug: "rompers",
      nameRu: "Комбинезоны",
      nameAz: "Kombinezonlar",
      sortOrder: 2,
      parentId: unisex.id,
    },
  });
  const sets = await prisma.category.create({
    data: {
      slug: "sets",
      nameRu: "Комплекты",
      nameAz: "Dəstlər",
      sortOrder: 3,
      parentId: unisex.id,
    },
  });
  // Отдельные ветки под «Девочки» и «Мальчики» — показать многоуровневую иерархию.
  await prisma.category.create({
    data: {
      slug: "dresses",
      nameRu: "Платья",
      nameAz: "Donlar",
      sortOrder: 1,
      parentId: girls.id,
    },
  });
  await prisma.category.create({
    data: {
      slug: "pants",
      nameRu: "Штанишки",
      nameAz: "Şalvarlar",
      sortOrder: 1,
      parentId: boys.id,
    },
  });

  // ── Товары ──────────────────────────────────────────────
  // 1. Боди «Облачко»
  const cloud = await prisma.product.create({
    data: {
      slug: "bodi-oblachko",
      nameRu: "Боди «Облачко»",
      nameAz: "«Bulud» bodi",
      descriptionRu:
        "Мягкое боди из органического хлопка с кнопками для быстрой смены подгузника.",
      descriptionAz:
        "Bezin tez dəyişməsi üçün düymələri olan üzvi pambıqdan yumşaq bodi.",
      compositionRu: "100% органический хлопок",
      compositionAz: "100% üzvi pambıq",
      careRu: "Стирка при 30°C, не отбеливать, гладить при низкой температуре.",
      careAz: "30°C-də yuyun, ağartmayın, aşağı temperaturda ütüləyin.",
      isOrganic: true,
      isHypoallergenic: true,
      cottonPercent: 100,
      certifications: "OEKO-TEX",
      categoryId: bodysuits.id,
      metaTitleRu: "Боди «Облачко» из органического хлопка",
      metaTitleAz: "Üzvi pambıqdan «Bulud» bodi",
      variants: {
        create: buildVariants("CLOUD", 1990, ["0-3m", "3-6m", "6-9m"], [
          COLORS.milk,
          COLORS.powder,
        ]),
      },
      images: {
        create: [
          {
            url: "https://picsum.photos/seed/cloud1/800/1000",
            altRu: "Боди «Облачко», молочный",
            altAz: "«Bulud» bodi, süd rəngi",
            sortOrder: 1,
          },
          {
            url: "https://picsum.photos/seed/cloud2/800/1000",
            altRu: "Боди «Облачко», деталь кнопок",
            altAz: "«Bulud» bodi, düymələr",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // 2. Комбинезон «Тёплый сон»
  const warm = await prisma.product.create({
    data: {
      slug: "kombinezon-tyoplyy-son",
      nameRu: "Комбинезон «Тёплый сон»",
      nameAz: "«İsti yuxu» kombinezon",
      descriptionRu:
        "Утеплённый велюровый комбинезон с закрытыми ножками для прохладных дней.",
      descriptionAz:
        "Sərin günlər üçün qapalı ayaqlı isti velür kombinezon.",
      compositionRu: "80% хлопок, 20% полиэстер",
      compositionAz: "80% pambıq, 20% polyester",
      careRu: "Стирка при 30°C, сушить в расправленном виде.",
      careAz: "30°C-də yuyun, açıq halda qurudun.",
      isHypoallergenic: true,
      cottonPercent: 80,
      categoryId: rompers.id,
      variants: {
        create: buildVariants("WARM", 3490, ["3-6m", "6-9m", "9-12m"], [
          COLORS.mint,
          COLORS.sky,
        ]),
      },
      images: {
        create: [
          {
            url: "https://picsum.photos/seed/warm1/800/1000",
            altRu: "Комбинезон «Тёплый сон», мятный",
            altAz: "«İsti yuxu» kombinezon, nanə",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // 3. Набор «Первый гардероб» (комплект)
  const firstSet = await prisma.product.create({
    data: {
      slug: "nabor-pervyy-garderob",
      nameRu: "Набор «Первый гардероб»",
      nameAz: "«İlk qarderob» dəsti",
      descriptionRu:
        "Подарочный набор: боди, ползунки и шапочка. Идеально на выписку и в подарок.",
      descriptionAz:
        "Hədiyyə dəsti: bodi, alt geyim və papaq. Doğuş və hədiyyə üçün ideal.",
      compositionRu: "100% хлопок",
      compositionAz: "100% pambıq",
      careRu: "Стирка при 40°C.",
      careAz: "40°C-də yuyun.",
      isBundle: true,
      isOrganic: true,
      cottonPercent: 100,
      certifications: "OEKO-TEX",
      // Состав набора — по одному пункту на строку.
      bundleItemsRu: "Боди с длинным рукавом\nПолзунки\nШапочка",
      bundleItemsAz: "Uzunqol bodi\nAlt geyim\nPapaq",
      categoryId: sets.id,
      variants: {
        create: buildVariants("SET", 4990, ["0-3m", "3-6m"], [
          COLORS.milk,
          COLORS.sky,
        ]),
      },
      images: {
        create: [
          {
            url: "https://picsum.photos/seed/set1/800/1000",
            altRu: "Набор «Первый гардероб»",
            altAz: "«İlk qarderob» dəsti",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // ── Отзывы (только зарегистрированный покупатель) ────────
  await prisma.review.createMany({
    data: [
      {
        productId: cloud.id,
        userId: customer.id,
        rating: 5,
        title: "Очень мягкое",
        body: "Ткань приятная, не раздражает кожу малыша. Берём второе.",
        isVerifiedPurchase: true,
      },
      {
        productId: cloud.id,
        userId: customer2.id,
        rating: 4,
        title: "Хорошее качество",
        body: "Село отлично, кнопки удобные. Немного маломерит.",
      },
      {
        productId: firstSet.id,
        userId: customer.id,
        rating: 5,
        title: "Отличный подарок",
        body: "Подарили на выписку — восторг. Упаковка приятная.",
        isVerifiedPurchase: true,
      },
    ],
  });

  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  console.log(
    `✅ Готово: ${productCount} товара, ${variantCount} вариантов, ` +
      `категорий: ${await prisma.category.count()}. ` +
      `Админ: ${admin.email}, покупатель: ${customer.email}.`,
  );
  // warm создан выше и на него нет ссылок ниже — удерживаем для читаемости.
  void warm;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Ошибка сида:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
