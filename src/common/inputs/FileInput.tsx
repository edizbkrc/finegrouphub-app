import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import {
  Alert,
  Box,
  FormHelperText,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { getAcceptedMimeTypes, isValidFileExtension } from "@common/helpers/getAcceptedMimeTypes";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import type { ICommonInputProps } from "../types/ICommonInputProps";

interface IFileItem {
  id?: string;
  base64?: string;
  fileName?: string;
  type?: string | number;
  url?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function FileInput({ formItem, setValue, control, defaultValue, error, errorMessage, t }: ICommonInputProps) {
  const fieldKey = formItem?.name || "documents";
  const [fileList, setFileList] = useState<IFileItem[]>([]);
  const [fileSizeError, setFileSizeError] = useState("");

  useEffect(() => {
    if (defaultValue) {
      const normalized = Array.isArray(defaultValue)
        ? defaultValue.map((f) => ({ ...f, type: formItem?.fileType }))
        : [defaultValue];
      setFileList(normalized as IFileItem[]);
    } else {
      setValue(fieldKey, formItem?.fileMultiple ? [] : undefined);
    }
  }, [defaultValue, formItem?.fileType, formItem?.name, formItem?.fileMultiple, fieldKey, setValue]);

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const onDrop = async (acceptedFiles: File[]) => {
    setFileSizeError("");

    const oversized = acceptedFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setFileSizeError(`${t("FileSizeTooLarge")}: ${oversized.map((f) => f.name).join(", ")}. ${t("MaxFileSize")}: 50 MB`);
      return;
    }

    const validFiles = formItem?.fileType
      ? acceptedFiles.filter((file) => isValidFileExtension(file.name, formItem.fileType!))
      : acceptedFiles;

    if (validFiles.length === 0) return;

    const newFiles = await Promise.all(
      validFiles.map(async (file) => ({
        base64: await convertToBase64(file),
        type: formItem?.fileType,
        fileName: file.name,
        fileExtension: file.name.split(".").pop(),
      }))
    );

    const updatedFiles = formItem?.fileMultiple ? [...fileList, ...newFiles] : [newFiles[0]];
    setFileList(updatedFiles);
    setValue(formItem.name, formItem?.fileMultiple ? updatedFiles : (updatedFiles[0] ?? null), { shouldDirty: true });
  };

  const handleFileRemove = (index: number) => {
    setFileSizeError("");
    const updatedFiles = fileList.filter((_, i) => i !== index);
    setFileList(updatedFiles);
    setValue(formItem.name, formItem?.fileMultiple ? updatedFiles : (updatedFiles[0] ?? null), { shouldDirty: true });
  };

  const isSingleFull = !formItem?.fileMultiple && fileList.length > 0;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: formItem?.fileMultiple,
    accept: Object.fromEntries(
      getAcceptedMimeTypes(formItem?.fileType ?? OpsFileTypeEnum.Document).map((type) => [type, []])
    ),
    disabled: isSingleFull,
  });

  return (
    <Controller
      name={formItem.name}
      control={control}
      rules={{
        validate: !formItem?.registerOptions?.required
          ? undefined
          : (value: unknown) => {
              if (formItem?.fileMultiple) {
                return Array.isArray(value) && value.length > 0 ? true : t("Required");
              }
              return value ? true : t("Required");
            },
      }}
      render={() => (
        <Paper sx={{ p: 2, pb: 3 }} elevation={2}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            {formItem?.label === "" ? "" : t(formItem?.label || "Documents")}
          </Typography>

          {error && (
            <FormHelperText error sx={{ mb: 2 }}>
              {errorMessage}
            </FormHelperText>
          )}

          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed #cccccc",
              padding: 3,
              borderRadius: "10px",
              textAlign: "center",
              cursor: isSingleFull ? "not-allowed" : "pointer",
              opacity: isSingleFull ? 0.5 : 1,
              "&:hover": { borderColor: isSingleFull ? "#cccccc" : "#aaaaaa" },
            }}
          >
            <input {...getInputProps()} data-cy={`input-${formItem.name}`} />
            <UploadFileIcon sx={{ fontSize: 48, color: "#cccccc" }} />
            <Typography variant="body1" sx={{ color: "#666666", mt: 1 }}>
              {t("FileSelectText")}
            </Typography>
          </Box>

          {fileSizeError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {fileSizeError}
            </Alert>
          )}

          {fileList.length > 0 && (
            <List sx={{ mt: 2 }}>
              {fileList.map((file, index) => (
                <ListItem
                  key={file?.id || index}
                  dense
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleFileRemove(index)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <IconButton
                      component="a"
                      edge="end"
                      aria-label="download"
                      href={file?.url ?? file?.base64 ?? "#"}
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
        </Paper>
      )}
    />
  );
}
