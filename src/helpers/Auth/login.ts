import axios from "axios";
import queryString from "query-string";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { setAccessTokenExpiration } from "@network/axiosInstance";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { Routes } from "@enums/Routes";
import { localStorageService } from "../Common/localStorageService";
import { getDeviceID } from "../Common/getCustomFingerprint";
import showOpsApiMessages from "../Network/showOpsApiMessages";
import { getCommonErrorMessage } from "../Network/getCommonErrorMessage";
import getAcceptLanguage from "./getAcceptLanguage";
import type { IBaseResponse } from "@common/types/IBaseResponse";
import type { ILoginResponse } from "@common/types/ILoginResponse";
import type { IMenuItem } from "@common/types/IMenuItem";

interface ILoginProps {
  setLoading: (loading: boolean) => void;
  data: { userName: string; password: string };
  enqueueSnackbar: (message: string, options: unknown) => void;
  locale: string;
  router: { push: (href: string) => void };
}

/** Giriş sonrası açılacak sayfa. Menüye göre özelleştirilebilir. */
const getDefaultRoute = (_accessibleMenuItems: IMenuItem[]): string =>
  Routes.Dashboard;

/**
 * localStorage'a oturum verilerini yazar.
 *
 * Not: `localStorageService.setItem` zaten `JSON.stringify` uyguluyor. Referansta
 * bazı çağrılar ayrıca `JSON.stringify(...)` geçiyordu (çift kodlama), bazıları
 * geçmiyordu — okuma tarafında tutarsızlığa yol açıyordu. Burada nesneler
 * DOĞRUDAN verilir; okuma tarafı da `JSON.parse` yapmaz.
 */
const persistSession = (
  loginResponse: ILoginResponse,
  userName: string,
  defaultRoute: string
) => {
  const { token } = loginResponse;

  localStorageService.setItem(LocalStorageKeysEnum.AccessToken, token.accessToken);
  localStorageService.setItem(LocalStorageKeysEnum.RefreshToken, token.refreshToken);
  setAccessTokenExpiration(token.expiresIn);

  localStorageService.setItem(LocalStorageKeysEnum.Username, userName);
  localStorageService.setItem(LocalStorageKeysEnum.UserId, loginResponse.id);
  localStorageService.setItem(LocalStorageKeysEnum.DefaultRoute, defaultRoute);
  localStorageService.setItem(
    LocalStorageKeysEnum.AccessibleMenuItems,
    loginResponse.accessibleMenuItems
  );
  localStorageService.setItem(
    LocalStorageKeysEnum.PageInformations,
    loginResponse.pageInformations
  );
  if (loginResponse.systemInfo) {
    localStorageService.setItem(
      LocalStorageKeysEnum.SystemInfo,
      loginResponse.systemInfo
    );
  }
};

/** Profil bilgisini arka planda çeker; login akışını bloklamaz. */
const prefetchProfile = (userId: number) => {
  axiosInstance
    .get(`${ApiRoutes.AccountDetail}?userId=${userId}`, { withoutToast: true })
    .then((response) => {
      if (response?.data?.isSuccess) {
        localStorageService.setItem(
          LocalStorageKeysEnum.ProfileInfo,
          response.data.data
        );
      }
    })
    .catch(() => {
      /* profil yüklenemezse login yine de geçerli */
    });
};

/** httpOnly session cookie'sini oluşturur ve yönlendirir. */
const createSessionAndRedirect = async (
  loginResponse: ILoginResponse,
  locale: string,
  router: ILoginProps["router"],
  enqueueSnackbar: ILoginProps["enqueueSnackbar"],
  defaultRoute: string
) => {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: loginResponse.id }),
  });

  if (!response.ok) {
    enqueueSnackbar(getCommonErrorMessage(), {
      variant: "error",
      autoHideDuration: 5000,
    });
    return;
  }

  const parsed = queryString.parse(window.location.search);
  const returnUrl = parsed?.returnUrl?.toString();

  router.push(returnUrl || `/${locale}${defaultRoute}`);
};

export default async function login({
  setLoading,
  data,
  enqueueSnackbar,
  locale,
  router,
}: ILoginProps) {
  setLoading(true);

  try {
    // axiosInstance DEĞİL: login öncesi token yok, interceptor'ın refresh
    // denemesi gereksiz bir 401 turu yaratır.
    const response = await axios.post<IBaseResponse<ILoginResponse>>(
      `${process.env.NEXT_PUBLIC_API_URL}${ApiRoutes.Login}`,
      { ...data, deviceId: getDeviceID() },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": getAcceptLanguage(locale),
        },
      }
    );

    showOpsApiMessages(response?.data);

    if (!response.data?.isSuccess) return;

    const loginResponse = response.data.data;
    const defaultRoute = getDefaultRoute(loginResponse.accessibleMenuItems);

    persistSession(loginResponse, data.userName, defaultRoute);
    prefetchProfile(loginResponse.id);

    await createSessionAndRedirect(
      loginResponse,
      locale,
      router,
      enqueueSnackbar,
      defaultRoute
    );
  } catch (error: any) {
    if (error?.response?.data) {
      showOpsApiMessages(error.response.data);
    } else {
      enqueueSnackbar(getCommonErrorMessage(), {
        variant: "error",
        autoHideDuration: 5000,
      });
    }
  } finally {
    setLoading(false);
  }
}
