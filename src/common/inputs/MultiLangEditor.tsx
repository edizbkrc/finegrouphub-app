"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Controller, type UseFormSetValue } from "react-hook-form";
import { Box, FormHelperText, MenuItem, Select, Typography } from "@mui/material";
import type { ILanguageDto } from "@common/types/ILanguageDto";
import "react-quill-new/dist/quill.snow.css";
import type { IFormItem } from "../types/IFormItem";
import { reverseTransformTranslations } from "./multiLangHelpers";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const TOOLBAR_MODULES = {
  toolbar: [
    [{ header: "1" }, { header: "2" }, { font: [] }],
    [{ size: [] }],
    [{ color: [] }, { background: [] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["clean"],
  ],
};

interface IMultiLangEditorProps {
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

export default function MultiLangEditor({
  formItem,
  error,
  errorMessage,
  control,
  languages,
  selectedLang,
  handleLanguageChange,
  setValue,
  apiData,
}: IMultiLangEditorProps) {
  const t = useTranslations("Form");
  const requiredLanguage = languages.find((lang) => lang?.isDefault) || languages?.[0];
  const requiredLangCode = requiredLanguage?.code || "tr";
  const [defaultValues, setDefaultValues] = useState<Record<string, Record<string, unknown>>>({});
  const isRequired = !!formItem?.registerOptions?.required;

  useEffect(() => {
    const values = reverseTransformTranslations(apiData, languages);
    setDefaultValues(values);
    Object.keys(values).forEach((key) => setValue(key, values[key]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData]);

  return (
    <Controller
      name={formItem?.name}
      control={control}
      defaultValue={defaultValues[formItem?.name]?.[selectedLang] || ""}
      rules={{
        validate: !isRequired
          ? undefined
          : (value: Record<string, string>) => {
              const requiredValue = value?.[requiredLangCode];
              return !requiredValue || requiredValue.trim() === ""
                ? t("RequiredWithLang", { lang: requiredLanguage?.name })
                : true;
            },
      }}
      render={({ field }) => (
        <Box sx={{ width: "100%" }}>
          <Box alignItems="center" mb={2} justifyContent="space-between" sx={{ width: "100%", display: "flex" }}>
            <Typography variant="h6">{t(formItem.label)}</Typography>
            <Select size="small" value={selectedLang} onChange={handleLanguageChange} displayEmpty variant="standard">
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  <Box display="flex" alignItems="center">
                    <Image src={`/flag-${lang.code}.png`} alt={lang.name} width={20} height={15} />
                    <Typography ml={1}>{lang.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </Box>

          <ReactQuill
            theme="snow"
            value={field.value?.[selectedLang] || ""}
            onChange={(value) => field.onChange({ ...field.value, [selectedLang]: value })}
            modules={TOOLBAR_MODULES}
            style={{ height: "100%", borderRadius: "10px", minHeight: "200px" }}
            data-cy={`input-${formItem.name}`}
          />

          {error && <FormHelperText error>{errorMessage}</FormHelperText>}
        </Box>
      )}
    />
  );
}
