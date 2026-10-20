"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Box, Button, Collapse, Grid, IconButton, Popover, Stack, useMediaQuery, useTheme } from "@mui/material";
import { ArrowBack, Delete, Info, Save } from "@mui/icons-material";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Typography } from "@mui/material";
import OpsBreadcrumb from "@components/OpsBreadcrumb";
import OpsIconButton from "@components/OpsIconButton";
import type { IOpsPageFormHeaderProps } from "@common/types/IOpsPageFormHeaderProps";
import { AuditFieldsList } from "./AuditFieldsList";

export default function OpsPageFormHeader({
  isEdit,
  title,
  editTitle,
  submitButtonVisible,
  deleteButtonVisible,
  handleDelete,
  isDirty,
  isSubmitting,
  auditInfo,
  renderAdditionalHeader,
  renderRightComponent,
  goBackRouteName,
  showInfoButton = true,
  addButonHref,
  renderLeftSide,
  breadcrumbs,
  showBreadcrumb = false,
}: IOpsPageFormHeaderProps) {
  const [showBar, setShowBar] = useState(false);
  const [auditInfoAnchorEl, setAuditInfoAnchorEl] = useState<HTMLElement | null>(null);
  const t = useTranslations("Form");
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const storageKey = `${goBackRouteName ?? "page"}_TopBarVisible`;

  const handleChangeShowBar = () => {
    try {
      localStorage.setItem(storageKey, String(!showBar));
    } catch {
      /* private mode */
    }
    setShowBar((s) => !s);
  };

  useEffect(() => {
    try {
      const topBarVisible = localStorage.getItem(storageKey);
      setShowBar(topBarVisible === "true" || topBarVisible === null);
    } catch {
      setShowBar(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goBackRouteName]);

  const auditInfoOpen = Boolean(auditInfoAnchorEl);

  const renderInfoButton = () => {
    if (!showInfoButton) return null;

    return (
      <>
        <Button
          variant="contained"
          startIcon={<Info />}
          sx={{ ml: [0, 0, 0, 2], mt: [2, 2, 2, 0] }}
          onClick={(event: MouseEvent<HTMLButtonElement>) => setAuditInfoAnchorEl(event.currentTarget)}
          fullWidth={isMobile}
          data-cy="ops-form-info-button"
          size="large"
          color="tertiary"
        >
          {t("Info")}
        </Button>
        <Popover
          open={auditInfoOpen}
          anchorEl={auditInfoAnchorEl}
          onClose={() => setAuditInfoAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <AuditFieldsList auditInfo={auditInfo} width="400px" />
        </Popover>
      </>
    );
  };

  return (
    <Grid size={12}>
      <Box sx={{ backgroundColor: "background.paper", px: 2, py: 2, borderRadius: "16px", border: "1px solid", borderColor: "divider" }}>
        <Grid container>
          <Grid size={{ xs: 12, sm: 12, md: 6, lg: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              {goBackRouteName && (
                <Link href={`/${locale}${goBackRouteName}`} prefetch data-cy="ops-back-link">
                  <OpsIconButton data-cy="ops-back" size="large">
                    <ArrowBack />
                  </OpsIconButton>
                </Link>
              )}
              <Typography variant="h4" sx={{ ml: 2 }} data-cy="ops-form-title">
                {isEdit ? editTitle : title}
              </Typography>
              {renderLeftSide?.()}
              {isEdit && renderInfoButton()}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 12, md: 6, lg: 7 }}>
            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              spacing={0}
              sx={{ justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center", width: "100%", mt: { xs: 2, lg: 0 }, gap: 0 }}
            >
              {renderRightComponent?.()}

              {isEdit && addButonHref && (
                <Button
                  variant="outlined"
                  color="primary"
                  disableElevation
                  startIcon={<ControlPointIcon />}
                  fullWidth={isMobile}
                  sx={{ maxHeight: "40px", mr: [0, 2], mt: [2, 0] }}
                  href={addButonHref}
                  data-cy="ops-form-add-button"
                  size="large"
                >
                  {t("AddNew")}
                </Button>
              )}

              {deleteButtonVisible && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Delete />}
                  fullWidth={isMobile}
                  onClick={handleDelete}
                  sx={{ height: 40, minHeight: 40, maxHeight: 40, whiteSpace: "nowrap", flexShrink: 0, mr: [0, 2], mt: [2, 0] }}
                  data-cy="ops-form-delete-button"
                >
                  {t("Delete")}
                </Button>
              )}

              {submitButtonVisible && (
                <Button
                  disabled={!isDirty || isSubmitting}
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  type="submit"
                  fullWidth={isMobile}
                  sx={{ height: 40, minHeight: 40, maxHeight: 40, whiteSpace: "nowrap", flexShrink: 0, mt: [2, 0] }}
                  data-cy="ops-form-submit-button"
                >
                  {t("Save")}
                </Button>
              )}

              {renderAdditionalHeader && (
                <IconButton
                  sx={{
                    backgroundColor: "transparent !important",
                    height: "40px",
                    ":hover": { backgroundColor: "important !important", color: "secondary.main" },
                  }}
                  onClick={handleChangeShowBar}
                >
                  {showBar ? <KeyboardArrowUpIcon sx={{ fontSize: "40px" }} /> : <ExpandMoreIcon sx={{ fontSize: "40px" }} />}
                </IconButton>
              )}
            </Stack>
          </Grid>

          {renderAdditionalHeader && (
            <Collapse in={showBar}>
              <Grid size={12}>{renderAdditionalHeader()}</Grid>
            </Collapse>
          )}
        </Grid>

        {(showBreadcrumb || breadcrumbs) && (
          <Grid size={12}>
            <OpsBreadcrumb customBreadcrumbs={breadcrumbs} />
          </Grid>
        )}
      </Box>
    </Grid>
  );
}
