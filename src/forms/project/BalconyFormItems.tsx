"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import CustomMultiLangInput from "@components/CustomMultiLangInput";
import ImageUpload from "@common/inputs/ImageUpload";
import NumericInput from "@common/inputs/NumericInput";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormCustomComponent } from "@common/types/IFormCustomComponent";

let languagesRequested = false;

/** Daire balkon görselleri (lisans: unit-balcony-image). */
export default function BalconyFormItems({ apiData, formState }: IFormCustomComponent) {
  const t = useTranslations();
  const formT = useTranslations("Form");
  const { supportedLanguage, getLanguages } = useSupportedLanguages();
  const [selectedLang, setSelectedLang] = useState(supportedLanguage[0]?.code || "tr");
  const { register, control, setValue } = formState || {};
  const { fields, append, remove } = useFieldArray({ control: control!, name: "balconies" });

  // Yükleme bayrağı global: çekim sırasında ebeveyn OpsForm null döndürüp bu bileşeni söküyor ve
  // geri kuruyor. Koşulsuz çekseydik her kuruluşta yeniden çekip formu sonsuz döngüye sokardık
  // (pencere hiç açılmıyordu). Bayrak modül seviyesinde, çünkü bileşen state'i sökülünce sıfırlanır.
  useEffect(() => {
    if (supportedLanguage.length > 0 || languagesRequested) return;
    languagesRequested = true;
    getLanguages();
  }, [supportedLanguage.length, getLanguages]);

  useEffect(() => {
    if (apiData?.balconies?.length) setValue?.("balconies", apiData.balconies);
  }, [apiData, setValue]);

  const handleAdd = () => {
    append({
      id: `new_${Date.now()}`,
      displayOrder: fields.length + 1,
      image: {
        id: null,
        fileChanged: true,
        fileExtension: null,
        fileName: null,
        order: 1,
        altText: "",
        fileAsBase64: null,
      },
      translations: [],
    });
  };

  return (
    <Stack spacing={2} sx={{ width: "100%", mt: 2 }} data-cy="balcony-items">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>
          {t("Form.Balconies")}
        </Typography>
        <Button variant="contained" size="small" color="tertiary" onClick={handleAdd} startIcon={<Add />}>
          {t("Button.Add")}
        </Button>
      </Stack>

      {fields.map((item: any, index) => {
        const selectedLangId = supportedLanguage.find((lang) => lang.code === selectedLang)?.id;
        const langTranslation = item?.translations?.find((lang: any) => lang.languageId === selectedLangId);

        return (
          <Grid
            container
            key={item.id || index}
            spacing={2}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 2 }}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <ImageUpload
                register={register as any}
                t={formT}
                formItem={{
                  name: `balconies.${index}.image`,
                  label: "UploadBalconyImage",
                  visibility: FormItemVisibilityEnum.Both,
                  type: FormItemTypeEnum.S3_IMAGE,
                }}
                control={control}
                setValue={(name, value) => {
                  if (value !== undefined) setValue?.(name, value, { shouldDirty: true });
                }}
                defaultValue={item.image}
              />
            </Grid>
            {/* Opsiyonel gece panoraması: Fine3D gece modunda bunu açar, yoksa gündüz görseline düşer. */}
            <Grid size={{ xs: 12, md: 6 }}>
              <ImageUpload
                register={register as any}
                t={formT}
                formItem={{
                  name: `balconies.${index}.nightImage`,
                  label: "UploadBalconyNightImage",
                  visibility: FormItemVisibilityEnum.Both,
                  type: FormItemTypeEnum.S3_IMAGE,
                }}
                control={control}
                setValue={(name, value) => {
                  if (value !== undefined) setValue?.(name, value, { shouldDirty: true });
                }}
                defaultValue={item.nightImage}
              />
            </Grid>
            <Grid size={12}>
              <input type="hidden" {...register?.(`balconies.${index}.id`)} value={item.id || ""} />
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
                listKeyName="balconies"
              />
              <Box mt={2}>
                <NumericInput
                  register={register as any}
                  formItem={{
                    name: `balconies.${index}.displayOrder`,
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
              <Box mt={2}>
                <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => remove(index)}>
                  {t("Button.Remove")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        );
      })}
    </Stack>
  );
}
