import type { UserRole } from "@/lib/constants";

// Расширяем типы Auth.js: добавляем id и role в User/Session/JWT.
declare module "next-auth" {
  interface User {
    role?: UserRole | string;
  }
  interface Session {
    user: {
      id: string;
      role?: UserRole | string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole | string;
  }
}
