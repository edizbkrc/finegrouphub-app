"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsPageForm from "@common/page/OpsPageForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { diffFormObject } from "@common/helpers/diffFormObject";
import { uploadPendingFiles, type IUploadItem } from "@common/helpers/processFormUploads";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import { ProjectEndpoint } from "@/features/project/helpers/ProjectEndpoint";
import { prepareNestedImageItems } from "@forms/helpers/prepareNestedImageItems";
import InfoCardFormItems from "./InfoCardFormItems";

/** Tam sayfa bilgi kartı formu — prod hub `info-card` / `info-card/[id]` akışı. */
export default function InfoCardForm({ data, reFetch }: { data?: any; reFetch?: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const projectId = Number(params?.projectId);
  const isEdit = !!data;

  const schema: IOpsPageFormItem[] = [
    {
      schema: [
        {
          name: "name",
          label: "Name",
          type: FormItemTypeEnum.LANGUAGE_TEXT,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: {
            required: t("Form.Required"),
            maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
          },
        },
      ],
    },
    {
      renderComponent: (apiData, formState) => <InfoCardFormItems apiData={apiData} formState={formState} />,
      renderComponentVisiblitity: FormItemVisibilityEnum.Both,
    },
  ];

  const succesCallback = (responseData: any) => {
    if (isEdit) {
      reFetch?.();
      return;
    }
    const id = typeof responseData === "object" && responseData !== null ? responseData.id : responseData;
    if (id) {
      router.push(`/${locale}${ProjectEndpoint.InfoCard(projectId, id)}`);
      return;
    }
    router.push(`/${locale}${ProjectEndpoint.InfoCards(projectId)}`);
  };

  const customSubmit = (formData: Record<string, any>, setSubmitLoading: (v: boolean) => void) => {
    setSubmitLoading(true);
    const uploadItems: IUploadItem[] = [];
    prepareNestedImageItems(formData.items, uploadItems, data?.items);

    const payload = isEdit ? diffFormObject(data, formData) : { ...formData, projectId, items: formData.items ?? [] };

    if (Object.keys(payload).length === 0 && uploadItems.length === 0) {
      setSubmitLoading(false);
      enqueueSnackbar(t("Toast.NotChangedData"), { variant: "warning", autoHideDuration: 5000 });
      return;
    }

    axiosInstance
      .request({
        url: ApiRoutes.InfoCardDetail,
        method: isEdit ? "PUT" : "POST",
        data: { ...payload, ...(isEdit && { id: data?.id }), projectId },
      })
      .then(async (res) => {
        if (!res?.data?.isSuccess) {
          setSubmitLoading(false);
          return;
        }
        await uploadPendingFiles(res.data, uploadItems, () =>
          enqueueSnackbar(t("Toast.ImageUploadError"), { variant: "error", autoHideDuration: 5000 })
        );
        succesCallback(res.data.data);
        setSubmitLoading(false);
      })
      .catch(() => setSubmitLoading(false));
  };

  return (
    <OpsPageForm
      data={data}
      schema={schema}
      pageHeaderProps={{
        goBackRouteName: ProjectEndpoint.InfoCards(projectId),
        title: t("Modal.InfoCardCreate"),
        editTitle: data?.name || t("Modal.InfoCardDetail"),
      }}
      endpoint={ApiRoutes.InfoCardDetail}
      deletePropertyName="InfoCardId"
      succesCallback={succesCallback}
      pageName={OpsPageNames.ProjectOperationManagement}
      customSubmit={customSubmit}
      lastDisabledRowId={0}
    />
  );
}
