"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { readCartToken, mergeGuestCartIntoUserCart } from "@/lib/cart";

// Коды ошибок — переводятся на клиенте (Auth.Errors.*).
export type AuthActionState = { error?: string; ok?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// После входа/регистрации переносим гостевую корзину в корзину пользователя.
async function mergeGuestCart(userId: string) {
  const token = await readCartToken();
  if (token) await mergeGuestCartIntoUserCart(token, userId);
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email) || !password) return { error: "invalid" };

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: "credentials" };
    throw e;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (user) await mergeGuestCart(user.id);

  return { ok: true };
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "invalid_email" };
  if (password.length < 6) return { error: "weak_password" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "email_taken" };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name: name || null, passwordHash, role: "customer" },
  });

  await signIn("credentials", { email, password, redirect: false });
  await mergeGuestCart(user.id);

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
