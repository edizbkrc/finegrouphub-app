"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import MuiDrawer from "@mui/material/Drawer";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Collapse,
  Divider,
  Fade,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tooltip,
} from "@mui/material";
import { styled, useTheme, type CSSObject, type Theme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppDispatch } from "@redux/hooks";
import { setGeneralLoading } from "@redux/appSlice";
import useAccessibleMenuItems from "@hooks/useAccessibleMenuItems";
import { localStorageService } from "@helpers/Common/localStorageService";
import refreshCacheLocale from "@helpers/Common/refreshCacheLocale";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import type { IMenuItem } from "@common/types/IMenuItem";
import { getMenuIcon } from "./OpsNavigationBarIcon";

const DRAWER_WIDTH = 248;

interface INavEntry {
  segment: string | null;
  title: string;
  icon: ReactNode;
  pageName: string | null;
  children: INavEntry[];
}

interface INavGroup {
  title: string;
  children: INavEntry[];
}

export default function OpsNavigationBar({ open }: { open: boolean }) {
  const pathname = usePathname();
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const { accessibleMenuItems, getMenuItems } = useAccessibleMenuItems();

  const activePath = pathname.replace(`/${locale}`, "");

  // `defaultExpanded` yalnızca ilk mount'taki state'i belirler; her render'da
  // `activePath`'ten yeniden hesaplanması MUI Accordion'ın uyardığı tam olay
  // (B53) — sayfa değiştikçe aktif grup gerçekte açılıp kapanmıyordu.
  // Aktif grup varsayılan olarak açık gösterilir; kullanıcı elle açar/kapatırsa
  // o tercih oturum boyunca (bu bileşen unmount olana kadar) korunur.
  const [manuallyToggled, setManuallyToggled] = useState<Record<string, boolean>>({});

  const navigationList = useMemo(
    () => generateNavigationList(accessibleMenuItems),
    [accessibleMenuItems]
  );

  useEffect(() => {
    getMenuItems();

    // Arayüz dili değiştiyse menü/izin cache'i localizedName için tazelenmeli.
    const cachedLanguage = localStorageService.getItem(
      LocalStorageKeysEnum.Language
    );

    if (cachedLanguage !== locale) {
      localStorageService.setItem(LocalStorageKeysEnum.Language, locale);
      dispatch(setGeneralLoading(true));
      refreshCacheLocale(() => {
        getMenuItems();
        dispatch(setGeneralLoading(false));
      });
    }
    // `locale` referansta bağımlılık listesinde yoktu; dil değişince menü
    // eski dilde kalıyordu.
  }, [locale, dispatch, getMenuItems]);

  const renderEntry = (entry: INavEntry, nested = false) => {
    const isActive = activePath === entry.segment;

    return (
      <ListItem key={entry.title} dense disablePadding={nested ? !open : true}>
        <Link
          href={`/${locale}${entry.segment ?? ""}`}
          data-cy={`${entry.pageName}-menu-item`}
          prefetch
          style={{ width: "100%" }}
        >
          <Tooltip title={entry.title} placement="right" arrow>
            <ListItemButton
              sx={{
                minHeight: 42,
                px: 1.5,
                mt: 0.25,
                borderRadius: "10px",
                justifyContent: open ? "initial" : "center",
                backgroundColor: isActive ? "action.selected" : "transparent",
                color: isActive ? "primary.main" : "text.primary",
                boxShadow: isActive ? (theme) => `inset 3px 0 0 ${theme.palette.primary.main}` : "none",
                ":hover": {
                  backgroundColor: isActive ? "action.selected" : "action.hover",
                  color: isActive ? "primary.main" : "text.primary",
                },
                "& .MuiListItemIcon-root": { color: "inherit" },
                "& .MuiTypography-root": { color: "inherit" },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: "center",
                  color: "inherit",
                  mr: open ? 1 : "auto",
                }}
              >
                {entry.icon}
              </ListItemIcon>
              <Fade in={open} unmountOnExit>
                <ListItemText
                  primary={entry.title}
                  slotProps={{
                    primary: {
                      noWrap: true,
                      sx: {
                        fontWeight: isActive ? 700 : 600,
                        fontSize: "0.875rem",
                        color: "inherit",
                      },
                    },
                  }}
                />
              </Fade>
            </ListItemButton>
          </Tooltip>
        </Link>
      </ListItem>
    );
  };

  return (
    <Drawer variant="permanent" open={open}>
      <Link href={`/${locale}/dashboard`} prefetch style={{ textDecoration: "none", color: "inherit" }}>
        <Brand open={open} />
      </Link>
      {navigationList.map((group, index) => (
        <Fragment key={group.title}>
          <List dense disablePadding>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <ListSubheader
                sx={{
                  color: "text.secondary",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  lineHeight: "32px",
                  backgroundColor: "transparent",
                }}
              >
                {group.title}
              </ListSubheader>
            </Collapse>

            {group.children.map((entry) => {
              const isActiveGroup = entry.children.some(
                (child) => child.segment === activePath
              );
              const expanded = manuallyToggled[entry.title] ?? isActiveGroup;

              return entry.children.length > 0 ? (
                <Accordion
                  key={entry.title}
                  id={`${entry.children[0]?.pageName}-menu`}
                  data-cy={`${entry.children[0]?.pageName}-parent-menu`}
                  elevation={0}
                  disableGutters
                  expanded={expanded}
                  onChange={(_, isExpanded) =>
                    setManuallyToggled((prev) => ({ ...prev, [entry.title]: isExpanded }))
                  }
                  sx={{
                    backgroundColor: "transparent",
                    color: "text.primary",
                    "&:before": { display: "none" },
                    ...(open ? {} : { padding: 0, minHeight: 0 }),
                  }}
                >
                  {open && (
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
                      sx={{
                        borderRadius: "10px",
                        minHeight: 42,
                        color: "text.primary",
                        "& .MuiAccordionSummary-content": { my: 0.5 },
                        ":hover": { backgroundColor: "action.hover" },
                      }}
                    >
                      <ListItemText
                        primary={entry.title}
                        slotProps={{ primary: { sx: { fontWeight: 700, color: "text.primary" } } }}
                      />
                    </AccordionSummary>
                  )}
                  <AccordionDetails sx={{ padding: 0 }}>
                    {entry.children.map((child) => renderEntry(child, true))}
                  </AccordionDetails>
                </Accordion>
              ) : (
                renderEntry(entry)
              );
            })}
          </List>
          {index < navigationList.length - 1 && (
            <Divider sx={{ mt: 1, borderColor: "divider" }} />
          )}
        </Fragment>
      ))}
    </Drawer>
  );
}

