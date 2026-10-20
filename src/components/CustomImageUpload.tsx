"use client";

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Dialog, IconButton, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PhotoIcon from "@/assets/svgs/PhotoIcon";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";

interface ICustomImageUploadProps {
  setValue: (value: { mediaAsBase64?: string | null; imageFileExtension?: string | null } | string | null) => void;
  defaultValue?: { publicUrl?: string } | string | null;
  variant?: "outlined" | "contained";
  type: FormItemTypeEnum;
  label?: string;
  removeLabel?: string;
}

/**
 * `ImageUpload` (common/inputs) ile aynı akış, react-hook-form dışı (kontrollü
 * `setValue` ile) kullanılan hafif sürüm — tek yuvarlak avatar görseli için.
 */
export default function CustomImageUpload({ setValue, defaultValue: defaultImage, variant, type, label, removeLabel }: ICustomImageUploadProps) {
  const t = useTranslations();
  const isS3 = type === FormItemTypeEnum.S3_IMAGE;

  const [image, setImage] = useState<string | null>(isS3 ? ((defaultImage as string) ?? null) : null);
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isS3) {
      setImage((defaultImage as string) || "");
    } else {
      const publicUrl = (defaultImage as { publicUrl?: string })?.publicUrl;
      if (publicUrl) setImage((process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "") + publicUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultImage, type]);

  const onImageChange = (base64?: string | null, imageFileExtension?: string) => {
    setValue({ mediaAsBase64: base64, imageFileExtension });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      const fileExtension = file.name.split(".").pop();
      reader.onloadend = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setImage(dataUrl);
          onImageChange(dataUrl, fileExtension);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const handleImageRemove = (event: MouseEvent) => {
    event.stopPropagation();
    if (isS3) {
      setImage("");
      setValue("");
    } else {
      setImage(null);
      onImageChange(null);
    }
  };

  return (
    <Box sx={{ alignSelf: "center" }}>
      <Stack direction={["column", "row"]} justifyContent={["center", "space-evenly"]} flexWrap="wrap" sx={{ width: "100%", alignItems: "center" }}>
        <Box sx={{ borderRadius: "50%", border: "1px dashed #7E7E7E", display: "flex", justifyContent: "center", alignItems: "center", p: "7px" }}>
          <Box
            sx={{ width: 130, height: 130, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#D9D9D9", position: "relative", cursor: "pointer" }}
            onClick={image ? () => setFullscreen(true) : () => fileInputRef.current?.click()}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <PhotoIcon sx={{ fontSize: 48, color: "#7E7E7E" }} />
            )}
          </Box>
        </Box>
        <Stack>
          <Button variant="contained" startIcon={<PhotoIcon />} onClick={() => fileInputRef.current?.click()} disableElevation sx={{ mt: 2, marginBottom: 2, ml: variant === "outlined" ? 0 : [0, 0, 1] }}>
            {label || t("Form.UploadImage")}
          </Button>
          <Button variant="outlined" disableElevation startIcon={<DeleteIcon />} onClick={handleImageRemove} disabled={!image} sx={{ ml: variant === "outlined" ? 0 : [0, 0, 1] }}>
            {removeLabel || t("Form.RemoveImage")}
          </Button>
        </Stack>
      </Stack>

      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleFileChange} data-cy={`input-${label}`} />

      <Dialog open={fullscreen} onClose={() => setFullscreen(false)} maxWidth="lg" fullWidth sx={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
        <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "black" }} onClick={() => setFullscreen(false)}>
          <IconButton sx={{ position: "absolute", top: 16, right: 16, color: "white" }} onClick={() => setFullscreen(false)}>
            <CloseIcon />
          </IconButton>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }} />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
