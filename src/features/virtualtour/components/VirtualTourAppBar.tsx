import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ProjectEndpoint } from "@features/project/helpers/ProjectEndpoint";
import LinkWraper from "@components/LinkWraper";
import OpsIconButton from "@components/OpsIconButton";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import {
  Save as SaveIcon,
  Menu as MenuIcon,
  ArrowBack,
} from "@mui/icons-material";
import { SceneChanges } from "../types";
import { VirtualTourEntityTypeEnum } from "../types/VirtualTourEntityTypeEnum";

interface VirtualTourAppBarProps {
  scenes: any[];
  sceneChanges: SceneChanges;
  tourModified: boolean;
  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSaveTour: () => void;
  projectId: string;
  entityId: string;
  entityType?: VirtualTourEntityTypeEnum;
  name?: string;
}

const VirtualTourAppBar: React.FC<VirtualTourAppBarProps> = ({
  scenes,
  sceneChanges,
  tourModified,
  drawerOpen,
  setDrawerOpen,
  onSaveTour,
  projectId,
  entityId,
  entityType,
  name,
}) => {
  const t = useTranslations("VirtualTourBuilder");
  const locale = useLocale();

  const getBackUrl = () => {
    const path =
      entityType === VirtualTourEntityTypeEnum.UnitTemplate
        ? ProjectEndpoint.UnitTemplate(projectId, entityId)
        : ProjectEndpoint.ProjectVirtualTours(projectId);
    return `/${locale}${path}`;
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "background.paper",
      }}
    >
      <Toolbar>
        <LinkWraper href={getBackUrl()}>
          <OpsIconButton data-cy="back-button">
            <ArrowBack />
          </OpsIconButton>
        </LinkWraper>
        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{ flexGrow: 1, color: "text.primary", ml: 1 }}
        >
          {t("title")} - {name}
        </Typography>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSaveTour}
          sx={{ minWidth: 120 }}
          disableElevation
          size="large"
          disabled={
            scenes.length === 0 ||
            (sceneChanges.created.length === 0 &&
              sceneChanges.updated.length === 0 &&
              sceneChanges.deleted.length === 0 &&
              !tourModified)
          }
        >
          {t("save")}
        </Button>
        <OpsIconButton
          sx={{
            ml: 2,
          }}
          onClick={() => setDrawerOpen(!drawerOpen)}
          edge="end"
        >
          <MenuIcon />
        </OpsIconButton>
      </Toolbar>
    </AppBar>
  );
};

export default VirtualTourAppBar;
