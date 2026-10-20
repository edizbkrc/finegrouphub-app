"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Controller, type UseFormSetValue } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import {
  Box,
  FormHelperText,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { getAcceptedMimeTypes } from "@common/helpers/getAcceptedMimeTypes";
import type { ILanguageDto } from "@common/types/ILanguageDto";
import type { IFormItem } from "../types/IFormItem";
import { reverseTransformTranslations } from "./multiLangHelpers";

interface IFileItem {
  id?: string;
  mediaAsBase64: string;
  type: number;
  fileName?: string;
  publicUrl?: string;
}

interface IMultiLangFileInputProps {
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

export default function MultiLangFileInput({
  formItem,
  error,
  errorMessage,
  control,
  selectedLang,
  handleLanguageChange,
  languages,
  apiData,
  setValue,
}: IMultiLangFileInputProps) {
  // ⚠️ Referansta bu bileşen `useTranslations()` (KÖK, namespace'siz) kullanıp
  // `t("RequiredWithLang", ...)` ve `t("FileSelectText.root")` çağırıyordu —
  // ikisi de yanlış; gerçek anahtarlar "Form.RequiredWithLang" ve
  // "Form.FileSelectText". Kardeş MultiLang* bileşenleriyle tutarlı olsun diye
  // "Form" namespace'ine sabitlendi.
  const t = useTranslations("Form");
  const [defaultValues, setDefaultValues] = useState<Record<string, Record<string, unknown>>>({});

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  useEffect(() => {
    const values = reverseTransformTranslations(apiData, languages);
    setDefaultValues(values);
    Object.keys(values).forEach((key) => setValue(key, values[key]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData]);

  return (
    <Controller
      name={formItem.name}
      defaultValue={defaultValues[formItem.name] || null}
      rules={{
        validate: !formItem?.registerOptions?.required
          ? undefined
          : (value: Record<string, unknown[]>) => {
              const requiredFiles = value?.[selectedLang];
              if (requiredFiles?.length) return true;
              const requiredLanguage = languages.find((lang) => lang?.isDefault) || languages?.[0];
              return t("RequiredWithLang", { lang: requiredLanguage?.name });
            },
      }}
      control={control}
      render={({ field }) => {
        const currentFileList: IFileItem[] = field.value?.[selectedLang] || [];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { getRootProps, getInputProps } = useDropzone({
          onDrop: async (acceptedFiles) => {
            const newFiles = await Promise.all(
              acceptedFiles.map(async (file) => ({
                mediaAsBase64: await convertToBase64(file),
                type: formItem?.fileType,
                fileName: file.name,
              }))
            );

            field.onChange({ ...field.value, [selectedLang]: [...currentFileList, ...newFiles] });
          },
          multiple: formItem?.fileMultiple,
          accept:
            formItem?.fileType !== undefined
              ? Object.fromEntries(getAcceptedMimeTypes(formItem.fileType).map((type) => [type, []]))
              : undefined,
        });

        const handleFileRemove = (index: number) => {
          const updatedFiles = currentFileList.filter((_, i) => i !== index);
          field.onChange({ ...field.value, [selectedLang]: updatedFiles });
        };

        return (
          <Box>
            <Select disableUnderline value={selectedLang} onChange={handleLanguageChange} displayEmpty variant="standard" fullWidth sx={{ mb: 2 }}>
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Image src={`/flag-${lang.code}.png`} alt={lang.name} width={20} height={15} />
                    {lang?.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>

            {error && (
              <FormHelperText error sx={{ mb: 2 }}>
                {errorMessage}
              </FormHelperText>
            )}

            <Box
              {...getRootProps()}
              sx={{ border: "2px dashed #cccccc", padding: 3, borderRadius: "10px", textAlign: "center", cursor: "pointer", "&:hover": { borderColor: "#aaaaaa" } }}
            >
              <input {...getInputProps()} data-cy={`input-${formItem.name}`} />
              <UploadFileIcon sx={{ fontSize: 48, color: "#cccccc" }} />
              <Typography variant="body1" sx={{ color: "#666666", mt: 1 }}>
                {t("FileSelectText")}
              </Typography>
            </Box>

            {currentFileList.length > 0 && (
              <List sx={{ mt: 2 }}>
                {currentFileList.map((file, index) => (
                  <ListItem
                    key={file?.id || index}
                    dense
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleFileRemove(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IconButton
                        edge="end"
                        aria-label="download"
                        href={file?.publicUrl ? process.env.NEXT_PUBLIC_IMAGE_BASE_URL + file.publicUrl : file?.mediaAsBase64}
                        download
                        target="_blank"
                      >
                        <Download />
                      </IconButton>
                    </ListItemIcon>
                    <ListItemText primary={file?.fileName} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        );
      }}
    />
  );
}
