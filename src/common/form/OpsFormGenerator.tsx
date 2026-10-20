"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Box, Button, Grid, InputLabel, Stack, Typography } from "@mui/material";
import { Close, Save } from "@mui/icons-material";
import { useOpsModal } from "@hooks/useOpsModal";
import { lowercaseFirstLetter } from "@helpers/Common/lowercaseFirstLetter";
import DateProvider from "@/providers/DateProvider";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { ICommonInputProps } from "@common/types/ICommonInputProps";
import type { IOpsFormGeneratorProps } from "@common/types/IOpsFormGeneratorProps";
import { buildFieldRenderers, getNestedValue } from "./OpsFormGeneratorShared";

const OpsFormAuditInfo = dynamic(() => import("./OpsFormAuditInfo"));
const OpsEditor = dynamic(() => import("../inputs/OpsEditor"));
const LabelFields = dynamic(() => import("../inputs/LabelFields"));
const TelInput = dynamic(() => import("../inputs/TelInput"));
const FileInput = dynamic(() => import("../inputs/FileInput"));
const MultiLangArrayInput = dynamic(() => import("../inputs/MultiLangArrayInput"));
const MultiLangFileInput = dynamic(() => import("../inputs/MultiLangFileInput"));
const MultiArrayTextInput = dynamic(() => import("../inputs/MultiArrayTextInput"));
const MultiLangEditor = dynamic(() => import("../inputs/MultiLangEditor"));
const MuiIconAutocomplete = dynamic(() => import("../inputs/MuiIconAutocomplete"));

/**
 * JSON şemadan (IFormItem[]) modal/drawer içi formu üretir.
 *
 * Form dosyaları (`src/forms/*.tsx`) yalnızca şema döndürür; bu bileşen JSX'i
 * üretir. Şema → tip eşlemesi `OpsFormGeneratorShared.buildFieldRenderers`'ta
 * (OpsPageFormGenerator ile paylaşılır).
 */
