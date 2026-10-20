import { v4 as uuidv4 } from "uuid";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { s3ImageUpload } from "@common/helpers/s3ImageUpload";

const DAYLIGHT = 1;
const NIGHTLIGHT = 2;

interface IPresignedNav {
  fileId?: string;
  preSignedUrl?: string;
  propertyName?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function extensionOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

function baseName(file: File): string {
  return file.name.replace(/\.[^.]+$/, "") || "render";
}

/**
 * Seçilen dosyaları workspace karesi olarak oluşturur, dönen presigned
 * URL'lere görseli yükler. `startOrder` mevcut karelerden sonraki sıra.
 */
export async function createWorkspaceItemsWithImages(params: {
  entityId: number;
  entityType: number;
  files: File[];
  startOrder: number;
  presentationType?: number;
  mainFrame?: boolean;
}): Promise<void> {
  const presentationType = params.presentationType ?? DAYLIGHT;
  const prepared = await Promise.all(
    params.files.map(async (file, index) => {
      const id = uuidv4();
      const base64 = await fileToDataUrl(file);
      const fileExtension = extensionOf(file);
      return {
        id,
        base64,
        order: params.startOrder + index,
        fileName: baseName(file),
        fileExtension,
      };
    })
  );

  const response = await axiosInstance.post(
    ApiRoutes.WorkspaceItems,
    {
      entityId: params.entityId,
      entityType: params.entityType,
      items: prepared.map((item, index) => ({
        presentationType,
        order: item.order,
        mainFrame: Boolean(params.mainFrame) && index === 0,
        compassDegree: 0,
        image: {
          id: item.id,
          fileName: item.fileName,
          fileExtension: item.fileExtension,
          order: 0,
        },
      })),
    },
    { withoutToast: true }
  );

  if (!response?.data?.isSuccess) {
    throw new Error(response?.data?.messages?.[0]?.message || "upload-failed");
  }

  const urls: IPresignedNav[] = Array.isArray(response.data.data) ? response.data.data : [];
  await Promise.all(
    urls.map(async (entry) => {
      const match = prepared.find((item) => item.id === entry.fileId);
      if (!match?.base64 || !entry.preSignedUrl) return;
      await s3ImageUpload(entry.preSignedUrl, match.base64);
    })
  );
}

/** Mevcut bir karenin gündüz veya bağlı gece görselini değiştirir. */
export async function replaceWorkspaceItemImage(params: {
  entityId: number;
  entityType: number;
  itemId: number | string;
  presentationType?: number;
  /** true → aynı frame’in nightImage alanı (S3 nightLight/). */
  isNightImage?: boolean;
  file: File;
}): Promise<void> {
  const id = uuidv4();
  const base64 = await fileToDataUrl(params.file);
  const fileExtension = extensionOf(params.file);
  const isNight = Boolean(params.isNightImage);

  const response = await axiosInstance.put(
    ApiRoutes.WorkspaceItemImage,
    {
      entityId: params.entityId,
      entityType: params.entityType,
      item: {
        id: params.itemId,
        presentationType: isNight ? NIGHTLIGHT : (params.presentationType ?? DAYLIGHT),
        isNightImage: isNight,
        image: {
          id,
          fileName: baseName(params.file),
          fileExtension,
          order: 0,
        },
      },
    },
    { withoutToast: true }
  );

  if (!response?.data?.isSuccess) {
    throw new Error(response?.data?.messages?.[0]?.message || "replace-failed");
  }

  const url = response.data.data?.preSignedUrl as string | undefined;
  if (url) await s3ImageUpload(url, base64);
}
