"use client";

import { useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useProject } from "./ProjectContext";
import type { IMetadata } from "@common/types/IMetadata";
import {
  applyUnitAreaFieldsToMetadata,
  readUnitAreaFields,
  resolveUnitAreaFields,
  type IResolvedUnitAreaFields,
} from "./unitAreaFields";

/**
 * Aktif projenin çözümlenmiş alan adları/gizlilikleri.
 *
 * Proje bağlamındaki (ProjectContext) özetten okur; ayrı istek atmaz ve getLanguages()
 * çağırmaz — OpsForm içinde kullanıldığında global languageLoading formu söküp kurar,
 * sonsuz döngü olur (CLAUDE.md "Panel formları"). config null → bugünkü varsayılanlar.
 */
export const useUnitAreaFields = (): IResolvedUnitAreaFields => {
  const { project } = useProject();
  const locale = useLocale();
  const t = useTranslations();
  const fields = readUnitAreaFields(project);
  const fieldsKey = JSON.stringify(fields ?? null);

  // t her render'da yeni referans olabilir; anahtar olarak içerik + dil yeterli.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => resolveUnitAreaFields(fields, locale, t), [fieldsKey, locale]);
};

/** Proje tablolarında (şablon, daire) alan kolonlarının adını/görünürlüğünü uygular. */
export const useUnitAreaMetadataTransform = () => {
  const resolved = useUnitAreaFields();
  return useCallback((metadatas: IMetadata[]) => applyUnitAreaFieldsToMetadata(metadatas, resolved), [resolved]);
};
