"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import DateProvider from "@/providers/DateProvider";
import { buildFieldRenderers, getNestedValue } from "@common/form/OpsFormGeneratorShared";
import type { ICommonInputProps } from "@common/types/ICommonInputProps";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsPageFormGeneratorProps } from "@common/types/IOpsPageFormGeneratorProps";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import OpsPageFormHeader from "./OpsPageFormHeader";

const OpsEditor = dynamic(() => import("../inputs/OpsEditor"));
const LabelFields = dynamic(() => import("../inputs/LabelFields"));
const TelInput = dynamic(() => import("../inputs/TelInput"));
const FileInput = dynamic(() => import("../inputs/FileInput"));
const MultiLangArrayInput = dynamic(() => import("../inputs/MultiLangArrayInput"));
const MultiLangFileInput = dynamic(() => import("../inputs/MultiLangFileInput"));
const MultiArrayTextInput = dynamic(() => import("../inputs/MultiArrayTextInput"));
const MultiLangEditor = dynamic(() => import("../inputs/MultiLangEditor"));
const MuiIconAutocomplete = dynamic(() => import("../inputs/MuiIconAutocomplete"));

const DEFAULT_GRID_SIZE = { xs: 12, sm: 12, md: 6, lg: 4, xl: 4 };

/**
 * Tam sayfa CRUD formunu üretir: kartlara bölünmüş `IOpsPageFormItem[]` şeması
 * alır (OpsFormGenerator'ın düz `IFormItem[]` alan modal karşılığı).
 */
export default function OpsPageFormGenerator({
  schema: pageScheme,
  onSubmit,
  apiData,
  isEdit,
  handleDelete,
  languages,
  pageHeaderProps,
  children,
}: IOpsPageFormGeneratorProps) {
  const t = useTranslations("Form");

  const {
    register,
    control,
    setValue,
    handleSubmit,
    watch,
    trigger,
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
    const defaultValue = getNestedValue(apiData, formItem?.name) ?? formItem.defaultValue;

    const commonProps: ICommonInputProps = {
      formItem,
      control,
      error: !!error,
      errorMessage,
      defaultValue,
      register,
      setValue,
      apiData,
      t,
      isEdit,
      variant: "outlined",
    };

    return fieldRenderers.get(formItem.type)?.(commonProps) ?? null;
  };

  const renderGridItem = (gridItem: IOpsPageFormItem, index: number, container = true) => (
    <Grid
      size={gridItem?.gridSize || DEFAULT_GRID_SIZE}
      container={container}
      key={`${gridItem?.name}-renderGridItem-${index}-${container ? "root" : "sub"}`}
      sx={{
        borderRadius: "16px",
        boxShadow: gridItem?.surface === "flat" ? "none" : (theme) => `0 8px 24px ${theme.palette.mode === "light" ? "rgba(15, 23, 42, 0.05)" : "none"}`,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        alignContent: "flex-start",
        overflow: "hidden",
      }}
    >
      {gridItem?.name && (
        <Grid size={12}>
          <Paper elevation={0} sx={{ borderRadius: 0, px: 2.5, pt: 2.5, pb: 0, bgcolor: "transparent" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {gridItem?.icon}
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                {gridItem?.name}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      )}

      <Grid size={12} container sx={{ p: 3, pt: gridItem?.name ? 0 : 3 }}>
        {gridItem?.schema?.map((field, fieldIndex) => {
          if (field?.handleVisibility && !field.handleVisibility(apiData, watch)) {
            return (
              <Grid container key={field.name} sx={{ display: "none" }}>
                {renderField(field)}
              </Grid>
            );
          }

          return (
            <Grid size={field?.gridSize || 12} key={`${field?.name}-field-${fieldIndex}`} mt={container ? 0 : 3}>
              {renderField(field)}
              {field?.infoText && (
                <Typography sx={{ color: "#7E7E7E", fontSize: "12px", pl: 1, pt: 1 }}>{field.infoText}</Typography>
              )}
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );

  const renderMultiGridItem = (gridItem: IOpsPageFormItem, index: number) => (
    <Grid container key={`${gridItem?.name}-multi-${index}`} size={gridItem?.gridSize || DEFAULT_GRID_SIZE}>
      {gridItem?.multiSchema?.map((subGridItem, subIndex) =>
        subGridItem?.renderComponent ? (
          subGridItem.renderComponent(apiData, { register, control, setValue, errors, trigger })
        ) : (
          renderGridItem({ ...subGridItem, gridSize: subGridItem.gridSize ?? 12 }, subIndex + index, false)
        )
      )}
    </Grid>
  );

  return (
    <DateProvider>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4} alignItems="stretch">
          <OpsPageFormHeader isEdit={isEdit} handleDelete={handleDelete} isDirty={isDirty} isSubmitting={isSubmitting} auditInfo={apiData?.auditInfo} {...pageHeaderProps} />

          {pageScheme?.map((gridItem, index) => {
            if (gridItem?.renderComponent) return gridItem.renderComponent(apiData, { register, control, setValue, errors });
            if (gridItem?.multiSchema) return renderMultiGridItem(gridItem, index);
            return renderGridItem(gridItem, index);
          })}

          {children}
        </Grid>
      </form>
    </DateProvider>
  );
}
