import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { VirtualTourScene } from "../types";
import { v4 as uuidv4 } from "uuid";

export const useFileUpload = () => {
  const { enqueueSnackbar } = useSnackbar();
  const t = useTranslations("VirtualTourBuilder.messages");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const processFiles = useCallback(
    async (
      files: File[],
      viewerRef: React.RefObject<any>,
      onScenesProcessed: (
        scenes: VirtualTourScene[],
        isFirstScene: boolean
      ) => void
    ) => {
      const isFirstScene = true; // This will be determined by the calling component
      let newScenes: VirtualTourScene[] = [];

      // Sanal tur görüntüsünde boyut sınırı yok; orijinal dosya olduğu gibi kullanılır.

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          enqueueSnackbar(t("notImageFile", { fileName: file.name }), {
            variant: "warning",
            autoHideDuration: 5000,
          });
          continue;
        }

        try {
          const imageUrl = URL.createObjectURL(file);
          const fileName = file.name;
          const baseName = fileName.replace(/\.[^/.]+$/, "");

          if (!viewerRef.current) {
            enqueueSnackbar(t("viewerNotReady"), {
              variant: "warning",
              autoHideDuration: 5000,
            });
            continue;
          }

          // Import Marzipano dynamically to avoid SSR issues
          const Marzipano = await import("marzipano");
          const source = Marzipano.ImageUrlSource.fromString(imageUrl);
          const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

          const view = new Marzipano.RectilinearView({
            yaw: 0,
            pitch: 0,
            fov: Math.PI / 3,
          });
          const scene = viewerRef.current.createScene({
            source,
            geometry,
            view,
          });

          const newScene: VirtualTourScene = {
            id: uuidv4(),
            nameTranslations: [{ languageId: 21, value: baseName }],
            descriptionTranslations: [{ languageId: 21, value: "" }],
            // Legacy fields for backward compatibility
            name: baseName,
            description: "",
            imageUrl: imageUrl,
            fileName: fileName,
            faceSize: 1500,
            initialView: { yaw: 0, pitch: 0, fov: Math.PI / 3 },
            linkHotspots: [],
            infoHotspots: [],
            _scene: scene,
            _view: view,
          };

          newScenes.push(newScene);
        } catch (error) {
          enqueueSnackbar(t("errorProcessingFile", { fileName: file.name }), {
            variant: "error",
            autoHideDuration: 5000,
          });
        }
      }

      if (newScenes.length > 0) {
        onScenesProcessed(newScenes, isFirstScene);
        enqueueSnackbar(t("imagesProcessedSuccess"), {
          variant: "success",
        });
      }
    },
    [enqueueSnackbar, t]
  );

  const handleFileUpload = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      viewerRef: React.RefObject<any>,
      onScenesProcessed: (
        scenes: VirtualTourScene[],
        isFirstScene: boolean
      ) => void
    ) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      await processFiles(files, viewerRef, onScenesProcessed);
    },
    [processFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver) {
        setIsDragOver(true);
      }
    },
    [isDragOver]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the drop zone completely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (
      e: React.DragEvent<HTMLDivElement>,
      viewerRef: React.RefObject<any>,
      onScenesProcessed: (
        scenes: VirtualTourScene[],
        isFirstScene: boolean
      ) => void
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFiles(files, viewerRef, onScenesProcessed);
      }
    },
    [processFiles]
  );

  return {
    isDragOver,
    setIsDragOver,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    processFiles,
  };
};
