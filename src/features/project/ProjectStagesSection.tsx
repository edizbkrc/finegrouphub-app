"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import FlagIcon from "@mui/icons-material/Flag";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";

interface IStage {
  id: number;
  name?: string;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
}

const formatDate = (value?: string) => (value ? getLocalizedMoment(value).format("LL") : "-");

/**
 * Hub'daki etap bölümü (production ProjectFormStages karşılığı): her etap görselli bir kart,
 * karta tıklamak etabın bloklarına, başlıktaki buton etap yönetim sayfasına gider.
 * Ekleme/silme burada değil `/stages` sayfasındadır; hub yalnızca hızlı gezinme sağlar.
 */
export default function ProjectStagesSection({ projectId }: { projectId: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const [stages, setStages] = useState<IStage[] | null>(null);
  const base = `/${locale}${Routes.Project}/${projectId}`;

  useEffect(() => {
    // Liste isteği düz gövdede `projectId` ister (iç içe filtre değil).
    axiosInstance
      .patch(ApiRoutes.Stages, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => {
        const rows = (res?.data?.data as IStage[] | undefined) ?? [];
        // Sıralama istemcide yapılır; API sıralama alanı adına bağımlı kalmayalım.
        setStages([...rows].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      })
      .catch(() => setStages([]));
  }, [projectId]);

  return (
    <Grid size={{ xs: 12 }}>
      <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }} data-cy="project-stages-section">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "itemBackground.main" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FlagIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("Form.Stages")}
            </Typography>
          </Stack>
          <Button
            component={Link}
            href={`${base}/stages`}
            variant="outlined"
            color="tertiary"
            endIcon={<ArrowForwardIcon />}
            data-cy="project-stages-manage"
          >
            {t("Project.ManageStages")}
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ p: 2 }}>
          {stages === null ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <Skeleton variant="rounded" height={150} />
              </Grid>
            ))
          ) : stages.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary">{t("Project.NoStages")}</Typography>
            </Grid>
          ) : (
            stages.map((stage) => (
              <Grid key={stage.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                {/* Kart blok sayfasına gider; blok sayfası stageId ile ilgili sekmeyi açar. */}
                <Link href={`${base}/blocks?stageId=${stage.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <Box
                    data-cy={`project-stage-card-${stage.id}`}
                    sx={{
                      p: 2,
                      height: 150,
                      position: "relative",
                      overflow: "hidden",
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "10px",
                      transition: "border-color .2s ease, box-shadow .2s ease",
                      "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                    }}
                  >
                    <Box sx={{ position: "relative", zIndex: 1 }}>
                      <Typography variant="h6" noWrap sx={{ mb: 1.5, fontWeight: 700, maxWidth: "70%" }}>
                        {stage.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("Form.Order")}: {stage.displayOrder ?? "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("Form.Start")}: {formatDate(stage.startDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("Form.End")}: {formatDate(stage.endDate)}
                      </Typography>
                    </Box>
                    {/* Production'daki köşeden taşan küçük çizim; metnin arkasında kalır. */}
                    <Box sx={{ position: "absolute", top: -30, right: -50, opacity: 0.9 }}>
                      <Image src="/svgs/project-block.svg" alt="" width={230} height={230} unoptimized />
                    </Box>
                  </Box>
                </Link>
              </Grid>
            ))
          )}
        </Grid>
      </Paper>
    </Grid>
  );
}
