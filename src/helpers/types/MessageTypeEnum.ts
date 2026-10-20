/**
 * `IBaseResponse.messages[].type` değerleri.
 * API, başarılı işlem mesajlarını da `Information` ile döndürür — bu yüzden
 * `Information` toast'ta yeşil (success) gösterilir. Bkz. getToastVariantByMessageType.
 */
export enum MessageTypeEnum {
  Information = 1,
  Validation = 2,
  Unauthorized = 3,
  Forbidden = 4,
  Warning = 5,
  Error = 6,
  Fatal = 7,
}
