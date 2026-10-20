"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

/**
 * İletişim formları sitelerden (Fine3D / public site) gelir; panelden oluşturulmaz.
 * Gönderen bilgileri salt okunur, yalnızca "görüldü" ve "e-posta listesi" güncellenir.
 * Detay ucu yok — satır verisi kullanılır (`useTableData`).
 */
export default function ContactFormForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();
  const readOnly = () => true;

  const scheme: IFormItem[] = [
    { name: "nameSurname", label: "NameSurname", type: FormItemTypeEnum.TEXT, visibility: FormItemVisibilityEnum.Edit, inputDisabled: readOnly, gridSize: { xs: 12, md: 6 } },
    { name: "email", label: "Email", type: FormItemTypeEnum.TEXT, visibility: FormItemVisibilityEnum.Edit, inputDisabled: readOnly, gridSize: { xs: 12, md: 6 } },
    { name: "phoneNumber", label: "Phone", type: FormItemTypeEnum.TEXT, visibility: FormItemVisibilityEnum.Edit, inputDisabled: readOnly, gridSize: { xs: 12, md: 6 } },
    { name: "fromDescription", label: "From", type: FormItemTypeEnum.TEXT, visibility: FormItemVisibilityEnum.Edit, inputDisabled: readOnly, gridSize: { xs: 12, md: 6 } },
    { name: "message", label: "Message", type: FormItemTypeEnum.TEXT, visibility: FormItemVisibilityEnum.Edit, inputDisabled: readOnly, multiLine: true, rows: 5 },
    { name: "seen", label: "Seen", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Edit, gridSize: { xs: 12, md: 6 } },
    { name: "mailingListAccepted", label: "MailingListAccepted", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Edit, gridSize: { xs: 12, md: 6 } },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ContactFormDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ContactFormManagement}
      title={t("Modal.ContactFormDetail")}
      editTitle={t("Modal.ContactFormDetail")}
      allowDetailRefetch={false}
      // Salt okunur alanlar PUT gövdesine girmesin (komut yalnızca seen/mailingListAccepted kabul eder).
      getDeletedPropertyNames={() => ["nameSurname", "email", "phoneNumber", "fromDescription", "message"]}
    />
  );
}
