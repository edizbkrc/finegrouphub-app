"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Box,
  Button,
  Grid,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import { useAppSelector } from "@redux/hooks";
import { usePageInformation } from "@hooks/usePageInformation";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsIconButton from "@components/OpsIconButton";
import LinkWraper from "@components/LinkWraper";
import type { IBreadcrumbItem } from "@components/OpsBreadcrumb";
import OpsLayoutContent from "./OpsLayoutContent";
import OpsPageHeader from "./OpsPageHeader";

interface IOpsTablePageProps {
  children: ReactNode;
  breadcrumbs?: IBreadcrumbItem[];
  defaultButton?: boolean;
  showTitle?: boolean;
  defaultButtonOnClick?: () => void;
  defaultButtonLabel?: string;
  customToolbar?: ReactNode;
  title?: string;
  href?: string;
  renderRightSide?: ReactNode;
  pageName?: string;
  backRoute?: string;
  backButtonVisible?: boolean;
  disableAddNew?: boolean;
}

export default function OpsTablePage({
  children,
  defaultButton = true,
  showTitle = true,
  defaultButtonOnClick,
  defaultButtonLabel,
  customToolbar,
  title: titleProp,
  href,
  renderRightSide,
  pageName,
  backRoute,
  backButtonVisible = false,
  disableAddNew,
  breadcrumbs,
}: IOpsTablePageProps) {
  const t = useTranslations("Button");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const pageInfo = usePageInformation(pageName);
  const { openOpsModal } = useOpsModal();
  const title = titleProp ?? pageInfo?.localizedName;

  const totalDataCount = useAppSelector((state) => state.TableReducer.tableResponse?.totalDataCount);
  const metadatas = useAppSelector((state) => state.TableReducer.tableResponse?.metadatas);

  useEffect(() => {
    if (metadatas && metadatas.length > 0) setLoading(false);
  }, [metadatas]);

  const renderDefaultButton = () => (
    <Stack direction={["column", "row"]} justifyContent={["flex-start", "flex-end"]}>
      {renderRightSide}
      <LinkWraper href={href ? `/${locale}${href}` : undefined}>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          startIcon={<ControlPointIcon />}
          onClick={href ? undefined : (defaultButtonOnClick ?? openOpsModal)}
          fullWidth={isMobile}
          data-cy="ops-new-button"
          sx={{ mt: [2, 0] }}
          size="large"
        >
          {defaultButtonLabel ?? t("AddNew")}
        </Button>
      </LinkWraper>
    </Stack>
  );

  const renderToolbar = (): ReactNode => {
    const showDefaultButton = defaultButton && pageInfo?.hasCreate && pageInfo?.userCanCreate;
    if (showDefaultButton && !disableAddNew) return renderDefaultButton();
    return renderRightSide;
  };

  if (!showTitle) {
    return (
      <OpsLayoutContent>
        <Box sx={{ mt: 3 }}>{children}</Box>
      </OpsLayoutContent>
    );
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    return (
      <OpsLayoutContent>
        <OpsPageHeader
          title={title || ""}
          breadcrumbs={breadcrumbs}
          renderRightHeader={() => customToolbar ?? renderToolbar()}
        />
        <Box sx={{ mt: 3 }}>{children}</Box>
      </OpsLayoutContent>
    );
  }

  return (
    <OpsLayoutContent>
      <Grid container>
        {loading ? (
          <Grid size={12}>
            <Skeleton width="100%">
              <Skeleton variant="rectangular" width="100%" height={80} />
            </Skeleton>
          </Grid>
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {backButtonVisible && (
                  <LinkWraper href={backRoute}>
                    <OpsIconButton
                      onClick={backRoute ? undefined : () => router.back()}
                      data-cy="back-button"
                      size="large"
                    >
                      <ArrowBack />
                    </OpsIconButton>
                  </LinkWraper>
                )}
                <Typography variant="h4" data-cy="page-title">
                  {title}
                  {totalDataCount ? ` (${totalDataCount})` : ""}
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 8 }}>{customToolbar ?? renderToolbar()}</Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 3 }}>{children}</Box>
    </OpsLayoutContent>
  );
}
