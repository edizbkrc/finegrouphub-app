"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsPageForm from "@common/page/OpsPageForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";
import { usePageAction } from "@hooks/usePageAction";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import { OrderStateEnum, type IOrderDetail } from "@/features/order/types";
import type { IFeatureSpecification } from "@/features/offer/types";

/**
 * Alt sipariş formu. Üst sipariş (OpsPageFetcher'dan `data`) varsayılan fiyat/para birimi için,
 * projenin GÜNCEL özellikleri ise özellik seçiminin başlangıç değeri olarak kullanılır:
 * API alt siparişte yalnızca artırıma izin verir (azaltma reddedilir), bu yüzden başlangıç = mevcut durum.
 */
export default function SubOrderForm({ data }: { data?: IOrderDetail }) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const canAddSubOrder = usePageAction(OpsPageNames.OrderManagement, "AddSubOrder");

  const parentOrderId = data?.id ?? Number(decodeURIComponent(String(params?.id ?? "")));
  const projectId = data?.projectId ?? Number(decodeURIComponent(String(params?.projectId ?? "")));
  const parentPrice = data?.priceSpecs;

  const [projectSpecs, setProjectSpecs] = useState<IFeatureSpecification[] | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProjectSpecs([]);
      return;
    }
    axiosInstance
      .get(ApiRoutes.ProjectDetail, { params: { projectId }, withoutToast: true })
      .then((res) => setProjectSpecs(res?.data?.isSuccess ? ((res.data.data?.featureSpecifications as IFeatureSpecification[]) ?? []) : []))
      // Proje okunamazsa üst siparişin özellikleriyle devam edilir; API zaten düşürmeyi reddeder.
      .catch(() => setProjectSpecs([]));
  }, [projectId]);

  const backRoute = `${Routes.Order}/${parentOrderId}`;

  // API alt siparişi yalnızca tamamlanmış ana siparişe açar; formu hiç göstermeyip nedenini söylemek kullanıcıyı boş yere doldurmaktan kurtarır.
  if (data && (!data.isMainOrder || data.state !== OrderStateEnum.Completed)) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        <Alert severity="warning">{t("Order.SubOrderNotAllowed")}</Alert>
        <Box>
          <Link href={`/${locale}${backRoute}`}>
            <Button variant="outlined">{t("Form.Back")}</Button>
          </Link>
        </Box>
      </Stack>
    );
  }

  if (!data || projectSpecs === null) return <Skeleton variant="rounded" height="60vh" />;

  const initialSpecs = (projectSpecs.length > 0 ? projectSpecs : (data.featureSpecifications ?? [])).map((spec) => ({
    featureAlias: spec.featureAlias,
    value: spec.value,
  }));

  const withDefault = (item: IFormItem, value: unknown): IFormItem => (value === undefined || value === null ? item : { ...item, defaultValue: value });

  const decimal = (name: string, label: string, value: unknown, required = true, gridMd = 4, max: number = Number.MAX_SAFE_INTEGER): IFormItem =>
    withDefault(
      {
        name,
        label,
        type: FormItemTypeEnum.Decimal,
        visibility: FormItemVisibilityEnum.Add,
        gridSize: { xs: 12, md: gridMd },
        registerOptions: {
          ...(required ? { required: t("Form.Required") } : {}),
          min: { value: 0, message: t("Form.MinValue", { min: 0 }) },
          max: { value: max, message: t("Form.MaxValue", { max: max.toString() }) },
        },
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
      name: t("Order.SubOrder"),
      renderComponentVisiblitity: FormItemVisibilityEnum.Both,
      renderComponent: () => (
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {data.projectName} · {t("Order.ParentOrder", { id: data.id })}
          </Typography>
          <Alert severity="info" variant="outlined">
            {t("Order.SubOrderInfo")}
          </Alert>
        </Stack>
      ),
    },
    {
      name: t("Offer.PricingAndCurrency"),
      schema: [
        withDefault(
          {
            name: "serviceEndDate",
            label: "ServiceEndDate",
            type: FormItemTypeEnum.Date_Time,
            visibility: FormItemVisibilityEnum.Add,
            gridSize: { xs: 12, md: 4 },
            registerOptions: { required: t("Form.Required") },
          },
          data.serviceEndDate
        ),
        {
          name: "currency",
          label: "MainCurrency",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Add,
          gridSize: { xs: 12, md: 4 },
          registerOptions: { required: t("Form.Required") },
          defaultValue: parentPrice?.currencySnap?.currency ?? 0,
          autoCompleteProps: {
            enumName: "Currency",
            getDefaultValue: () => ({ id: parentPrice?.currencySnap?.currency ?? 0, title: parentPrice?.currencyDescription ?? "TRY" }),
          },
        },
        decimal("featureUnitPriceFactor", "FeatureUnitPriceFactor", parentPrice?.featureUnitPriceFactor ?? 1),
        decimal("vatPercentage", "VatPercentage", parentPrice?.vatPercentage ?? 20, true, 4, 100),
        decimal("discountAmount", "DiscountAmount", 0),
        decimal("prePaymentAmountWithVat", "PrePaymentAmountWithVat", 0),
        decimal("extraPriceWithoutVat", "ExtraPriceWithoutVat", 0, false),
        decimal("extraPriceVatPercentage", "ExtraPriceVatPercentage", parentPrice?.extraPriceVatPercentage ?? 20, false, 4, 100),
        {
          name: "extraPriceDescription",
          label: "ExtraPriceDescription",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Add,
          gridSize: { xs: 12, md: 8 },
          registerOptions: { maxLength: { value: 5000, message: t("Form.MaxLength", { max: 5000 }) } },
        },
        decimal("dailyMaintenancePriceWithoutVat", "DailyMaintenancePriceWithoutVat", parentPrice?.dailyMaintenancePriceWithoutVat ?? 0, false, 6),
        integer("maintenanceDurationInDays", "MaintenanceDurationInDays", parentPrice?.maintenanceDurationInDays ?? 0),
      ],
    },
    {
      name: t("Offer.TechnicalSpecifications"),
      schema: [
        {
          name: "featureSpecifications",
          label: "Features",
          type: FormItemTypeEnum.FEATURE_SPECIFICATIONS,
          visibility: FormItemVisibilityEnum.Add,
          defaultValue: initialSpecs,
        },
      ],
    },
  ];

  return (
    <OpsPageForm
      schema={schema}
      pageName={OpsPageNames.OrderManagement}
      endpoint={ApiRoutes.OrderDetail}
      addExtraData={() => ({ parentOrderId })}
      manipulateFormData={(_, formData) => {
        const { currency, ...rest } = formData;
        return {
          ...rest,
          // AutoSelect, kullanıcı açıp seçmedikçe form değerini doldurmaz; varsayılan para birimi burada tamamlanır.
          currencySnap: { currency: Number(currency ?? parentPrice?.currencySnap?.currency ?? 0) },
          // API yalnızca { featureAlias, value } okur; formdaki ek alanlar gövdeye taşınmaz.
          featureSpecifications: (formData.featureSpecifications ?? initialSpecs).map((item: IFeatureSpecification) => ({
            featureAlias: item.featureAlias,
            value: item.value,
          })),
        };
      }}
      succesCallback={(id) => router.push(`/${locale}${Routes.Order}/${id}`)}
      pageHeaderProps={{
        title: t("Modal.SubOrderCreate"),
        goBackRouteName: backRoute,
        showInfoButton: false,
        // Yetki, sayfanın genel "Create" izni değil "AddSubOrder" ek aksiyonudur (finehub ile aynı).
        submitButtonVisible: canAddSubOrder,
      }}
    />
  );
}
