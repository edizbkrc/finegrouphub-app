"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { toEnumLookupParams } from "@network/adapters";
import { OrderStateEnum, type IOrderDetail } from "./types";

interface IOption {
  value: number;
  name: string;
}

/**
 * Sipariş durumu. Ana sipariş "Tamamlandı"ya alınırken proje henüz yoksa API
 * projeyi `projectCreationSpecs` ile oluşturur — bu yüzden o durumda proje
 * bilgileri de istenir. Tamamlama için ön ödeme alınmış olmalıdır.
 */
export default function OrderStateDialog({
  open,
  order,
  onClose,
  onUpdated,
}: {
  open: boolean;
  order: IOrderDetail;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const t = useTranslations();
  const [options, setOptions] = useState<IOption[]>([]);
  const [presentationTypes, setPresentationTypes] = useState<IOption[]>([]);
  const [stateTo, setStateTo] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [sendMail, setSendMail] = useState(false);
  const [project, setProject] = useState({
    name: "",
    slogan: "",
    startMode: 1,
    pinned: false,
    featured: false,
    showUnitPricesInFine3d: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStateTo("");
    setDescription("");
    setSendMail(false);
    setProject((prev) => ({ ...prev, name: order.projectName ?? "" }));
    const load = (enumName: string, set: (rows: IOption[]) => void) =>
      axiosInstance
        .get(ApiRoutes.LookupsEnum, { params: toEnumLookupParams(enumName), withoutToast: true })
        .then((res) => set((res?.data?.data as IOption[]) ?? []))
        .catch(() => set([]));
    load("OrderUpdateState", (rows) => setOptions(rows.filter((row) => row.value !== order.state)));
    load("PresentationType", setPresentationTypes);
  }, [open, order.projectName, order.state]);

  const needsProject = stateTo === OrderStateEnum.Completed && order.isMainOrder && !order.projectId;
  const valid = stateTo !== "" && (!needsProject || project.name.trim().length > 0);

  const submit = () => {
    if (stateTo === "") return;
    setSaving(true);
    axiosInstance
      .put(ApiRoutes.OrderState, {
        id: order.id,
        stateTo,
        description: description.trim() || null,
        sendMailToCompany: sendMail,
        ...(needsProject ? { projectCreationSpecs: { ...project, displayOrder: 0 } } : {}),
      })
      .then((res) => {
        if (!res?.data?.isSuccess) return;
        onUpdated();
        onClose();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("Order.UpadateOrder")}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}>
            <TextField select fullWidth label={t("Form.State")} value={stateTo} onChange={(e) => setStateTo(Number(e.target.value))} inputProps={{ "data-cy": "order-state-select" }}>
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {needsProject && (
            <>
              <Grid size={12}>
                <Typography variant="subtitle2">{t("Order.ProjectCreation")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("Order.ProjectCreationInfo")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" required label={t("Form.ProjectName")} value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" label={t("Form.Slogan")} value={project.slogan} onChange={(e) => setProject({ ...project, slogan: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth size="small" label={t("Form.ModeStart")} value={project.startMode} onChange={(e) => setProject({ ...project, startMode: Number(e.target.value) })}>
                  {presentationTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel control={<Checkbox checked={project.featured} onChange={(e) => setProject({ ...project, featured: e.target.checked })} />} label={t("Form.Featured")} />
                <FormControlLabel control={<Checkbox checked={project.pinned} onChange={(e) => setProject({ ...project, pinned: e.target.checked })} />} label={t("Form.Pinned")} />
                <FormControlLabel
                  control={<Checkbox checked={project.showUnitPricesInFine3d} onChange={(e) => setProject({ ...project, showUnitPricesInFine3d: e.target.checked })} />}
                  label={t("Form.ShowUnitPricesInFine3d")}
                />
              </Grid>
            </>
          )}

          <Grid size={12}>
            <TextField fullWidth multiline minRows={2} label={t("Form.Description")} value={description} onChange={(e) => setDescription(e.target.value)} inputProps={{ maxLength: 1000 }} />
          </Grid>
          <Grid size={12}>
            <FormControlLabel control={<Checkbox checked={sendMail} onChange={(e) => setSendMail(e.target.checked)} />} label={t("Form.SendMailToCompany")} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Form.Cancel")}</Button>
        <Button variant="contained" onClick={submit} disabled={!valid || saving} data-cy="order-state-submit">
          {t("Form.Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
