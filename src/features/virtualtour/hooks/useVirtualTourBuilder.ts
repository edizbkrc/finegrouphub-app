import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import {
  useVirtualTourManager,
  useSceneManager,
  useMarzipanoViewer,
  useFileUpload,
  useTourSettings,
} from "./index";
import { EditingScene } from "../types";
import { IVirtualTourData } from "../types/IVirtualTourData";
import { hotspotCSS } from "../components/styles";
import { HotspotTypeEnum } from "../types/HotspotTypeEnum";

export const useVirtualTourBuilder = (
  projectId?: any,
  entityId?: any,
  entityType?: any,
  virtualId?: any,
  apiData?: IVirtualTourData,
  onHotspotContextMenu?: (
    e: MouseEvent,
    hotspotId: string,
    hotspotType: "info" | "link"
  ) => void,
  onHotspotEdit?: (hotspotId: string, hotspotType: "info" | "link") => void
) => {
  const { enqueueSnackbar } = useSnackbar();
  const t = useTranslations("VirtualTourBuilder.messages");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tourManager = useVirtualTourManager(
    projectId,
    entityId,
    entityType,
    virtualId
  );
  const sceneManager = useSceneManager();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [editSceneDialog, setEditSceneDialog] = useState<boolean>(false);
  const [hotspotDialog, setHotspotDialog] = useState<boolean>(false);
  const viewer = useMarzipanoViewer(setHotspotDialog, onHotspotContextMenu);
  const fileUpload = useFileUpload();
  const tourSettingsHook = useTourSettings();
  const [nightPreview, setNightPreview] = useState(false);
  const [editingScene, setEditingScene] = useState<EditingScene>({
    id: "",
    name: "",
    description: "",
    yaw: "0",
    pitch: "0",
    fov: "90",
    faceSize: "1500",
  });

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = hotspotCSS;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const switchToScene = useCallback(
    (sceneId: string) => {
      const scene = sceneManager.scenes.find((s) => s.id === sceneId);
      if (scene) {
        const visible = nightPreview && scene._nightScene ? scene._nightScene : undefined;
        viewer.switchToScene(scene, visible);
        sceneManager.switchToScene(sceneId);
        if (viewer.updateCurrentScene) {
          viewer.updateCurrentScene(scene);
        }
      }
    },
    [sceneManager, viewer, nightPreview]
  );

  // Set the switchToScene callback in the viewer
  useEffect(() => {
    if (viewer.setSwitchToSceneCallback) {
      viewer.setSwitchToSceneCallback(switchToScene);
    }
  }, [viewer]);

  useEffect(() => {
    if (!viewer.setHotspotMovedHandler) return;
    viewer.setHotspotMovedHandler((hotspotId, hotspotType, yaw, pitch) => {
      viewer.handleUpdateHotspot(
        hotspotId,
        hotspotType,
        sceneManager.currentSceneId,
        sceneManager.scenes,
        sceneManager.setScenes,
        sceneManager.trackSceneUpdated,
        undefined,
        undefined,
        undefined,
        yaw,
        pitch,
        true
      );
    });
  }, [viewer, sceneManager]);

  useEffect(() => {
    if (!viewer.setHotspotEditHandler || !onHotspotEdit) return;
    viewer.setHotspotEditHandler(onHotspotEdit);
  }, [viewer, onHotspotEdit]);

  useEffect(() => {
    if (sceneManager.currentSceneId) switchToScene(sceneManager.currentSceneId);
    // Gece/gündüz önizleme değişince aynı sahne yeniden çizilir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nightPreview]);

  const processApiScenes = useCallback(
    async (scenesData: any[]) => {
      const loadedScenes = await Promise.all(
        scenesData.map(async (sceneData: any) => {
          try {
            let imageUrl = sceneData.image?.url || "";

            if (!imageUrl) {
              imageUrl = `data:image/svg+xml;base64,${btoa(
                `<svg width="4000" height="2000" viewBox="0 0 4000 2000" xmlns="http://www.w3.org/2000/svg"><rect width="4000" height="2000" fill="#f0f0f0"/><text x="2000" y="1000" font-family="Arial" font-size="80" fill="#999" text-anchor="middle" dy=".3em">${
                  sceneData.translations?.[0]?.name || "Scene"
                }</text></svg>`
              )}`;
            }

            // Import Marzipano dynamically to avoid SSR issues
            const Marzipano = await import("marzipano");
            const source = Marzipano.ImageUrlSource.fromString(imageUrl);
            const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
            //@ts-ignore
            const limiter = Marzipano.RectilinearView.limit.traditional(
              2048,
              (90 * Math.PI) / 180,
              (150 * Math.PI) / 180
            );

            const view = new Marzipano.RectilinearView(
              sceneData.initialViewParameters
                ? {
                    yaw:
                      ((sceneData.initialViewParameters.yaw || 0) * Math.PI) /
                      180,
                    pitch:
                      ((sceneData.initialViewParameters.pitch || 0) * Math.PI) /
                      180,
                    fov:
                      ((sceneData.initialViewParameters.fov || 120.0) *
                        Math.PI) /
                      180,
                  }
                : { yaw: 0, pitch: 0, fov: (120 * Math.PI) / 180 },
              //@ts-ignore
              limiter
            );

            const scene = viewer.viewerRef.current?.createScene({
              source,
              geometry,
              view,
            });

            let nightScene = null;
            if (sceneData.nightImage?.url && viewer.viewerRef.current) {
              const nightSource = Marzipano.ImageUrlSource.fromString(sceneData.nightImage.url);
              nightScene = viewer.viewerRef.current.createScene({
                source: nightSource,
                geometry,
                view,
              });
            }

            const infoHotspots =
              sceneData.hotspots
                ?.filter((h: any) => h.type === 2 || h.type === 2)
                .map((hotspot: any) => ({
                  id: hotspot.id,
                  title:
                    hotspot.translations?.[0]?.title ||
                    hotspot.translations?.[0]?.name ||
                    "",
                  content:
                    hotspot.translations?.[0]?.content ||
                    hotspot.translations?.[0]?.description ||
                    "",
                  yaw: hotspot.yaw,
                  pitch: hotspot.pitch,
                  type: HotspotTypeEnum.Info,
                })) || [];

            const linkHotspots =
              sceneData.hotspots
                ?.filter((h: any) => h.type === "1" || h.type === 1)
                .map((hotspot: any) => ({
                  id: hotspot.id,
                  title:
                    hotspot.translations?.[0]?.title ||
                    hotspot.translations?.[0]?.name ||
                    "Link",
                  targetScene: hotspot.targetScene,
                  yaw: hotspot.yaw,
                  pitch: hotspot.pitch,
                  type: HotspotTypeEnum.Link,
                })) || [];

            return {
              id: sceneData.id,
              nameTranslations: sceneData.translations?.map((t: any) => ({
                languageId: t.languageId || 21,
                languageCode: t.languageCode || "tr",
                value: t.name || "Unnamed Scene",
              })) || [
                { languageId: 21, languageCode: "tr", value: "Unnamed Scene" },
              ],
              descriptionTranslations: sceneData.translations?.map(
                (t: any) => ({
                  languageId: t.languageId || 21,
                  languageCode: t.languageCode || "tr",
                  value: t.description || "",
                })
              ) || [{ languageId: 21, languageCode: "tr", value: "" }],
              // Legacy fields for backward compatibility
              name: sceneData.translations?.[0]?.name || "Unnamed Scene",
              description: sceneData.translations?.[0]?.description || "",
              imageUrl: imageUrl,
              fileName:
                sceneData.image?.fileName || `scene_${sceneData.id}.jpg`,
              nightImageUrl: sceneData.nightImage?.url || "",
              nightFileName: sceneData.nightImage?.fileName || "",
              faceSize: sceneData.faceSize || 1500,
              initialView: sceneData.initialViewParameters
                ? {
                    yaw:
                      ((sceneData.initialViewParameters.yaw || 0) * Math.PI) /
                      180,
                    pitch:
                      ((sceneData.initialViewParameters.pitch || 0) * Math.PI) /
                      180,
                    fov:
                      ((sceneData.initialViewParameters.fov || 120.0) *
                        Math.PI) /
                      180,
                  }
                : { yaw: 0, pitch: 0, fov: (120 * Math.PI) / 180 },
              infoHotspots: infoHotspots,
              linkHotspots: linkHotspots,
              _scene: scene,
              _nightScene: nightScene,
              _view: view,
            };
          } catch (error) {
            return null;
          }
        })
      );

      return loadedScenes.filter((scene) => scene !== null);
    },
    [viewer]
  );

  const initializeFromApiData = useCallback(async (data: IVirtualTourData) => {
    try {
      if (data.translations && data.translations.length > 0) {
        const tourTranslations = data.translations.map((t: any) => ({
          languageId: t?.languageId,
          value: t?.name,
        }));
        tourManager.setTourNameTranslations(tourTranslations);
      }

      tourSettingsHook.setTourSettings({
        name: data.translations?.[0]?.name || "My Virtual Tour",
        initialSceneId: data.viewerSettings?.initialSceneId || null,
        autorotateEnabled: data.viewerSettings?.autorotateEnabled || false,
        fullscreenButton: data.viewerSettings?.fullscreenButton !== false,
        viewControlButtons: data.viewerSettings?.viewControlButtons !== false,
        mouseViewMode: parseInt(data.viewerSettings?.mouseViewMode || "1") || 1,
      });

      if (data.scenes && data.scenes.length > 0) {
        const loadedScenes = await processApiScenes(data.scenes);
        sceneManager.setScenes(loadedScenes);
      }

      tourManager.setTourModified(false);
      sceneManager.clearSceneChanges();
    } catch (error) {
      enqueueSnackbar(t("failedToLoadTour"), {
        variant: "error",
        autoHideDuration: 5000,
      });
    }
  }, []);

  useEffect(() => {
    if (apiData && virtualId) {
      initialSceneSetRef.current = false;
      initializeFromApiData(apiData);
    }
  }, [apiData, virtualId, initializeFromApiData]);

  const initialSceneSetRef = useRef<boolean>(false);

  useEffect(() => {
    if (
      sceneManager.scenes.length > 0 &&
      !sceneManager.currentSceneId &&
      !initialSceneSetRef.current
    ) {
      const targetSceneId =
        apiData?.viewerSettings?.initialSceneId || sceneManager.scenes[0].id;
      switchToScene(targetSceneId);
      initialSceneSetRef.current = true;
    }
  }, [sceneManager, apiData?.viewerSettings?.initialSceneId]);

  useEffect(() => {
    if (tourManager.currentTourId && sceneManager.scenes.length > 0) {
      tourManager.setTourModified(true);
    }
  }, [sceneManager.scenes, tourSettingsHook.tourSettings, tourManager]);

  const updateCameraInfo = useCallback(() => {
    if (sceneManager.currentSceneId && sceneManager.scenes.length > 0) {
      const currentScene = sceneManager.scenes.find(
        (s) => s.id === sceneManager.currentSceneId
      );
      if (currentScene && currentScene.initialView) {
        viewer.setCurrentCameraInfo({
          fov: ((currentScene.initialView.fov * 180) / Math.PI).toFixed(1),
          yaw: ((currentScene.initialView.yaw * 180) / Math.PI).toFixed(1),
          pitch: ((currentScene.initialView.pitch * 180) / Math.PI).toFixed(1),
          sceneName:
            currentScene.nameTranslations?.find((t) => t.languageId === 21)
              ?.value ||
            currentScene.name ||
            `Scene ${currentScene.id}`,
        });
      }
    }
  }, [sceneManager.currentSceneId, sceneManager.scenes, viewer]);

  useEffect(() => {
    updateCameraInfo();
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const isFirstScene = sceneManager.scenes.length === 0;

      await fileUpload.handleFileUpload(
        e,
        viewer.viewerRef,
        (newScenes, firstScene) => {
          sceneManager.addScenes(newScenes);

          if (isFirstScene && newScenes.length > 0) {
            setTimeout(() => {
              const scene = newScenes[0];
              viewer.switchToScene(scene);
              sceneManager.switchToScene(scene.id);
              // Update current scene in viewer for camera info
              if (viewer.updateCurrentScene) {
                viewer.updateCurrentScene(scene);
              }
            }, 500);
          }
        }
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [sceneManager, viewer, fileUpload]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      const isFirstScene = sceneManager.scenes.length === 0;

      await fileUpload.handleDrop(
        e,
        viewer.viewerRef,
        (newScenes, firstScene) => {
          sceneManager.addScenes(newScenes);

          if (isFirstScene && newScenes.length > 0) {
            setTimeout(() => {
              const scene = newScenes[0];
              viewer.switchToScene(scene);
              sceneManager.switchToScene(scene.id);
              // Update current scene in viewer for camera info
              if (viewer.updateCurrentScene) {
                viewer.updateCurrentScene(scene);
              }
            }, 500);
          }
        }
      );
    },
    [sceneManager, viewer, fileUpload]
  );

  const editScene = useCallback(
    (sceneId: string) => {
      const scene = sceneManager.scenes.find((s) => s.id === sceneId);
      if (scene) {
        const editingData = {
          id: scene.id,
          name:
            scene.nameTranslations?.find((t) => t.languageId === 21)?.value ||
            scene.name ||
            "",
          description:
            scene.descriptionTranslations?.find((t) => t.languageId === 21)
              ?.value ||
            scene.description ||
            "",
          yaw: scene.initialView?.yaw
            ? ((scene.initialView.yaw * 180) / Math.PI).toFixed(1)
            : "0",
          pitch: scene.initialView?.pitch
            ? ((scene.initialView.pitch * 180) / Math.PI).toFixed(1)
            : "0",
          fov: scene.initialView?.fov
            ? ((scene.initialView.fov * 180) / Math.PI).toFixed(1)
            : "90",
          faceSize: (scene.faceSize || 1500).toString(),
        };

        setEditingScene(editingData);
        setEditSceneDialog(true);
      }
    },
    [sceneManager.scenes, setEditSceneDialog]
  );

  const updateScene = useCallback(() => {
    if (!editingScene.name.trim()) {
      enqueueSnackbar(t("sceneNameRequired"), {
        variant: "warning",
        autoHideDuration: 5000,
      });
      return;
    }

    const yaw = parseFloat(editingScene.yaw) || 0;
    const pitch = parseFloat(editingScene.pitch) || 0;
    const fov = parseFloat(editingScene.fov) || 90;
    const faceSize = parseInt(String(editingScene.faceSize)) || 1500;

    if (fov < 10 || fov > 179) {
      enqueueSnackbar(t("fovRangeError"), {
        variant: "warning",
        autoHideDuration: 5000,
      });
      return;
    }

    if (pitch < -90 || pitch > 90) {
      enqueueSnackbar(t("pitchRangeError"), {
        variant: "warning",
        autoHideDuration: 5000,
      });
      return;
    }

    const updatedData = {
      id: editingScene.id,
      nameTranslations: [
        { languageId: 21, languageCode: "tr", value: editingScene.name },
      ],
      descriptionTranslations: [
        { languageId: 21, languageCode: "tr", value: editingScene.description },
      ],
      // Legacy fields for backward compatibility
      name: editingScene.name,
      description: editingScene.description,
      faceSize: faceSize,
      initialView: {
        yaw: (yaw * Math.PI) / 180,
        pitch: (pitch * Math.PI) / 180,
        fov: (fov * Math.PI) / 180,
      },
    };

    sceneManager.updateScene(updatedData, switchToScene);

    setEditSceneDialog(false);
    setEditingScene({
      id: "",
      name: "",
      description: "",
      yaw: "0",
      pitch: "0",
      fov: "90",
      faceSize: "1500",
    });

    enqueueSnackbar(t("sceneUpdated"), { variant: "success" });
  }, [editingScene, sceneManager]);

  const deleteScene = useCallback(
    (sceneId: string) => {
      sceneManager.deleteScene(
        sceneId,
        tourSettingsHook.tourSettings,
        tourSettingsHook.setTourSettings,
        switchToScene
      );
      enqueueSnackbar(t("sceneDeleted"), { variant: "success" });
    },
    [
      sceneManager,
      tourSettingsHook.tourSettings,
      tourSettingsHook.setTourSettings,
    ]
  );

  const handleAddHotspot = useCallback(
    (title?: string, content?: string) => {
      viewer.handleAddHotspot(
        sceneManager.currentSceneId,
        sceneManager.scenes,
        sceneManager.setScenes,
        sceneManager.trackSceneUpdated,
        title,
        content
      );
      setHotspotDialog(false);
    },
    [viewer, sceneManager, setHotspotDialog]
  );

  const handleCloseHotspotDialog = useCallback(() => {
    setHotspotDialog(false);
  }, [setHotspotDialog]);

  const handleDeleteHotspot = useCallback(
    (hotspotId: string, hotspotType: "info" | "link") => {
      viewer.handleDeleteHotspot(
        hotspotId,
        hotspotType,
        sceneManager.currentSceneId,
        sceneManager.scenes,
        sceneManager.setScenes,
        sceneManager.trackSceneUpdated
      );
    },
    [viewer, sceneManager]
  );

  const handleUpdateHotspot = useCallback(
    (
      hotspotId: string,
      hotspotType: "info" | "link",
      title: string,
      content?: string,
      targetScene?: string,
      yaw?: number,
      pitch?: number
    ) => {
      viewer.handleUpdateHotspot(
        hotspotId,
        hotspotType,
        sceneManager.currentSceneId,
        sceneManager.scenes,
        sceneManager.setScenes,
        sceneManager.trackSceneUpdated,
        title,
        content,
        targetScene,
        yaw,
        pitch
      );
    },
    [viewer, sceneManager]
  );

  const addNightImage = useCallback(
    async (sceneId: string, file: File) => {
      const scene = sceneManager.scenes.find((item) => item.id === sceneId);
      if (!scene || !viewer.viewerRef.current || !file.type.startsWith("image/")) return;

      const Marzipano = await import("marzipano");
      const imageUrl = URL.createObjectURL(file);
      const source = Marzipano.ImageUrlSource.fromString(imageUrl);
      const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
      const view = new Marzipano.RectilinearView(scene.initialView || { yaw: 0, pitch: 0, fov: Math.PI / 3 });
      const nightScene = viewer.viewerRef.current.createScene({ source, geometry, view });
      const updated = {
        ...scene,
        nightImageUrl: imageUrl,
        nightFileName: file.name,
        _nightScene: nightScene,
      };

      sceneManager.setScenes((prev) =>
        prev.map((item) => (item.id === sceneId ? updated : item))
      );
      sceneManager.trackSceneUpdated(sceneId, { nightImageUrl: imageUrl, nightFileName: file.name });
      setNightPreview(true);
      if (sceneManager.currentSceneId === sceneId) {
        viewer.switchToScene(updated, nightScene);
        if (viewer.updateCurrentScene) {
          viewer.updateCurrentScene(updated);
        }
      }
      enqueueSnackbar(t("nightImageReady") || "Night image added", { variant: "success" });
    },
    [sceneManager, viewer, enqueueSnackbar, t]
  );

  const saveTour = useCallback(async () => {
    await tourManager.saveTour(
      sceneManager.scenes,
      tourSettingsHook.tourSettings,
      sceneManager.sceneChanges,
      () => {
        sceneManager.clearSceneChanges();
      }
    );
  }, [tourManager, sceneManager, tourSettingsHook.tourSettings]);

  return {
    // State
    scenes: sceneManager.scenes,
    currentSceneId: sceneManager.currentSceneId,
    tourModified: sceneManager.tourModified,
    setTourModified: sceneManager.setTourModified,
    tourSettings: tourSettingsHook.tourSettings,
    setTourSettings: tourSettingsHook.setTourSettings,
    sceneChanges: sceneManager.sceneChanges,

    // Multi-language states
    tourNameTranslations: tourManager.tourNameTranslations,
    setTourNameTranslations: tourManager.setTourNameTranslations,

    // UI State
    drawerOpen,
    setDrawerOpen,
    editSceneDialog,
    setEditSceneDialog,
    hotspotDialog,
    setHotspotDialog,
    editingScene,
    setEditingScene,

    // Viewer state
    editMode: viewer.editMode,
    setEditMode: viewer.setEditMode,
    hotspotForm: viewer.hotspotForm,
    setHotspotForm: viewer.setHotspotForm,
    currentCameraInfo: viewer.currentCameraInfo,
    isDragOver: fileUpload.isDragOver,

    // Refs
    panoEl: viewer.panoEl,
    viewerRef: viewer.viewerRef,
    fileInputRef,

    // Actions
    handleFileUpload,
    handleDragOver: fileUpload.handleDragOver,
    handleDragLeave: fileUpload.handleDragLeave,
    handleDrop,
    switchToScene,
    nightPreview,
    setNightPreview,
    addNightImage,
    editScene,
    updateScene,
    deleteScene,
    handleAddHotspot,
    handleCloseHotspotDialog,
    handleDeleteHotspot,
    handleUpdateHotspot,
    saveTour,
    setScenes: sceneManager.setScenes,

    // Tracking functions for VirtualTourDrawer
    onTrackSceneUpdated: sceneManager.trackSceneUpdated,
  };
};
