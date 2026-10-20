"use client";

import { Box, Button, Grid, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsLayoutContent from "./OpsLayoutContent";

interface IOpsLayoutPageProps {
  children?: React.ReactNode;
  titleKey: string;
  /** "Yeni Ekle" bir sayfaya gidecekse route; modal açacaksa boş bırakılır. */
  addButtonRoute?: string;
  addButtonClick?: () => void;
  /** true ise "Yeni Ekle" OpsModal'ı açar. */
  defaultAddButton?: boolean;
  rightComponent?: React.ReactNode;
}

export default function OpsLayoutPage({
  children,
  titleKey,
  addButtonRoute,
  addButtonClick,
  defaultAddButton = false,
  rightComponent,
}: IOpsLayoutPageProps) {
  const t = useTranslations();
  const { openOpsModal } = useOpsModal();

  /**
   * ⚠️ Referansta iki ayrı `<Button>` bloğu vardı ve `defaultAddButton` ile
   * `addButonRoute` birlikte verildiğinde İKİ buton birden render ediliyordu
   * (ayrıca prop adı "addButonRoute" yazım hatasıydı). Tek buton, tek karar:
   * route varsa link, yoksa callback, o da yoksa modal.
   */
  const showAddButton = defaultAddButton || !!addButtonRoute || !!addButtonClick;
  const handleAddClick = addButtonClick ?? (defaultAddButton ? openOpsModal : undefined);

  return (
    <OpsLayoutContent>
      <Grid container alignItems="center">
        <Grid size={6}>
          <Typography
            variant="h4"
            fontSize={["1.25rem", "1.50rem"]}
            data-cy="page-title"
          >
            {t(titleKey)}
          </Typography>
        </Grid>

        <Grid size={6} textAlign="right">
          {rightComponent}
          {showAddButton && (
            <Button
              href={addButtonRoute}
              onClick={handleAddClick}
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Add />}
              data-cy="ops-new-button"
            >
              {t("Button.AddNew")}
            </Button>
          )}
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>{children}</Box>
    </OpsLayoutContent>
  );
}
