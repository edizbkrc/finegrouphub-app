"use client";
import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import VirtualTourAppBar from "@features/virtualtour/components/VirtualTourAppBar";
import VirtualTourDrawer from "@features/virtualtour/components/VirtualTourDrawer";
import HotspotDialog from "@features/virtualtour/components/HotspotDialog";
import EditSceneDialog from "@features/virtualtour/components/EditSceneDialog";
import EditHotspotDialog from "@features/virtualtour/components/EditHotspotDialog";
import VirtualTourContextMenu from "@features/virtualtour/components/VirtualTourContextMenu";
import DayNightToggle from "@features/virtualtour/components/DayNightToggle";
import {
  PanoramaContainer,
  AnimatedBackground,
  EmptyStateContainer,
  IconContainer,
} from "@features/virtualtour/components/styles";
import { useVirtualTourBuilder } from "@features/virtualtour/hooks/useVirtualTourBuilder";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { useSnackbar } from "notistack";
import { IVirtualTourData } from "../types/IVirtualTourData";
import { VirtualTourEntityTypeEnum } from "../types/VirtualTourEntityTypeEnum";

interface ContextMenuPosition {
  mouseX: number;
  mouseY: number;
}

export default function VirtualTourPage({
  projectId,
  entityId,
  entityType,
  virtualId,
  apiData,
  name,
}: {
  projectId?: any;
  entityId?: any;
  entityType?: VirtualTourEntityTypeEnum;
  virtualId?: any;
  apiData?: IVirtualTourData;
  name?: string;
}) {
  const t = useTranslations("VirtualTourBuilder");
  const { getLanguages } = useSupportedLanguages();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const nightInputRef = React.useRef<HTMLInputElement>(null);

  const [editHotspotDialog, setEditHotspotDialog] = React.useState(false);
  const [editingHotspot, setEditingHotspot] = React.useState<{
    hotspot: any;
    type: "info" | "link";
  } | null>(null);

  const [contextMenu, setContextMenu] =
    React.useState<ContextMenuPosition | null>(null);
  const [contextMenuType, setContextMenuType] = React.useState<
    "panorama" | "hotspot"
  >("panorama");
  const [selectedHotspot, setSelectedHotspot] = React.useState<{
    id: string;
    type: "info" | "link";
  } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{
    yaw: number;
    pitch: number;
  } | null>(null);

  const virtualTourRef = React.useRef<ReturnType<typeof useVirtualTourBuilder> | null>(null);

  const handleHotspotContextMenu = React.useCallback(
    (e: MouseEvent, hotspotId: string, hotspotType: "info" | "link") => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        mouseX: e.clientX,
        mouseY: e.clientY,
      });
      setContextMenuType("hotspot");
      setSelectedHotspot({ id: hotspotId, type: hotspotType });
    },
    []
  );

  const openHotspotEditor = React.useCallback(
    (hotspotId: string, hotspotType: "info" | "link") => {
      const current = virtualTourRef.current;
      const currentScene = current?.scenes.find((s) => s.id === current.currentSceneId);
      if (!currentScene) return;
      const hotspot =
        hotspotType === "info"
          ? currentScene.infoHotspots?.find((h) => h.id === hotspotId)
          : currentScene.linkHotspots?.find((h) => h.id === hotspotId);
      if (!hotspot) return;
      setSelectedHotspot({ id: hotspotId, type: hotspotType });
      setEditingHotspot({ hotspot, type: hotspotType });
      setEditHotspotDialog(true);
    },
    []
  );

  const virtualTour = useVirtualTourBuilder(
    projectId,
    entityId,
    entityType,
    virtualId,
    apiData,
    handleHotspotContextMenu,
    openHotspotEditor
  );
  virtualTourRef.current = virtualTour;

  useEffect(() => {
    getLanguages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePanoramaContextMenu = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (virtualTour.editMode !== "none" || virtualTour.scenes.length === 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Check if the click is on a hotspot
      const target = e.target as HTMLElement;
      if (target.closest(".hotspot")) {
        return;
      }

      // Get position
      if (!virtualTour.panoEl.current || !virtualTour.viewerRef.current) return;

      const rect = virtualTour.panoEl.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      try {
        const view = virtualTour.viewerRef.current.view();
        const coords = view.screenToCoordinates({ x, y });
        let yaw = coords.yaw;
        let pitch = coords.pitch;

        if (isNaN(yaw) || isNaN(pitch)) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          yaw = ((x - centerX) / rect.width) * Math.PI * 2;
          pitch = -((y - centerY) / rect.height) * Math.PI;
        }

        while (yaw > Math.PI) yaw -= 2 * Math.PI;
        while (yaw < -Math.PI) yaw += 2 * Math.PI;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        setContextMenuPosition({ yaw, pitch });
        setContextMenu({
          mouseX: e.clientX,
          mouseY: e.clientY,
        });
        setContextMenuType("panorama");
      } catch (error) {
        console.error("Error getting position:", error);
      }
    },
    [
      virtualTour.editMode,
      virtualTour.scenes.length,
      virtualTour.panoEl,
      virtualTour.viewerRef,
    ]
  );

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedHotspot(null);
    setContextMenuPosition(null);
  };

  const handleAddInfoHotspot = () => {
    if (!contextMenuPosition) return;

    virtualTour.setHotspotForm({
      type: "info",
      title: "",
      content: "",
      targetScene: "",
      position: contextMenuPosition,
    });
    virtualTour.setHotspotDialog(true);
  };

  const handleAddLinkHotspot = () => {
    if (!contextMenuPosition) return;

    virtualTour.setHotspotForm({
      type: "link",
      title: "",
      content: undefined,
      targetScene: "",
      position: contextMenuPosition,
    });
    virtualTour.setHotspotDialog(true);
  };

  const handleSetCameraView = () => {
    if (!virtualTour.currentSceneId) return;

    const currentScene = virtualTour.scenes.find(
      (s) => s.id === virtualTour.currentSceneId
    );

    if (currentScene && virtualTour.viewerRef.current) {
      try {
        const view = virtualTour.viewerRef.current.view();
        const fov = view.fov();
        const yaw = view.yaw();
        const pitch = view.pitch();

        virtualTour.editScene(virtualTour.currentSceneId);

        // Update the editing scene with current camera values
        setTimeout(() => {
          virtualTour.setEditingScene({
            id: currentScene.id,
            name:
              currentScene.nameTranslations?.find((t) => t.languageId === 21)
                ?.value ||
              currentScene.name ||
              "",
            description:
              currentScene.descriptionTranslations?.find(
                (t) => t.languageId === 21
              )?.value ||
              currentScene.description ||
              "",
            yaw: ((yaw * 180) / Math.PI).toFixed(1),
            pitch: ((pitch * 180) / Math.PI).toFixed(1),
            fov: ((fov * 180) / Math.PI).toFixed(1),
            faceSize: (currentScene.faceSize || 1500).toString(),
          });
        }, 100);
      } catch (error) {
        console.error("Error setting camera view:", error);
      }
    }
  };

  const handleEditHotspot = () => {
    if (!selectedHotspot) return;
    openHotspotEditor(selectedHotspot.id, selectedHotspot.type);
  };

  const handleDeleteHotspot = () => {
    if (!selectedHotspot) return;
    virtualTour.handleDeleteHotspot(selectedHotspot.id, selectedHotspot.type);
  };

  // Daire içi (mülk şablonu) turlarda gece/gündüz yok: iç mekânda gece görüntüsü istenmiyor.
  // Gece/gündüz yalnız proje (dış mekân) turlarında anlamlı.
  const dayNightEnabled = entityType !== VirtualTourEntityTypeEnum.UnitTemplate;

  return (
    <Box sx={{ height: "100vh" }}>
      <VirtualTourAppBar
        projectId={projectId}
        entityId={entityId}
        entityType={entityType}
        name={name}
        scenes={virtualTour.scenes}
        sceneChanges={virtualTour.sceneChanges}
        tourModified={virtualTour.tourModified}
        drawerOpen={virtualTour.drawerOpen}
        setDrawerOpen={virtualTour.setDrawerOpen}
        onSaveTour={virtualTour.saveTour}
      />

      <VirtualTourDrawer
        open={virtualTour.drawerOpen}
        tourNameTranslations={virtualTour.tourNameTranslations}
        setTourNameTranslations={virtualTour.setTourNameTranslations}
        setTourModified={virtualTour.setTourModified}
        scenes={virtualTour.scenes}
        editMode={virtualTour.editMode}
        setEditMode={virtualTour.setEditMode}
        isDragOver={virtualTour.isDragOver}
        handleDragOver={virtualTour.handleDragOver}
        handleDragLeave={virtualTour.handleDragLeave}
        handleDrop={virtualTour.handleDrop}
        onFileInputClick={() => virtualTour.fileInputRef.current?.click()}
        currentSceneId={virtualTour.currentSceneId}
        tourSettings={virtualTour.tourSettings}
        setTourSettings={virtualTour.setTourSettings}
        currentCameraInfo={virtualTour.currentCameraInfo}
        viewerRef={virtualTour.viewerRef}
        onSwitchToScene={virtualTour.switchToScene}
        onEditScene={virtualTour.editScene}
        onDeleteScene={virtualTour.deleteScene}
        onSetScenes={virtualTour.setScenes}
        onTrackSceneUpdated={virtualTour.onTrackSceneUpdated}
        onDeleteHotspot={virtualTour.handleDeleteHotspot}
        onEditHotspot={(hotspot, type) => {
          setEditingHotspot({ hotspot, type });
          setEditHotspotDialog(true);
        }}
        nightPreview={virtualTour.nightPreview}
        setNightPreview={virtualTour.setNightPreview}
        onAddNightImage={virtualTour.addNightImage}
        dayNightEnabled={dayNightEnabled}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mr: virtualTour.drawerOpen ? "400px" : 0,
          transition: theme.transitions.create(["margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: "64px",
          position: "relative",
        }}
      >
        <PanoramaContainer
          ref={virtualTour.panoEl}
          scenes={virtualTour.scenes.length}
          editMode={virtualTour.editMode}
          isDragOver={virtualTour.isDragOver}
          onDragOver={virtualTour.handleDragOver}
          onDragLeave={virtualTour.handleDragLeave}
          onDrop={virtualTour.handleDrop}
          onContextMenu={handlePanoramaContextMenu}
          onClick={
            virtualTour.scenes.length === 0
              ? () => virtualTour.fileInputRef.current?.click()
              : undefined
          }
        >
          {virtualTour.scenes.length === 0 && (
            <>
              <AnimatedBackground />
              <EmptyStateContainer isDragOver={virtualTour.isDragOver}>
                <IconContainer isDragOver={virtualTour.isDragOver}>
                  <CloudUploadIcon sx={{ fontSize: 35, color: "inherit" }} />
                </IconContainer>
                <Typography
                  variant="h4"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    background: "linear-gradient(45deg, #ffffff, #e3f2fd)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("createYourVirtualTour")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    opacity: 0.9,
                    color: "#ffffff",
                    fontSize: "1.1rem",
                  }}
                >
                  {t("uploadDescription")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#7f8c8d",
                    fontSize: "0.85rem",
                    mb: 3,
                  }}
                >
                  {virtualTour.isDragOver
                    ? t("releaseToUpload")
                    : t("uploadInstructions")}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    virtualTour.fileInputRef.current?.click();
                  }}
                  sx={{
                    mt: 2,
                    background: virtualTour.isDragOver
                      ? "linear-gradient(135deg, rgba(52, 152, 219, 0.9), rgba(41, 128, 185, 0.9))"
                      : "linear-gradient(135deg, rgba(26,35,126,0.9), rgba(40,53,147,0.9))",
                    borderRadius: "25px",
                    padding: "12px 30px",
                    fontSize: "16px",
                    textTransform: "none",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, rgba(52, 152, 219, 0.9), rgba(41, 128, 185, 0.9))",
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 25px rgba(0,0,0,0.4)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {virtualTour.isDragOver
                    ? t("dropImages")
                    : t("addPanoramaImages")}
                </Button>
              </EmptyStateContainer>
            </>
          )}
        </PanoramaContainer>
        {dayNightEnabled && virtualTour.scenes.length > 0 && (
          <DayNightToggle
            nightPreview={virtualTour.nightPreview}
            hasNightImage={Boolean(
              virtualTour.scenes.find((scene) => scene.id === virtualTour.currentSceneId)
                ?.nightImageUrl ||
                virtualTour.scenes.find((scene) => scene.id === virtualTour.currentSceneId)
                  ?._nightScene
            )}
            onSelectDay={() => virtualTour.setNightPreview(false)}
            onSelectNight={() => {
              const current = virtualTour.scenes.find(
                (scene) => scene.id === virtualTour.currentSceneId
              );
              if (current?.nightImageUrl || current?._nightScene) {
                virtualTour.setNightPreview(true);
                return;
              }
              if (!virtualTour.currentSceneId) return;
              enqueueSnackbar(t("nightImageMissing"), { variant: "info" });
              nightInputRef.current?.click();
            }}
          />
        )}
      </Box>

      <input
        ref={virtualTour.fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={virtualTour.handleFileUpload}
      />
      <input
        ref={nightInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file && virtualTour.currentSceneId) {
            virtualTour.addNightImage(virtualTour.currentSceneId, file);
          }
          event.target.value = "";
        }}
      />

      <EditSceneDialog
        open={virtualTour.editSceneDialog}
        onClose={() => virtualTour.setEditSceneDialog(false)}
        editingScene={virtualTour.editingScene}
        setEditingScene={virtualTour.setEditingScene}
        onUpdateScene={virtualTour.updateScene}
      />

      <HotspotDialog
        open={virtualTour.hotspotDialog}
        onClose={virtualTour.handleCloseHotspotDialog}
        hotspotForm={virtualTour.hotspotForm}
        setHotspotForm={virtualTour.setHotspotForm}
        scenes={virtualTour.scenes}
        currentSceneId={virtualTour.currentSceneId}
        onAddHotspot={virtualTour.handleAddHotspot}
      />

      <EditHotspotDialog
        open={editHotspotDialog}
        onClose={() => {
          setEditHotspotDialog(false);
          setEditingHotspot(null);
        }}
        hotspot={editingHotspot?.hotspot || null}
        hotspotType={editingHotspot?.type || "info"}
        scenes={virtualTour.scenes}
        currentSceneId={virtualTour.currentSceneId}
        onUpdateHotspot={(
          hotspotId,
          hotspotType,
          title,
          content,
          targetScene,
          yaw,
          pitch
        ) => {
          virtualTour.handleUpdateHotspot(
            hotspotId,
            hotspotType,
            title,
            content,
            targetScene,
            yaw,
            pitch
          );
          setEditHotspotDialog(false);
          setEditingHotspot(null);
        }}
      />

      <VirtualTourContextMenu
        contextMenu={contextMenu}
        onClose={handleCloseContextMenu}
        menuType={contextMenuType}
        hotspotType={selectedHotspot?.type}
        onAddInfoHotspot={handleAddInfoHotspot}
        onAddLinkHotspot={handleAddLinkHotspot}
        onSetCameraView={handleSetCameraView}
        onEditHotspot={handleEditHotspot}
        onDeleteHotspot={handleDeleteHotspot}
      />
    </Box>
  );
}
