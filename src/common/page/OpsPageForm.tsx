"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import axiosInstance from "@network/axiosInstance";
import { CRUD_KEY } from "@network/adapters";
import { usePageInformation } from "@hooks/usePageInformation";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import { ErrorBoundary } from "@components/ErrorBoundary";
import LoadingComponent from "@components/LoadingComponent";
import { diffFormObject } from "@common/helpers/diffFormObject";
import { RemoveUndefinedValues } from "@common/helpers/removeUndefinedValues";
import { prepareTranslationData } from "@common/helpers/prepareTranslationData";
import { flattenSchemas } from "@common/helpers/flattenSchemas";
import { filterOpsGridSchema } from "@common/helpers/filterOpsGridSchema";
import { processUploadFields, uploadPendingFiles, type IUploadItem } from "@common/helpers/processFormUploads";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import type { IOpsPageFormProps } from "@common/types/IOpsPageFormProps";
import OpsPageFormGenerator from "./OpsPageFormGenerator";

const OpsPageFormDeleteDialog = dynamic(() => import("./OpsPageFormDeleteDialog"));
const FormSkeleton = dynamic(() => import("./OpsPageFormSkeleton"));

/** İç içe şemalarda herhangi bir yerde `LANGUAGE_*` alanı var mı? */
const hasLanguageText = (schema?: IOpsPageFormItem[]): boolean =>
  !!schema?.some((s) => s.schema?.some((item) => item.type.startsWith("LANGUAGE_")) || hasLanguageText(s.multiSchema));

/**
 * Tam sayfa (URL'de kendi rotası olan) CRUD form motoru.
 *
 * OpsForm'un (modal) tam sayfa karşılığı — aynı diffFormObject/upload
 * sözleşmesini kullanır, ama iç içe grup şeması (`IOpsPageFormItem[]`) alır.
 */
export default function OpsPageForm({
  endpoint,
  schema,
  customSubmit,
  succesCallback,
  errorCallback,
  data: apiData,
  deletePropertyName,
  deleteModalProps,
  deleteProcessCallback,
  pageName,
  addExtraData,
  getDeletedPropertyNames,
  lastDisabledRowId = 20,
  getDefaultValues,
  pageHeaderProps,
  manipulateFormData,
}: IOpsPageFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Toast");
  const { enqueueSnackbar } = useSnackbar();
  const { supportedLanguage, getLanguages } = useSupportedLanguages();
  const pageInfo = usePageInformation(pageName);
  // Dil yüklemesi Redux'ta paylaşıldığı için çocuk bileşenlerin getLanguages
  // çağırması bu formu tekrar skeleton'a düşürmesin diye yerel bayrak kullanılır.
  const [languagesBootstrapping, setLanguagesBootstrapping] = useState(() => hasLanguageText(schema));

  const pageAddAuth = !!(pageInfo?.hasCreate && pageInfo?.userCanCreate);
  const dataId = apiData?.id;
  const isProtectedRow = Number(dataId) > lastDisabledRowId || typeof dataId !== "number" ? false : true;
  const pageEditAuth = !isProtectedRow && !!(pageInfo?.hasEdit && pageInfo?.userCanEdit);
  const pageDeleteAuth = !isProtectedRow && !!(pageInfo?.hasDelete && pageInfo?.userCanDelete);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const isEdit = !!apiData;
  const filteredSchema = filterOpsGridSchema(schema, isEdit);

  const handleSubmit = (form: Record<string, any>) => {
    const allScheme = flattenSchemas(schema);
    let formData = RemoveUndefinedValues(form);
    formData = prepareTranslationData(allScheme, formData, apiData?.translations, supportedLanguage);

    if (customSubmit) {
      customSubmit(formData, setSubmitLoading);
      return;
    }

    setSubmitLoading(true);

    const hasS3Upload = allScheme.some((s) => s.type === FormItemTypeEnum.S3_IMAGE || s.type === FormItemTypeEnum.FILE);
    const uploadItems: IUploadItem[] = [];

    if (hasS3Upload) processUploadFields(formData, allScheme, apiData, isEdit, uploadItems);

    const manipulatedData = manipulateFormData ? manipulateFormData(apiData, formData) : formData;
    const newData = isEdit ? diffFormObject(apiData, manipulatedData, getDefaultValues) : manipulatedData;

    getDeletedPropertyNames?.(formData, apiData)?.forEach((name) => delete newData[name]);

    if (Object.keys(newData).length === 0 && uploadItems.length === 0) {
      setSubmitLoading(false);
      enqueueSnackbar(t("NotChangedData"), { variant: "warning", autoHideDuration: 5000 });
      return;
    }

    const extraData = addExtraData?.(formData, apiData);

    axiosInstance
      .request({
        url: endpoint,
        method: isEdit ? "PUT" : "POST",
        data: { ...newData, ...(extraData || {}), ...(isEdit && { id: apiData?.id }) },
      })
      .then(async (res) => {
        const resData = res?.data;

        if (!resData?.isSuccess) {
          setSubmitLoading(false);
          return;
        }

        if (hasS3Upload) {
          await uploadPendingFiles(resData, uploadItems, () =>
            enqueueSnackbar(t("ImageUploadError"), { variant: "error", autoHideDuration: 5000 })
          );
        }

        succesCallback?.(resData?.data);
        setSubmitLoading(false);
      })
      .catch(() => {
        setSubmitLoading(false);
        errorCallback?.();
      });
  };

  const handleDeleteModalClose = () => setDeleteModalVisible(false);

  const handleDelete = () => {
    handleDeleteModalClose();
    if (!endpoint) return;

    const deletedRowId = apiData?.id;
    if (deletedRowId === undefined) return;

    setSubmitLoading(true);

    axiosInstance
      .delete(endpoint, { params: { [deletePropertyName ?? CRUD_KEY]: deletedRowId } })
      .then((res) => {
        setSubmitLoading(false);
        handleDeleteModalClose();
        if (res?.data?.isSuccess) {
          if (pageHeaderProps?.goBackRouteName) router.push(`/${locale}${pageHeaderProps.goBackRouteName}`);
          deleteProcessCallback?.("success");
        }
      })
      .catch(() => {
        setSubmitLoading(false);
        deleteProcessCallback?.("error");
      });
  };

  useEffect(() => {
    if (!languagesBootstrapping) return;
    Promise.resolve(getLanguages()).finally(() => setLanguagesBootstrapping(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (languagesBootstrapping) return <FormSkeleton />;

  return (
    <>
      <LoadingComponent open={submitLoading} />
      <ErrorBoundary>
        <OpsPageFormGenerator
          pageHeaderProps={{
            ...pageHeaderProps,
            submitButtonVisible:
              pageHeaderProps?.submitButtonVisible === undefined ? (isEdit ? pageEditAuth : pageAddAuth) : pageHeaderProps.submitButtonVisible,
            deleteButtonVisible:
              pageHeaderProps?.deleteButtonVisible === undefined ? (isEdit ? pageDeleteAuth : false) : pageHeaderProps.deleteButtonVisible,
          }}
          languages={supportedLanguage}
          schema={filteredSchema}
          onSubmit={handleSubmit}
          apiData={apiData}
          isEdit={isEdit}
          handleDelete={() => setDeleteModalVisible(true)}
        />
      </ErrorBoundary>
      <OpsPageFormDeleteDialog
        deleteModalProps={deleteModalProps}
        deleteModalVisible={deleteModalVisible}
        handleDeleteModalClose={handleDeleteModalClose}
        handleDelete={handleDelete}
      />
    </>
  );
}
