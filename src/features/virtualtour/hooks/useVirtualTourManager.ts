import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { setGeneralLoading } from "@redux/appSlice";
import {
  VirtualTour,
  TourSettings,
  SceneChanges,
  VirtualTourScene,
  VirtualTourTranslation,
} from "../types";
import { HotspotTypeEnum } from "../types/HotspotTypeEnum";

export const useVirtualTourManager = (
  projectId?: any,
  entityId?: any,
  entityType?: any,
  virtualId?: any
) => {
  const currentTourId = virtualId;
  const { enqueueSnackbar } = useSnackbar();
  const t = useTranslations("VirtualTourBuilder.messages");
  const dispatch = useDispatch();
  const [tourModified, setTourModified] = useState<boolean>(false);
  const [availableTours, setAvailableTours] = useState<VirtualTour[]>([]);
  const [loadingTours, setLoadingTours] = useState<boolean>(false);

  const [tourNameTranslations, setTourNameTranslations] = useState<
    VirtualTourTranslation[]
  >([{ languageId: 21, value: "" }]);

  const handleImageUploads = useCallback(
    async (imageUploadsNeeded: any[], uploadInfos: any[]) => {
      for (let i = 0; i < imageUploadsNeeded.length; i++) {
        const upload = imageUploadsNeeded[i];
        const uploadInfo = uploadInfos[i];

        if (uploadInfo?.preSignedUrl) {
          // Sanal tur panoraması sıkıştırılmaz; orijinal dosya S3'e gider.
          const body = upload.blob;

          const response = await fetch(uploadInfo.preSignedUrl, {
            method: "PUT",
            body,
            headers: {
              "Cache-Control": "public, max-age=86400",
            },
          });

          if (!response.ok) {
            throw new Error(
              `Upload failed: ${response.status} ${response.statusText}`
            );
          }
        }
      }
    },
    []
  );

  const updateExistingTour = useCallback(
    async (tourId: string, tourSettings: TourSettings) => {
      const tourData = {
        id: tourId,
        projectId,
        entityId,
        entityType,
        translations: {
          value: tourNameTranslations.map((translation) => ({
            languageId: translation.languageId,
            name: translation.value,
          })),
          isUpdated: true,
        },
        viewerSettings: {
          value: {
            mouseViewMode: tourSettings.mouseViewMode || 1,
            autorotateEnabled: tourSettings.autorotateEnabled || false,
            fullscreenButton: tourSettings.fullscreenButton !== false,
            viewControlButtons: tourSettings.viewControlButtons !== false,
            initialSceneId: tourSettings.initialSceneId,
          },
          isUpdated: true,
        },
      };

      await axiosInstance({
        method: "PUT",
        url: ApiRoutes.VirtualTourDetail,
        data: tourData,
      });
    },
    [tourNameTranslations]
  );

  const deleteScenes = useCallback(
    async (tourId: string, deletedScenes: VirtualTourScene[]) => {
      const sceneIds = deletedScenes.map((scene) => scene.id);
      await axiosInstance({
        method: "DELETE",
        url: ApiRoutes.VirtualTourScenes,
        data: {
          virtualTourId: tourId,
          projectId,
          entityId,
          entityType,
          sceneIds: sceneIds,
        },
      });
    },
    []
  );

  const createScenes = useCallback(
    async (
      tourId: string,
      createdScenes: VirtualTourScene[],
      allScenes: VirtualTourScene[]
    ) => {
      const scenesData = [];
      const imageUploadsNeeded = [];

      for (const createdScene of createdScenes) {
        // Get the latest version of the scene from allScenes
        const scene =
          allScenes.find((s) => s.id === createdScene.id) || createdScene;

        const sceneDto = {
          id: scene.id,
          translations: scene.nameTranslations.map((translation) => ({
            languageId: translation.languageId,
            name: translation.value,
            description:
              scene.descriptionTranslations?.find(
                (desc) => desc.languageId === translation.languageId
              )?.value || "",
          })),
          faceSize: scene.faceSize || 1500,
          initialViewParameters: {
            yaw: ((scene.initialView?.yaw || 0) * 180) / Math.PI,
            pitch: ((scene.initialView?.pitch || 0) * 180) / Math.PI,
            fov: scene.initialView?.fov
              ? (scene.initialView.fov * 180) / Math.PI
              : 90.0,
          },
          hotspots: [
            ...(scene.infoHotspots?.map((hotspot) => ({
              id: hotspot.id,
              type: HotspotTypeEnum.Info,
              yaw: hotspot.yaw,
              pitch: hotspot.pitch,
              rotation: null,
              translations: [
                {
                  languageId: 21,
                  title: hotspot.title || "",
                  content: hotspot.content || "",
                  text: hotspot.content || "",
                },
              ],
            })) || []),
            ...(scene.linkHotspots?.map((hotspot) => ({
              id: hotspot.id,
              type: HotspotTypeEnum.Link,
              yaw: hotspot.yaw,
              pitch: hotspot.pitch,
              rotation: null,
              targetScene: hotspot.targetScene,
              translations: [
                {
                  languageId: 21,
                  title: hotspot.title || "Link",
                  content: "",
                  text: "",
                },
              ],
            })) || []),
          ],
        };

        if (scene.imageUrl && scene.imageUrl.startsWith("blob:")) {
          const response = await fetch(scene.imageUrl);
          const blob = await response.blob();

          //@ts-ignore
          sceneDto.image = {
            id: null,
            fileName: scene.fileName || `scene_${scene.id}.jpg`,
            fileExtension: "jpg",
            altText:
              scene.nameTranslations?.find((t) => t.languageId === 21)?.value ||
              `Scene ${scene.id}`,
            order: 1,
          };

          imageUploadsNeeded.push({
            sceneId: scene.id,
            blob: blob,
          });
        }

        if (scene.nightImageUrl && scene.nightImageUrl.startsWith("blob:")) {
          const response = await fetch(scene.nightImageUrl);
          const blob = await response.blob();
          //@ts-ignore
          sceneDto.nightImage = {
            fileName: scene.nightFileName || `scene_${scene.id}_night.jpg`,
            fileExtension: "jpg",
            altText: "night",
            order: 2,
            fileChanged: true,
          };
          imageUploadsNeeded.push({ sceneId: scene.id, blob });
        }

        scenesData.push(sceneDto);
      }

      const createResult = await axiosInstance({
        method: "POST",
        url: ApiRoutes.VirtualTourScenes,
        data: {
          projectId,
          entityId,
          entityType,
          virtualTourId: tourId,
          scenes: scenesData,
        },
      });

      if (
        imageUploadsNeeded.length > 0 &&
        createResult.data.data?.uploadInfos
      ) {
        await handleImageUploads(
          imageUploadsNeeded,
          createResult.data.data.uploadInfos
        );
      }
    },
    [projectId, entityId, entityType, handleImageUploads]
  );

  const updateScenes = useCallback(
    async (
      tourId: string,
      updatedScenes: VirtualTourScene[],
      allScenes: VirtualTourScene[]
    ) => {
      const scenesData = [];
      const imageUploadsNeeded = [];

      for (const updatedData of updatedScenes) {
        const scene = allScenes.find((s) => s.id === updatedData.id);
        if (!scene) {
          continue;
        }

        const sceneDto: any = {
          id: scene.id,
        };

        // Only include translations if they exist in the scene
        if (scene.nameTranslations && scene.nameTranslations.length > 0) {
          sceneDto.translations = {
            value: scene.nameTranslations.map((translation) => ({
              languageId: translation.languageId,
              name: translation.value,
              description:
                scene.descriptionTranslations?.find(
                  (desc) => desc.languageId === translation.languageId
                )?.value || "",
            })),
            isUpdated: true,
          };
        }

        // Only include faceSize if it exists
        if (scene.faceSize) {
          sceneDto.faceSize = {
            value: scene.faceSize,
            isUpdated: true,
          };
        }

        // Only include initialViewParameters if they exist
        if (scene.initialView) {
          sceneDto.initialViewParameters = {
            value: {
              yaw: ((scene.initialView.yaw || 0) * 180) / Math.PI,
              pitch: ((scene.initialView.pitch || 0) * 180) / Math.PI,
              fov: scene.initialView.fov
                ? (scene.initialView.fov * 180) / Math.PI
                : 90.0,
            },
            isUpdated: true,
          };
        }

        // Always include hotspots to ensure they're synchronized
        sceneDto.hotspots = {
          value: [
            ...(scene.infoHotspots?.map((hotspot) => ({
              id: hotspot.id,
              type: HotspotTypeEnum.Info,
              yaw: hotspot.yaw,
              pitch: hotspot.pitch,
              translations: [
                {
                  languageId: 21,
                  title: hotspot.title || "",
                  content: hotspot.content || "",
                  text: hotspot.content || "",
                },
              ],
            })) || []),
            ...(scene.linkHotspots?.map((hotspot) => ({
              id: hotspot.id,
              type: HotspotTypeEnum.Link,
              yaw: hotspot.yaw,
              pitch: hotspot.pitch,
              targetScene: hotspot.targetScene,
              translations: [
                {
                  languageId: 21,
                  title: hotspot.title || "Link",
                  content: "",
                  text: "",
                },
              ],
            })) || []),
          ],
          isUpdated: true,
        };

        if (scene.imageUrl && scene.imageUrl.startsWith("blob:")) {
          const response = await fetch(scene.imageUrl);
          const blob = await response.blob();

          sceneDto.image = {
            value: {
              fileName: scene.fileName || `scene_${scene.id}.jpg`,
              fileExtension: "jpg",
              altText:
                scene.nameTranslations?.find((t) => t.languageId === 21)
                  ?.value || `Scene ${scene.id}`,
              order: 0,
              fileChanged: true,
            },
            isUpdated: true,
          };

          imageUploadsNeeded.push({
            sceneId: scene.id,
            blob: blob,
          });
        }

        if (scene.nightImageUrl && scene.nightImageUrl.startsWith("blob:")) {
          const response = await fetch(scene.nightImageUrl);
          const blob = await response.blob();
          sceneDto.nightImage = {
            value: {
              fileName: scene.nightFileName || `scene_${scene.id}_night.jpg`,
              fileExtension: "jpg",
              altText: "night",
              order: 2,
              fileChanged: true,
            },
            isUpdated: true,
          };
          imageUploadsNeeded.push({ sceneId: scene.id, blob });
        }

        scenesData.push(sceneDto);
      }

      const updateResult = await axiosInstance({
        method: "PUT",
        url: ApiRoutes.VirtualTourScenes,
        data: {
          projectId,
          entityId,
          entityType,
          virtualTourId: tourId,
          scenes: scenesData,
        },
      });

      if (
        imageUploadsNeeded.length > 0 &&
        updateResult.data.data?.uploadInfos
      ) {
        await handleImageUploads(
          imageUploadsNeeded,
          updateResult.data.data.uploadInfos
        );
      }
    },
    [projectId, entityId, entityType, handleImageUploads]
  );

  const saveTour = useCallback(
    async (
      scenes: VirtualTourScene[],
      tourSettings: TourSettings,
      sceneChanges: SceneChanges,
      onSuccess?: () => void
    ) => {
      try {
        dispatch(setGeneralLoading(true));
        let finalTourId = currentTourId;

        if (!currentTourId) {
          // Create new tour
          const scenesData = [];
          const imageUploadsNeeded = [];
          for (const scene of scenes) {
            const sceneDto = {
              id: scene.id,
              translations: scene.nameTranslations.map((translation) => ({
                languageId: translation.languageId,
                name: translation.value,
                description:
                  scene.descriptionTranslations.find(
                    (desc) => desc.languageId === translation.languageId
                  )?.value || "",
              })),
              faceSize: scene.faceSize || 1500,
              initialViewParameters: {
                yaw: ((scene.initialView?.yaw || 0) * 180) / Math.PI,
                pitch: ((scene.initialView?.pitch || 0) * 180) / Math.PI,
                fov: scene.initialView?.fov
                  ? (scene.initialView.fov * 180) / Math.PI
                  : 90.0,
              },
              hotspots: [
                ...(scene.infoHotspots?.map((hotspot) => ({
                  id: hotspot.id,
                  type: HotspotTypeEnum.Info,
                  yaw: hotspot.yaw,
                  pitch: hotspot.pitch,
                  rotation: null,
                  translations: [
                    {
                      title: hotspot.title || "",
                      content: hotspot.content || "",
                      text: hotspot.content || "",
                      languageId: 21,
                    },
                  ],
                })) || []),
                ...(scene.linkHotspots?.map((hotspot) => ({
                  id: hotspot.id,
                  type: HotspotTypeEnum.Link,
                  yaw: hotspot.yaw,
                  pitch: hotspot.pitch,
                  rotation: null,
                  targetScene: hotspot.targetScene,
                  translations: [
                    {
                      title: hotspot.title || "Link",
                      content: "",
                      text: "",
                      languageId: 21,
                    },
                  ],
                })) || []),
              ],
            };

            if (scene.imageUrl && scene.imageUrl.startsWith("blob:")) {
              const response = await fetch(scene.imageUrl);
              const blob = await response.blob();

              //@ts-ignore
              sceneDto.image = {
                fileName: scene.fileName || `scene_${scene.id}.jpg`,
                fileExtension: "jpg",
                altText:
                  scene.nameTranslations.find((t) => t.languageId === 21)
                    ?.value || `Scene ${scene.id}`,
                order: 1,
              };

              imageUploadsNeeded.push({
                sceneId: scene.id,
                blob: blob,
              });
            }

            if (scene.nightImageUrl && scene.nightImageUrl.startsWith("blob:")) {
              const response = await fetch(scene.nightImageUrl);
              const blob = await response.blob();
              //@ts-ignore
              sceneDto.nightImage = {
                fileName: scene.nightFileName || `scene_${scene.id}_night.jpg`,
                fileExtension: "jpg",
                altText: "night",
                order: 2,
                fileChanged: true,
              };
              imageUploadsNeeded.push({ sceneId: scene.id, blob });
            }

            scenesData.push(sceneDto);
          }

          const tourData = {
            translations: tourNameTranslations.map((translation) => ({
              languageId: translation.languageId,
              name: translation.value,
            })),
            scenes: scenesData,
            viewerSettings: {
              mouseViewMode: tourSettings.mouseViewMode || 1,
              autorotateEnabled: tourSettings.autorotateEnabled || false,
              fullscreenButton: tourSettings.fullscreenButton !== false,
              viewControlButtons: tourSettings.viewControlButtons !== false,
              initialSceneId: tourSettings.initialSceneId,
            },
            projectId,
            entityId,
            entityType,
          };

          const createResult = await axiosInstance({
            method: "POST",
            url: ApiRoutes.VirtualTourDetail,
            data: tourData,
          });

          if (createResult?.data?.isSuccess) {
            finalTourId = createResult?.data?.data?.id;
            if (
              imageUploadsNeeded.length > 0 &&
              createResult.data.data?.uploadInfos
            ) {
              await handleImageUploads(
                imageUploadsNeeded,
                createResult.data.data.uploadInfos
              );
            }
          }
        } else {
          finalTourId = currentTourId;

          if (tourModified) {
            await updateExistingTour(finalTourId, tourSettings);
          }

          if (sceneChanges.deleted.length > 0) {
            await deleteScenes(finalTourId, sceneChanges.deleted);
          }

          if (sceneChanges.created.length > 0) {
            await createScenes(finalTourId, sceneChanges.created, scenes);
          }

          if (sceneChanges.updated.length > 0) {
            await updateScenes(finalTourId, sceneChanges.updated, scenes);
          }
        }

        setTourModified(false);
        onSuccess?.();
        dispatch(setGeneralLoading(false));
      } catch (error) {
        dispatch(setGeneralLoading(false));
        enqueueSnackbar(
          t("failedToSaveTour") +
            ": " +
            (error instanceof Error ? error.message : "Unknown error"),
          { variant: "error", autoHideDuration: 5000 }
        );
      }
    },
    [
      currentTourId,
      tourModified,
      tourNameTranslations,
      projectId,
      entityId,
      entityType,
      dispatch,
      enqueueSnackbar,
      t,
      handleImageUploads,
      updateExistingTour,
      deleteScenes,
      createScenes,
      updateScenes,
    ]
  );

  const fetchAvailableTours = useCallback(
    async (projectId: number, entityId: any, entityType: number) => {
      setLoadingTours(true);
      try {
        const response = await axiosInstance({
          method: "PATCH",
          url: ApiRoutes.VirtualTours,
          data: {
            pageIndex: 0,
            requestedItemCount: 100,
            projectId,
            entityId,
            entityType,
          },
        });

        if (response.data.isSuccess && response.data.data) {
          setAvailableTours(
            response.data.data.map((tour: any) => ({
              id: tour.id,
              name: tour.name || `Tour ${tour.id}`,
              createdAt: new Date().toISOString(),
              modifiedAt: new Date().toISOString(),
              sceneCount: tour.sceneCount || 0,
              entityName: tour.entityName || "Unknown",
            }))
          );
        } else {
          setAvailableTours([]);
        }
      } catch (error) {
        enqueueSnackbar(
          t("failedToLoadTours") +
            ": " +
            (error instanceof Error ? error.message : "Unknown error"),
          { variant: "error", autoHideDuration: 5000 }
        );
        setAvailableTours([]);
      } finally {
        setLoadingTours(false);
      }
    },
    [enqueueSnackbar, t]
  );

  return {
    currentTourId,
    tourModified,
    setTourModified,
    availableTours,
    loadingTours,
    tourNameTranslations,
    setTourNameTranslations,

    // Actions
    saveTour,
    fetchAvailableTours,
  };
};
