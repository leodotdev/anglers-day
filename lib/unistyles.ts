import { StyleSheet } from "react-native-unistyles";
import { colors, darkColors } from "./colors";

const sharedTokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    "5xl": 48,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    "2xl": 20,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },
} as const;

const lightTheme = {
  colors,
  ...sharedTokens,
} as const;

const darkTheme: typeof lightTheme = {
  colors: darkColors as unknown as typeof colors,
  ...sharedTokens,
};

type AppTheme = typeof lightTheme;

declare module "react-native-unistyles" {
  export interface UnistylesThemes {
    light: AppTheme;
    dark: AppTheme;
  }
}

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  settings: {
    initialTheme: "light",
    adaptiveThemes: false,
  },
});

export { StyleSheet, lightTheme, darkTheme, type AppTheme };
