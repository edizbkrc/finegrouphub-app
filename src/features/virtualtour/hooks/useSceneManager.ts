import { useState, useCallback, useEffect } from "react";
import { VirtualTourScene, SceneChanges, TourSettings } from "../types";

export const useSceneManager = () => {
  const [scenes, setScenes] = useState<VirtualTourScene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [sceneChanges, setSceneChanges] = useState<SceneChanges>({
    created: [],
    updated: [],
    deleted: [],
  });

  // Track when tour is modified
  const [tourModified, setTourModified] = useState<boolean>(false);

  useEffect(() => {
    if (
      sceneChanges.created.length > 0 ||
      sceneChanges.updated.length > 0 ||
      sceneChanges.deleted.length > 0
    ) {
      setTourModified(true);
    }
  }, [sceneChanges]);

  const trackSceneCreated = useCallback((scene: VirtualTourScene) => {
    setSceneChanges((prev) => ({
      ...prev,
      created: [...prev.created, scene],
    }));
  }, []);

  const trackSceneUpdated = useCallback(
    (sceneId: string, updatedData: Partial<VirtualTourScene>) => {
      setSceneChanges((prev) => {
        // Check if scene is in created list
        const isCreated = prev.created.some((s) => s.id === sceneId);

        if (isCreated) {
          const updatedCreated = prev.created.map((s) => {
            if (s.id === sceneId) {
              const updated = { ...s, ...updatedData };

              return updated;
            }
            return s;
          });
          return {
            ...prev,
            created: updatedCreated,
          };
        } else {
          // Add or update in updated list
          return {
            ...prev,
            updated: prev.updated.some((u) => u.id === sceneId)
              ? prev.updated.map((u) =>
                  u.id === sceneId ? { ...u, ...updatedData } : u
                )
              : [
                  ...prev.updated,
                  { id: sceneId, name: "", ...updatedData } as VirtualTourScene,
                ],
          };
        }
      });
    },
    []
  );

  const trackSceneDeleted = useCallback((scene: VirtualTourScene) => {
    setSceneChanges((prev) => {
      const wasJustCreated = prev.created.some((s) => s.id === scene.id);

      if (wasJustCreated) {
        return {
          ...prev,
          created: prev.created.filter((s) => s.id !== scene.id),
          updated: prev.updated.filter((s) => s.id !== scene.id),
        };
      } else {
        return {
          ...prev,
          deleted: [...prev.deleted, scene],
          updated: prev.updated.filter((s) => s.id !== scene.id),
        };
      }
    });
  }, []);

  const clearSceneChanges = useCallback(() => {
    setSceneChanges({
      created: [],
      updated: [],
      deleted: [],
    });
    setTourModified(false);
  }, []);

  const deleteScene = useCallback(
    (
      sceneId: string,
      tourSettings: TourSettings,
      setTourSettings: (settings: TourSettings) => void,
      onSceneSwitch?: (sceneId: string) => void
    ) => {
      const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
      if (sceneIndex === -1) return;

      const sceneToDelete = scenes[sceneIndex];
      const updatedScenes = scenes.filter((s) => s.id !== sceneId);

      trackSceneDeleted(sceneToDelete);
      setScenes(updatedScenes);

      // Update initial scene if needed
      if (tourSettings.initialSceneId === sceneId && updatedScenes.length > 0) {
        setTourSettings({
          ...tourSettings,
          initialSceneId: updatedScenes[0].id,
        });
      }

      // Switch to another scene if current scene is deleted
      if (currentSceneId === sceneId && updatedScenes.length > 0) {
        const newCurrentId =
          updatedScenes[sceneIndex > 0 ? sceneIndex - 1 : 0].id;
        setCurrentSceneId(newCurrentId);
        onSceneSwitch?.(newCurrentId);
      } else if (updatedScenes.length === 0) {
        setCurrentSceneId(null);
      }
    },
    [scenes, currentSceneId, trackSceneDeleted]
  );

  const updateScene = useCallback(
    (
      updatedData: Partial<VirtualTourScene> & { id: string },
      onSceneSwitch?: (sceneId: string) => void
    ) => {
      const oldScene = scenes.find((s) => s.id === updatedData.id);
      if (oldScene) {
        trackSceneUpdated(updatedData.id, updatedData);
      }

      setScenes((prevScenes) =>
        prevScenes.map((scene) => {
          if (scene.id === updatedData.id) {
            const updatedScene = { ...scene, ...updatedData };

            // Update view parameters if provided
            if (updatedData.initialView && scene._view) {
              try {
                scene._view.setParameters(updatedData.initialView);
              } catch (error) {}
            }

            return updatedScene;
          }
          return scene;
        })
      );

      // Re-render scene if it's currently active
      if (currentSceneId === updatedData.id) {
        setTimeout(() => {
          onSceneSwitch?.(updatedData.id);
        }, 100);
      }
    },
    [scenes, currentSceneId, trackSceneUpdated]
  );

  const addScene = useCallback(
    (scene: VirtualTourScene, isFirstScene = false) => {
      setScenes((prev) => [...prev, scene]);
      trackSceneCreated(scene);

      if (isFirstScene) {
        setCurrentSceneId(scene.id);
      }
    },
    [trackSceneCreated]
  );

  const addScenes = useCallback(
    (newScenes: VirtualTourScene[], switchToFirst = false) => {
      setScenes((prev) => [...prev, ...newScenes]);

      newScenes.forEach((scene) => trackSceneCreated(scene));

      if (switchToFirst && newScenes.length > 0) {
        setCurrentSceneId(newScenes[0].id);
      }
    },
    [trackSceneCreated]
  );

  const switchToScene = useCallback((sceneId: string) => {
    setCurrentSceneId(sceneId);
  }, []);

  const resetScenes = useCallback(() => {
    setScenes([]);
    setCurrentSceneId(null);
    clearSceneChanges();
  }, [clearSceneChanges]);

  return {
    // State
    scenes,
    setScenes,
    currentSceneId,
    setCurrentSceneId,
    sceneChanges,
    tourModified,
    setTourModified,

    // Actions
    addScene,
    addScenes,
    updateScene,
    deleteScene,
    switchToScene,
    resetScenes,
    trackSceneCreated,
    trackSceneUpdated,
    trackSceneDeleted,
    clearSceneChanges,
  };
};
