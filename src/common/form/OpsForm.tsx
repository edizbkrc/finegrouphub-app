"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import axiosInstance from "@network/axiosInstance";
import { useAppDispatch } from "@redux/hooks";
import { setGeneralLoading, setOpsModalVisible } from "@redux/appSlice";
import { useOpsModal } from "@hooks/useOpsModal";
import { usePageInformation } from "@hooks/usePageInformation";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { CRUD_KEY } from "@network/adapters";
import { diffFormObject } from "@common/helpers/diffFormObject";
import { RemoveUndefinedValues } from "@common/helpers/removeUndefinedValues";
import { prepareTranslationData } from "@common/helpers/prepareTranslationData";
import { processUploadFields, uploadPendingFiles, type IUploadItem } from "@common/helpers/processFormUploads";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IOpsFormProps } from "@common/types/IOpsFormProps";
import OpsFormGenerator from "./OpsFormGenerator";
import OpsFormModal from "./OpsFormModal";

/**
 * Modal içi CRUD form motoru.
 *
 * Tek çağrıyla tam bir "yeni ekle / düzenle" akışı doğurur:
 *   <OpsForm url={ApiRoutes.UserDetail} scheme={UserFormSchema} title={...} />
 *
 * `opsModalData` (useOpsModal) `null` ise ekleme, dolu ise düzenleme modudur.
 */
export default function OpsForm({
  url,
  opsService,
  scheme,
  title,
  editTitle,
  customSubmit,
  succesCallback,
  pageName,
  allowDetailRefetch = true,
  getAddExtraData,
  getDeletedPropertyNames,
  lastDisabledRowId = 20,
  getDefaultValues,
  submitButtonVisible,
  manipulateFormData,
  renderExtra,
}: IOpsFormProps) {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { closeOpsModal, opsModalData, setModalData } = useOpsModal();
  const { supportedLanguage, loading, getLanguages, setLoading } = useSupportedLanguages();
  const pageInfo = usePageInformation(pageName);

  const pageAddAuth = !!(pageInfo?.hasCreate && pageInfo?.userCanCreate);
  const dataId = opsModalData?.id;
  // Seed kayıtlar (id <= lastDisabledRowId) düzenlenemez — Faz 6/7'deki
  // korumayla aynı sözleşme.
  const pageEditAuth =
    Number(dataId) > lastDisabledRowId || typeof dataId !== "number"
      ? !!(pageInfo?.hasEdit && pageInfo?.userCanEdit)
      : false;

  const [submitLoading, setSubmitLoading] = useState(false);
  const [trigger, setTrigger] = useState(false);

  const isEdit = !!opsModalData;

  const detailReFetch = (id: unknown) => {
    if (!url) return;

    axiosInstance
      .get(url, { params: { [opsService?.crudPropertyName ?? CRUD_KEY]: id }, withoutToast: true })
      .then((res) => {
        dispatch(setGeneralLoading(true));
        if (!res?.data?.isSuccess) {
          dispatch(setGeneralLoading(false));
          return;
        }
        setModalData(res.data.data);
        dispatch(setOpsModalVisible(true));
        dispatch(setGeneralLoading(false));
      })
      .catch(() => dispatch(setGeneralLoading(false)));
  };

  const handleSubmit = (form: Record<string, any>) => {
    let formData = RemoveUndefinedValues(form);
    formData = prepareTranslationData(scheme, formData, opsModalData?.translations, supportedLanguage);

    if (customSubmit) {
      customSubmit(formData, setSubmitLoading);
      return;
    }

    setSubmitLoading(true);

    const hasS3Upload = scheme.some((s) => s.type === FormItemTypeEnum.S3_IMAGE || s.type === FormItemTypeEnum.FILE);
    const uploadItems: IUploadItem[] = [];

    if (hasS3Upload) processUploadFields(formData, scheme, opsModalData, isEdit, uploadItems);

    const manipulatedData = manipulateFormData ? manipulateFormData(opsModalData, formData) : formData;
    const newData = isEdit ? diffFormObject(opsModalData, manipulatedData, getDefaultValues) : manipulatedData;

    getDeletedPropertyNames?.(formData, opsModalData)?.forEach((name) => delete newData[name]);

    if (Object.keys(newData).length === 0 && uploadItems.length === 0) {
      setSubmitLoading(false);
      enqueueSnackbar(t("Toast.NotChangedData"), { variant: "warning", autoHideDuration: 5000 });
      return;
    }

    const extraData = getAddExtraData?.(formData, form);

    axiosInstance
      .request({
        url,
        method: isEdit ? "PUT" : "POST",
        data: { ...newData, ...(extraData || {}), ...(isEdit && { id: opsModalData?.id }) },
      })
      .then(async (res) => {
        const resData = res?.data;

        if (!resData?.isSuccess) {
          setSubmitLoading(false);
          return;
        }

        if (hasS3Upload) {
          await uploadPendingFiles(resData, uploadItems, () =>
            enqueueSnackbar(t("Toast.ImageUploadError"), { variant: "error", autoHideDuration: 5000 })
          );
        }

        succesCallback?.();
        closeOpsModal();
        opsService?.initialProcess();
        setSubmitLoading(false);

        if (allowDetailRefetch && resData?.data) {
          const refetchId =
            typeof resData.data === "number" || typeof resData.data === "string" ? resData.data : resData.data?.id;
          if (refetchId) detailReFetch(refetchId);
        }
      })
      .catch(() => setSubmitLoading(false));
  };

  const filteredScheme = scheme.filter((s) => {
    const isEditVisible = s.visibility === FormItemVisibilityEnum.Edit || s.visibility === FormItemVisibilityEnum.Both;
    const isAddVisible = s.visibility === FormItemVisibilityEnum.Add || s.visibility === FormItemVisibilityEnum.Both;
    return isEdit ? isEditVisible : isAddVisible;
  });

  useEffect(() => {
    const hasLanguageText = scheme.some((s) => s.type.startsWith("LANGUAGE_"));
    if (hasLanguageText) getLanguages();
    else setLoading(false);

    dispatch(setGeneralLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;

  return (
    <OpsFormModal setTrigger={setTrigger}>
      <ErrorBoundary>
        <OpsFormGenerator
          languages={supportedLanguage}
          trigger={trigger}
          submitLoading={submitLoading}
          schema={filteredScheme}
          onSubmit={handleSubmit}
          title={title}
          editTitle={editTitle}
          apiData={opsModalData}
          isEdit={isEdit}
          submitButtonVisible={submitButtonVisible !== undefined ? submitButtonVisible : isEdit ? pageEditAuth : pageAddAuth}
          renderExtra={renderExtra}
        />
      </ErrorBoundary>
    </OpsFormModal>
  );
}
