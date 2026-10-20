import type { VariantType } from "notistack";
import { MessageTypeEnum } from "@helpers/types/MessageTypeEnum";

/**
 * API mesaj tipini toast varyantına eşler.
 *
 * `Information → success` kasıtlıdır: API başarılı işlem mesajlarını da
 * `Information` tipiyle döndürüyor.
 *
 * ⚠️ Referansta `default` dalı da `"success"` idi; sunucu yeni bir mesaj tipi
 * eklediğinde (ör. 8) hata mesajı yeşil toast olarak görünürdü. Burada `"info"`
 * (nötr) yapıldı — bilinmeyen tip başarı gibi gösterilmez.
 */
export const getToastVariantByMessageType = (
  messageType: MessageTypeEnum
): VariantType => {
  switch (messageType) {
    case MessageTypeEnum.Information:
      return "success";
    case MessageTypeEnum.Warning:
      return "warning";
    case MessageTypeEnum.Validation:
    case MessageTypeEnum.Unauthorized:
    case MessageTypeEnum.Forbidden:
    case MessageTypeEnum.Error:
    case MessageTypeEnum.Fatal:
      return "error";
    default:
      return "info";
  }
};
