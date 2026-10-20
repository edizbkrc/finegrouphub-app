"use client";

import { useRouter } from "next/navigation";
import { Box, Grid, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import OpsIconButton from "@components/OpsIconButton";
import OpsBreadcrumb, { type IBreadcrumbItem } from "@components/OpsBreadcrumb";
import LinkWraper from "@components/LinkWraper";

export default function OpsPageHeader({
  title,
  renderRightHeader,
  renderBottom,
  titleSize,
  rightHeaderSize,
  backRoute,
  breadcrumbs,
  showBreadcrumb = false,
}: {
  title: string;
  renderRightHeader?: () => React.ReactNode;
  renderBottom?: () => React.ReactNode;
  titleSize?: Record<string, number>;
  rightHeaderSize?: Record<string, number>;
  backRoute?: string;
  breadcrumbs?: IBreadcrumbItem[];
  showBreadcrumb?: boolean;
}) {
  const router = useRouter();

  return (
    <Grid size={12}>
      <Box
        sx={{
          backgroundColor: "background.paper",
          p: 2,
          py: 2.5,
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Grid container spacing={2}>
          <Grid
            size={
              titleSize ?? {
                xs: 12,
                sm: 12,
                md: renderRightHeader ? 12 : 8,
                lg: 4,
              }
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              <LinkWraper href={backRoute}>
                <OpsIconButton
                  onClick={backRoute ? undefined : () => router.back()}
                  data-cy="back-button"
                  size="large"
                >
                  <ArrowBack />
                </OpsIconButton>
              </LinkWraper>
              <Typography variant="h4" sx={{ ml: 2, fontWeight: 700, letterSpacing: "-0.03em" }} data-cy="page-title">
                {title}
              </Typography>
            </Box>
          </Grid>

          <Grid
            size={
              rightHeaderSize ?? {
                xs: 12,
                sm: 12,
                md: renderRightHeader ? 12 : 8,
                lg: 8,
              }
            }
          >
            {renderRightHeader?.()}
          </Grid>
        </Grid>

        {renderBottom?.()}

        {(showBreadcrumb || breadcrumbs) && (
          <Grid size={12}>
            <OpsBreadcrumb customBreadcrumbs={breadcrumbs} />
          </Grid>
        )}
      </Box>
    </Grid>
  );
}
