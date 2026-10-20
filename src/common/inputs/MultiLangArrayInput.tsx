import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Controller, type UseFormSetValue } from "react-hook-form";
import { Box, Chip, Divider, IconButton, InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { ILanguageDto } from "@common/types/ILanguageDto";
import type { IFormItem } from "../types/IFormItem";
import { reverseTransformTranslations } from "./multiLangHelpers";

interface IMultiLangArrayInputProps {
  formItem: IFormItem;
  error?: boolean;
  errorMessage?: string;
  defaultValue?: unknown;
  control: any;
  selectedLang: string;
  handleLanguageChange: (e: { target: { value: string } }) => void;
  languages: ILanguageDto[];
  apiData?: { translations?: Record<string, unknown>[] };
  setValue: UseFormSetValue<any>;
}

export default function MultiLangArrayInput({
  formItem,
  error,
  errorMessage,
  control,
  selectedLang,
  handleLanguageChange,
  languages,
  apiData,
  setValue,
}: IMultiLangArrayInputProps) {
  const t = useTranslations("Form");
  const requiredLanguage = languages.find((lang) => lang?.isDefault) || languages?.[0];
  const isRequired = !!formItem?.registerOptions?.required;
  const requiredLangCode = requiredLanguage?.code || "tr";
  const [defaultValues, setDefaultValues] = useState<Record<string, Record<string, unknown>>>({});
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const values = reverseTransformTranslations(apiData, languages);
    setDefaultValues(values);
    Object.keys(values).forEach((key) => setValue(key, values[key]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData]);

  return (
    <Controller
      name={formItem?.name}
      defaultValue={defaultValues[formItem?.name]?.[selectedLang] || null}
      control={control}
      rules={{
        validate: !isRequired
          ? undefined
          : (value: Record<string, unknown[]>) => {
              const list = value?.[requiredLangCode];
              return !list || list.length === 0
                ? t("RequiredWithLang", { lang: requiredLanguage?.name })
                : true;
            },
      }}
      render={({ field }) => (
        <Box>
          <TextField
            fullWidth
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={t(formItem.label)}
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
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        if (!inputValue.trim()) return;
                        const current = field.value || {};
                        const updatedArray = [...(current[selectedLang] || []), inputValue.trim()];
                        field.onChange({ ...current, [selectedLang]: updatedArray });
                        setInputValue("");
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                inputProps: { "data-cy": `input-${formItem.name}` },
              },
            }}
            error={error}
            helperText={errorMessage}
          />

          <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
            {(field.value?.[selectedLang] || []).map((item: string, index: number) => (
              <Chip
                key={index}
                label={item}
                onDelete={() => {
                  const updatedArray = field.value[selectedLang].filter((_: unknown, idx: number) => idx !== index);
                  field.onChange({ ...field.value, [selectedLang]: updatedArray });
                }}
                deleteIcon={<DeleteIcon />}
              />
            ))}
          </Box>
        </Box>
      )}
    />
  );
}
