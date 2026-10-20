import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Controller, type UseFormSetValue } from "react-hook-form";
import { Box, Divider, InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import type { ILanguageDto } from "@common/types/ILanguageDto";
import type { IFormItem } from "../types/IFormItem";
import { reverseTransformTranslations } from "./multiLangHelpers";

interface IMultiLangInputProps {
  formItem: IFormItem;
  error?: boolean;
  errorMessage?: string;
  defaultValue?: Record<string, Record<string, string>>;
  control: any;
  selectedLang: string;
  handleLanguageChange: (e: { target: { value: string } }) => void;
  languages: ILanguageDto[];
  apiData?: { translations?: Record<string, unknown>[] };
  setValue: UseFormSetValue<any>;
  variant?: string;
}

export default function MultiLangInput({
  formItem,
  error,
  apiData,
  errorMessage,
  control,
  languages,
  selectedLang,
  handleLanguageChange,
  setValue,
  variant,
}: IMultiLangInputProps) {
  const t = useTranslations("Form");
  const requiredLanguage = languages.find((lang) => lang?.isDefault) || languages?.[0];
  const requiredLangCode = requiredLanguage?.code || "tr";
  const [defaultValues, setDefaultValues] = useState<Record<string, Record<string, unknown>>>({});
  const isRequired = !!formItem?.registerOptions?.required;

  const maxLength =
    typeof formItem?.registerOptions?.maxLength === "number"
      ? formItem.registerOptions.maxLength
      : (formItem?.registerOptions?.maxLength as { value?: number })?.value || 5000;

  useEffect(() => {
    const values = reverseTransformTranslations(apiData, languages);
    setDefaultValues(values);
    Object.keys(values).forEach((key) => setValue(key, values[key]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData]);

  return (
    <Controller
      name={formItem?.name}
      defaultValue={defaultValues[formItem?.name]?.[selectedLang] || ""}
      control={control}
      rules={{
        validate: !isRequired
          ? undefined
          : (value: Record<string, string>) => {
              if (!requiredLanguage) return true;
              const requiredValue = value?.[requiredLangCode];
              return !requiredValue || requiredValue.trim() === ""
                ? t("RequiredWithLang", { lang: requiredLanguage?.name })
                : true;
            },
      }}
      render={({ field }) => (
        <TextField
          fullWidth
          label={variant === "outlined" ? t(formItem.label) : undefined}
          value={field.value?.[selectedLang] || ""}
          multiline={formItem?.multiLine}
          rows={formItem?.rows}
          disabled={formItem?.handleDisabled ? formItem.handleDisabled() : false}
          onChange={(event) => {
            if (event.target.value.length <= maxLength) {
              field.onChange({ ...field.value, [selectedLang]: event.target.value });
            }
          }}
          error={error}
          helperText={errorMessage}
          sx={formItem?.multiLine ? { "& .MuiInputBase-root": { justifyContent: "flex-start", alignItems: "flex-start" } } : {}}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Select disableUnderline value={selectedLang} onChange={handleLanguageChange} displayEmpty variant="standard">
                    {languages.map((lang) => (
                      <MenuItem key={lang.code} value={lang.code}>
                        <Image src={`/flag-${lang.code}.png`} alt={lang.name} width={20} height={15} />
                      </MenuItem>
                    ))}
                  </Select>
                  <Divider orientation="vertical" flexItem sx={{ borderStyle: "solid" }} />
                </InputAdornment>
              ),
              inputProps: { "data-cy": `input-${formItem.name}`, maxLength },
            },
          }}
        />
      )}
    />
  );
}
