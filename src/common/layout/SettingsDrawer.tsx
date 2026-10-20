"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Box,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setTheme } from "@redux/appSlice";
import { localStorageService } from "@helpers/Common/localStorageService";
import refreshCacheLocale from "@helpers/Common/refreshCacheLocale";
import LoadingComponent from "@components/LoadingComponent";
import OpsModalHeader from "@components/OpsModalHeader";
import OpsIconButton from "@components/OpsIconButton";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { ThemeOptionsEnum } from "@common/enums/ThemeOptionsEnum";

const THEME_OPTIONS = [
  { value: ThemeOptionsEnum.DARK, icon: <DarkModeIcon />, cy: "dark-theme-button" },
  {
    value: ThemeOptionsEnum.SYSTEM,
    icon: <SettingsBrightnessIcon />,
    cy: "system-theme-button",
  },
  {
    value: ThemeOptionsEnum.LIGHT,
    icon: <LightModeIcon />,
    cy: "light-theme-button",
  },
] as const;

export default function SettingsDrawer({
  isOpen,
  toggleDrawer,
}: {
  isOpen: boolean;
  toggleDrawer: () => void;
}) {
  const t = useTranslations("Settings");
  const theme = useAppSelector((state) => state.AppReducer.theme);
  const dispatch = useAppDispatch();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleThemeChange = (newTheme: ThemeOptionsEnum) => {
    dispatch(setTheme(newTheme));
    localStorageService.setItem(LocalStorageKeysEnum.THEME, newTheme);
  };

  const handleLocaleChange = (newLocale: string) => {
    if (!newLocale || newLocale === locale) return;

    setLoading(true);
    localStorageService.setItem(LocalStorageKeysEnum.Language, newLocale);

    // Menü/izin localizedName'leri yeni dilde gelsin diye cache tazelenir.
    refreshCacheLocale(() => {
      setLoading(false);
      router.push(pathname?.replace(`/${locale}`, `/${newLocale}`) || "/");
    });
  };

  return (
    <Drawer anchor="right" open={isOpen} onClose={toggleDrawer}>
      <LoadingComponent open={loading} />

      <Box sx={{ minWidth: ["100%", 400] }}>
        <OpsModalHeader title={t("root")} handleClose={toggleDrawer} />
        <Divider />

        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            py: 1,
            pl: 1,
            px: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("Theme")}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 1, p: 2 }}>
            {THEME_OPTIONS.map((option) => {
              const selected = theme === option.value;
              return (
                <OpsIconButton
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  data-cy={option.cy}
                  aria-pressed={selected}
                  sx={
                    selected
                      ? undefined
                      : { backgroundColor: "#E2E2E2", color: "#7E7E7E" }
                  }
                >
                  {option.icon}
                </OpsIconButton>
              );
            })}
          </Stack>
        </Stack>

        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            p: 1,
            px: 2,
            mt: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("Language")}
          </Typography>

          <FormControl sx={{ minWidth: 175 }} size="small">
            <InputLabel id="settings-language-label">{t("Language")}</InputLabel>
            <Select
              labelId="settings-language-label"
              value={locale}
              label={t("Language")}
              MenuProps={{ disablePortal: true }}
              onChange={(event) => handleLocaleChange(event.target.value)}
              data-cy="language-select"
            >
              <MenuItem value="tr">{t("Turkish")}</MenuItem>
              <MenuItem value="en">{t("English")}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
    </Drawer>
  );
}
