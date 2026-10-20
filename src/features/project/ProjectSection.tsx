"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import { usePageInformation } from "@hooks/usePageInformation";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";
import { useProject } from "./ProjectContext";

/**
 * Proje alt sayfası araç çubuğu: geri + başlık + aksiyonlar.
 * Proje adı yok — sadece sayfa başlığı.
 */
export default function ProjectSection({
  title,
  onAdd,
  addLabel,
  right,
  children,
}: {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId } = useProject();
  const pageInfo = usePageInformation(OpsPageNames.ProjectOperationManagement);
  const canCreate = !!(pageInfo?.hasCreate && pageInfo?.userCanCreate);

  return (
    <>
      <Box
        data-cy="project-section-bar"
        sx={{
          mb: 2.5,
          px: 1.5,
          py: 1,
          borderRadius: "12px",
          bgcolor: "card2.main",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <IconButton
            component={Link}
            href={`/${locale}${Routes.Project}/${projectId}`}
            data-cy="project-back"
            size="small"
            sx={{
              borderRadius: "10px",
              bgcolor: "action.selected",
              color: "text.primary",
              "&:hover": { bgcolor: "action.hover", color: "primary.main" },
            }}
            aria-label={t("Form.Back")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
            noWrap
          >
            {title}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: "wrap" }}>
          {right}
          {onAdd && canCreate && (
            <Button variant="contained" disableElevation startIcon={<ControlPointIcon />} onClick={onAdd} data-cy="project-section-add">
              {addLabel ?? t("Button.AddNew")}
            </Button>
          )}
        </Stack>
      </Box>
      {children}
    </>
  );
}
