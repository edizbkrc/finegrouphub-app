"use client";

import { useTranslations } from "next-intl";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { Stack, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import OpsIconButton from "@components/OpsIconButton";
import OpsLayoutToolBar from "./OpsLayoutToolBar";

const DRAWER_OPEN = 248;
const DRAWER_CLOSED = 72;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => {
  const drawer = open ? DRAWER_OPEN : DRAWER_CLOSED;

  return {
    zIndex: theme.zIndex.drawer + 1,
    width: `calc(100% - ${drawer}px)`,
    marginLeft: drawer,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  };
});

export default function OpsAppBar({
  open,
  handleDrawerOpen,
}: {
  open: boolean;
  handleDrawerOpen: () => void;
}) {
  const t = useTranslations();

  return (
    <AppBar position="fixed" elevation={0} open={open}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: "64px !important", px: 2.5 }}>
        <Stack direction="row" alignItems="center">
          <Tooltip
            title={open ? t("Button.CloseMenu") : t("Button.OpenMenu")}
            arrow
          >
            <OpsIconButton
              data-cy="menu-toggle-button"
              color="inherit"
              aria-label={open ? t("Button.CloseMenu") : t("Button.OpenMenu")}
              onClick={handleDrawerOpen}
              edge="start"
            >
              {open ? <MenuOpenIcon /> : <MenuIcon />}
            </OpsIconButton>
          </Tooltip>
        </Stack>

        <OpsLayoutToolBar />
      </Toolbar>
    </AppBar>
  );
}
