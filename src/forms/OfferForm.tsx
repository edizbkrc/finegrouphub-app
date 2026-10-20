"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsPageForm from "@common/page/OpsPageForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import type { IOfferDetail } from "@/features/offer/types";
import { lookup } from "./helpers/formHelpers";

interface IOfferFormProps {
  /** Yeni versiyon oluştururken önceki teklif — alanlar onunla dolar, `previousOfferId` eklenir. */
  template?: IOfferDetail;
}

const getFeatureGroupOptions = (setLoading: (loading: boolean) => void, setOptions: (values: unknown[]) => void) => {
  setLoading(true);
  axiosInstance
    .patch(ApiRoutes.FeatureGroups, { pageNumber: 1, rowCount: 200 }, { withoutToast: true })
    .then((res) => {
      const rows = (res?.data?.data as { id: number; name: string }[] | undefined) ?? [];
      setOptions(rows.map((row) => ({ id: row.id, title: row.name })));
    })
    .catch(() => setOptions([]))
    .finally(() => setLoading(false));
};

/**
 * Teklif oluşturma. Teklifler değiştirilemez: düzeltme gerektiğinde aynı
 * correlation altında "yeni versiyon" açılır (bu form `template` ile).
 * API tüm Fine özellikleri için değer ister — FEATURE_SPECIFICATIONS hepsini listeler.
 */
