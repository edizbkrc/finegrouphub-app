import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";
import {
  VirtualTourScene,
  InfoHotspot,
  LinkHotspot,
  HotspotForm,
  CameraInfo,
} from "../types";

export const useMarzipanoViewer = (
  setHotspotDialog?: (open: boolean) => void,
  onHotspotContextMenu?: (
    e: MouseEvent,
    hotspotId: string,
    hotspotType: "info" | "link"
  ) => void
) => {
  const { enqueueSnackbar } = useSnackbar();
  const t = useTranslations("VirtualTourBuilder.messages");
  const panoEl = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any | null>(null);
  const switchToSceneRef = useRef<((sceneId: string) => void) | null>(null);
  const onHotspotMovedRef = useRef<
    ((hotspotId: string, hotspotType: "info" | "link", yaw: number, pitch: number) => void) | null
  >(null);
  const onHotspotEditRef = useRef<
    ((hotspotId: string, hotspotType: "info" | "link") => void) | null
  >(null);
  const [currentCameraInfo, setCurrentCameraInfo] = useState<CameraInfo | null>(
    null
  );
  const [currentScene, setCurrentScene] = useState<VirtualTourScene | null>(
    null
  );
  const [editMode, setEditMode] = useState<"none" | "info" | "link">("none");
  const [hotspotForm, setHotspotForm] = useState<HotspotForm>({
    type: "info",
    title: "",
    content: "",
    targetScene: "",
    position: null,
  });

  // Initialize Marzipano viewer
  useEffect(() => {
    if (!panoEl.current) return;

    const initializeViewer = async () => {
      try {
        const Marzipano = await import("marzipano");
        if (panoEl.current) {
          viewerRef.current = new Marzipano.Viewer(panoEl.current);
        }
      } catch (error) {
        enqueueSnackbar(t("viewerInitFailed"), {
          variant: "error",
          autoHideDuration: 5000,
        });
      }
    };

    initializeViewer();
  }, [enqueueSnackbar, t]);

  const readYawPitch = useCallback((clientX: number, clientY: number) => {
    if (!panoEl.current || !viewerRef.current) return null;
    const rect = panoEl.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    try {
      const view = viewerRef.current.view();
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
      return { yaw, pitch };
    } catch {
      return null;
    }
  }, []);

  // Sürükle: konumu değiştir. Tıkla (az hareket): hotspot ayarını aç.
  const bindHotspotInteraction = useCallback(
    (
      element: HTMLDivElement,
      mzHotspot: { setPosition?: (position: { yaw: number; pitch: number }) => void },
      hotspotId: string,
      hotspotType: "info" | "link"
    ) => {
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startY = 0;

      element.onpointerdown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        element.setPointerCapture(e.pointerId);
      };
      element.onpointermove = (e) => {
        if (!dragging) return;
        e.preventDefault();
        e.stopPropagation();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!moved && dx * dx + dy * dy < 36) return;
        moved = true;
        element.classList.add("hotspot-dragging");
        const coords = readYawPitch(e.clientX, e.clientY);
        if (coords) mzHotspot.setPosition?.(coords);
      };
      const endDrag = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        element.classList.remove("hotspot-dragging");
        if (moved) {
          const coords = readYawPitch(e.clientX, e.clientY);
          if (coords) onHotspotMovedRef.current?.(hotspotId, hotspotType, coords.yaw, coords.pitch);
        } else {
          onHotspotEditRef.current?.(hotspotId, hotspotType);
        }
      };
      element.onpointerup = endDrag;
      element.onpointercancel = endDrag;
    },
    [readYawPitch]
  );

  const recreateHotspotsForScene = useCallback(
    async (
      scene: VirtualTourScene,
      onHotspotContextMenu?: (
        e: MouseEvent,
        hotspotId: string,
        hotspotType: "info" | "link"
      ) => void
    ) => {
      const paint = (mzScene: any) => {
        const hotspotContainer = mzScene?.hotspotContainer?.();
        if (!hotspotContainer) return;

        if (typeof hotspotContainer.destroyAllHotspots === "function") {
          hotspotContainer.destroyAllHotspots();
        }

        scene.infoHotspots?.forEach((hotspot) => {
          const element = document.createElement("div");
          element.className = "hotspot info-hotspot";
          element.setAttribute("data-hotspot-id", hotspot.id);
          element.setAttribute("data-hotspot-type", "info");
          element.innerHTML = `
          <div class="hotspot-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <div class="hotspot-tooltip">${hotspot.title}</div>
        `;

          let tooltipTimeout: NodeJS.Timeout;
          element.onmouseenter = () => {
            clearTimeout(tooltipTimeout);
            const tooltip = element.querySelector(
              ".hotspot-tooltip"
            ) as HTMLElement;
            if (tooltip) {
              tooltip.innerHTML = `<strong>${hotspot.title}</strong><br/>${
                hotspot.content || ""
              }`;
              tooltip.style.display = "block";
            }
          };

          element.onmouseleave = () => {
            tooltipTimeout = setTimeout(() => {
              const tooltip = element.querySelector(
                ".hotspot-tooltip"
              ) as HTMLElement;
              if (tooltip) {
                tooltip.innerHTML = hotspot.title;
                tooltip.style.display = "none";
              }
            }, 300);
          };

          element.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onHotspotContextMenu) {
              onHotspotContextMenu(e, hotspot.id, "info");
            }
          };

          element.onmousedown = (e) => {
            e.stopPropagation();
          };

          const mzHotspot = hotspotContainer.createHotspot(element, {
            yaw: hotspot.yaw,
            pitch: hotspot.pitch,
          }) as unknown as { setPosition?: (position: { yaw: number; pitch: number }) => void };
          bindHotspotInteraction(element, mzHotspot, hotspot.id, "info");
        });

        scene.linkHotspots?.forEach((hotspot) => {
          const element = document.createElement("div");
          element.className = "hotspot link-hotspot";
          element.setAttribute("data-hotspot-id", hotspot.id);
          element.setAttribute("data-hotspot-type", "link");
          element.innerHTML = `
          <div class="hotspot-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </div>
          <div class="hotspot-label">${hotspot.title || "Go to scene"}</div>
        `;

          element.onmousedown = (e) => {
            e.stopPropagation();
          };

          element.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onHotspotContextMenu) {
              onHotspotContextMenu(e, hotspot.id, "link");
            }
          };

          const mzHotspot = hotspotContainer.createHotspot(element, {
            yaw: hotspot.yaw,
            pitch: hotspot.pitch,
          }) as unknown as { setPosition?: (position: { yaw: number; pitch: number }) => void };
          bindHotspotInteraction(element, mzHotspot, hotspot.id, "link");
        });
      };

      try {
        if (scene._scene) paint(scene._scene);
        if (scene._nightScene && scene._nightScene !== scene._scene) {
          paint(scene._nightScene);
        }
      } catch (error) {}
    },
    [bindHotspotInteraction]
  );

  const updateCameraInfoWithScene = useCallback((scene: VirtualTourScene) => {
    if (scene?._view) {
      const view = scene._view;
      const fov = view.fov();
      const fovDegrees = ((fov * 180) / Math.PI).toFixed(1);
      const yaw = view.yaw();
      const pitch = view.pitch();

      setCurrentCameraInfo({
        fov: fovDegrees,
        yaw: ((yaw * 180) / Math.PI).toFixed(1),
        pitch: ((pitch * 180) / Math.PI).toFixed(1),
        sceneName:
          scene.nameTranslations?.find((t) => t.languageId === 21)?.value ||
          scene.name ||
          `Scene ${scene.id}`,
      });
    }
  }, []);

  const switchToScene = useCallback(
    (scene: VirtualTourScene, visibleMzScene?: any) => {
      const target = visibleMzScene || scene._scene;
      if (scene && target && viewerRef.current) {
        viewerRef.current.switchScene(target);

        if (scene._view) {
          scene._view.setFov(Math.PI / 3);
        }

        recreateHotspotsForScene(scene, onHotspotContextMenu);

        // Set current scene and update camera info after switching scene
        setCurrentScene(scene);
        setTimeout(() => updateCameraInfoWithScene(scene), 100);
      }
    },
    [recreateHotspotsForScene, updateCameraInfoWithScene, onHotspotContextMenu]
  );

  const handleAddHotspot = useCallback(
    (
      currentSceneId: string | null,
      scenes: VirtualTourScene[],
      onScenesUpdate: (scenes: VirtualTourScene[]) => void,
      onTrackSceneUpdated?: (
        sceneId: string,
        updatedData: Partial<VirtualTourScene>
      ) => void,
      title?: string,
      content?: string
    ) => {
      if (!hotspotForm.position) {
        enqueueSnackbar(t("clickToPlaceHotspot"), {
          variant: "warning",
          autoHideDuration: 5000,
        });
        return;
      }

      const hotspotTitle = title || hotspotForm.title;
      if (!hotspotTitle.trim()) {
        enqueueSnackbar(t("hotspotTitleRequired"), {
          variant: "warning",
          autoHideDuration: 5000,
        });
        return;
      }

      if (hotspotForm.type === "link" && !hotspotForm.targetScene) {
        enqueueSnackbar(t("selectTargetSceneRequired"), {
          variant: "warning",
          autoHideDuration: 5000,
        });
        return;
      }

      if (hotspotForm.type === "info") {
        const newHotspot: InfoHotspot = {
          id: uuidv4(),
          title: hotspotTitle,
          content: content || hotspotForm.content || "",
          yaw: hotspotForm.position.yaw,
          pitch: hotspotForm.position.pitch,
        };

        let currentSceneUpdated: VirtualTourScene | null = null;

        const updatedScenes = scenes.map((scene) => {
          if (scene.id === currentSceneId) {
            const updatedScene = {
              ...scene,
              infoHotspots: [...(scene.infoHotspots || []), newHotspot],
            };

            currentSceneUpdated = updatedScene;

            if (onTrackSceneUpdated) {
              onTrackSceneUpdated(scene.id, {
                infoHotspots: updatedScene.infoHotspots,
                linkHotspots: updatedScene.linkHotspots,
              });
            }

            return updatedScene;
          }
          return scene;
        });

        onScenesUpdate(updatedScenes);

        if (currentSceneUpdated) {
          recreateHotspotsForScene(currentSceneUpdated, onHotspotContextMenu);
        }
      } else if (hotspotForm.type === "link") {
        const newHotspot: LinkHotspot = {
          id: uuidv4(),
          title: hotspotTitle,
          targetScene: hotspotForm.targetScene || "",
          yaw: hotspotForm.position.yaw,
          pitch: hotspotForm.position.pitch,
        };

        let currentSceneUpdated: VirtualTourScene | null = null;

        const updatedScenes = scenes.map((scene) => {
          if (scene.id === currentSceneId) {
            const updatedScene = {
              ...scene,
              linkHotspots: [...(scene.linkHotspots || []), newHotspot],
            };

            currentSceneUpdated = updatedScene;

            // Track scene update for API synchronization
            if (onTrackSceneUpdated) {
              onTrackSceneUpdated(scene.id, {
                infoHotspots: updatedScene.infoHotspots,
                linkHotspots: updatedScene.linkHotspots,
              });
            }

            return updatedScene;
          }
          return scene;
        });

        onScenesUpdate(updatedScenes);

        // Recreate hotspots immediately with the updated scene
        if (currentSceneUpdated) {
          recreateHotspotsForScene(currentSceneUpdated, onHotspotContextMenu);
        }
      }

      setHotspotForm({
        type: "info",
        title: "",
        content: "",
        targetScene: "",
        position: null,
      });

      // Hotspot başarıyla eklendikten sonra editMode'u sıfırla
      setEditMode("none");

      enqueueSnackbar(t("hotspotAdded"), { variant: "success" });
    },
    [
      hotspotForm,
      recreateHotspotsForScene,
      enqueueSnackbar,
      t,
      onHotspotContextMenu,
    ]
  );

  // Handle panorama clicks for hotspot placement
  useEffect(() => {
    if (!panoEl.current || !viewerRef.current) return;

    const handleClick = (e: MouseEvent) => {
      if (editMode === "none") return;

      const target =
        e.target && (e.target as Element).closest
          ? (e.target as Element).closest(".hotspot")
          : null;
      if (target) return;

      e.preventDefault();
      e.stopPropagation();

      if (!panoEl.current || !viewerRef.current) return;

      const rect = panoEl.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      try {
        const view = viewerRef.current.view();
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

        setHotspotForm({
          type: editMode,
          title: "",
          content: editMode === "info" ? "" : undefined,
          targetScene: editMode === "link" ? "" : undefined,
          position: { yaw, pitch },
        });

        setHotspotDialog?.(true);
      } catch (error) {
        enqueueSnackbar(
          t("errorPlacingHotspot") +
            ": " +
            (error instanceof Error ? error.message : "Unknown error"),
          { variant: "error", autoHideDuration: 5000 }
        );
      }
    };

    const panoElement = panoEl.current;
    if (panoElement) {
      panoElement.addEventListener("click", handleClick, true);
    }

    return () => {
      if (panoElement) {
        panoElement.removeEventListener("click", handleClick, true);
      }
    };
  }, [editMode, setHotspotDialog, enqueueSnackbar, t]);

  // Update camera info
  useEffect(() => {
    if (!panoEl.current || !viewerRef.current) return;

    const handleViewChange = () => {
      if (currentScene) {
        setTimeout(() => updateCameraInfoWithScene(currentScene), 50);
      }
    };

    const panoElement = panoEl.current;
    if (panoElement) {
      // Listen to multiple events that can change the view
      panoElement.addEventListener("wheel", handleViewChange);
      panoElement.addEventListener("mouseup", handleViewChange);
      panoElement.addEventListener("touchend", handleViewChange);
    }

    return () => {
      if (panoElement) {
        panoElement.removeEventListener("wheel", handleViewChange);
        panoElement.removeEventListener("mouseup", handleViewChange);
        panoElement.removeEventListener("touchend", handleViewChange);
      }
    };
  }, [currentScene, updateCameraInfoWithScene]);

  const handleDeleteHotspot = useCallback(
    (
      hotspotId: string,
      hotspotType: "info" | "link",
      currentSceneId: string | null,
      scenes: VirtualTourScene[],
      onScenesUpdate: (scenes: VirtualTourScene[]) => void,
      onTrackSceneUpdated?: (
        sceneId: string,
        updatedData: Partial<VirtualTourScene>
      ) => void
    ) => {
      let currentSceneUpdated: VirtualTourScene | null = null;

      const updatedScenes = scenes.map((scene) => {
        if (scene.id === currentSceneId) {
          let updatedScene;

          if (hotspotType === "info") {
            updatedScene = {
              ...scene,
              infoHotspots: (scene.infoHotspots || []).filter(
                (h) => h.id !== hotspotId
              ),
            };
          } else {
            updatedScene = {
              ...scene,
              linkHotspots: (scene.linkHotspots || []).filter(
                (h) => h.id !== hotspotId
              ),
            };
          }

          currentSceneUpdated = updatedScene;

          if (onTrackSceneUpdated) {
            onTrackSceneUpdated(scene.id, {
              infoHotspots: updatedScene.infoHotspots,
              linkHotspots: updatedScene.linkHotspots,
            });
          }

          return updatedScene;
        }
        return scene;
      });

      onScenesUpdate(updatedScenes);

      if (currentSceneUpdated) {
        recreateHotspotsForScene(currentSceneUpdated, onHotspotContextMenu);
      }

      enqueueSnackbar(t("hotspotDeleted"), { variant: "success" });
    },
    [recreateHotspotsForScene, enqueueSnackbar, t, onHotspotContextMenu]
  );

  const handleUpdateHotspot = useCallback(
    (
      hotspotId: string,
      hotspotType: "info" | "link",
      currentSceneId: string | null,
      scenes: VirtualTourScene[],
      onScenesUpdate: (scenes: VirtualTourScene[]) => void,
      onTrackSceneUpdated?: (
        sceneId: string,
        updatedData: Partial<VirtualTourScene>
      ) => void,
      title?: string,
      content?: string,
      targetScene?: string,
      yaw?: number,
      pitch?: number,
      silent?: boolean
    ) => {
      let currentSceneUpdated: VirtualTourScene | null = null;

      const updatedScenes = scenes.map((scene) => {
        if (scene.id === currentSceneId) {
          let updatedScene;

          if (hotspotType === "info") {
            updatedScene = {
              ...scene,
              infoHotspots: (scene.infoHotspots || []).map((h) =>
                h.id === hotspotId
                  ? {
                      ...h,
                      title: title || h.title,
                      content: content !== undefined ? content : h.content,
                      yaw: yaw !== undefined ? yaw : h.yaw,
                      pitch: pitch !== undefined ? pitch : h.pitch,
                    }
                  : h
              ),
            };
          } else {
            updatedScene = {
              ...scene,
              linkHotspots: (scene.linkHotspots || []).map((h) =>
                h.id === hotspotId
                  ? {
                      ...h,
                      title: title || h.title,
                      targetScene: targetScene || h.targetScene,
                      yaw: yaw !== undefined ? yaw : h.yaw,
                      pitch: pitch !== undefined ? pitch : h.pitch,
                    }
                  : h
              ),
            };
          }

          currentSceneUpdated = updatedScene;

          // Track scene update for API synchronization
          if (onTrackSceneUpdated) {
            onTrackSceneUpdated(scene.id, {
              infoHotspots: updatedScene.infoHotspots,
              linkHotspots: updatedScene.linkHotspots,
            });
          }

          return updatedScene;
        }
        return scene;
      });

      onScenesUpdate(updatedScenes);

      if (currentSceneUpdated) {
        recreateHotspotsForScene(currentSceneUpdated, onHotspotContextMenu);
      }

      if (!silent) enqueueSnackbar(t("hotspotUpdated"), { variant: "success" });
    },
    [recreateHotspotsForScene, enqueueSnackbar, t, onHotspotContextMenu]
  );

  // Function to set the switchToScene callback from parent
  const setSwitchToSceneCallback = useCallback(
    (callback: (sceneId: string) => void) => {
      switchToSceneRef.current = callback;
    },
    []
  );

  const setHotspotMovedHandler = useCallback(
    (
      callback: (hotspotId: string, hotspotType: "info" | "link", yaw: number, pitch: number) => void
    ) => {
      onHotspotMovedRef.current = callback;
    },
    []
  );

  const setHotspotEditHandler = useCallback(
    (callback: (hotspotId: string, hotspotType: "info" | "link") => void) => {
      onHotspotEditRef.current = callback;
    },
    []
  );

  // Function to update current scene from outside the hook
  const updateCurrentScene = useCallback(
    (scene: VirtualTourScene) => {
      setCurrentScene(scene);
      setTimeout(() => updateCameraInfoWithScene(scene), 100);
    },
    [updateCameraInfoWithScene]
  );

  return {
    // Refs
    panoEl,
    viewerRef,

    // State
    currentCameraInfo,
    setCurrentCameraInfo,
    editMode,
    setEditMode,
    hotspotForm,
    setHotspotForm,

    // Actions
    switchToScene,
    recreateHotspotsForScene,
    handleAddHotspot,
    handleDeleteHotspot,
    handleUpdateHotspot,
    setSwitchToSceneCallback,
    setHotspotMovedHandler,
    setHotspotEditHandler,
    updateCurrentScene,
  };
};
