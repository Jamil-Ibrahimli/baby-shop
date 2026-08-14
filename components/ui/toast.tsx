"use client";

import type { ReactNode } from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { Check, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Всплывающие уведомления на примитивах Base UI (пресет base-nova, НЕ Radix).
// Провайдер монтируется один раз в оболочке витрины, вызов — через useToast().

export type ToastData = {
  /** Необязательное действие в теле уведомления (например, ссылка «В корзину»). */
  action?: ReactNode;
};

export function useToast() {
  return ToastPrimitive.useToastManager<ToastData>();
}

export function ToastProvider({
  children,
  closeLabel,
}: {
  children: ReactNode;
  closeLabel: string; // строка локализована в layout — сюда приходит готовой
}) {
  // Viewport рендерим прямо здесь, без Toast.Portal: лишний слой не нужен
  // (позиционирование и так fixed), зато область уведомлений видна в разметке
  // страницы — это проверяемо.
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastPrimitive.Viewport className="fixed inset-x-4 bottom-4 z-50 flex flex-col-reverse gap-2 outline-none sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96">
        <ToastList closeLabel={closeLabel} />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Provider>
  );
}

function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = useToast();

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg"
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 shrink-0",
          toast.type === "info" ? "text-muted-foreground" : "text-primary",
        )}
      >
        {toast.type === "info" ? (
          <Info className="size-5" />
        ) : (
          <Check className="size-5" />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <ToastPrimitive.Title className="text-sm font-medium" />
        <ToastPrimitive.Description className="text-sm text-muted-foreground" />
        {toast.data?.action}
      </div>

      <ToastPrimitive.Close
        aria-label={closeLabel}
        className="-m-1 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ));
}
