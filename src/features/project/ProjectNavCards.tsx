"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Box, Chip, Grid, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import LayersIcon from "@mui/icons-material/Layers";
import LabelIcon from "@mui/icons-material/Label";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MapIcon from "@mui/icons-material/Map";
import ThreeSixtyIcon from "@mui/icons-material/ThreeSixty";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PinOutlinedIcon from "@mui/icons-material/PinOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { Routes } from "@enums/Routes";
import FineNavigationCard from "@components/FineNavigationCard";

interface IProjectLink {
  label: string;
  href: string;
  icon: SvgIconComponent;
  /** Hub'daki görselli kart modunda kullanılan küçük çizim (public/svgs). */
  imageUrl: string;
  ready: boolean;
  fullScreen?: boolean;
}

/**
 * Etaplar / Bloklar sağ rayda değil; hub'da Yapı kartları olarak durur.
 * Sağ liste yalnız araç sayfalarını tutar (çalışma alanı, arama, galeri…).
 */
export const PROJECT_STRUCTURE_LINKS = [
  { label: "Form.Stages", href: "/stages", imageUrl: "/svgs/project-block.svg" },
  { label: "Form.Blocks", href: "/blocks", imageUrl: "/svgs/project-block.svg" },
] as const;

export const PROJECT_LINKS: IProjectLink[] = [
  { label: "Form.Workspace", href: "/workspace", icon: DesignServicesIcon, imageUrl: "/svgs/workspace.svg", ready: true, fullScreen: true },
  { label: "Form.AdvancedUnitSearch", href: "/units/search", icon: ManageSearchIcon, imageUrl: "/svgs/apartment-definition.svg", ready: true },
  { label: "Breadcrumb.Units", href: "/units", icon: ApartmentIcon, imageUrl: "/svgs/apartment-definition.svg", ready: true },
  { label: "Project.UnitNumbers", href: "/unit-numbers", icon: PinOutlinedIcon, imageUrl: "/svgs/apartment-definition.svg", ready: true },
  { label: "Form.ProjectVirtualTours", href: "/virtual-tours", icon: ThreeSixtyIcon, imageUrl: "/svgs/workspace.svg", ready: true },
  { label: "Form.FloorPlanDefinition", href: "/floor-templates", icon: LayersIcon, imageUrl: "/svgs/floor-definition.svg", ready: true },
  { label: "Breadcrumb.Gallery", href: "/gallery", icon: PhotoLibraryIcon, imageUrl: "/svgs/gallery.svg", ready: true },
  { label: "Form.StateDefinition", href: "/unit-states", icon: LabelIcon, imageUrl: "/svgs/state-definition.svg", ready: true },
  { label: "Breadcrumb.InfoCards", href: "/info-cards", icon: InfoOutlinedIcon, imageUrl: "/svgs/info-cards.svg", ready: true },
  { label: "Breadcrumb.Map", href: "/map", icon: MapIcon, imageUrl: "/svgs/maps.svg", ready: true },
  { label: "Form.ApartmentPlan", href: "/unit-templates", icon: DashboardCustomizeIcon, imageUrl: "/svgs/apartment-plan.svg", ready: true },
];

/** Hub üstünde Etaplar ve Bloklar — sağ menüden taşınan girişler. */
export function ProjectStructureCards({ projectId }: { projectId: number }) {
  const t = useTranslations();

  return (
    <Box sx={{ mb: 2.5 }} data-cy="project-structure-cards">
      <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 700, letterSpacing: "-0.01em" }}>
        {t("Project.GroupBuild")}
      </Typography>
      <Grid container spacing={2}>
        {PROJECT_STRUCTURE_LINKS.map((link) => (
          <Grid key={link.href} size={{ xs: 12, sm: 6 }}>
            <FineNavigationCard
              label={t(link.label)}
              href={`${Routes.Project}/${projectId}${link.href}`}
              imageUrl={link.imageUrl}
              dataCy={`project-structure-${link.href.replace(/\//g, "-")}`}
              sx={{ height: 120 }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/**
 * `projectId` proje kökünü kurmak için gerekir.
 * `variant="cards"` hub sayfasında görselli kart yığınını, `"list"` alt sayfalarda
 * dar ve sticky liste rayını çizer (alt sayfalarda içerik alanı geniş kalsın diye).
 */
export default function ProjectNavCards({ projectId, variant = "list" }: { projectId: number; variant?: "cards" | "list" }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const base = `/${locale}${Routes.Project}/${projectId}`;
  const here = pathname.replace(/\/$/, "");

  if (variant === "cards") {
    return (
      <Stack spacing={2} data-cy="project-nav-cards">
        {PROJECT_LINKS.filter((link) => link.ready).map((link) => {
          // Çalışma alanı tam ekran rota; locale öneki kartın kendisi ekler.
          const href = link.fullScreen ? `${link.href}/project/${projectId}` : `${Routes.Project}/${projectId}${link.href}`;
          return (
            <FineNavigationCard
              key={link.href}
              label={t(link.label)}
              href={href}
              imageUrl={link.imageUrl}
              dataCy={`project-nav-${link.href.replace(/\//g, "-")}`}
              sx={{ height: 120 }}
            />
          );
        })}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        bgcolor: "background.paper",
        p: 1.5,
        position: { lg: "sticky" },
        top: { lg: 16 },
      }}
    >
      <Typography variant="subtitle2" sx={{ px: 1, mb: 1, fontWeight: 700, letterSpacing: "-0.01em" }}>
        {t("Project.Sections")}
      </Typography>
      <Stack spacing={0.25}>
        {PROJECT_LINKS.map((link) => {
          const href = link.fullScreen
            ? `/${locale}${link.href}/project/${projectId}`
            : `${base}${link.href}`;
          const active = here === href.replace(/\/$/, "") || here.startsWith(`${base}${link.href}`);
          const Icon = link.icon;
          const cy = `project-nav-${link.href.replace(/\//g, "-")}`;

          if (!link.ready) {
            return (
              <ListItemButton
                key={link.href}
                disabled
                data-cy={cy}
                sx={{ borderRadius: "8px", minHeight: 44, opacity: 0.55 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "text.disabled" }}>
                  <Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={t(link.label)}
                  slotProps={{ primary: { sx: { fontSize: "0.875rem", fontWeight: 600 } } }}
                />
                <Chip size="small" label={t("Project.ComingSoon")} sx={{ height: 22 }} />
              </ListItemButton>
            );
          }

          return (
            <ListItemButton
              key={link.href}
              component={Link}
              href={href}
              data-cy={cy}
              selected={active}
              sx={{
                borderRadius: "8px",
                minHeight: 44,
                color: active ? "primary.main" : "text.primary",
                transition: "background-color .2s ease, color .2s ease",
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                  "&:hover": { bgcolor: "action.selected" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                <Icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={t(link.label)}
                slotProps={{
                  primary: {
                    noWrap: true,
                    sx: { fontSize: "0.875rem", fontWeight: active ? 700 : 600 },
                  },
                }}
              />
              <ChevronRightIcon sx={{ fontSize: 18, color: active ? "primary.main" : "text.disabled" }} />
            </ListItemButton>
          );
        })}
      </Stack>
    </Box>
  );
}
