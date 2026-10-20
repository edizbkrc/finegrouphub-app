import { v4 as uuidv4 } from "uuid";
import type { IUploadItem } from "@common/helpers/processFormUploads";

/**
 * Bilgi kartı / balkon gibi iç içe görsel alanlarını API gövdesine hazırlar;
 * base64'leri `uploadItems` listesine taşır; `new_*` id'leri siler.
 *
 * `key` varsayılan "image"; balkonda aynı satırın gece panoraması için "nightImage" ile ikinci kez
 * çağrılır. Yükleme eşlemesi fileId üzerinden olduğu için iki alan aynı uploadItems'a girebilir.
 */
export function prepareNestedImageItems(
  items: Array<Record<string, any>> | undefined,
  uploadItems: IUploadItem[],
  apiItems?: Array<Record<string, any>>,
  key: string = "image"
) {
  if (!Array.isArray(items)) return;

  items.forEach((item) => {
    const image = item?.[key];
    if (image?.base64 === "-1") {
      item[key] = null;
    } else if (image?.base64) {
      const id = image?.id || uuidv4();
      uploadItems.push({ ...image, id });
      item[key] = {
        id,
        fileChanged: !!image?.id,
        fileExtension: image.fileExtension,
        fileName: image.fileName,
        order: image.order || 0,
        altText: image.altText || null,
      };
    } else if (image && item?.id) {
      const founded = apiItems?.find((row) => row?.id === item.id)?.[key];
      if (
        !founded &&
        (isNaN(image?.order) || image?.order === null) &&
        (!image?.altText || image?.altText === "")
      ) {
        delete item[key];
      } else if (founded) {
        item[key] = {
          id: founded.id,
          order: image?.order ?? founded.order ?? 0,
          altText: image?.altText ?? founded.altText ?? null,
          fileChanged: false,
        };
      } else {
        item[key] = {
          id: null,
          order: image?.order || 0,
          altText: image?.altText || null,
          fileChanged: false,
        };
      }
    } else if (!image || (!image.base64 && !item?.id)) {
      delete item[key];
    }

    if (item?.id && typeof item.id === "string" && item.id.startsWith("new_")) {
      delete item.id;
    }
  });
}
