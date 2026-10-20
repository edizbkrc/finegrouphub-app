"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { toLookupRequest } from "@network/adapters";
import { projectFilter } from "./ProjectContext";

/** Bloğa ardışık numaralı katlar ekler (POST /blocks/block/floors/floor). */
export default function AddFloorsDialog({
  open,
  projectId,
  blockId,
  nextNumber,
  onClose,
  onAdded,
}: {
  open: boolean;
  projectId: number;
  blockId: number;
  nextNumber: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useTranslations();
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ start: String(nextNumber), count: "1", templateId: "" as number | "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ start: String(nextNumber), count: "1", templateId: "" });
    axiosInstance
      .patch(ApiRoutes.Lookups, toLookupRequest({ entityName: "FloorTemplate", requestedPropertyNames: ["Name"], filtering: projectFilter(projectId) }), { withoutToast: true })
      .then((res) => setTemplates(((res?.data?.data?.[0]?.data as { Id: number; Name: string }[]) ?? []).map((row) => ({ id: row.Id, name: row.Name }))))
      .catch(() => setTemplates([]));
  }, [open, projectId, nextNumber]);

  const count = Number(form.count);
  const valid = count > 0 && count <= 100 && form.templateId !== "";

  const submit = () => {
    if (form.templateId === "") return;
    const start = Number(form.start) || 0;
    setSaving(true);
    axiosInstance
      .post(ApiRoutes.BlockFloors, { blockId, floors: Array.from({ length: count }, (_, i) => ({ templateId: form.templateId, number: start + i })) })
      .then((res) => {
        if (!res?.data?.isSuccess) return;
        onAdded();
        onClose();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("Project.AddFloors")}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label={t("Form.StartFloorNumber")} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label={t("Form.FloorCountToAdd")} value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} inputProps={{ min: 1, max: 100 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth label={t("Form.FloorPlanDefinition")} value={form.templateId} onChange={(e) => setForm({ ...form, templateId: Number(e.target.value) })}>
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
        <Button variant="contained" onClick={submit} disabled={!valid || saving}>
          {t("Form.Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
