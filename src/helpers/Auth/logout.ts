import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { localStorageService } from "../Common/localStorageService";
import { getDeviceID } from "../Common/getCustomFingerprint";
import getAccessToken from "./getAccessToken";

export const clearLocalStorage = () => {
  [
    LocalStorageKeysEnum.AccessToken,
    LocalStorageKeysEnum.RefreshToken,
    LocalStorageKeysEnum.AccessTokenExpiration,
    LocalStorageKeysEnum.AccessibleMenuItems,
    LocalStorageKeysEnum.PageInformations,
    LocalStorageKeysEnum.UserId,
    LocalStorageKeysEnum.Username,
    LocalStorageKeysEnum.ProfileInfo,
    LocalStorageKeysEnum.Language,
    LocalStorageKeysEnum.SupportedLanguages,
    LocalStorageKeysEnum.SystemInfo,
    LocalStorageKeysEnum.DefaultRoute,
  ].forEach(localStorageService.removeItem);
};

/**
 * @param isLogOutApi  API'ye de logout gönderilsin mi (cihaz oturumunu sonlandırır)
 * @param isShowMessage login ekranında bilgilendirme toast'ı gösterilsin mi
 */
export default async function logout(isLogOutApi = true, isShowMessage = false) {
  if (isShowMessage) {
    try {
      sessionStorage.setItem("redirectSnackbar", "true");
    } catch {
      /* yoksay */
    }
  }

  const redirectHome = () => {
    clearLocalStorage();
    window.location.href = "/";
  };

  try {
    // httpOnly session cookie'sini sil
    await fetch("/api/logout", { method: "GET" });

    if (!isLogOutApi) {
      clearLocalStorage();
      const { pathname } = window.location;
      if (pathname !== "/" && pathname !== "/tr" && pathname !== "/en") {
        window.location.href = "/";
      }
      return;
    }

    const userName = localStorageService.getItem(LocalStorageKeysEnum.Username);

    try {
      await axiosInstance.post(
        ApiRoutes.Logout,
        { userName, deviceId: getDeviceID() },
        {
          // ⚠️ Referansta buraya ham token yazılıyordu ("Bearer " öneki yoktu);
          // istek 401 alıyor, catch yutuyor ve cihaz oturumu sunucuda hiç
          // kapanmıyordu. getAccessToken() öneki ekler.
          headers: { Authorization: getAccessToken() },
          withoutToast: true,
        }
      );
    } catch (error) {
      process.env.NODE_ENV !== "production" &&
        console.error("logout: API çağrısı başarısız", error);
    }

    redirectHome();
  } catch (error) {
    process.env.NODE_ENV !== "production" &&
      console.error("logout: beklenmedik hata", error);
    redirectHome();
  }
}
