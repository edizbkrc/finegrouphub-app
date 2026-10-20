import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Box, Divider, InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import type { ILanguageDto } from "@common/types/ILanguageDto";

interface IMultiLangSingleInputProps {
  label: string;
  languages: ILanguageDto[];
  defaultValue?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  handleSelectLang?: (lang?: string) => void;
  multiLine?: boolean;
  rows?: number;
}

/** Diller arasında geçiş yapılabilen TEK bir çok dilli metin alanı (dizi/çeviri sözleşmesi olmadan). */
export default function MultiLangSingleInput({ label, languages, defaultValue, onChange, multiLine, rows, handleSelectLang }: IMultiLangSingleInputProps) {
  const t = useTranslations("Form");
  const defaultLanguage = languages.find((lang) => lang.isDefault) || languages[0];
  const [selectedLang, setSelectedLang] = useState<string>(defaultLanguage?.code);
  const [value, setValue] = useState<Record<string, string>>(defaultValue || {});

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const updated = { ...value, [selectedLang]: event.target.value };
    setValue(updated);
    onChange?.(updated);
  };

  const handleLanguageChange = (event: { target: { value: string } }) => {
    handleSelectLang?.(event.target.value);
    setSelectedLang(event.target.value);
  };

  return (
    <TextField
      fullWidth
      label={t(label as never)}
      value={value[selectedLang] || ""}
      onChange={handleInputChange}
      multiline={multiLine}
      rows={rows}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Select disableUnderline value={selectedLang} onChange={handleLanguageChange} displayEmpty variant="standard">
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Image src={`/flag-${lang.code}.png`} alt={lang.name} width={20} height={15} />
                      {lang.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <Divider orientation="vertical" flexItem sx={{ borderStyle: "solid" }} />
            </InputAdornment>
          ),
          inputProps: { "data-cy": "input-multilang" },
        },
      }}
    />
  );
}
