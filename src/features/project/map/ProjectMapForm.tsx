"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Box, Button, Stack, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsDrawer from "@common/form/OpsDrawer";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { RemoveUndefinedValues } from "@common/helpers/removeUndefinedValues";
import { prepareTranslationData } from "@common/helpers/prepareTranslationData";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import type { IFormItem } from "@common/types/IFormItem";
import type { IReactHookFormProps } from "@common/types/IReactHookFormProps";
import { v4 as uuidv4 } from "uuid";

const MAX_EDGE_PX = 96;
const JPEG_QUALITY = 0.8;
/** Kalıcı etiketin varsayılan rengi — panel teması ve Fine3D varsayılanıyla aynı turuncu. */
export const DEFAULT_MAP_LABEL_COLOR = "#F26522";
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export type SavedMapMark = {
  id: string;
  geoPoint: { latitude: number; longitude: number };
  emoji?: string | null;
  customIcon?: string | null;
  showLabel?: boolean;
  labelColor?: string | null;
  translations?: Array<{ name?: string; languageId?: number }>;
  [key: string]: unknown;
};

type Props = {
  data?: any;
  mapInfo?: any;
  isOpen: boolean;
  handleClose: (isRefresh?: boolean, savedMarks?: SavedMapMark[]) => void;
  selectedGeoPoint?: { latitude: number; longitude: number } | null;
  projectId: number;
};

/** Özel ikonu küçültüp data-URI yap — büyük base64 PUT’u bozmasın. */
async function compressIconFile(file: File): Promise<string> {
  if (typeof createImageBitmap !== "function") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject());
      reader.onerror = () => reject();
      reader.readAsDataURL(file);
    });
  }

  if (file.type === "image/svg+xml") {
    const raw = await file.text();
    const blobUrl = URL.createObjectURL(new Blob([raw], { type: "image/svg+xml" }));
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject();
        el.src = blobUrl;
      });
      const nw = img.naturalWidth || MAX_EDGE_PX;
      const nh = img.naturalHeight || MAX_EDGE_PX;
      const scale = Math.min(1, MAX_EDGE_PX / Math.max(nw, nh));
      const w = Math.max(1, Math.round(nw * scale));
      const h = Math.max(1, Math.round(nh * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/** İşaretçi drawer’ı — stok MUI ikon + isteğe bağlı özel görsel. */
export default function ProjectMapForm({
  isOpen,
  handleClose,
  data,
  selectedGeoPoint,
  mapInfo,
  projectId,
}: Props) {
  const t = useTranslations();
  const formT = useTranslations("Form");
  const { enqueueSnackbar } = useSnackbar();
  const { supportedLanguage } = useSupportedLanguages();
  // Kaynak: React state (RHF setValue F5/submit’te kaybolabiliyordu).
  const [customIcon, setCustomIcon] = useState<string | null>(data?.customIcon || null);

  useEffect(() => {
    setCustomIcon(data?.customIcon || null);
  }, [data?.customIcon, isOpen]);

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "Name",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "emoji",
      label: "Icon",
      type: FormItemTypeEnum.MUI_ICON_AUTOCOMPLETE,
      visibility: FormItemVisibilityEnum.Both,
    },
    {
      // Fine3D'de adı tıklamadan hep gösterir; kapalıyken eski "tıklayınca balon" davranışı.
      name: "showLabel",
      label: "ShowMapLabel",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Both,
      defaultValue: false,
      gridSize: { xs: 12, md: 6 },
    },
    {
      name: "labelColor",
      label: "MapLabelColor",
      type: FormItemTypeEnum.COLOR_PICKER,
      visibility: FormItemVisibilityEnum.Both,
      defaultValue: DEFAULT_MAP_LABEL_COLOR,
      gridSize: { xs: 12, md: 6 },
    },
    {
      name: "geoPoint.latitude",
      defaultValue: selectedGeoPoint?.latitude ?? data?.geoPoint?.latitude,
      label: "Latitude",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { valueAsNumber: true, required: t("Form.Required") },
    },
    {
      name: "geoPoint.longitude",
      label: "Longitude",
      defaultValue: selectedGeoPoint?.longitude ?? data?.geoPoint?.longitude,
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { valueAsNumber: true, required: t("Form.Required") },
    },
  ];

  const handleSubmit = (formData: any, setSubmitLoading: (loading: boolean) => void) => {
    const icon =
      (typeof customIcon === "string" && customIcon.trim()) ||
      (typeof formData?.customIcon === "string" && formData.customIcon.trim()) ||
      null;

    if (!icon && !formData?.emoji) {
      enqueueSnackbar(formT("CustomMapIconOrStockRequired"), { variant: "warning", autoHideDuration: 4000 });
      return;
    }

    setSubmitLoading(true);
    let newData = RemoveUndefinedValues(formData);
    newData = prepareTranslationData(scheme, formData, data?.translations, supportedLanguage);

    const lat = Number(formData?.geoPoint?.latitude ?? formData?.["geoPoint.latitude"] ?? selectedGeoPoint?.latitude);
    const lng = Number(formData?.geoPoint?.longitude ?? formData?.["geoPoint.longitude"] ?? selectedGeoPoint?.longitude);
    newData.geoPoint = { latitude: lat, longitude: lng };
    delete newData["geoPoint.latitude"];
    delete newData["geoPoint.longitude"];
    // Form alanından sızmasın; yalnızca biz set ediyoruz.
    delete newData.customIcon;

    newData.customIcon = icon;
    newData.emoji = formData?.emoji || data?.emoji || "place";
    newData.showLabel = !!formData?.showLabel;
    // Renk seçici serbest metin de kabul ediyor; geçersiz değer Fine3D'de CSS'e gitmesin diye
    // yalnız hex saklanır. Etiket kapalıyken renk yine korunur (tekrar açınca kaybolmasın).
    const rawColor = typeof formData?.labelColor === "string" ? formData.labelColor.trim() : "";
    newData.labelColor = HEX_COLOR.test(rawColor) ? rawColor : null;

    const currentMarks: SavedMapMark[] = Array.isArray(mapInfo?.marks) ? mapInfo.marks : [];
    const markId = data?.id || uuidv4();
    const savedMark: SavedMapMark = {
      ...newData,
      id: markId,
      customIcon: icon,
      emoji: newData.emoji,
      showLabel: newData.showLabel,
      labelColor: newData.labelColor,
    };
    const updatedMarks = data?.id
      ? currentMarks.map((mark) => (mark?.id === data?.id ? { ...mark, ...savedMark, id: data.id } : mark))
      : [...currentMarks, savedMark];

    axiosInstance
      .put(ApiRoutes.ProjectDetail, {
        id: projectId,
        mapInfo: {
          value: {
            geoPoint: mapInfo?.geoPoint ?? selectedGeoPoint ?? { latitude: lat, longitude: lng },
            zoom: mapInfo?.zoom ?? 12,
            marks: updatedMarks,
          },
          isUpdated: true,
        },
      })
      .then((res) => {
        if (res?.data?.isSuccess) {
          // Anında haritaya yansıt; reload gecikse bile icon kaybolmasın.
          handleClose(true, updatedMarks);
          return;
        }
        enqueueSnackbar(t("Toast.Error") || "Error", { variant: "error", autoHideDuration: 5000 });
      })
      .catch(() => {
        enqueueSnackbar(t("Toast.Error") || "Error", { variant: "error", autoHideDuration: 5000 });
      })
      .finally(() => setSubmitLoading(false));
  };

  const renderBefore = (_apiData: any, form: IReactHookFormProps) => (
    <CustomIconField initial={customIcon} form={form} formT={formT} onChange={setCustomIcon} />
  );

  return (
    <OpsDrawer
      isOpen={isOpen}
      handleClose={() => handleClose(false)}
      schema={scheme}
      handleSubmit={handleSubmit}
      title={t("Modal.AddMarker")}
      editTitle={t("Modal.EditMarker")}
      apiData={data}
      renderBefore={renderBefore}
    />
  );
}

