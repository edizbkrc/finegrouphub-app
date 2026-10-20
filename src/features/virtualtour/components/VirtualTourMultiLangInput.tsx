import React, { useState, useEffect } from "react";
import Image from "next/image";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import {
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Box,
} from "@mui/material";

interface Translation {
  languageId: number;
  value: string;
}

interface VirtualTourMultiLangInputProps {
  label: string;
  value: Translation[];
  onChange: (translations: Translation[]) => void;
  multiline?: boolean;
  rows?: number;
  size?: "small" | "medium";
  placeholder?: string;
  defaultLanguage?: string;
}

const VirtualTourMultiLangInput: React.FC<VirtualTourMultiLangInputProps> = ({
  label,
  value = [],
  onChange,
  multiline = false,
  rows = 1,
  size = "small",
  placeholder,
  defaultLanguage = "tr",
}) => {
  const { supportedLanguage } = useSupportedLanguages();
  const [selectedLang, setSelectedLang] = useState(() => {
    const defaultLangData = supportedLanguage.find(
      (l: any) => l.code === defaultLanguage
    );
    return defaultLangData?.id || supportedLanguage[0]?.id || 21;
  });

  // Initialize with default language if empty
  useEffect(() => {
    if (value.length === 0) {
      const defaultLangData = supportedLanguage.find(
        (l: any) => l.code === defaultLanguage
      );
      if (defaultLangData) {
        onChange([
          {
            languageId: defaultLangData.id,
            value: "",
          },
        ]);
        setSelectedLang(defaultLangData.id);
      }
    }
  }, [value.length, onChange, defaultLanguage, supportedLanguage]);

  const handleLanguageChange = (event: any) => {
    setSelectedLang(event.target.value);
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const selectedLanguage = supportedLanguage.find(
      (l: any) => l.id === selectedLang
    );

    if (!selectedLanguage) return;

    const updatedTranslations = [...value];
    const existingIndex = updatedTranslations.findIndex(
      (t) => t.languageId === selectedLang
    );

    if (existingIndex >= 0) {
      updatedTranslations[existingIndex] = {
        ...updatedTranslations[existingIndex],
        value: newValue,
      };
    } else {
      updatedTranslations.push({
        languageId: selectedLanguage.id,
        value: newValue,
      });
    }

    onChange(updatedTranslations);
  };

  const currentTranslation = value.find((t) => t.languageId === selectedLang);
  const currentValue = currentTranslation?.value || "";

  return (
    <TextField
      fullWidth
      label={label}
      value={currentValue}
      onChange={handleValueChange}
      multiline={multiline}
      rows={rows}
      size={size}
      placeholder={placeholder}
      sx={
        multiline
          ? {
              "& .MuiInputBase-root": {
                justifyContent: "flex-start",
                alignItems: "flex-start",
              },
            }
          : {}
      }
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Select
                disableUnderline
                value={selectedLang}
                onChange={handleLanguageChange}
                displayEmpty
                variant="standard"
              >
                {supportedLanguage.map((lang) => (
                  <MenuItem key={lang.id} value={lang.id}>
                    <Image
                      src={`/flag-${lang.code}.png`}
                      alt={lang.name}
                      width={20}
                      height={15}
                    />
                  </MenuItem>
                ))}
              </Select>
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  borderStyle: "solid",
                }}
              />
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default VirtualTourMultiLangInput;
