"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setLanguageLoading, setLanguages } from "@redux/appSlice";
import { localStorageService } from "@helpers/Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { DefaultLanguage } from "@common/enums/DefaultLanguage";
import type { ILanguageDto } from "@common/types/ILanguageDto";

/**
 * Entity çevirileri için desteklenen dil listesi.
 *
 * Panelin arayüz dili (next-intl, tr/en) ile İÇERİK dilleri farklıdır: içerik
 * dilleri API'den gelir ve yönetilebilir.
 */
const useSupportedLanguages = () => {
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const { languageLoading, languages } = useAppSelector(
    (state) => state.AppReducer
  );

  const supportedLanguage = languages?.filter((item) => item?.supported) ?? [];

  const currentLanguage =
    languages?.find((item) => item?.code === locale) ??
    ({ id: DefaultLanguage.TR, code: "tr", name: "Türkçe" } as ILanguageDto);

  const setLoading = useCallback(
    (loading: boolean) => dispatch(setLanguageLoading(loading)),
    [dispatch]
  );

  /**
   * Referansta `getLanguages` ve `refreshLanguages` neredeyse birebir aynı
   * gövdeye sahipti (kopyala-yapıştır); tek yerde toplandı.
   */
  const fetchLanguages = useCallback(
    (onSuccess?: () => void) => {
      setLoading(true);

      return axiosInstance
        .patch(
          ApiRoutes.Languages,
          { pageNumber: 1, rowCount: 10000 },
          { withoutToast: true }
        )
        .then((response) => {
          if (!response.data?.isSuccess) return;

          // API "tr-TR" döner; panelde "tr" kullanılır.
          const data: ILanguageDto[] = (response.data.data ?? []).map(
            (item: ILanguageDto) => ({
              ...item,
              code: item?.code?.split("-")[0],
            })
          );

          localStorageService.setItem(
            LocalStorageKeysEnum.SupportedLanguages,
            data
          );
          dispatch(setLanguages(data));
          onSuccess?.();
        })
        .catch(() => {
          /* cache ile devam */
        })
        .finally(() => setLoading(false));
    },
    [dispatch, setLoading]
  );

  /** Önce cache'i gösterir, sonra tazeler. */
  const getLanguages = useCallback(() => {
    const cached = localStorageService.getItem(
      LocalStorageKeysEnum.SupportedLanguages
    );
    dispatch(setLanguages(Array.isArray(cached) ? cached : []));

    return fetchLanguages();
  }, [dispatch, fetchLanguages]);

  return {
    loading: languageLoading,
    languages,
    supportedLanguage,
    currentLanguage,
    getLanguages,
    refreshLanguages: fetchLanguages,
    setLoading,
  } as const;
};

export default useSupportedLanguages;
