import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { localStorageService } from "./localStorageService";

/**
 * Dil değiştiğinde menü ve sayfa izinlerini yeniden çeker — `localizedName`
 * alanları `Accept-Language`'e göre geldiği için cache tazelenmeli.
 */
export default function refreshCacheLocale(done: () => void) {
  Promise.all([
    axiosInstance.get(ApiRoutes.UIPages, { withoutToast: true }),
    axiosInstance.get(ApiRoutes.MenuItems, { withoutToast: true }),
  ])
    .then(([pagesResponse, menuResponse]) => {
      // localStorageService zaten JSON.stringify uyguluyor (çift kodlama yok).
      if (pagesResponse.data?.isSuccess) {
        localStorageService.setItem(
          LocalStorageKeysEnum.PageInformations,
          pagesResponse.data.data
        );
      }
      if (menuResponse.data?.isSuccess) {
        localStorageService.setItem(
          LocalStorageKeysEnum.AccessibleMenuItems,
          menuResponse.data.data
        );
      }
    })
    .catch(() => {
      /* tazeleme başarısız olsa da mevcut cache ile devam */
    })
    .finally(done);
}
