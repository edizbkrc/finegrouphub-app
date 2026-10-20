"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { toLookupRequest } from "@network/adapters";
import { projectFilter } from "./ProjectContext";

interface IOption {
  id: number;
  name: string;
}

/**
 * Blok + katları tek adımda: başlangıç kat numarası, kat sayısı ve kat şablonu
 * seçilir, katlar ardışık numaralarla üretilir. (Farklı şablonlu katlar
 * blok sayfasından ayrıca eklenebilir.)
 */
export default function BlockCreateDialog({
  open,
  projectId,
  stageId,
  onClose,
  onCreated,
}: {
  open: boolean;
  projectId: number;
  stageId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations();
  const [templates, setTemplates] = useState<IOption[]>([]);
  const [form, setForm] = useState({ name: "", apartmentCount: "", startFloor: "0", floorCount: "5", templateId: "" as number | "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ name: "", apartmentCount: "", startFloor: "0", floorCount: "5", templateId: "" });
    axiosInstance
      .patch(ApiRoutes.Lookups, toLookupRequest({ entityName: "FloorTemplate", requestedPropertyNames: ["Name"], filtering: projectFilter(projectId) }), { withoutToast: true })
      .then((res) => setTemplates(((res?.data?.data?.[0]?.data as { Id: number; Name: string }[]) ?? []).map((row) => ({ id: row.Id, name: row.Name }))))
      .catch(() => setTemplates([]));
  }, [open, projectId]);

  const floorCount = Number(form.floorCount);
  const valid = form.name.trim() && floorCount > 0 && floorCount <= 200 && form.templateId !== "";

  const submit = () => {
    if (form.templateId === "") return;
    const start = Number(form.startFloor) || 0;
    const floors = Array.from({ length: floorCount }, (_, i) => ({ templateId: form.templateId, number: start + i }));
    setSaving(true);
    axiosInstance
      .post(ApiRoutes.BlockDetail, {
        projectId,
        projectStageId: stageId,
        name: form.name.trim(),
        apartmentCount: Number(form.apartmentCount) || 0,
        floors,
      })
      .then((res) => {
        if (!res?.data?.isSuccess) return;
        onCreated();
        onClose();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("Modal.AddBlock")}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField fullWidth required label={t("Form.BlockName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} inputProps={{ maxLength: 100, "data-cy": "block-name" }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label={t("Form.ApartmentCount")} value={form.apartmentCount} onChange={(e) => setForm({ ...form, apartmentCount: e.target.value })} inputProps={{ min: 0 }} />
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2">{t("Project.Floors")}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label={t("Form.StartFloorNumber")} value={form.startFloor} onChange={(e) => setForm({ ...form, startFloor: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth required type="number" label={t("Form.FloorCountToAdd")} value={form.floorCount} onChange={(e) => setForm({ ...form, floorCount: e.target.value })} inputProps={{ min: 1, max: 200 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth required label={t("Form.FloorPlanDefinition")} value={form.templateId} onChange={(e) => setForm({ ...form, templateId: Number(e.target.value) })} helperText={templates.length === 0 ? t("Project.NoFloorTemplates") : undefined}>
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Form.Cancel")}</Button>
        <Button variant="contained" onClick={submit} disabled={!valid || saving} data-cy="block-create-submit">
          {t("Form.Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
