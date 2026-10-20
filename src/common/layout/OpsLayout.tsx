"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, CssBaseline, Fab, Zoom, useScrollTrigger } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { localStorageService } from "@helpers/Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import OpsAppBar from "./OpsAppBar";
import OpsNavigationBar from "./OpsNavigationBar";

const APP_BAR_HEIGHT = 64;

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [contentRef, setContentRef] = useState<HTMLElement | null>(null);

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: contentRef ?? undefined,
  });

  const handleDrawerOpen = useCallback(() => {
    setOpen((prev) => {
      localStorageService.setItem(
        LocalStorageKeysEnum.Navbar,
        prev ? "close" : "open"
      );
      return !prev;
    });
  }, []);

  const scrollToTop = useCallback(() => {
    contentRef?.scrollTo({ top: 0, behavior: "smooth" });
  }, [contentRef]);

  useEffect(() => {
    const state = localStorageService.getItem(LocalStorageKeysEnum.Navbar);
    // Kayıt yoksa menü açık kalsın; kullanıcı bilerek kapattıysa onu hatırla.
    if (state === "close") setOpen(false);
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <OpsAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
      <OpsNavigationBar open={open} />

      <Box
        component="main"
        ref={setContentRef}
        sx={{
          backgroundColor: "contentBackground.main",
          marginTop: `${APP_BAR_HEIGHT}px`,
          height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
          overflow: "auto",
          width: "100%",
          pb: [10, 10, 0],
        }}
      >
        <Zoom in={trigger}>
          <Fab
            data-cy="scroll-to-top-button"
            color="primary"
            size="medium"
            onClick={scrollToTop}
            sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 99999 }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Zoom>
        {children}
      </Box>
    </Box>
  );
}
