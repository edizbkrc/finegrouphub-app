"use client";

import { useTranslations } from "next-intl";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import type { IAutoSelectItem } from "@components/AsyncAutocomplete";

interface ITenantContactInfo {
  webSiteAddress?: string | null;
  locationUrl?: string | null;
}

interface ITenantFormData {
  id?: string;
  tenancyName?: string;
  companyDisplayName?: string;
  languageId?: number;
  languageName?: string;
  contactInfo?: ITenantContactInfo;
}

/**
 * Dil seçici: genel `PATCH /v1/Lookups` ucu henüz yok, `getOptions` kaçış
 * kapısıyla doğrudan `/v1/languages`'tan besleniyor (UserForm'daki rol
 * seçiciyle aynı geçici çözüm — bkz. docs/API_ADAPTER.md §7).
 */
const getLanguageOptions = (
  setLoading: (loading: boolean) => void,
  setOptions: (values: unknown[]) => void
) => {
  setLoading(true);
  axiosInstance
    .patch(ApiRoutes.Languages, { pageNumber: 1, rowCount: 50 }, { withoutToast: true })
    .then((response) => {
      if (!response.data?.isSuccess) return;
      const options: IAutoSelectItem[] = (response.data.data as { id: number; name: string }[]).map(
        (language) => ({ id: language.id, title: language.name })
      );
      setOptions(options);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
};

export default function TenantForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "tenancyName",
      label: "TenancyName",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Add,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) },
      },
    },
    {
      name: "companyDisplayName",
      label: "CompanyDisplayName",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Add,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "fullCompanyName",
      label: "FullCompanyName",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "managerNameSurname",
      label: "ManagerNameSurname",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "managerIdentityNumber",
      label: "ManagerIdentityNumber",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        maxLength: { value: 11, message: t("Form.MaxLength", { max: 11 }) },
      },
    },
    {
      name: "taxNo",
      label: "TaxNo",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        maxLength: { value: 20, message: t("Form.MaxLength", { max: 20 }) },
      },
    },
    {
      name: "taxOfficeName",
      label: "TaxOfficeName",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      // Yalnızca oluşturmada gönderiliyor — UpdateTenantCommand'da mainCurrency yok
      // (CreateTenantCommand'a özgü, sonradan değiştirilemiyor; API sözleşmesi böyle).
      name: "mainCurrency",
      label: "MainCurrency",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Add,
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: { enumName: "Currency" },
    },
    {
      name: "languageId",
      label: "Language",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: {
        getOptions: getLanguageOptions,
        getDefaultValue: (apiData) => {
          const data = apiData as ITenantFormData | null;
          return data?.languageId ? { id: data.languageId, title: data.languageName ?? "" } : null;
        },
      },
    },
    {
      name: "contactInfo.webSiteAddress",
      label: "WebSiteAddress",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
    },
    {
      name: "contactInfo.locationUrl",
      label: "LocationUrl",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
    },
    {
      // Yalnızca güncellemede — CreateTenantCommand'da yok (yeni firma varsayılan olarak öne
      // çıkarılmamış/sabitlenmemiş başlar).
      name: "featured",
      label: "Featured",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Edit,
    },
    {
      name: "showInReferences",
      label: "ShowInReferences",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Edit,
    },
    {
      name: "pinned",
      label: "Pinned",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Edit,
    },
  ];

  /**
   * `contactInfo` API'de tek parça bir nesne olarak güncelleniyor
   * (`#[UpdateOf(ContactInfoDto::class)]`) — formda yalnızca 2 alanı
   * (webSiteAddress/locationUrl) düzenliyoruz, ama nesnenin `contacts`/
   * `addresses`/`id` alanlarını KAYBETMEMEK için mevcut değerle birleştirilir.
   * (v1 kapsamı: kişiler/adresler dizisi ve logo/döküman yüklemesi henüz yok —
   * bkz. docs/API_ADAPTER.md §7.)
   */
  const getDefaultValues = (key: string, apiData: Record<string, unknown>) =>
    key === "contactInfo" ? ((apiData?.contactInfo as Record<string, unknown>) ?? {}) : null;

  return (
    <OpsForm
      url={ApiRoutes.CompanyDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.TenantManagement}
      title={t("TenantManagement.Create")}
      editTitle={t("TenantManagement.Detail")}
      getDefaultValues={getDefaultValues}
    />
  );
}
