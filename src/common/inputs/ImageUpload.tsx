"use client";

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Alert, Box, Button, Dialog, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import PhotoIcon from "@/assets/svgs/PhotoIcon";
import { v4 as uuidv4 } from "uuid";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import type { ICommonInputProps } from "../types/ICommonInputProps";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const VIDEO_EXT = new Set(["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "mpeg", "m4v"]);

function isVideoSource(src?: string | null, fileName?: string | null): boolean {
  const probe = `${fileName || ""} ${src || ""}`.toLowerCase();
  if (probe.includes("video/") || probe.startsWith("data:video")) return true;
  return Array.from(VIDEO_EXT).some((ext) => probe.includes(`.${ext}`));
}

export default function ImageUpload({
  formItem,
  setValue,
  defaultValue: defaultImage,
  t,
  register,
  isEdit,
  acceptMedia = false,
}: ICommonInputProps & { /** Bilgi kartı gibi görsel+video kabul eder. */ acceptMedia?: boolean }) {
  const fieldKey = formItem?.name || "image";
  const isS3 = formItem?.type === FormItemTypeEnum.S3_IMAGE;
  const accept = acceptMedia ? "image/*,video/*" : "image/*";

  const [image, setImage] = useState<string | null>(isS3 ? (defaultImage?.url ?? null) : null);
  const [fileName, setFileName] = useState<string | null>(defaultImage?.fileName ?? null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fileSizeError, setFileSizeError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVideo = isVideoSource(image, fileName);

  useEffect(() => {
    if (isS3) {
      setImage(defaultImage?.url || "");
      setFileName(defaultImage?.fileName ?? null);
    } else if (defaultImage?.publicUrl) {
      setImage(process.env.NEXT_PUBLIC_IMAGE_BASE_URL + defaultImage.publicUrl);
      setFileName(defaultImage?.fileName ?? null);
    }
    // Mevcut dosyayı silme — yalnızca mount/default değişiminde form yolunu sıfırlama.
    // Nested `items.N.image` yollarında undefined atmak RHF ağacını bozduğu için atlanıyor.
    if (!fieldKey.includes(".")) {
      setValue(fieldKey, undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultImage, formItem?.type]);

  const onImageChange = (base64?: string | null, imageFileExtension?: string | null, name?: string | null) => {
    if (isS3) {
      // Nested yolda id yoksa üret — API upload eşlemesi id ister.
      const existingId = defaultImage?.id;
      if (!existingId) {
        setValue(`${fieldKey}.id`, uuidv4(), { shouldDirty: true });
      } else {
        setValue(`${fieldKey}.id`, existingId, { shouldDirty: true });
      }
      setValue(`${fieldKey}.base64`, base64, { shouldDirty: true });
      setValue(`${fieldKey}.fileExtension`, imageFileExtension ? `.${imageFileExtension}` : null, { shouldDirty: true });
      setValue(`${fieldKey}.fileName`, name, { shouldDirty: true });
      setValue(`${fieldKey}.fileChanged`, true, { shouldDirty: true });
    } else {
      setValue(formItem?.name, { mediaAsBase64: base64, type: OpsFileTypeEnum.Image }, { shouldDirty: true });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileSizeError("");

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileSizeError(`${t("FileSizeTooLarge")}: ${file.name}. ${t("MaxFileSize")}: 50 MB`);
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      if (acceptMedia === false && VIDEO_EXT.has(fileExtension)) {
        setFileSizeError(t("InvalidFileType") || "Invalid file type");
        event.target.value = "";
        return;
      }

      reader.onloadend = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setImage(dataUrl);
          setFileName(file.name);
          onImageChange(dataUrl, fileExtension, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const handleImageRemove = (event: MouseEvent) => {
    event.stopPropagation();
    setFileSizeError("");
    setFileName(null);
    if (isS3) {
      setImage("");
      onImageChange(isEdit ? "-1" : undefined);
    } else {
      setImage(null);
      onImageChange(null, null, null);
    }
  };

  return (
    <Grid container sx={{ borderRadius: 3, boxShadow: 2, p: 2 }} spacing={2}>
      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: ["block", "block", "block", "block", "none"] }}>
          {formItem?.label === "" ? "" : t(formItem?.label || "UploadImage")}
        </Typography>
        <Box
          sx={{
            width: "100%",
            height: 180,
            borderRadius: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            cursor: "pointer",
            backgroundColor: "#EAEAE9",
          }}
          onClick={image ? () => setFullscreen(true) : () => fileInputRef.current?.click()}
        >
          {image ? (
            isVideo ? (
              <video src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.png";
                  event.currentTarget.onerror = null;
                }}
              />
            )
          ) : (
            <PhotoIcon sx={{ fontSize: 48, color: "#7E7E7E" }} />
          )}
        </Box>
      </Grid>

      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 7 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, display: ["none", "none", "none", "none", "block"] }}>
            {formItem?.label === "" ? "" : t(formItem?.label || "UploadImage")}
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button variant="contained" startIcon={<PhotoIcon />} onClick={() => fileInputRef.current?.click()} disableElevation fullWidth size="large">
              {t("Upload")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleImageRemove}
              disabled={!image}
              fullWidth
              size="large"
              sx={{
                color: "#9E9E9E",
                borderColor: "#BDBDBD",
                "&:hover": { borderColor: "#9E9E9E", backgroundColor: "#F5F5F5" },
              }}
            >
              {t("Remove")}
            </Button>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              defaultValue={defaultImage?.altText || undefined}
              label={t("AltText")}
              variant="outlined"
              {...register(`${fieldKey}.altText`)}
              fullWidth
              size="small"
            />
            <TextField
              defaultValue={defaultImage?.order || undefined}
              label={t("Order")}
              variant="outlined"
              type="number"
              fullWidth
              size="small"
              {...register(`${fieldKey}.order`, {
                valueAsNumber: true,
                setValueAs: (v) => (v ? parseInt(v, 10) : null),
              })}
            />
          </Stack>
        </Stack>
      </Grid>

      {fileSizeError && <Alert severity="error">{fileSizeError}</Alert>}

      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept={accept} onChange={handleFileChange} data-cy={`input-${formItem.name}`} />

      <Dialog open={fullscreen} onClose={() => setFullscreen(false)} maxWidth="lg" fullWidth sx={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
        <Box
          sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "black" }}
          onClick={() => setFullscreen(false)}
        >
          <IconButton sx={{ position: "absolute", top: 16, right: 16, color: "white" }} onClick={() => setFullscreen(false)}>
            <CloseIcon />
          </IconButton>
          {image &&
            (isVideo ? (
              <video src={image} controls style={{ maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }} />
            ))}
        </Box>
      </Dialog>
    </Grid>
  );
}
