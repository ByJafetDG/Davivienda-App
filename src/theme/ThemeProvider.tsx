import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { palette, Palette } from "./colors";

export type Theme = {
  palette: Palette;
  radii: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  spacing: (value: number) => number;
  typography: {
    family: string;
    headings: string;
  };
};

const ThemeContext = createContext<Theme | undefined>(undefined);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const value = useMemo<Theme>(
    () => ({
      palette,
      radii: {
        xs: 6,
        sm: 10,
        md: 14,
        lg: 20,
        xl: 32,
        full: 999,
      },
      spacing: (v: number) => v * 8,
      typography: {
        family: "System",
        headings: "System",
      },
    }),
    [],
  );

  return (
    <ThemeContext.Provider value={value}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
};
