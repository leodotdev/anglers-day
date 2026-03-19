import { useState, useEffect, useCallback } from "react";
import { useColorScheme, Platform } from "react-native";
import { UnistylesRuntime } from "react-native-unistyles";

export type ThemeMode = "light" | "dark" | "auto";

// Simple persistence that works without native modules
function saveTheme(mode: ThemeMode) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try { localStorage.setItem("anglers_day_theme", mode); } catch {}
  }
}

function loadTheme(): ThemeMode {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      const v = localStorage.getItem("anglers_day_theme");
      if (v === "light" || v === "dark" || v === "auto") return v;
    } catch {}
  }
  return "light";
}

export function useThemeMode() {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(loadTheme);

  const resolveTheme = useCallback(
    (m: ThemeMode): "light" | "dark" =>
      m === "auto"
        ? (systemScheme === "dark" ? "dark" : "light")
        : m,
    [systemScheme]
  );

  const applyTheme = useCallback(
    (m: ThemeMode) => {
      const resolved = resolveTheme(m);
      try {
        UnistylesRuntime.setTheme(resolved);
      } catch {}
    },
    [resolveTheme]
  );

  useEffect(() => {
    applyTheme(mode);
  }, [systemScheme, mode, applyTheme]);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      saveTheme(newMode);
      applyTheme(newMode);
    },
    [applyTheme]
  );

  const resolvedTheme = resolveTheme(mode);

  return { mode, setMode, resolvedTheme };
}
