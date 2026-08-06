"use client";

import { createContext, useContext, useState } from "react";

// Общее состояние выбранного цвета между галереей и селектором варианта.
// Селектор при выборе цвета кладёт сюда его colorKey, галерея — читает и фильтрует фото.
type ColorSelectionValue = {
  colorKey: string | null;
  setColorKey: (key: string | null) => void;
};

const ColorSelectionContext = createContext<ColorSelectionValue | null>(null);

export function ColorSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorKey, setColorKey] = useState<string | null>(null);
  return (
    <ColorSelectionContext.Provider value={{ colorKey, setColorKey }}>
      {children}
    </ColorSelectionContext.Provider>
  );
}

export function useColorSelection(): ColorSelectionValue {
  // Безопасный фолбэк, если компонент используется вне провайдера.
  return (
    useContext(ColorSelectionContext) ?? {
      colorKey: null,
      setColorKey: () => {},
    }
  );
}
