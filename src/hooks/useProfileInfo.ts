"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { localStorageService } from "@helpers/Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import type { IAccountDetailDto } from "@common/types/IAccountDetailDto";

/** Aktif kullanıcının profil bilgisi; cache varsa ondan, yoksa API'den. */
const useProfileInfo = () => {
  const [loading, setLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState<IAccountDetailDto | undefined>();

  useEffect(() => {
    let cancelled = false;

    const userId = localStorageService.getItem(LocalStorageKeysEnum.UserId);
    const cached: IAccountDetailDto | null = localStorageService.getItem(
      LocalStorageKeysEnum.ProfileInfo
    );

    // Cache başka bir kullanıcıya aitse yeniden çek.
    if (cached && String(cached.id) === String(userId)) {
      setProfileInfo(cached);
      setLoading(false);
      return;
    }

    axiosInstance
      .get(`${ApiRoutes.AccountDetail}?userId=${userId}`, { withoutToast: true })
      .then((response) => {
        if (cancelled) return;

        if (response?.data?.isSuccess) {
          setProfileInfo(response.data.data);
          localStorageService.setItem(
            LocalStorageKeysEnum.ProfileInfo,
            response.data.data
          );
        }
      })
      .catch(() => {
        /* profil yüklenemezse arayüz baş harfsiz devam eder */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, profileInfo } as const;
};

export default useProfileInfo;
