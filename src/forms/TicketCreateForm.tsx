"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import { TicketStateEnum } from "@/features/ticket/types";
import { lookup } from "./helpers/formHelpers";

interface IUploadedDocument {
  id?: string;
  fileName?: string;
  fileExtension?: string;
}

/** Yeni destek talebi: ilk mesaj (ve ekleri) ile açılır; kayıttan sonra liste yenilenir. */
export default function TicketCreateForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();
  const { currentLanguage, getLanguages } = useSupportedLanguages();

  // Dil listesi başka bir yerde yüklenmemiş olabilir; panel dilinin kimliği (tr/en) buradan çözülür.
  useEffect(() => {
    getLanguages();
  }, [getLanguages]);

  const scheme: IFormItem[] = [
    {
      name: "title",
      label: "Title",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Add,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "tenantId",
      label: "Tenant",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Add,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: { lookUpParams: lookup("Tenant") },
    },
    {
      name: "type",
      label: "Type",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Add,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: { enumName: "TicketType" },
    },
    {
      name: "message",
      label: "Message",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Add,
      multiLine: true,
      rows: 5,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 5000, message: t("Form.MaxLength", { max: 5000 }) },
      },
    },
    {
      // API ticket eklerini görsel uzantı listesine karşı doğrular (jpg, jpeg, png, svg).
      name: "documents",
      label: "Attachments",
      type: FormItemTypeEnum.FILE,
      visibility: FormItemVisibilityEnum.Add,
      fileType: OpsFileTypeEnum.Image,
      fileMultiple: true,
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.TicketDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.TicketManagement}
      title={t("Modal.CreateTicket")}
      allowDetailRefetch={false}
      manipulateFormData={(_, formData) => {
        const { documents, message, ...rest } = formData as Record<string, unknown> & { documents?: IUploadedDocument[]; message?: string };
        return {
          ...rest,
          // API ilk mesajı nesne olarak bekler; ekler üst düzey değil mesajın içinde gider.
          message: {
            message,
            documents: (documents ?? []).map((doc, index) => ({
              id: doc.id,
              fileName: doc.fileName,
              fileExtension: doc.fileExtension,
              order: index,
            })),
          },
          // Yeni talep her zaman "Açık" başlar; dil, panelin o anki arayüz dilidir (sabit kimlik değil).
          state: TicketStateEnum.Open,
          languageId: currentLanguage.id,
        };
      }}
      editTitle={t("Modal.CreateTicket")}
      lastDisabledRowId={0}
    />
  );
}
