"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { ExitToApp, Settings } from "@mui/icons-material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import useProfileInfo from "@hooks/useProfileInfo";
import logout from "@helpers/Auth/logout";
import OpsIconButton from "@components/OpsIconButton";
import { Routes } from "@enums/Routes";
import SettingsDrawer from "./SettingsDrawer";

export default function OpsLayoutToolBar() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Settings");
  const { loading, profileInfo } = useProfileInfo();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * ⚠️ Referansta `isFullscreen` yalnızca butona basıldığında güncelleniyordu;
   * kullanıcı Esc ile tam ekrandan çıkınca ikon yanlış durumda kalıyordu.
   * Gerçek kaynak `document.fullscreenElement`.
   */
  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", sync);
    sync();

    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  const confirmLogout = async () => {
    await logout(true);
    router.push(`/${locale}`);
  };

  const initials = `${profileInfo?.name?.[0] ?? ""}${profileInfo?.surname?.[0] ?? ""}`;

  return (
    <Stack direction="row">
      <SettingsDrawer
        isOpen={settingsOpen}
        toggleDrawer={() => setSettingsOpen(false)}
      />

      <Box sx={{ mr: [1, 2], display: ["none", "block"] }}>
        <Tooltip title={t(isFullscreen ? "ExitFullScreen" : "FullScreen")} arrow>
          <OpsIconButton
            color="inherit"
            onClick={toggleFullScreen}
            data-cy="fullscreen-toggle-button"
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </OpsIconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mr: [1, 2] }}>
        <Tooltip title={t("root")} arrow>
          <OpsIconButton
            type="button"
            aria-label="settings"
            data-cy="settings-button"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings />
          </OpsIconButton>
        </Tooltip>
      </Box>

      <Link href={`/${locale}${Routes.Profile}`} prefetch data-cy="profile-link">
        <Box
          sx={{
            mr: [1, 3],
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Avatar
            alt=""
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "itemBackground.main",
              color: (theme) =>
                theme.palette.mode === "light" ? "#595856" : "#fff",
            }}
          >
            {loading ? <Box /> : initials}
          </Avatar>
          <Typography
            ml={1}
            sx={{
              display: ["none", "block"],
              color: (theme) =>
                theme.palette.mode === "light" ? "#595856" : "#fff",
            }}
          >
            {profileInfo?.name} {profileInfo?.surname}
          </Typography>
        </Box>
      </Link>

      <Box>
        <Tooltip title={t("Exit")} arrow>
          <OpsIconButton
            type="button"
            aria-label="exit"
            onClick={() => setLogoutDialogOpen(true)}
            data-cy="logout-button"
          >
            <ExitToApp />
          </OpsIconButton>
        </Tooltip>
      </Box>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          {t("ConfirmLogoutTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            {t("ConfirmLogoutText")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
            {t("Cancel")}
          </Button>
          <Button
            onClick={confirmLogout}
            color="error"
            autoFocus
            data-cy="logout-confirm"
          >
            {t("YesLogout")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