/**
 * `accessibleMenuItems`'ı grup → öğe → alt öğe hiyerarşisine dönüştürür.
 * Kodda SABİT MENÜ TANIMI YOKTUR; her şey bu fonksiyondan doğar.
 */
function generateNavigationList(items: IMenuItem[]): INavGroup[] {
  // tsconfig `target: es5` olduğu için Map iterator spread'i kullanılamıyor;
  // düz nesne + Object.keys yeterli.
  const groups: Record<string, { order: number; items: IMenuItem[] }> = {};

  items.forEach((item) => {
    const name = item.group?.name || "Ungrouped";

    if (!groups[name]) {
      groups[name] = { order: item.group?.order ?? 0, items: [] };
    }
    groups[name].items.push(item);
  });

  const byOrder = (a: IMenuItem, b: IMenuItem) =>
    (a.order ?? 0) - (b.order ?? 0);

  const toEntry = (item: IMenuItem): INavEntry => ({
    segment: item.url,
    title: item.name,
    icon: getMenuIcon(item.url),
    pageName: item.pageName,
    // `.slice()` ile kopya üzerinde sıralama: referansta localStorage'dan gelen
    // dizi yerinde mutasyona uğruyordu.
    children: (item.childrens ?? []).slice().sort(byOrder).map(toEntry),
  });

  return Object.keys(groups)
    .sort((a, b) => groups[a].order - groups[b].order)
    .map((title) => ({
      title,
      children: groups[title].items.slice().sort(byOrder).map(toEntry),
    }));
}

const openedMixin = (theme: Theme): CSSObject => ({
  border: "none",
  width: DRAWER_WIDTH,
  marginTop: 0,
  height: "100vh",
  paddingLeft: 12,
  paddingRight: 12,
  paddingBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  backgroundImage: "none",
  color: theme.palette.text.primary,
  borderRight: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  border: "none",
  marginTop: 0,
  height: "100vh",
  paddingLeft: 8,
  paddingRight: 8,
  paddingBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  backgroundImage: "none",
  color: theme.palette.text.primary,
  borderRight: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: 72,
  [theme.breakpoints.up("sm")]: {
    width: 72,
  },
});

/** Kenar çubuğu markası — teal damga + Fine Hub. */
function Brand({ open }: { open: boolean }) {
  const theme = useTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: open ? "16px 8px 20px" : "16px 0 20px",
        justifyContent: open ? "flex-start" : "center",
        color: theme.palette.text.primary,
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 36,
          height: 36,
          borderRadius: 12,
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          fontSize: 15,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        F
      </span>
      {open && (
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <strong style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Fine Hub
          </strong>
          <small style={{ color: theme.palette.text.secondary, fontSize: 12 }}>Yönetim</small>
        </span>
      )}
    </div>
  );
}

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  backgroundColor: theme.palette.background.default,
  ...(open
    ? { ...openedMixin(theme), "& .MuiDrawer-paper": openedMixin(theme) }
    : { ...closedMixin(theme), "& .MuiDrawer-paper": closedMixin(theme) }),
}));
