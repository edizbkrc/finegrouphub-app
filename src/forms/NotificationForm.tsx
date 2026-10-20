"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import { enumDefault, lookup } from "./helpers/formHelpers";

/**
 * Panel içi bildirim. Alıcı seçilmezse API, bildirim tipine abone olan
 * kullanıcıları kendisi bulur (`findRecipientsFromType`).
 */
export default function NotificationForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "type",
      label: "Type",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required") },
      gridSize: { xs: 12, md: 6 },
      autoCompleteProps: { enumName: "NotificationType", getDefaultValue: enumDefault("type", "typeDescription") },
    },
    {
      name: "recipients",
      label: "Users",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Add,
      gridSize: { xs: 12, md: 6 },
      infoText: t("Form.NotificationRecipientsInfo"),
      autoCompleteProps: {
        isMultiple: true,
        requestedPropertyName: "title",
        lookUpParams: lookup("User", ["UserName"]),
      },
    },
    {
      name: "text",
      label: "Message",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      multiLine: true,
      rows: 4,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 2500, message: t("Form.MaxLength", { max: 2500 }) },
      },
    },
    {
      name: "actionLink",
      label: "ActionLink",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { maxLength: { value: 500, message: t("Form.MaxLength", { max: 500 }) } },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.NotificationDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.NotificationManagement}
      title={t("Modal.NotificationCreate")}
      editTitle={t("Modal.NotificationDetail")}
      allowDetailRefetch={false}
      getAddExtraData={(formData) =>
        formData?.recipients?.length ? { findRecipientsFromType: false } : { findRecipientsFromType: true, recipients: [] }
      }
    />
  );
}
