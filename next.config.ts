import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Фото товаров из Supabase Storage (публичный бакет).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
      // Заглушки для демо-данных из сида.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

// Плагин next-intl подключает конфиг запроса (i18n/request.ts).
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
