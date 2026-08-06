import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Локале-осознающие обёртки навигации: <Link>, useRouter, usePathname и т.д.
// Автоматически подставляют текущую локаль в ссылки.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
