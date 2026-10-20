"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, FileDownload } from "@mui/icons-material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import CustomMultiLangInput from "@components/CustomMultiLangInput";
import AsyncAutocomplete from "@components/AsyncAutocomplete";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import type { IFormCustomComponent } from "@common/types/IFormCustomComponent";

/** Mülk şablonu teknik özellikleri + başka şablondan içe aktarma. */
export default function UnitTemplateFormSpecifications({
  apiData,
  formState,
  projectId,
}: IFormCustomComponent & { projectId: number }) {
  const t = useTranslations();
  // Dilleri burada yeniden çekmiyoruz: ebeveyn OpsForm zaten çekiyor ve yükleme bayrağı global.
  // Burada getLanguages() çağrılınca OpsForm `loading` iken null döndürüp bu bileşeni söküyor,
  // bayrak inince yeniden kuruyor, bileşen yine çekiyor → sonsuz döngü, pencere hiç açılmıyordu.
  const { supportedLanguage } = useSupportedLanguages();
  const [selectedLang, setSelectedLang] = useState(supportedLanguage[0]?.code || "tr");
  const [importOpen, setImportOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id?: number; title?: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const { register, control, setValue, errors } = formState || {};
  const { fields, append, remove } = useFieldArray({ control: control!, name: "specifications" });

  useEffect(() => {
    if (apiData?.specifications?.length) setValue?.("specifications", apiData.specifications);
  }, [apiData, setValue]);

  const handleImport = async () => {
    if (!selectedTemplate?.id) return;
    setImporting(true);
    try {
      const response = await axiosInstance.get(ApiRoutes.UnitTemplateDetail, {
        params: { UnitTemplateId: selectedTemplate.id },
        withoutToast: true,
      });
      const specs = response.data?.data?.specifications;
      if (response.data?.isSuccess && Array.isArray(specs)) {
        specs.forEach((spec: unknown) => append(spec as Record<string, unknown>));
        setImportOpen(false);
        setSelectedTemplate(null);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Stack spacing={2} sx={{ width: "100%", mt: 2 }} data-cy="unit-template-specs">
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            {t("Form.Specifications")}
          </Typography>
          <Stack direction="row" spacing={1}>
            {/* Düzenlemede de açık: içe aktarılanlar listeye eklenir, OpsForm dizideki farkı
                bütün liste olarak gönderir ve API listeyi baştan kurar. */}
            <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={() => setImportOpen(true)}>
              {t("Button.ImportSpecifications")}
            </Button>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => append({})} data-cy="spec-add">
              {t("Button.Add")}
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {fields.map((item: any, index) => {
            const selectedLangId = supportedLanguage.find((lang) => lang.code === selectedLang)?.id;
            const langTranslation = item?.translations?.find((lang: any) => lang.languageId === selectedLangId);
            const valueError = (errors as any)?.specifications?.[index]?.value;
            const nameError = (errors as any)?.specifications?.[index]?.translations;

            return (
              <Grid key={item.id || index} size={{ xs: 12, md: 6, lg: 4 }}>
                <Paper sx={{ p: 2, borderRadius: "12px" }} variant="outlined">
                  <Stack spacing={2}>
                    <CustomMultiLangInput
                      itemIndex={index}
                      fieldKey="name"
                      label="Name"
                      selectedLang={selectedLang}
                      handleLanguageChange={(event) => setSelectedLang(event.target.value)}
                      control={control!}
                      setValue={setValue!}
                      languages={supportedLanguage}
                      defaultValue={langTranslation?.name || ""}
                      listKeyName="specifications"
                      // Ad boşsa API 'Translations' zorunlu hatasıyla reddediyor ve kullanıcı yalnız
                      // toast görüyordu; formda engelleyip alanın altında gösteriyoruz.
                      registerOptions={{ required: t("Form.Required") }}
                      error={!!nameError}
                      errorMessage={nameError?.message as string | undefined}
                    />
                    <TextField
                      label={t("Form.Value")}
                      placeholder={t("Form.PlaceHolderValue", { value: t("Form.Value") })}
                      fullWidth
                      defaultValue={item?.value || ""}
                      error={!!valueError}
                      helperText={valueError?.message as string}
                      {...register?.(`specifications.${index}.value`, {
                        required: t("Form.Required"),
                        maxLength: { value: 5000, message: t("Form.MaxLength", { max: 5000 }) },
                      })}
                    />
                    <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => remove(index)}>
                      {t("Button.Remove")}
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("Button.ImportSpecifications")}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <AsyncAutocomplete
              label={t("Form.SelectUnitTemplate")}
              autoCompleteProps={{
                lookUpParams: {
                  entityName: "UnitTemplate",
                  requestedPropertyNames: ["Name"],
                  filtering: {
                    criterias: [{ filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo }],
                  },
                },
              }}
              onChange={(value) => setSelectedTemplate(value as { id?: number; title?: string } | null)}
              fullWidth
              disablePortal={false}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>{t("Button.Cancel")}</Button>
          <Button variant="contained" disabled={!selectedTemplate || importing} onClick={handleImport}>
            {t("Button.Confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
