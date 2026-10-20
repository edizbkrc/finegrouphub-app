import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import OpsIconButton from "@components/OpsIconButton";
import {
  Drawer,
  Box,
  Typography,
  Button,
  List,
  IconButton,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Chip,
  Paper,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  CameraAlt as CameraAltIcon,
  Place as InfoIcon,
  Link as LinkIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  TrendingFlat,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import * as Marzipano from "marzipano";
import {
  VirtualTourScene,
  TourSettings,
  CameraInfo,
  VirtualTourTranslation,
  InfoHotspot,
  LinkHotspot,
} from "../types";
import VirtualTourMultiLangInput from "./VirtualTourMultiLangInput";
import ConfirmDialog from "./ConfirmDialog";

interface VirtualTourDrawerProps {
  open: boolean;
  tourNameTranslations: VirtualTourTranslation[];
  setTourNameTranslations: React.Dispatch<
    React.SetStateAction<VirtualTourTranslation[]>
  >;
  setTourModified: React.Dispatch<React.SetStateAction<boolean>>;
  scenes: VirtualTourScene[];
  editMode: "none" | "info" | "link";
  setEditMode: React.Dispatch<React.SetStateAction<"none" | "info" | "link">>;
  isDragOver: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileInputClick: () => void;
  currentSceneId: string | null;
  tourSettings: TourSettings;
  setTourSettings: React.Dispatch<React.SetStateAction<TourSettings>>;
  currentCameraInfo: CameraInfo | null;
  viewerRef: React.RefObject<Marzipano.Viewer | null>;
  onSwitchToScene: (sceneId: string) => void;
  onEditScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onSetScenes: React.Dispatch<React.SetStateAction<VirtualTourScene[]>>;
  onTrackSceneUpdated: (
    sceneId: string,
    updatedData: Partial<VirtualTourScene>
  ) => void;
  onDeleteHotspot?: (hotspotId: string, hotspotType: "info" | "link") => void;
  onEditHotspot?: (
    hotspot: InfoHotspot | LinkHotspot,
    type: "info" | "link"
  ) => void;
  nightPreview: boolean;
  setNightPreview: (value: boolean) => void;
  onAddNightImage: (sceneId: string, file: File) => void;
  /** false → gece/gündüz araçları gizlenir (daire içi turlar: iç mekânda gece görüntüsü istenmiyor). */
  dayNightEnabled?: boolean;
}

const VirtualTourDrawer: React.FC<VirtualTourDrawerProps> = ({
  open,
  tourNameTranslations,
  setTourNameTranslations,
  setTourModified,
  scenes,
  editMode,
  setEditMode,
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  onFileInputClick,
  currentSceneId,
  tourSettings,
  setTourSettings,
  currentCameraInfo,
  viewerRef,
  onSwitchToScene,
  onEditScene,
  onDeleteScene,
  onSetScenes,
  onTrackSceneUpdated,
  onDeleteHotspot,
  onEditHotspot,
  nightPreview,
  setNightPreview,
  onAddNightImage,
  dayNightEnabled = true,
}) => {
  const t = useTranslations("VirtualTourBuilder");
  const { enqueueSnackbar } = useSnackbar();

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleHotspotDelete = (
    hotspotId: string,
    hotspotType: "info" | "link",
    hotspotTitle: string
  ) => {
    setConfirmDialog({
      open: true,
      title: t("deleteHotspot"),
      message: t("deleteHotspotConfirm", { title: hotspotTitle }),
      onConfirm: () => {
        if (onDeleteHotspot) {
          onDeleteHotspot(hotspotId, hotspotType);
        }
      },
    });
  };

  const handleSceneDelete = (sceneId: string, sceneName: string) => {
    setConfirmDialog({
      open: true,
      title: t("deleteScene"),
      message: t("deleteSceneConfirm", { name: sceneName }),
      onConfirm: () => {
        onDeleteScene(sceneId);
      },
    });
  };

  // Get current scene for hotspot display
  const currentScene = scenes.find((scene) => scene.id === currentSceneId);
  const nightInputRef = React.useRef<HTMLInputElement>(null);
  const [nightTargetId, setNightTargetId] = useState<string | null>(null);

  // Helper function to get scene name
  const getSceneName = (scene: VirtualTourScene): string => {
    return (
      scene.nameTranslations?.find((t) => t.languageId === 21)?.value ||
      scene.name ||
      `Scene ${scene.id}`
    );
  };

  // Handle tour name change and mark as modified
  const handleTourNameChange = (newTranslations: VirtualTourTranslation[]) => {
    setTourNameTranslations(newTranslations);
    setTourModified(true);
  };

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: 400,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 400,
          boxSizing: "border-box",
          mt: "64px",
          borderRadius: "0 10px 10px 0",
          backgroundColor: "background.paper",
          borderLeft: "1px solid",
          borderLeftColor: "borderdashed.main",
        },
      }}
    >
      <Box sx={{ p: 3, height: "calc(100vh - 64px)", overflowY: "auto" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            mb: 2,
            color: "text.primary",
          }}
        >
          {t("tourInformation")}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <VirtualTourMultiLangInput
            label={t("tourName")}
            value={tourNameTranslations}
            onChange={handleTourNameChange}
            placeholder={t("tourNamePlaceholder")}
          />
        </Box>

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            mb: 2,
            color: "text.primary",
          }}
        >
          {t("hotspotTools")}
        </Typography>
        {scenes.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              textAlign: "center",
              p: 2,
              borderRadius: 2,
              backgroundColor: "card.main",
              color: "text.secondary",
              border: "1px solid",
              borderColor: "borderdashed.main",
            }}
          >
            {t("addScenesMessage")}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Button
            variant={editMode === "none" ? "contained" : "contained"}
            //@ts-ignore
            color={editMode === "none" ? "secondary" : "default"}
            startIcon={<ViewIcon />}
            onClick={() => setEditMode("none")}
            disabled={scenes.length === 0}
            sx={{
              borderRadius: 2,
            }}
            disableElevation
          >
            {t("normal")}
          </Button>
          <Button
            variant={editMode === "info" ? "contained" : "contained"}
            //@ts-ignore
            color={editMode === "info" ? "secondary" : "default"}
            startIcon={<InfoIcon />}
            onClick={() => setEditMode(editMode === "info" ? "none" : "info")}
            disabled={scenes.length === 0}
            sx={{
              borderRadius: 2,
            }}
            disableElevation
          >
            {t("info")}
          </Button>
          <Button
            variant={editMode === "link" ? "contained" : "contained"}
            //@ts-ignore
            color={editMode === "link" ? "secondary" : "default"}
            startIcon={<LinkIcon />}
            onClick={() => setEditMode(editMode === "link" ? "none" : "link")}
            disabled={scenes.length === 0}
            sx={{
              borderRadius: 2,
            }}
            disableElevation
          >
            {t("link")}
          </Button>
        </Box>

        {editMode !== "none" && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              backgroundColor: "contentBackground.main",
              borderRadius: 2,
              "& .MuiAlert-icon": {
                color: "primary.main",
              },
              "& .MuiAlert-message": {
                color: "text.primary",
              },
            }}
          >
            {t("hotspotModeMessage", {
              mode: editMode === "info" ? t("info") : t("link"),
            })}
          </Alert>
        )}

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            mb: 2,
            color: "text.primary",
          }}
        >
          {t("scenes")} ({scenes.length})
        </Typography>

        {dayNightEnabled && (
          <>
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {t("dayNightDrawerHint")}
        </Alert>

        <FormControlLabel
          sx={{ mb: 1.5 }}
          control={
            <Switch
              checked={nightPreview}
              onChange={(_, checked) => {
                if (!checked) {
                  setNightPreview(false);
                  return;
                }
                const current = scenes.find((scene) => scene.id === currentSceneId);
                if (current?.nightImageUrl || current?._nightScene) {
                  setNightPreview(true);
                  return;
                }
                if (!currentSceneId) return;
                setNightTargetId(currentSceneId);
                nightInputRef.current?.click();
              }}
            />
          }
          label={nightPreview ? t("nightPreview") : t("dayPreview")}
        />
        <input
          ref={nightInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file && nightTargetId) onAddNightImage(nightTargetId, file);
            event.target.value = "";
            setNightTargetId(null);
          }}
        />
          </>
        )}

        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={onFileInputClick}
          sx={{
            mb: 3,
            p: 3,
            border: isDragOver ? "2px dashed" : "1px dashed",
            borderColor: isDragOver ? "primary.main" : "borderdashed.main",
            borderRadius: 3,
            backgroundColor: isDragOver
              ? (theme) => `${theme.palette.primary.main}08`
              : "contentBackground.main",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.3s ease",
            "&:hover": {
              borderColor: "primary.main",
              backgroundColor: (theme) => `${theme.palette.primary.main}08`,
              transform: "translateY(-1px)",
            },
            ...(isDragOver && {
              transform: "scale(1.02)",
              boxShadow: (theme) =>
                `0 8px 25px ${theme.palette.primary.main}20`,
            }),
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 40,
              color: "primary.main",
              mb: 1.5,
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              color: "text.primary",
            }}
          >
            {isDragOver ? t("releaseToUpload") : t("addPanoramaImages")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.85rem",
              color: "text.secondary",
            }}
          >
            {isDragOver ? t("releaseToUpload") : t("uploadInstructions")}
          </Typography>
        </Box>
        <List dense>
          {scenes.map((scene) => (
            <Box
              key={scene.id}
              onClick={() => onSwitchToScene(scene.id)}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                backgroundColor:
                  currentSceneId === scene.id ? "secondary.main" : "card2.main",
                transition: "all 0.2s ease",
                cursor: "pointer",
                border: 1,
                borderColor:
                  currentSceneId === scene.id ? "secondary.main" : "divider",
                "&:hover": {
                  borderColor: "secondary.main",
                  transform: "translateY(-1px)",
                  backgroundColor:
                    currentSceneId === scene.id
                      ? "secondary.main"
                      : "itemBackgroundHover.main",
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                {/* Scene Name Row */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  {tourSettings.initialSceneId === scene.id && (
                    <StarIcon
                      sx={{
                        fontSize: 16,
                        color:
                          currentSceneId === scene.id
                            ? "primary.contrastText"
                            : "#FFD700",
                      }}
                    />
                  )}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color:
                        currentSceneId === scene.id
                          ? "primary.contrastText"
                          : "text.primary",
                      flex: 1,
                    }}
                  >
                    {getSceneName(scene)}
                  </Typography>
                  {dayNightEnabled && (scene.nightImageUrl || scene._nightScene) && (
                    <Chip
                      size="small"
                      label={t("hasNightImage")}
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        bgcolor:
                          currentSceneId === scene.id
                            ? "rgba(255,255,255,0.2)"
                            : "warning.main",
                        color:
                          currentSceneId === scene.id
                            ? "primary.contrastText"
                            : "warning.contrastText",
                      }}
                    />
                  )}
                </Box>

                {/* Info and Actions Row */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        currentSceneId === scene.id
                          ? "primary.contrastText"
                          : "text.secondary",
                    }}
                  >
                    {scene.infoHotspots?.length || 0} {t("info").toLowerCase()}{" "}
                    • {scene.linkHotspots?.length || 0}{" "}
                    {t("link").toLowerCase()}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title={t("setCameraView")}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!viewerRef.current) return;

                          if (currentSceneId !== scene.id) {
                            enqueueSnackbar(t("switchToSceneFirst"), {
                              variant: "warning",
                              autoHideDuration: 5000,
                            });
                            return;
                          }

                          const view = viewerRef.current.view();
                          if (!view) return;

                          const yaw = view.yaw();
                          const pitch = view.pitch();
                          const fov = view.fov();

                          onSetScenes((prev) =>
                            prev.map((s) =>
                              s.id === scene.id
                                ? { ...s, initialView: { yaw, pitch, fov } }
                                : s
                            )
                          );
                          onTrackSceneUpdated(scene.id, {
                            initialView: { yaw, pitch, fov },
                          });
                          enqueueSnackbar(t("cameraViewSetAsInitial"), {
                            variant: "success",
                          });
                        }}
                        sx={{
                          color:
                            currentSceneId === scene.id
                              ? "primary.contrastText"
                              : "text.secondary",
                          opacity: 0.7,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <CameraAltIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>

                    {dayNightEnabled && (
                    <Tooltip title={scene.nightImageUrl ? t("changeNightImage") : t("addNightImage")}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNightTargetId(scene.id);
                          nightInputRef.current?.click();
                        }}
                        sx={{
                          color:
                            scene.nightImageUrl
                              ? "warning.main"
                              : currentSceneId === scene.id
                                ? "primary.contrastText"
                                : "text.secondary",
                          opacity: 0.8,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <DarkModeIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    )}

                    <Tooltip title={t("editScene")}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditScene(scene.id);
                        }}
                        sx={{
                          color:
                            currentSceneId === scene.id
                              ? "primary.contrastText"
                              : "text.secondary",
                          opacity: 0.7,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={t("deleteScene")}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSceneDelete(scene.id, getSceneName(scene));
                        }}
                        sx={{
                          color:
                            currentSceneId === scene.id
                              ? "primary.contrastText"
                              : "error.main",
                          opacity: 0.7,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </List>

        {/* Current Scene Hotspots */}
        {currentScene &&
          (currentScene.infoHotspots?.length || 0) +
            (currentScene.linkHotspots?.length || 0) >
            0 && (
            <>
              <Divider sx={{ mb: 3, borderColor: "borderdashed.main" }} />
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "text.primary",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    backgroundColor: "primary.main",
                    borderRadius: 1,
                  }}
                />
                {t("sceneHotspots")}
                <Chip
                  label={
                    (currentScene.infoHotspots?.length || 0) +
                    (currentScene.linkHotspots?.length || 0)
                  }
                  size="small"
                  sx={{
                    ml: "auto",
                    fontSize: "0.75rem",
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                  }}
                />
              </Typography>

              <Box sx={{ space: 2 }}>
                {/* Info Hotspots */}
                {currentScene.infoHotspots?.map((hotspot) => (
                  <Paper
                    key={hotspot.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mb: 2,
                      borderRadius: 3,
                      backgroundColor: "card2.main",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: (theme) =>
                          `0 4px 20px ${theme.palette.primary.main}20`,
                        borderColor: "primary.main",
                        transform: "translateY(-2px)",
                        backgroundColor: "itemBackgroundHover.main",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      <Tooltip title={t("goToHotspot")}>
                        <OpsIconButton
                          size="small"
                          onClick={() => {
                            if (
                              viewerRef.current &&
                              currentSceneId === currentScene.id
                            ) {
                              const view = viewerRef.current.view();
                              if (view) {
                                view.setParameters({
                                  yaw: hotspot.yaw,
                                  pitch: hotspot.pitch,
                                  fov: view.fov(),
                                });
                                enqueueSnackbar(t("cameraPositionedToInfo"), {
                                  variant: "success",
                                });
                              }
                            }
                          }}
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "primary.main",
                              color: "primary.contrastText",
                            },
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </OpsIconButton>
                      </Tooltip>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 1.5,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              fontSize: "0.95rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              mr: 1,
                            }}
                          >
                            {hotspot.title || "Untitled Info"}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {onEditHotspot && (
                              <Tooltip title={t("editHotspot")}>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditHotspot(hotspot, "info");
                                  }}
                                  size="small"
                                >
                                  <EditIcon
                                    sx={{ fontSize: 16 }}
                                    color="primary"
                                  />
                                </IconButton>
                              </Tooltip>
                            )}
                            {onDeleteHotspot && (
                              <Tooltip title={t("deleteHotspot")}>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHotspotDelete(
                                      hotspot.id,
                                      "info",
                                      hotspot.title || "this hotspot"
                                    );
                                  }}
                                  size="small"
                                >
                                  <DeleteIcon
                                    sx={{ fontSize: 16 }}
                                    color="error"
                                  />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>

                        {hotspot.content && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.8rem",
                              lineHeight: 1.5,
                              mb: 1.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {hotspot.content}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}

                {/* Link Hotspots */}
                {currentScene.linkHotspots?.map((hotspot) => (
                  <Paper
                    key={hotspot.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 3,
                      backgroundColor: "card2.main",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: (theme) =>
                          `0 4px 20px ${theme.palette.secondary.main}20`,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      <Tooltip title={t("goToHotspot")}>
                        <OpsIconButton
                          size="small"
                          onClick={() => {
                            if (
                              viewerRef.current &&
                              currentSceneId === currentScene.id
                            ) {
                              const view = viewerRef.current.view();
                              if (view) {
                                view.setParameters({
                                  yaw: hotspot.yaw,
                                  pitch: hotspot.pitch,
                                  fov: view.fov(),
                                });
                                enqueueSnackbar(t("cameraPositionedToLink"), {
                                  variant: "success",
                                });
                              }
                            }
                          }}
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "secondary.main",
                              color: "secondary.contrastText",
                            },
                          }}
                        >
                          <LinkIcon fontSize="small" />
                        </OpsIconButton>
                      </Tooltip>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 1.5,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              fontSize: "0.95rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              mr: 1,
                            }}
                          >
                            {hotspot.title || "Scene Link"}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {onEditHotspot && (
                              <Tooltip title={t("editHotspot")}>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditHotspot(hotspot, "link");
                                  }}
                                  size="small"
                                >
                                  <EditIcon
                                    sx={{ fontSize: 16 }}
                                    color="primary"
                                  />
                                </IconButton>
                              </Tooltip>
                            )}
                            {onDeleteHotspot && (
                              <Tooltip title={t("deleteHotspot")}>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHotspotDelete(
                                      hotspot.id,
                                      "link",
                                      hotspot.title || "this hotspot"
                                    );
                                  }}
                                  size="small"
                                >
                                  <DeleteIcon
                                    sx={{ fontSize: 16 }}
                                    color="error"
                                  />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.8rem",
                            lineHeight: 1.5,
                            mb: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Tooltip title={t("goToScene")}>
                            <OpsIconButton
                              size="small"
                              onClick={() =>
                                onSwitchToScene(hotspot.targetScene)
                              }
                            >
                              <TrendingFlat fontSize="small" />
                            </OpsIconButton>
                          </Tooltip>
                          {scenes.find((s) => s.id === hotspot.targetScene)
                            ? getSceneName(
                                scenes.find(
                                  (s) => s.id === hotspot.targetScene
                                )!
                              )
                            : "Unknown Scene"}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.7rem",
                              fontFamily: "monospace",
                              backgroundColor: "card2.main",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1.5,
                              border: "1px solid",
                              borderColor: "borderdashed.main",
                            }}
                          >
                            {hotspot.yaw.toFixed(1)}°,{" "}
                            {hotspot.pitch.toFixed(1)}°
                          </Typography> */}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </>
          )}

        <Divider sx={{ mb: 3, borderColor: "borderdashed.main" }} />

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: scenes.length === 0 ? "text.secondary" : "text.primary",
            fontWeight: 600,
            mb: 2,
          }}
        >
          {t("viewerSettings")}
        </Typography>

        {scenes.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              textAlign: "center",
              p: 2,
              borderRadius: 2,
              backgroundColor: "card.main",
              color: "text.secondary",
              border: "1px solid",
              borderColor: "borderdashed.main",
            }}
          >
            {t("addScenesMessage")}
          </Typography>
        )}

        <FormControl fullWidth sx={{ mb: 2 }} disabled={scenes.length === 0}>
          <InputLabel>{t("initialScene")}</InputLabel>
          <Select
            value={tourSettings.initialSceneId || ""}
            label={t("initialScene")}
            onChange={(e) => {
              setTourSettings((prev) => ({
                ...prev,
                initialSceneId: e.target.value,
              }));
              setTourModified(true);
            }}
            disabled={scenes.length === 0}
          >
            {scenes.map((scene) => (
              <MenuItem key={scene.id} value={scene.id}>
                {getSceneName(scene)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }} disabled={scenes.length === 0}>
          <InputLabel>{t("mouseViewMode")}</InputLabel>
          <Select
            value={tourSettings.mouseViewMode}
            label={t("mouseViewMode")}
            onChange={(e) => {
              setTourSettings((prev) => ({
                ...prev,
                mouseViewMode: e.target.value,
              }));
              setTourModified(true);
            }}
            disabled={scenes.length === 0}
          >
            <MenuItem value={1}>{t("drag")}</MenuItem>
            <MenuItem value={2}>{t("qtvr")}</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={tourSettings.autorotateEnabled}
              onChange={(e) => {
                setTourSettings((prev) => ({
                  ...prev,
                  autorotateEnabled: e.target.checked,
                }));
                setTourModified(true);
              }}
              color="primary"
              disabled={scenes.length === 0}
            />
          }
          label={t("autoRotate")}
          sx={{
            mb: 1,
          }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={tourSettings.fullscreenButton}
              onChange={(e) => {
                setTourSettings((prev) => ({
                  ...prev,
                  fullscreenButton: e.target.checked,
                }));
                setTourModified(true);
              }}
              color="primary"
              disabled={scenes.length === 0}
            />
          }
          label={t("fullscreenButton")}
          sx={{
            mb: 1,
          }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={tourSettings.viewControlButtons}
              onChange={(e) => {
                setTourSettings((prev) => ({
                  ...prev,
                  viewControlButtons: e.target.checked,
                }));
                setTourModified(true);
              }}
              color="primary"
              disabled={scenes.length === 0}
            />
          }
          label={t("viewControls")}
          sx={{
            mb: 2,
          }}
        />

        {currentSceneId && (
          <>
            <Divider sx={{ my: 3, borderColor: "borderdashed.main" }} />
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
              }}
            >
              {t("cameraInfo")}
            </Typography>
            <Paper
              sx={{
                p: 3,
                mb: 2,
                borderRadius: 3,
                backgroundColor: "card2.main",
              }}
              elevation={0}
            >
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "text.primary",
                  fontWeight: 500,
                }}
              >
                {t("scene")}: {currentCameraInfo?.sceneName || "Loading..."}
              </Typography>
              <Typography
                variant="body2"
                gutterBottom
                sx={{ color: "text.secondary" }}
              >
                <strong>{t("fov")}:</strong> {currentCameraInfo?.fov || "0"}
                {t("degrees")}
              </Typography>
              <Typography
                variant="body2"
                gutterBottom
                sx={{ color: "text.secondary" }}
              >
                <strong>{t("yaw")}:</strong> {currentCameraInfo?.yaw || "0"}
                {t("degrees")}
              </Typography>
              <Typography
                variant="body2"
                gutterBottom
                sx={{ color: "text.secondary" }}
              >
                <strong>{t("pitch")}:</strong> {currentCameraInfo?.pitch || "0"}
                {t("degrees")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  display: "block",
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                {t("cameraInstructions")}
              </Typography>
            </Paper>
          </>
        )}
      </Box>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        severity="error"
        confirmText={t("confirmDelete")}
        cancelText={t("cancel")}
      />
    </Drawer>
  );
};

export default VirtualTourDrawer;