export default function OfferForm({ template }: IOfferFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const price = template?.priceSpecs;

  const withDefault = (item: IFormItem, value: unknown): IFormItem =>
    value === undefined || value === null ? item : { ...item, defaultValue: value };

  const decimal = (name: string, label: string, value: unknown, required = true, gridMd = 4): IFormItem =>
    withDefault(
      {
        name,
        label,
        type: FormItemTypeEnum.Decimal,
        visibility: FormItemVisibilityEnum.Add,
        gridSize: { xs: 12, md: gridMd },
        registerOptions: required ? { required: t("Form.Required") } : undefined,
      },
      value
    );

  const integer = (name: string, label: string, value: unknown, gridMd = 6): IFormItem =>
    withDefault(
      {
        name,
        label,
        type: FormItemTypeEnum.NUMBER,
        visibility: FormItemVisibilityEnum.Add,
        gridSize: { xs: 12, md: gridMd },
        registerOptions: { required: t("Form.Required"), min: { value: 0, message: t("Form.MinValue0") } },
      },
      value
    );

  const schema: IOpsPageFormItem[] = [
    {
      name: t("Offer.TenantInfo"),
      schema: [
        {
          name: "tenantId",
          label: "Tenant",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Add,
          gridSize: { xs: 12, md: 6 },
          registerOptions: { required: t("Form.Required") },
          handleDisabled: () => !!template,
          defaultValue: template?.tenant?.id,
          autoCompleteProps: {
            lookUpParams: lookup("Tenant"),
            getDefaultValue: () =>
              template?.tenant ? { id: template.tenant.id, title: template.tenant.name ?? String(template.tenant.id) } : null,
          },
        },
        withDefault(
          {
            name: "projectName",
            label: "ProjectName",
            type: FormItemTypeEnum.TEXT,
            visibility: FormItemVisibilityEnum.Add,
            gridSize: { xs: 12, md: 6 },
            registerOptions: {
              required: t("Form.Required"),
              maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
            },
          },
          template?.projectName
        ),
        withDefault(
          {
            name: "text",
            label: "OfferText",
            type: FormItemTypeEnum.TEXT,
            visibility: FormItemVisibilityEnum.Add,
            multiLine: true,
            rows: 4,
            registerOptions: { maxLength: { value: 5000, message: t("Form.MaxLength", { max: 5000 }) } },
          },
          template?.text
        ),
      ],
    },
    {
      name: t("Offer.DeliveryDurations"),
      schema: [
        integer("minDeliveryDurationInDays", "MinDeliveryDurationInDays", template?.minDeliveryDurationInDays ?? 30),
        integer("maxDeliveryDurationInDays", "MaxDeliveryDurationInDays", template?.maxDeliveryDurationInDays ?? 60),
      ],
    },
    {
      name: t("Offer.TechnicalSpecifications"),
      schema: [
        {
          name: "featureGroupId",
          label: "FeatureGroups",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Add,
          defaultValue: template?.featureGroup?.id,
          autoCompleteProps: {
            getOptions: getFeatureGroupOptions,
            getDefaultValue: () =>
              template?.featureGroup ? { id: template.featureGroup.id, title: template.featureGroup.name ?? "" } : null,
          },
        },
        withDefault(
          {
            name: "featureSpecifications",
            label: "Features",
            type: FormItemTypeEnum.FEATURE_SPECIFICATIONS,
            visibility: FormItemVisibilityEnum.Add,
          },
          template?.featureSpecifications?.map((spec) => ({ featureAlias: spec.featureAlias, value: spec.value }))
        ),
      ],
    },
    {
      name: t("Offer.PricingAndCurrency"),
      schema: [
        {
          name: "currency",
          label: "OfferCurrency",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Add,
          infoText: t("Form.OfferCurrencyInfo"),
          gridSize: { xs: 12, md: 4 },
          registerOptions: { required: t("Form.Required") },
          defaultValue: price?.currencySnap?.currency ?? 0,
          autoCompleteProps: {
            enumName: "Currency",
            getDefaultValue: () => {
              const value = price?.currencySnap?.currency ?? 0;
              return { id: value, title: price?.currencyDescription ?? "TRY" };
            },
          },
        },
        decimal("featureUnitPriceFactor", "FeatureUnitPriceFactor", price?.featureUnitPriceFactor ?? 1),
        decimal("vatPercentage", "VatPercentage", price?.vatPercentage ?? 20),
        decimal("discountAmount", "DiscountAmount", price?.discountAmount ?? 0),
        decimal("prePaymentAmountWithVat", "PrePaymentAmountWithVat", price?.prePaymentAmountWithVat ?? 0),
        decimal("extraPriceWithoutVat", "ExtraPriceWithoutVat", price?.extraPriceWithoutVat ?? 0, false),
        decimal("extraPriceVatPercentage", "ExtraPriceVatPercentage", price?.extraPriceVatPercentage ?? 20, false),
        withDefault(
          {
            name: "extraPriceDescription",
            label: "ExtraPriceDescription",
            type: FormItemTypeEnum.TEXT,
            visibility: FormItemVisibilityEnum.Add,
            gridSize: { xs: 12, md: 8 },
            registerOptions: { maxLength: { value: 500, message: t("Form.MaxLength", { max: 500 }) } },
          },
          price?.extraPriceDescription
        ),
        decimal("dailyMaintenancePriceWithoutVat", "DailyMaintenancePriceWithoutVat", price?.dailyMaintenancePriceWithoutVat ?? 0, false, 6),
        integer("maintenanceDurationInDays", "MaintenanceDurationInDays", price?.maintenanceDurationInDays ?? 365),
      ],
    },
    {
      name: t("Offer.CommunicationSettings"),
      schema: [
        {
          name: "sendMailToCompany",
          label: "SendMailToCompany",
          type: FormItemTypeEnum.SWITCH,
          visibility: FormItemVisibilityEnum.Add,
          infoText: t("Form.SendMailToCompanyInfo"),
          defaultValue: false,
        },
      ],
    },
  ];

  return (
    <OpsPageForm
      schema={schema}
      pageName={OpsPageNames.OfferManagement}
      endpoint={ApiRoutes.OfferDetail}
      manipulateFormData={(_, formData) => {
        const { currency, ...rest } = formData;
        return {
          ...rest,
          // AutoSelect, kullanıcı açıp seçmedikçe form değerini doldurmaz; varsayılanlar burada tamamlanır.
          currencySnap: { currency: Number(currency ?? price?.currencySnap?.currency ?? 0) },
          featureGroupId: rest.featureGroupId ?? template?.featureGroup?.id ?? null,
          ...(template ? { previousOfferId: template.id, tenantId: template.tenant?.id } : {}),
        };
      }}
      succesCallback={(id) => router.push(`/${locale}${Routes.Offer}/${id}`)}
      pageHeaderProps={{
        title: template ? t("Modal.NewVersiyonOfferCreate") : t("Modal.OfferCreate"),
        goBackRouteName: template ? `${Routes.Offer}/${template.id}` : Routes.Offers,
        showInfoButton: false,
      }}
    />
  );
}
