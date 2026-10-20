"use client";

import { useCallback, useEffect, useMemo } from "react";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setTheme } from "@redux/appSlice";
import { getSystemTheme } from "@helpers/Common/getSystemTheme";
import { localStorageService } from "@helpers/Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { ThemeOptionsEnum } from "@common/enums/ThemeOptionsEnum";
import { getDefaultTheme } from "@/assets/theme/theme";

export default function CustomThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeMode = useAppSelector((state) => state.AppReducer.theme);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const saved = localStorageService.getItem(
      LocalStorageKeysEnum.THEME
    ) as ThemeOptionsEnum | null;

    dispatch(setTheme(saved ?? getSystemTheme()));
  }, [dispatch]);

  /** SYSTEM seçiliyse işletim sistemi tercihine düşer. */
  const resolvedMode = useCallback((): "light" | "dark" => {
    const mode =
      themeMode === ThemeOptionsEnum.SYSTEM ? getSystemTheme() : themeMode;
    return mode === ThemeOptionsEnum.DARK ? "dark" : "light";
  }, [themeMode]);

  const muiTheme = useMemo(
    () => getDefaultTheme(resolvedMode()),
    [resolvedMode]
  );

  // PWA adres çubuğu rengi tema ile birlikte değişsin.
  useEffect(() => {
    try {
      const color = resolvedMode() === "dark" ? "#060D12" : "#ffffff";
      let meta = document.querySelector('meta[name="theme-color"]');

      if (!meta) {
        meta = document.createElement("meta");
        (meta as HTMLMetaElement).name = "theme-color";
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", color);
    } catch {
      /* yoksay */
    }
  }, [resolvedMode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={(theme) => ({
          "::-webkit-scrollbar": { width: "8px", height: "8px" },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: "#C6C6C6",
            borderRadius: "10px",
          },
          "::-webkit-scrollbar-thumb:hover": { backgroundColor: "#C6C6C6" },
          "::-webkit-scrollbar-track": {
            backgroundColor: theme.palette.background.default,
          },
        })}
      />
      {children}
    </ThemeProvider>
  );
}