export default function OpsFormGenerator({
  trigger,
  schema,
  onSubmit,
  submitLoading,
  apiData,
  isEdit,
  submitButtonVisible,
  title,
  editTitle,
  languages,
  handleClose,
  renderBefore,
  renderExtra,
}: IOpsFormGeneratorProps) {
  const t = useTranslations("Form");
  const { closeOpsModal } = useOpsModal();
  const {
    register,
    control,
    setValue,
    handleSubmit,
    watch,
    trigger: triggerValidation,
    formState: { errors, isDirty, isSubmitting },
  } = useForm();

  const [selectedLang, setSelectedLang] = useState(languages[0]?.code);
  const handleLanguageChange = (event: { target: { value: string } }) => setSelectedLang(event.target.value);

  const fieldRenderers = buildFieldRenderers({
    languages,
    selectedLang,
    handleLanguageChange,
    watch,
    OpsEditor,
    LabelFields,
    TelInput,
    FileInput,
    MultiLangArrayInput,
    MultiLangFileInput,
    MultiArrayTextInput,
    MultiLangEditor,
    MuiIconAutocomplete,
  });

  const renderField = (formItem: IFormItem) => {
    const error = getNestedValue(errors, formItem?.name);
    const errorMessage = error ? error.message?.toString() : "";
    const defaultValue = getNestedValue(apiData, formItem?.name) ?? formItem?.defaultValue;

    const commonProps: ICommonInputProps = {
      formItem,
      register,
      setValue,
      control,
      apiData,
      t,
      error: !!error,
      errorMessage,
      defaultValue,
      isEdit,
      variant: "standard",
    };

    return fieldRenderers.get(formItem.type)?.(commonProps) ?? null;
  };

  const renderFieldLabel = (formItem: IFormItem) => (
    <Typography variant="body1" fontWeight="Bold">
      {formItem.hanndleDisabledLabel?.(apiData) ?? apiData?.[lowercaseFirstLetter(formItem.name)]}
    </Typography>
  );

  const renderGridItem = (field: IFormItem) => {
    const hasLabel = field.type !== FormItemTypeEnum.S3_IMAGE && field.type !== FormItemTypeEnum.Image;

    if (field?.handleVisibility && !field.handleVisibility(apiData, watch)) {
      return (
        <Grid container key={field.name} sx={{ display: "none" }}>
          {renderField(field)}
        </Grid>
      );
    }

    return (
      <Grid
        container
        key={field.name}
        sx={{
          width: "100%",
          borderBottom: "1px dashed",
          borderColor: "borderdashed.main",
          p: 2,
          py: 3,
          "&:last-child": { borderBottom: "none" },
          display: "flex",
          alignItems: "center",
        }}
      >
        {hasLabel && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <InputLabel sx={{ fontWeight: "Bold", fontSize: "16px", wordWrap: "break-word", wordBreak: "break-word", whiteSpace: "normal" }}>
              {field.labelText ?? t(field.label)}
            </InputLabel>
          </Grid>
        )}

        <Grid size={hasLabel ? { xs: 12, sm: 8 } : 12} pl={hasLabel ? [0, 2] : 0} mt={[2, 0]}>
          {field?.handleDisabled?.(isEdit, apiData) ? renderFieldLabel(field) : renderField(field)}
        </Grid>

        <Grid size={12} mt={1}>
          {field.infoText && (
            <Typography variant="caption" sx={{ color: "#7E7E7E" }}>
              {field.infoText}
            </Typography>
          )}
        </Grid>
      </Grid>
    );
  };

  return (
    <DateProvider>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ position: "relative" }}>
          <StickyHeader trigger={trigger}>
            <Box sx={{ display: "flex", flexDirection: ["column", "row"], alignItems: ["flex-start", "center"], justifyContent: "space-between", width: "100%" }}>
              <Typography variant="h5" sx={{ fontWeight: "SemiBold" }}>
                {isEdit ? editTitle : title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: [2, 0], width: ["100%", "auto"] }}>
                <Button
                  variant="outlined"
                  startIcon={<Close />}
                  sx={{ borderRadius: "10px", boxShadow: 0, width: ["100%", "auto"] }}
                  color="primary"
                  onClick={handleClose ?? closeOpsModal}
                  data-cy="ops-form-cancel-button"
                >
                  {t("Cancel")}
                </Button>
                {submitButtonVisible && (
                  <Button
                    disabled={!isDirty || isSubmitting}
                    loading={submitLoading}
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: "10px", boxShadow: 0, width: ["100%", "auto"] }}
                    data-cy="ops-form-submit-button"
                    startIcon={<Save />}
                  >
                    {t("Save")}
                  </Button>
                )}
              </Stack>
            </Box>
          </StickyHeader>

          {renderBefore?.(apiData, { register, control, setValue, errors, trigger: triggerValidation })}

          <Grid container spacing={1} sx={{ borderRadius: "10px", boxShadow: 1, mt: 4, overflow: "auto", backgroundColor: "background.default" }}>
            {schema.map((field) => renderGridItem(field))}
          </Grid>

          {renderExtra?.(apiData, { register, control, setValue, errors, trigger: triggerValidation })}

          {apiData?.auditInfo && <OpsFormAuditInfo auditInfo={apiData.auditInfo} />}
        </Box>
      </form>
    </DateProvider>
  );
}

function StickyHeader({ trigger, children }: { trigger?: boolean; children: ReactNode }) {
  return (
    <Box
      sx={{
        position: "sticky",
        top: trigger ? -32 : 0,
        zIndex: 1100,
        backdropFilter: trigger ? "blur(10px)" : "none",
        boxShadow: trigger ? "0px 4px 6px rgba(0, 0, 0, 0.1)" : "none",
        p: trigger ? 1 : undefined,
        py: trigger ? 2 : undefined,
        width: "100%",
        transition: "all 0.3s ease",
      }}
    >
      {children}
    </Box>
  );
}
