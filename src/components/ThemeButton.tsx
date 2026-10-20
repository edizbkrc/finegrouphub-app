"use client";

import { IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setTheme } from "@redux/appSlice";
import { ThemeOptionsEnum } from "@common/enums/ThemeOptionsEnum";

export default function ThemeButton() {
  const t = useTranslations("Toast");
  const theme = useAppSelector((state) => state.AppReducer.theme);
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const isDark = theme === ThemeOptionsEnum.DARK;

  const onThemeChange = () => {
    const next = isDark ? ThemeOptionsEnum.LIGHT : ThemeOptionsEnum.DARK;
    enqueueSnackbar(t("ChangedTheme", { theme: next }), { variant: "info" });
    dispatch(setTheme(next));
  };

  return (
    <IconButton sx={{ mt: 2 }} onClick={onThemeChange} color="inherit">
      {isDark ? <Brightness7Icon fontSize="large" /> : <Brightness4Icon fontSize="large" />}
    </IconButton>
  );
}
