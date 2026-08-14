"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Единые поля формы админки. Раньше каждое поле собиралось на месте: у Input
// была высота h-8 и радиус rounded-lg, у самодельных select/textarea — h-9 и
// rounded-xl, поэтому в одной строке элементы не совпадали. Здесь один размер,
// один радиус, один фокус-ринг и одинаковая подсветка ошибки.

/** Базовый вид поля ввода. Пробрасывается и в те места, где нужен «голый» Input. */
export const CONTROL_CLASS =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-xs outline-none transition-colors hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

// Обёртка: подпись сверху, поле, под ним подсказка или ошибка.
function FieldShell({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  min,
  suffix,
  hint,
  error,
  invalid,
  mono,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "decimal" | "numeric";
  min?: number;
  /** Единица измерения справа внутри поля: «AZN», «шт», «%». */
  suffix?: string;
  hint?: string;
  error?: string;
  invalid?: boolean;
  mono?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="relative">
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          min={min}
          value={value}
          placeholder={placeholder}
          aria-invalid={invalid || !!error || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            CONTROL_CLASS,
            mono && "font-mono uppercase",
            suffix && "pr-12",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  hint,
  rows = 3,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(CONTROL_CLASS, "h-auto resize-y py-2.5 leading-relaxed")}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  hint,
  invalid,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  hint?: string;
  invalid?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      {/* Оставляем нативный select: на телефоне это удобный системный список. */}
      <div className="relative">
        <select
          id={id}
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(CONTROL_CLASS, "cursor-pointer appearance-none pr-9")}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-muted-foreground"
          aria-hidden
        />
      </div>
    </FieldShell>
  );
}

// Флажок-карточка: заметнее голого чекбокса и явно показывает выбранное состояние.
export function CheckField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    // htmlFor + id: клик по тексту переключает флажок штатным способом браузера.
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm shadow-xs transition-colors",
        checked
          ? "border-primary bg-primary-soft"
          : "border-input bg-card hover:border-ring/60",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        className="mt-0.5"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

// Цвет: системный пипеткой + HEX руками. Обе части одной высоты с прочими полями.
export function ColorField({
  label,
  value,
  onChange,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} className={className}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-xl border border-input bg-card p-1 shadow-xs"
        />
        <Input
          id={id}
          value={value}
          placeholder="#FFFFFF"
          onChange={(e) => onChange(e.target.value)}
          className={cn(CONTROL_CLASS, "font-mono uppercase")}
        />
      </div>
    </FieldShell>
  );
}
