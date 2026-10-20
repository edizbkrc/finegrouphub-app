import { v4 as uuidv4 } from "uuid";
import { s3ImageUpload } from "./s3ImageUpload";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import type { IFormItem } from "@common/types/IFormItem";

export interface IUploadItem {
  id?: string;
  base64?: string;
  [key: string]: unknown;
}

/**
 * S3_IMAGE ve FILE tipli alanları submit gövdesinden ayıklar; yüklenecek
 * öğeleri `uploadItems`'a toplar, gövdedeki base64'ü temizler.
 *
 * ⚠️ Referansta bu mantık `OpsForm.tsx` (modal) ve `OpsPageForm.tsx`
 * (tam sayfa) içinde ~150 satır birebir kopyalanmıştı; iki motorun da
 * kullandığı tek yer burası.
 */
export function processUploadFields(
  formData: Record<string, any>,
  scheme: IFormItem[],
  apiData: Record<string, any> | undefined,
  isEdit: boolean,
  uploadItems: IUploadItem[]
) {
  for (const key in formData) {
    const type = scheme.find((s) => s.name === key)?.type;

    if (type === FormItemTypeEnum.S3_IMAGE) {
      const item = formData[key];

      if (Object.keys(item || {}).length === 0) {
        delete formData[key];
        continue;
      }

      if (!item.id) item.id = uuidv4();

      if (item.base64 === "-1") {
        formData[key] = null;
        continue;
      }

      const hasBase64 = !!item.base64;
      const normalize = (v: unknown) => (v === null || v === undefined ? null : v);
      const hasAltTextChanged = normalize(item.altText ?? null) !== normalize(apiData?.[key]?.altText ?? null);
      const hasOrderChanged = normalize(item.order) !== normalize(apiData?.[key]?.order);

      if (hasAltTextChanged || hasOrderChanged) {
        if (item.altText === undefined && apiData?.[key]?.altText !== undefined) item.altText = apiData[key].altText;
        if (item.order === undefined && apiData?.[key]?.order !== undefined) item.order = apiData[key].order;
      }

      if (hasBase64) {
        if (isEdit) formData[key].fileChanged = true;
        uploadItems.push({ ...item });
        delete formData[key].base64;
      }
      if (!hasBase64 && !hasAltTextChanged && !hasOrderChanged && isEdit) {
        formData[key] = null;
      }
      continue;
    }

    if (type === FormItemTypeEnum.FILE) {
      const schemaItem = scheme.find((s) => s.name === key);

      if (schemaItem?.fileMultiple) {
        const items: IUploadItem[] = formData[key];
        const newUploadItems: IUploadItem[] = [];

        items.forEach((item) => {
          if (!item?.id) item.id = uuidv4();
          if (item?.base64) {
            uploadItems.push({ ...item });
            delete item.base64;
            if (isEdit) newUploadItems.push({ ...item });
          }
        });

        if (isEdit) {
          const selectedIds = items.map((doc) => doc?.id).filter(Boolean);
          const oldDocuments: IUploadItem[] = apiData?.[key] || [];
          const remaining = oldDocuments.filter((doc) => doc?.id && selectedIds.includes(doc.id));
          formData[key] = [...remaining, ...newUploadItems];
        }
        continue;
      }

      const item: IUploadItem = formData[key];

      if (!item) {
        formData[key] = null;
        continue;
      }

      if (!item.id) item.id = uuidv4();

      if (item.base64) {
        uploadItems.push({ ...item });
        delete item.base64;
      }

      if (isEdit) {
        const apiFile = apiData?.[key];
        const hasChanges = item.base64 || item.id !== apiFile?.id;

        if (!hasChanges) {
          formData[key] = null;
        } else {
          formData[key].fileChanged = true;
          formData[key].base64 = item.base64;
        }
      }
    }
  }
}

/** Yanıttaki presigned URL'lere base64 gövdeleri yükler. Hata form akışını durdurmaz. */
export async function uploadPendingFiles(resData: any, uploadItems: IUploadItem[], onError: () => void) {
  if (uploadItems.length === 0) return;

  const uploadInfos = resData?.data?.uploadInfos || [];
  if (uploadInfos.length > 0) {
    for (const fileUploadItem of uploadInfos) {
      const matched = uploadItems.find((item) => item.id === fileUploadItem?.fileId);
      if (!matched) continue;
      await s3ImageUpload(fileUploadItem.preSignedUrl, matched.base64 as string).catch(onError);
    }
    return;
  }

  if (resData?.data?.uploadInfo) {
    await s3ImageUpload(resData.data.uploadInfo.preSignedUrl, uploadItems[0]?.base64 as string).catch(onError);
  }
}
