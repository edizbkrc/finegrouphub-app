"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Box, Chip, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import type { ReactNode } from "react";
import { Routes } from "@enums/Routes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import NotFoundComponent from "@components/NotFoundComponent";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import ProjectNavCards, { ProjectStructureCards } from "./ProjectNavCards";
import { ProjectProvider, useProject } from "./ProjectContext";

const STATE_COLOR: Record<number, "success" | "info" | "error" | "warning" | "default"> = {
  0: "success",
  1: "info",
  2: "error",
  3: "warning",
  4: "default",
};

/** Hub kökünde sadece proje adı; araç sayfalarında başlık ProjectSection bar’ında. */
function Header({ isHub }: { isHub: boolean }) {
  const { project, loading } = useProject();

  if (!isHub) return null;

  return (
    <Box sx={{ mb: 2 }}>
      {loading && !project ? (
        <Skeleton width={360} height={48} />
      ) : (
        <Typography variant="h3" data-cy="project-title" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
          {project?.name}
        </Typography>
      )}
    </Box>
  );
}

/** Şeritteki tek bilgi kartı: ikon + etiket + değer (değer metin ya da chip olabilir). */
function InfoCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: "12px", height: "100%" }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2, minHeight: 84 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: "10px",
            color: "primary.main",
            bgcolor: "action.selected",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Box sx={{ mt: 0.25 }}>{children}</Box>
        </Box>
      </Stack>
    </Paper>
  );
}

/** Hub üstündeki özet şeridi: proje durumu, firma, firma durumu ve iki tarih. */
function InfoStrip() {
  const t = useTranslations();
  const { project, loading } = useProject();

  if (loading && !project) return <Skeleton variant="rounded" height={84} sx={{ mb: 2.5 }} />;
  if (!project) return null;

  const date = (value?: string) => (value ? getLocalizedMoment(value).format("LL") : "-");
  const companyActive = !!project.companyIsActive;

  return (
    <Grid container spacing={2} sx={{ mb: 2.5 }} data-cy="project-info-strip">
      <Grid size={{ xs: 12, sm: 6, lg: 4, xl: "grow" }}>
        <InfoCard icon={<FlagOutlinedIcon />} label={t("Form.ProjectState")}>
          <Chip size="small" color={STATE_COLOR[project.state as number] ?? "default"} label={project.state !== undefined ? t(`ProjectState.${project.state}`) : "-"} />
        </InfoCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 4, xl: "grow" }}>
        <InfoCard icon={<BusinessIcon />} label={t("Form.Company")}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
            {project.company?.name || "-"}
          </Typography>
        </InfoCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 4, xl: "grow" }}>
        <InfoCard icon={<VerifiedUserOutlinedIcon />} label={t("Form.CompanyState")}>
          <Chip size="small" color={companyActive ? "success" : "error"} label={companyActive ? t("Form.Active") : t("Form.InActive")} />
        </InfoCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 6, xl: "grow" }}>
        <InfoCard icon={<EventAvailableIcon />} label={t("Form.ServiceEndDate")}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {date(project.serviceEndDate)}
          </Typography>
        </InfoCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 6, xl: "grow" }}>
        <InfoCard icon={<EventBusyIcon />} label={t("Form.EndOfUseDate")}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {date(project.lifeEndDate)}
          </Typography>
        </InfoCard>
      </Grid>
    </Grid>
  );
}

function Body({ children }: { children: ReactNode }) {
  const { notFound } = useProject();
  if (notFound) return <NotFoundComponent />;
  return <>{children}</>;
}

/**
 * Hub (proje kökü) ile alt sayfalar farklı yerleşim kullanır:
 *  - Hub: özet şeridi + Yapı kartları (etap/blok) + ortada form + sağda araç listesi.
 *  - Alt sayfa: tam genişlik içerik; sağ menü yok, sol üstte geri (Header).
 */
function Layout({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const { projectId } = useProject();
  const isHub = (pathname ?? "").replace(/\/$/, "") === `/${locale}${Routes.Project}/${projectId}`;

  // Araç sayfalarında (durum tanımı, galeri…) sağ rayı kaldır — içerik tam genişlik.
  if (!isHub) {
    return (
      <>
        <Header isHub={false} />
        <Body>{children}</Body>
      </>
    );
  }

  return (
    <>
      <Header isHub />
      <InfoStrip />
      <ProjectStructureCards projectId={projectId} />
      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 9 }}>
          <Body>{children}</Body>
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
          <ProjectNavCards projectId={projectId} />
        </Grid>
      </Grid>
    </>
  );
}

export default function ProjectShell({ projectId, children }: { projectId: number; children: ReactNode }) {
  return (
    <ProjectProvider projectId={projectId}>
      <OpsLayoutContent>
        <Layout>{children}</Layout>
      </OpsLayoutContent>
    </ProjectProvider>
  );
}
