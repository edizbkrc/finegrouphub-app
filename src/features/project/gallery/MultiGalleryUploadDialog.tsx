"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import FileInput from "@common/inputs/FileInput";
import { s3ImageUpload } from "@common/helpers/s3ImageUpload";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import type { IFormItem } from "@common/types/IFormItem";

interface IGroupOption {
  id: number;
  name: string;
}

interface IPickedImage {
  base64?: string;
  fileName?: string;
  fileExtension?: string;
}

interface IProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
}

/**
 * Aynı anda yüklenecek istek sayısı. Görseller base64 olarak bellekte tutulduğu ve
 * her biri sıkıştırılarak S3'e gittiği için hepsini birden başlatmak tarayıcıyı donduruyor.
 */
const CONCURRENCY = 3;

/**
 * FileInput, defaultValue her değiştiğinde seçili listeyi sıfırlıyor; render başına yeni
 * bir [] vermek seçilen dosyaları siler, bu yüzden sabit bir referans kullanılır.
 */
const NO_IMAGES: IPickedImage[] = [];

const imagesScheme: IFormItem = {
  name: "images",
  label: "Images",
  type: FormItemTypeEnum.FILE,
  fileType: OpsFileTypeEnum.Image,
  fileMultiple: true,
  visibility: FormItemVisibilityEnum.Both,
  registerOptions: { required: true },
};

/**
 * Galeriye çoklu resim yükleme (production MultiGalleryUploadDialog karşılığı).
 * Her resim için önce `POST gallery/item` kaydı açılır, dönen presigned URL'ye resim PUT edilir.
 */
export default function MultiGalleryUploadDialog({
  open,
  projectId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  projectId: number;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const [groups, setGroups] = useState<IGroupOption[]>([]);
  const [groupId, setGroupId] = useState<number | "">("");
  const [startingOrder, setStartingOrder] = useState("0");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<IProgress | null>(null);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors },
  } = useForm<{ images: IPickedImage[] }>({ defaultValues: { images: [] } });

  useEffect(() => {
    if (!open) return;
    reset({ images: [] });
    setGroupId("");
    setStartingOrder("0");
    setProgress(null);
    axiosInstance
      .patch(ApiRoutes.GalleryGroups, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => setGroups(((res?.data?.data as IGroupOption[]) ?? []).map((group) => ({ id: group.id, name: group.name }))))
      .catch(() => setGroups([]));
  }, [open, projectId, reset]);

  const uploadOne = async (image: IPickedImage, order: number) => {
    const response = await axiosInstance.post(
      ApiRoutes.GalleryItemDetail,
      {
        projectId,
        groupId,
        displayOrder: order,
        image: { id: uuidv4(), fileName: image.fileName, fileExtension: image.fileExtension },
      },
      { withoutToast: true }
    );
    if (!response?.data?.isSuccess) throw new Error("create-failed");

    const preSignedUrl = response.data.data?.uploadInfo?.preSignedUrl as string | undefined;
    if (preSignedUrl && image.base64) await s3ImageUpload(preSignedUrl, image.base64);
  };

  const onSubmit = async (form: { images: IPickedImage[] }) => {
    const images = form.images ?? [];

    if (groupId === "") {
      enqueueSnackbar(t("Toast.PleaseSelectGroup"), { variant: "error" });
      return;
    }
    if (images.length === 0) {
      enqueueSnackbar(t("Toast.PleaseSelectImages"), { variant: "error" });
      return;
    }

    const baseOrder = Number(startingOrder) || 0;
    setUploading(true);
    setProgress({ total: images.length, completed: 0, failed: 0, current: "" });

    let cursor = 0;
    let success = 0;
    let failed = 0;

    // Basit havuz: her işçi sıradaki resmi alır, bitince bir sonrakine geçer.
    const worker = async () => {
      while (cursor < images.length) {
        const index = cursor++;
        const image = images[index];
        setProgress((prev) => (prev ? { ...prev, current: image.fileName || `#${index + 1}` } : prev));
        try {
          await uploadOne(image, baseOrder + index);
          success += 1;
          setProgress((prev) => (prev ? { ...prev, completed: prev.completed + 1 } : prev));
        } catch {
          failed += 1;
          setProgress((prev) => (prev ? { ...prev, completed: prev.completed + 1, failed: prev.failed + 1 } : prev));
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, images.length) }, worker));

      if (failed > 0) {
        enqueueSnackbar(t("Toast.UploadCompletedWithErrors", { success, failed }), { variant: "warning", autoHideDuration: 5000 });
      } else {
        enqueueSnackbar(t("Toast.AllImagesUploadedSuccessfully"), { variant: "success" });
      }

      // Kısmi başarıda da liste yenilenmeli; yüklenenler zaten kaydedildi.
      if (success > 0) onSuccess?.();
      if (failed === 0) onClose();
    } catch {
      enqueueSnackbar(t("Toast.UploadError"), { variant: "error", autoHideDuration: 5000 });
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const handleClose = () => {
    // Yükleme sürerken kapatmak yarım kalan kayıtlar bırakır.
    if (!uploading) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{t("Modal.MultipleImageUpload")}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                select
                fullWidth
                required
                label={t("Form.GroupName")}
                value={groupId}
                onChange={(event) => setGroupId(Number(event.target.value))}
                disabled={uploading}
                data-cy="gallery-multi-group"
              >
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t("Form.StartingOrder")}
                value={startingOrder}
                onChange={(event) => setStartingOrder(event.target.value)}
                disabled={uploading}
              />
            </Grid>
            <Grid size={12}>
              <FileInput
                formItem={imagesScheme}
                control={control}
                register={register}
                setValue={setValue}
                defaultValue={NO_IMAGES}
                error={!!errors.images}
                errorMessage={errors.images?.message as string | undefined}
                t={(key) => t(`Form.${key}`)}
              />
            </Grid>
            {progress && (
              <Grid size={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {t("Form.UploadingProgress")}: {progress.current}
                  </Typography>
                  <Typography variant="body2">
                    {t("Form.Completed")}: {progress.completed} / {progress.total}
                  </Typography>
                  {progress.failed > 0 && (
                    <Typography variant="body2" color="error">
                      {t("Form.Failed")}: {progress.failed}
                    </Typography>
                  )}
                </Alert>
                <LinearProgress variant="determinate" value={(progress.completed / progress.total) * 100} />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={uploading} color="inherit">
            {t("Button.Cancel")}
          </Button>
          <Button type="submit" variant="contained" disableElevation disabled={uploading} startIcon={<CloudUploadIcon />} data-cy="gallery-multi-submit">
            {uploading ? t("Button.Uploading") : t("Button.Upload")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
