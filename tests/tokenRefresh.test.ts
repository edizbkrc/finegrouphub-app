/**
 * Faz 3 kabul kriteri: token yenileme kuyruğu.
 *
 * Referans projedeki hata: request interceptor'da refresh BAŞARISIZ olduğunda
 * kuyruğa alınmış istekler hiçbir zaman resolve/reject edilmiyordu — sonsuza
 * kadar askıda kalıyorlardı. Buradaki "başarısız refresh" testi o regresyonu
 * kilitler.
 */
import moment from "moment";
import axios from "axios";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";

jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return {
    __esModule: true,
    default: {
      ...actual.default,
      create: actual.default.create,
      post: jest.fn(),
      get: jest.fn(),
    },
  };
});

jest.mock("@helpers/Auth/logout", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("notistack", () => ({ enqueueSnackbar: jest.fn() }));

const mockedAxios = axios as unknown as {
  post: jest.Mock;
  get: jest.Mock;
};

/** Süresi dolmuş bir oturum kurar. */
function seedExpiredSession() {
  const { localStorageService } =
    require("@helpers/Common/localStorageService") as typeof import("@helpers/Common/localStorageService");

  localStorageService.setItem(LocalStorageKeysEnum.AccessToken, "eski-access");
  localStorageService.setItem(LocalStorageKeysEnum.RefreshToken, "refresh-1");
  localStorageService.setItem(LocalStorageKeysEnum.Username, "omer");
  localStorageService.setItem(
    LocalStorageKeysEnum.AccessTokenExpiration,
    moment().subtract(1, "hour").toISOString()
  );
}

/** axiosInstance'ı izole modül olarak kurar ve isteği yakalayan adapter takar. */
function loadInstance() {
  let instance: any;
  let seenRequests: any[] = [];

  jest.isolateModules(() => {
    instance = require("@network/axiosInstance").default;
  });

  instance.defaults.adapter = jest.fn(async (config: any) => {
    seenRequests.push(config);
    return {
      data: { isSuccess: true, statusCode: 200, messages: [], data: null },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  });

  return { instance, seenRequests };
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test";
  jest.clearAllMocks();
});

describe("token yenileme kuyruğu", () => {
  it("eşzamanlı istekler için refresh'i YALNIZCA BİR KEZ çağırır", async () => {
    seedExpiredSession();

    mockedAxios.post.mockResolvedValue({
      data: {
        isSuccess: true,
        data: {
          token: {
            accessToken: "yeni-access",
            refreshToken: "refresh-2",
            expiresIn: 3600,
          },
        },
      },
    });
    mockedAxios.get.mockResolvedValue({ data: { isSuccess: true, data: [] } });

    const { instance, seenRequests } = loadInstance();

    await Promise.all([
      instance.get("/v1/Users/user"),
      instance.get("/v1/Roles/role"),
      instance.get("/v1/tenants/tenant"),
    ]);

    const refreshCalls = mockedAxios.post.mock.calls.filter(([url]) =>
      String(url).includes("/login/refresh")
    );
    expect(refreshCalls).toHaveLength(1);

    // Üç istek de YENİ token ile çıkmış olmalı.
    expect(seenRequests).toHaveLength(3);
    seenRequests.forEach((config) => {
      expect(config.headers.Authorization).toBe("Bearer yeni-access");
    });
  });

  it("refresh sonrası /UI/pages ve /UI/menuItems'i tazeler", async () => {
    seedExpiredSession();

    mockedAxios.post.mockResolvedValue({
      data: {
        isSuccess: true,
        data: {
          token: {
            accessToken: "yeni-access",
            refreshToken: "refresh-2",
            expiresIn: 3600,
          },
        },
      },
    });
    mockedAxios.get.mockResolvedValue({ data: { isSuccess: true, data: [] } });

    const { instance } = loadInstance();
    await instance.get("/v1/Users/user");

    const fetched = mockedAxios.get.mock.calls.map(([url]) => String(url));
    expect(fetched.some((u) => u.includes("/v1/UI/pages"))).toBe(true);
    expect(fetched.some((u) => u.includes("/v1/UI/menuItems"))).toBe(true);
  });

  it("refresh BAŞARISIZ olduğunda kuyruktaki istekler askıda kalmaz", async () => {
    seedExpiredSession();

    mockedAxios.post.mockRejectedValue(new Error("refresh reddedildi"));

    const { instance } = loadInstance();

    // Askıda kalma regresyonunu yakalamak için zaman aşımı ile yarıştır.
    const requests = Promise.allSettled([
      instance.get("/v1/Users/user"),
      instance.get("/v1/Roles/role"),
      instance.get("/v1/tenants/tenant"),
    ]);

    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve("ASKIDA"), 2000)
    );

    const outcome = await Promise.race([requests, timeout]);

    expect(outcome).not.toBe("ASKIDA");
    expect(Array.isArray(outcome)).toBe(true);
    (outcome as PromiseSettledResult<unknown>[]).forEach((result) => {
      expect(result.status).toBe("rejected");
    });
  });

  it("token geçerliyken refresh çağrılmaz", async () => {
    const { localStorageService } =
      require("@helpers/Common/localStorageService") as typeof import("@helpers/Common/localStorageService");

    localStorageService.setItem(LocalStorageKeysEnum.AccessToken, "gecerli");
    localStorageService.setItem(
      LocalStorageKeysEnum.AccessTokenExpiration,
      moment().add(1, "hour").toISOString()
    );

    const { instance, seenRequests } = loadInstance();
    await instance.get("/v1/Users/user");

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(seenRequests[0].headers.Authorization).toBe("Bearer gecerli");
  });
});

describe("M-Metadata header", () => {
  it("isMetaData true ise 'true', değilse 'false' gönderir", async () => {
    const { localStorageService } =
      require("@helpers/Common/localStorageService") as typeof import("@helpers/Common/localStorageService");

    localStorageService.setItem(LocalStorageKeysEnum.AccessToken, "gecerli");
    localStorageService.setItem(
      LocalStorageKeysEnum.AccessTokenExpiration,
      moment().add(1, "hour").toISOString()
    );

    const { instance, seenRequests } = loadInstance();

    await instance.patch("/v1/Users", {}, { isMetaData: true });
    await instance.get("/v1/Users/user");

    expect(seenRequests[0].headers["M-Metadata"]).toBe("true");
    expect(seenRequests[1].headers["M-Metadata"]).toBe("false");
  });
});
