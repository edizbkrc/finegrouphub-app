"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsPageForm from "@common/page/OpsPageForm";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import CompanyContactForm from "./CompanyContactForm";
import CompanyAddressList from "./helpers/CompanyAddressList";
import { getLanguageOptions } from "./helpers/companyHelpers";

/** `http(s)://` önekini isteğe bağlı bırakan basit URL kalıbı (referansla aynı). */
const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-./?%&=]*)?$/;

/** Yeni firma (tenant) oluşturma sayfası. Düzenleme `CompanyDetailForm`'da. */
export default function CompanyForm({ data }: { data?: any }) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const schema: IOpsPageFormItem[] = [
    {
      name: t("Tenant.TenantInfo"),
      icon: <BusinessOutlinedIcon color="primary" sx={{ width: 32, height: 32 }} />,
      schema: [
        {
          name: "tenancyName",
          label: "TennantId",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: {
            required: t("Form.Required"),
            maxLength: { value: 70, message: t("Form.MaxLength70") },
            // Tenant kimliği kalıcı bir anahtar; referanstaki gibi yalnızca İngilizce harf
            // kabul edilir (API ayrıca küçük harfe çevirir — CreateTenantHandler).
            pattern: { value: /^[a-zA-Z\s]*$/, message: t("Form.OnlyEnglish") },
          },
        },
        {
          name: "fullCompanyName",
          label: "FullBusinessName",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: {
            required: t("Form.Required"),
            maxLength: { value: 200, message: t("Form.MaxLength200") },
          },
        },
        {
          name: "companyDisplayName",
          label: "CompanyDisplayName",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: {
            required: t("Form.Required"),
            // Referansta mesaj MaxLength200'dü ama sınır 100 idi (API de 100) — mesaj düzeltildi.
            maxLength: { value: 100, message: t("Form.MaxLength100") },
          },
        },
        {
          name: "managerNameSurname",
          label: "ManagerNameSurname",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: {
            required: t("Form.Required"),
            maxLength: { value: 70, message: t("Form.MaxLength70") },
          },
        },
        {
          name: "managerIdentityNumber",
          label: "MIdentityNumber",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: {
            maxLength: { value: 20, message: t("Form.MaxLength", { max: 20 }) },
          },
        },
      ],
    },
    {
      name: t("Tenant.TaxAndContactInfo"),
      icon: <ReceiptLongOutlinedIcon color="primary" sx={{ width: 32, height: 32 }} />,
      schema: [
        {
          name: "taxNo",
          label: "TaxNo",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: { maxLength: { value: 50, message: t("Form.MaxLength50") } },
        },
        {
          name: "taxOfficeName",
          label: "TaxOfficeName",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: { maxLength: { value: 100, message: t("Form.MaxLength100") } },
        },
        {
          name: "languageId",
          label: "ContactLanguage",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Both,
          // `Lookups` + Language yerine `/v1/languages` listesi (bkz. companyHelpers).
          autoCompleteProps: { getOptions: getLanguageOptions },
          registerOptions: { required: t("Form.Required") },
        },
        {
          name: "mainCurrency",
          label: "MainCurrency",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Both,
          autoCompleteProps: { enumName: "Currency" },
          registerOptions: { required: t("Form.Required") },
        },
        {
          name: "contactInfo.locationUrl",
          label: "LocationUrl",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: { pattern: { value: URL_PATTERN, message: t("Form.CorrectWebSite") } },
        },
        {
          name: "contactInfo.webSiteAddress",
          label: "WebSiteAddress",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: { pattern: { value: URL_PATTERN, message: t("Form.CorrectWebSite") } },
        },
      ],
    },
    {
      multiSchema: [
        {
          name: t("Form.UploadImage"),
          icon: <ImageOutlinedIcon color="primary" sx={{ width: 32, height: 32 }} />,
          schema: [
            {
              name: "logo",
              visibility: FormItemVisibilityEnum.Both,
              type: FormItemTypeEnum.S3_IMAGE,
              label: "UploadLogo",
            },
          ],
        },
        {
          name: t("Form.UploadFile"),
          icon: <DescriptionOutlinedIcon color="primary" sx={{ width: 32, height: 32 }} />,
          schema: [
            {
              name: "documents",
              visibility: FormItemVisibilityEnum.Both,
              type: FormItemTypeEnum.FILE,
              label: "Documents",
              fileMultiple: true,
            },
          ],
        },
      ],
    },
    {
      gridSize: { xs: 12, sm: 12, md: 8 },
      name: t("Tenant.ContactInfo"),
      renderComponent: (apiData, formState) => <CompanyContactForm apiData={apiData} formState={formState} />,
      renderComponentVisiblitity: FormItemVisibilityEnum.Both,
    },
    {
      renderComponent: (apiData, formState) => <CompanyAddressList apiData={apiData} formState={formState} />,
      renderComponentVisiblitity: FormItemVisibilityEnum.Both,
    },
    {
      gridSize: 12,
      name: t("Form.Notes"),
      icon: <NotesOutlinedIcon color="primary" sx={{ width: 24, height: 24 }} />,
      schema: [
        {
          name: "notes",
          label: "Notes",
          type: FormItemTypeEnum.MultiArrayObjectInput,
          visibility: FormItemVisibilityEnum.Both,
          multiLine: true,
          rows: 6,
          // API not başına 2500 karakter sınırı koyuyor (CreateTenantValidator.noteRules).
          registerOptions: { maxLength: { value: 2500, message: t("Form.MaxLength", { max: 2500 }) } },
        },
      ],
    },
  ];

  /**
   * Oluşturma yanıtı `{ id, uploadInfos }` döner (MultiPreSignedUrlTenantIdNavigationDto);
   * `id` "acme_1" gibi bileşik bir dize olduğundan URL için kodlanır, detay sayfası çözer.
   */
  const succesCallback = (created?: { id?: string }) => {
    if (!created?.id) return;
    router.push(`/${locale}${Routes.Company}/${encodeURIComponent(created.id)}`);
  };

  return (
    <OpsPageForm
      data={data}
      schema={schema}
      pageHeaderProps={{
        goBackRouteName: Routes.Companies,
        addButonHref: Routes.Company,
        title: t("Modal.CompanyCreate"),
        editTitle: data?.name || t("Modal.CompanyDetail"),
      }}
      endpoint={ApiRoutes.CompanyDetail}
      succesCallback={succesCallback}
      pageName={OpsPageNames.TenantManagement}
    />
  );
}