type CustomIconFieldProps = {
  initial: string | null;
  form: IReactHookFormProps;
  formT: ReturnType<typeof useTranslations>;
  onChange: (url: string | null) => void;
};

function CustomIconField({ initial, form, formT, onChange }: CustomIconFieldProps) {
  const { register, setValue } = form;
  const [preview, setPreview] = useState<string | null>(initial);
  const [iconError, setIconError] = useState("");
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    register("customIcon");
  }, [register]);

  // Sadece görsel önizlemeyi sync et — parent state’i sıfırlama (upload kaybı olmasın).
  useEffect(() => {
    setPreview(initial);
    setIconError("");
    setValue("customIcon", initial || "", { shouldDirty: false });
  }, [initial, setValue]);

  const onPickCustom = async (file: File | null) => {
    setIconError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setIconError(formT("InvalidFileType") || "Invalid file");
      return;
    }
    setCompressing(true);
    try {
      const dataUrl = await compressIconFile(file);
      setPreview(dataUrl);
      onChange(dataUrl);
      setValue("customIcon", dataUrl, { shouldDirty: true, shouldValidate: true });
    } catch {
      setIconError(formT("CustomMapIconTooLarge"));
    } finally {
      setCompressing(false);
    }
  };

  const onClear = () => {
    setPreview(null);
    onChange(null);
    setValue("customIcon", "", { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Box sx={{ mb: 3, mt: 2, p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
        {formT("CustomMapIcon")}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        {formT("CustomMapIconHint")}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "2px solid",
            borderColor: preview ? "primary.main" : "divider",
            overflow: "hidden",
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <PhotoCameraIcon color="action" fontSize="small" />
          )}
        </Box>
        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoCameraIcon />}
          size="small"
          disabled={compressing}
          data-cy="map-custom-icon-upload"
        >
          {compressing ? formT("Uploading") || "..." : formT("Upload")}
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              void onPickCustom(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
        </Button>
        {preview && (
          <Button variant="text" color="error" startIcon={<DeleteOutlineIcon />} size="small" onClick={onClear} data-cy="map-custom-icon-clear">
            {formT("Remove")}
          </Button>
        )}
      </Stack>
      {iconError && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
          {iconError}
        </Typography>
      )}
    </Box>
  );
}
