import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Controller, type Control, type RegisterOptions, type UseFormSetValue } from "react-hook-form";
import { Divider, InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import type { ILanguageDto } from "@common/types/ILanguageDto";

interface ITranslationRow {
  languageId: number;
  [key: string]: unknown;
}

interface ICustomMultiLangInputProps {
  itemIndex: number;
  fieldKey: string;
  label: string;
  selectedLang: string;
  handleLanguageChange: (e: { target: { value: string } }) => void;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  languages: ILanguageDto[];
  error?: boolean;
  errorMessage?: string;
  multiline?: boolean;
  rows?: number;
  defaultValue?: string;
  listKeyName: string;
  registerOptions?: RegisterOptions;
}

/**
 * `MultiLangInput`in dizi-öğesi (ör. `balconies[3].translations`) varyantı —
 * `MultiArrayObjectInput` gibi bir listenin TEK bir öğesindeki çok dilli alan
 * için kullanılır.
 */
export default function CustomMultiLangInput({
  itemIndex,
  fieldKey,
  selectedLang,
  handleLanguageChange,
  control,
  setValue,
  languages,
  error,
  errorMessage,
  multiline,
  rows,
  defaultValue,
  label,
  listKeyName,
  registerOptions,
}: ICustomMultiLangInputProps) {
  const t = useTranslations("Form");
  const selectedLanguage = languages?.find((l) => l.code === selectedLang);
  const languageId = selectedLanguage?.id;
  const requiredLanguage = languages.find((lang) => lang?.isDefault) || languages?.[0];
  const isRequired = !!registerOptions?.required;
  const controllerName = `${listKeyName}.${itemIndex}.translations`;

  // ⚠️ `control._formValues` react-hook-form'un dokümante edilmemiş iç
  // (private) API'sidir — sürüm güncellemelerinde kırılabilir. Referansta
  // aynen kullanılıyordu; burada da korunuyor, ama not düşülüyor.
  useEffect(() => {
    if (!languageId || !defaultValue) return;

    const currentTranslations: ITranslationRow[] =
      (control as unknown as { _formValues: Record<string, any> })._formValues?.[listKeyName]?.[itemIndex]?.translations || [];
    const langIndex = currentTranslations.findIndex((row) => row.languageId === languageId);
    const translationsCopy = [...currentTranslations];

    if (langIndex === -1) {
      translationsCopy.push({ languageId, [fieldKey]: defaultValue });
      setValue(controllerName, translationsCopy);
    } else if (translationsCopy[langIndex] && (translationsCopy[langIndex][fieldKey] === undefined || translationsCopy[langIndex][fieldKey] === null)) {
      translationsCopy[langIndex] = { ...translationsCopy[langIndex], [fieldKey]: defaultValue };
      setValue(controllerName, translationsCopy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageId, itemIndex, fieldKey, defaultValue, controllerName, listKeyName]);

  return (
    <Controller
      name={controllerName}
      control={control}
      rules={{
        validate: !isRequired
          ? undefined
          : (value: ITranslationRow[] | undefined) => {
              if (!requiredLanguage) return true;
              // Değer `{tr: "…"}` nesnesi DEĞİL, `[{languageId, name}]` dizisidir (aşağıdaki
              // handleChange böyle yazıyor). Eski kod nesne varsayıyordu; hiçbir çağıran
              // registerOptions vermediği için fark edilmemişti, verilince alan hep hata veriyordu.
              const requiredValue = Array.isArray(value)
                ? value.find((row) => row.languageId === requiredLanguage.id)?.[fieldKey]
                : undefined;
              return typeof requiredValue !== "string" || requiredValue.trim() === ""
                ? t("RequiredWithLang", { lang: requiredLanguage?.name })
                : true;
            },
      }}
      render={({ field }) => {
        const translations: ITranslationRow[] = field.value || [];
        const langIndex = translations.findIndex((row) => row.languageId === languageId);
        const currentValue = (translations?.[langIndex]?.[fieldKey] as string) ?? defaultValue ?? "";

        const handleChange = (event: { target: { value: string } }) => {
          const newValue = event.target.value;
          const updated = [...translations];

          if (langIndex >= 0) {
            if (!newValue || newValue.trim() === "") {
              updated.splice(langIndex, 1);
            } else {
              updated[langIndex] = { ...updated[langIndex], [fieldKey]: newValue, languageId: languageId! };
            }
          } else if (languageId && newValue && newValue.trim() !== "") {
            updated.push({ languageId, [fieldKey]: newValue });
          }

          field.onChange(updated);
        };

        return (
          <TextField
            fullWidth
            value={currentValue}
            onChange={handleChange}
            error={error}
            helperText={errorMessage}
            multiline={multiline}
            rows={rows}
            label={t(label as never)}
            sx={multiline ? { "& .MuiInputBase-root": { justifyContent: "flex-start", alignItems: "flex-start" } } : {}}
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
              },
            }}
          />
        );
      }}
    />
  );
}
