import { ThemeOptionsEnum } from "@common/enums/ThemeOptionsEnum";

export const getSystemTheme = (): ThemeOptionsEnum => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return ThemeOptionsEnum.DARK;
  }
  return ThemeOptionsEnum.LIGHT;
};
