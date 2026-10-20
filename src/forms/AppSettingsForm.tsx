"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsPageForm from "@common/page/OpsPageForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";

interface IAppSettingsFormProps {
  data?: { id?: number };
  reFetch?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Uygulama geneli ayarlar — tek kayıt, yalnızca güncellenir. */
export default function AppSettingsForm({ data, reFetch }: IAppSettingsFormProps) {
  const t = useTranslations();

  const emailListItem = (name: string, label: string) => ({
    name,
    label,
    type: FormItemTypeEnum.MultiArrayTextInput,
    visibility: FormItemVisibilityEnum.Both,
    registerOptions: { pattern: { value: EMAIL_PATTERN, message: t("Form.CorrectEmail") } },
  });

  const schema: IOpsPageFormItem[] = [
    {
      name: t("Modal.GeneralSettings"),
      schema: [
        {
          name: "maxDiscountRate",
          label: "MaxDiscountRate",
          type: FormItemTypeEnum.Decimal,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12, md: 4 },
          registerOptions: {
            required: t("Form.Required"),
            min: { value: 0, message: t("Form.MinValue", { min: 0 }) },
            max: { value: 100, message: t("Form.MaxValue", { max: 100 }) },
          },
        },
        {
          name: "offerExpirationDay",
          label: "OfferExpirationDay",
          type: FormItemTypeEnum.NUMBER,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12, md: 4 },
          registerOptions: { required: t("Form.Required"), min: { value: 1, message: t("Form.MinValue", { min: 1 }) } },
        },
        {
          name: "workspaceLockMinute",
          label: "WorkspaceLockMinute",
          type: FormItemTypeEnum.NUMBER,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12, md: 4 },
          registerOptions: { required: t("Form.Required"), min: { value: 1, message: t("Form.MinValue", { min: 1 }) } },
        },
      ],
    },
    {
      name: t("Modal.MailRecipients"),
      schema: [
        emailListItem("fine3dMailRecipients", "Fine3dMailRecipients"),
        emailListItem("fineprojectPublicSiteMailRecipients", "FineprojectPublicSiteMailRecipients"),
      ],
    },
  ];

  return (
    <OpsPageForm
      data={data}
      schema={schema}
      pageName={OpsPageNames.AppSettingsManagement}
      endpoint={ApiRoutes.AppSettings}
      succesCallback={() => reFetch?.()}
      pageHeaderProps={{ title: t("Modal.AppSettings"), editTitle: t("Modal.AppSettings") }}
    />
  );
}
