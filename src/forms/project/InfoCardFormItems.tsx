"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import { Box, Button, Grid, Typography } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import CustomMultiLangInput from "@components/CustomMultiLangInput";
import ImageUpload from "@common/inputs/ImageUpload";
import NumericInput from "@common/inputs/NumericInput";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormCustomComponent } from "@common/types/IFormCustomComponent";

/** Bilgi kartı maddeleri: görsel/video + çok dilli ad/açıklama + sıra. */
export default function InfoCardFormItems({ apiData, formState }: IFormCustomComponent) {
  const t = useTranslations();
  const formT = useTranslations("Form");
  // Diller OpsPageForm tarafından yüklenir; burada tekrar çekmek skeleton döngüsü yaratır.
  const { supportedLanguage } = useSupportedLanguages();
  const [selectedLang, setSelectedLang] = useState(supportedLanguage[0]?.code || "tr");
  const { register, control, setValue } = formState || {};
  const { fields, append, remove } = useFieldArray({ control: control!, name: "items" });

  useEffect(() => {
    if (supportedLanguage[0]?.code && !selectedLang) setSelectedLang(supportedLanguage[0].code);
  }, [supportedLanguage, selectedLang]);

  useEffect(() => {
    if (apiData?.items?.length) setValue?.("items", apiData.items, { shouldDirty: false });
  }, [apiData, setValue]);

  const handleAdd = () => {
    append({
      id: `new_${Date.now()}`,
      image: null,
      translations: [],
      displayOrder: fields.length + 1,
    });
  };

  /** Nested `items.N.image` yollarında undefined atmayı yut — RHF ağacını bozmasın. */
  const handleImageSetValue = (name: string, value: unknown, options?: object) => {
    if (value === undefined) return;
    setValue?.(name, value, { shouldDirty: true, ...(options as object) });
  };

  return (
    <Grid
      container
      spacing={3}
      size={{ xs: 12, lg: 8 }}
      data-cy="info-card-items"
      sx={{
        p: 3,
        pb: 4,
        borderRadius: "10px",
        boxShadow: 1,
        backgroundColor: "background.paper",
        alignContent: "flex-start",
      }}
    >
      <Grid size={12} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">{t("Form.InfoCards")}</Typography>
        <Button variant="contained" onClick={handleAdd} startIcon={<Add />} size="large" data-cy="info-card-item-add">
          {t("Button.Add")}
        </Button>
      </Grid>

      {fields.map((item: any, index) => {
        const selectedLangId = supportedLanguage.find((lang) => lang.code === selectedLang)?.id;
        const langTranslation = item?.translations?.find((lang: any) => lang.languageId === selectedLangId);
        const imageDefault = apiData?.items?.[index]?.image ?? item.image ?? null;

        return (
          <Grid
            container
            spacing={3}
            size={12}
            key={item.id || index}
            sx={{
              borderRadius: 3,
              boxShadow: 2,
              p: 3,
              backgroundColor: "background.paper",
            }}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <ImageUpload
                register={register as any}
                t={formT}
                isEdit={!!apiData?.id}
                acceptMedia
                formItem={{
                  name: `items.${index}.image`,
                  label: "UploadMedia",
                  visibility: FormItemVisibilityEnum.Both,
                  type: FormItemTypeEnum.S3_IMAGE,
                }}
                control={control}
                setValue={handleImageSetValue as any}
                defaultValue={imageDefault}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <input type="hidden" {...register?.(`items.${index}.id`)} defaultValue={item.id || ""} />
              <CustomMultiLangInput
                itemIndex={index}
                fieldKey="name"
                label="Name"
                selectedLang={selectedLang || "tr"}
                handleLanguageChange={(event) => setSelectedLang(event.target.value)}
                control={control!}
                setValue={setValue!}
                languages={supportedLanguage}
                defaultValue={langTranslation?.name || ""}
                listKeyName="items"
              />
              <Box mt={3}>
                <CustomMultiLangInput
                  itemIndex={index}
                  fieldKey="description"
                  label="Description"
                  selectedLang={selectedLang || "tr"}
                  handleLanguageChange={(event) => setSelectedLang(event.target.value)}
                  control={control!}
                  setValue={setValue!}
                  languages={supportedLanguage}
                  multiline
                  rows={4}
                  defaultValue={langTranslation?.description || ""}
                  listKeyName="items"
                />
              </Box>
              <Box mt={2}>
                <NumericInput
                  register={register as any}
                  formItem={{
                    name: `items.${index}.displayOrder`,
                    label: "Order",
                    placeholder: formT("PlaceHolderValue", { value: formT("Order") }),
                    type: FormItemTypeEnum.NUMBER,
                    visibility: FormItemVisibilityEnum.Both,
                  }}
                  variant="outlined"
                  control={control}
                  setValue={() => {}}
                  defaultValue={item.displayOrder}
                  t={formT}
                />
              </Box>
            </Grid>

            <Grid size={12}>
              <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => remove(index)}>
                {t("Form.Delete")}
              </Button>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
}
