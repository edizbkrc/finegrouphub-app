import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import moment from "moment";
import { enqueueSnackbar } from "notistack";
import { ApiRoutes } from "@network/ApiRoutes";
import logout from "@helpers/Auth/logout";
import { getAppLanguage } from "@helpers/Auth/getAppLanguage";
import getAccessToken, { getRawAccessToken } from "@helpers/Auth/getAccessToken";
import { localStorageService } from "@helpers/Common/localStorageService";
import { getDeviceID } from "@helpers/Common/getCustomFingerprint";
import showOpsApiMessages from "@helpers/Network/showOpsApiMessages";
import { getConnectionErrorMessage } from "@helpers/Network/getConnectionErrorMessage";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Token yenileme kuyruğu ────────────────────────────────────────────
// Aynı anda birden fazla istek süresi dolmuş token ile karşılaşabilir.
// Tek bir refresh çağrısı yapılır; diğerleri kuyruğa alınır ve yeni token
// ile salınır. Başarısızlıkta kuyruk REDDEDİLİR — referansta bu dal yoktu
// ve istekler sonsuza kadar askıda kalıyordu.
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const subscribeTokenRefresh = (
  resolve: (token: string) => void,
  reject: (reason?: unknown) => void
) => {
  refreshSubscribers.push({ resolve, reject });
};

const flushQueue = (token: string | null, error?: unknown) => {
  const subscribers = refreshSubscribers;
  refreshSubscribers = [];

  subscribers.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error ?? new Error("Token yenilenemedi"));
  });
};

/**
 * Access token son kullanma zamanı ISO 8601 olarak saklanır.
 *
 * Referansta `moment().add(...).toString()` ("Sat Sep 20 2026 13:00:00 GMT+0300")
 * yazılıp geri `moment(string)` ile okunuyordu; bu format ISO olmadığı için moment
 * tarayıcının `Date` ayrıştırıcısına düşüyor (deprecation uyarısı) ve sonuç
 * tarayıcıdan tarayıcıya değişebiliyor. Süresi dolmuş token'ın geçerli sayılması
 * demek olduğu için ISO'ya sabitlendi.
 */
export const setAccessTokenExpiration = (expiresInSeconds: number) => {
  localStorageService.setItem(
    LocalStorageKeysEnum.AccessTokenExpiration,
    moment().add(expiresInSeconds, "seconds").toISOString()
  );
};

const isTokenExpired = (): boolean => {
  const expiration = localStorageService.getItem(
    LocalStorageKeysEnum.AccessTokenExpiration
  );
  if (!expiration) return true;

  const expiresAt = moment(expiration, moment.ISO_8601);
  if (!expiresAt.isValid()) return true;

  return moment().isAfter(expiresAt);
};

const applyAuthHeaders = (
  config: AxiosRequestConfig | InternalAxiosRequestConfig,
  bearerToken: string
) => {
  config.headers = config.headers ?? {};
  (config.headers as Record<string, unknown>).Authorization = bearerToken;
  (config.headers as Record<string, unknown>)["Accept-Language"] = getAppLanguage();
  (config.headers as Record<string, unknown>)["M-Metadata"] = config.isMetaData
    ? "true"
    : "false";
};

/**
 * Yetki verilerini tazeler.
 *
 * İzinler oturum ortasında değişebildiği için refresh sonrası /UI/pages ve
 * /UI/menuItems yeniden çekilir (docs/API_ADAPTER.md §3.4).
 */
const refreshAuthorizationData = async (accessToken: string) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": getAppLanguage(),
  };

  try {
    const [pagesResponse, menuResponse] = await Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}${ApiRoutes.UIPages}`, { headers }),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}${ApiRoutes.MenuItems}`, { headers }),
    ]);

    // localStorageService zaten JSON.stringify uyguluyor — burada ayrıca
    // stringify etmek çift kodlamaya yol açardı (bkz. login.ts persistSession).
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
  } catch {
    // Yetki tazeleme başarısız olsa da token geçerli — isteği engelleme.
  }
};

const refreshToken = async (): Promise<string | null> => {
  try {
    const storedRefreshToken = localStorageService.getItem(
      LocalStorageKeysEnum.RefreshToken
    );
    const accessToken = getRawAccessToken();

    if (!storedRefreshToken || !accessToken) {
      await logout(false, true);
      return null;
    }

    // Süresi dolmuş ama imzası geçerli access token header'da gönderilir.
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}${ApiRoutes.RefreshToken}`,
      {
        refreshToken: storedRefreshToken,
        deviceId: getDeviceID(),
        userName: localStorageService.getItem(LocalStorageKeysEnum.Username),
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.data?.isSuccess) {
      await logout(false, true);
      return null;
    }

    const { token } = response.data.data;

    localStorageService.setItem(LocalStorageKeysEnum.AccessToken, token.accessToken);
    localStorageService.setItem(LocalStorageKeysEnum.RefreshToken, token.refreshToken);
    setAccessTokenExpiration(token.expiresIn);

    await refreshAuthorizationData(token.accessToken);

    return token.accessToken;
  } catch {
    await logout(false, true);
    return null;
  }
};

/** Refresh'i tekilleştirir: eşzamanlı çağrılar tek bir isteğe indirgenir. */
const ensureFreshToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      subscribeTokenRefresh(resolve, reject);
    });
  }

  isRefreshing = true;
  try {
    const newToken = await refreshToken();

    if (!newToken) {
      const error = new Error("Token yenilenemedi");
      flushQueue(null, error);
      throw error;
    }

    const bearerToken = `Bearer ${newToken}`;
    flushQueue(bearerToken);
    return bearerToken;
  } finally {
    isRefreshing = false;
  }
};

// ── Request interceptor ───────────────────────────────────────────────
axiosInstance.interceptors.request.use(async (config) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(config.url, " - request -", config.data);
  }

  config.headers["Accept-Language"] = getAppLanguage();
  config.headers["M-Metadata"] = config.isMetaData ? "true" : "false";

  if (isTokenExpired()) {
    // Başarısızlıkta hata fırlatır; istek askıda kalmaz.
    config.headers.Authorization = await ensureFreshToken();
    return config;
  }

  const token = getAccessToken();
  if (token) config.headers.Authorization = token;

  return config;
});

// ── Response interceptor ──────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(response?.config?.url, " - success - ", response?.data);
    }

    const { config } = response;
    const skipToast =
      config?.withoutErrorToast ||
      (config?.withoutToast &&
        (response.data?.statusCode === 200 || config.responseType === "blob"));

    if (!skipToast) showOpsApiMessages(response?.data);

    return response;
  },
  async (error) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueSnackbar(getConnectionErrorMessage(), {
        variant: "error",
        autoHideDuration: 5000,
      });
      return Promise.reject(error);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        error?.response?.config?.url,
        " - error - ",
        error?.response?.data
      );
    }

    const originalRequest = error.config;
    const status = error?.response?.status;
    const isAuthError = status === 401 || status === 419;

    if (isAuthError && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const bearerToken = await ensureFreshToken();
        applyAuthHeaders(originalRequest, bearerToken);
        return axiosInstance(originalRequest);
      } catch {
        await logout(false, true);
        return Promise.reject(error);
      }
    }

    if (!originalRequest?.withoutErrorToast) {
      showOpsApiMessages(error?.response?.data);
    }

    if (isAuthError) await logout(false, true);

    return Promise.reject(error);
  }
);

export default axiosInstance;
