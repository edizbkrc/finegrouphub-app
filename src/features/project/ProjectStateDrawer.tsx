"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Divider, Drawer, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import Save from "@mui/icons-material/Save";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsModalHeader from "@components/OpsModalHeader";

/** ProjectState enum değerleri (0 Aktif … 4 Süresi Doldu); etiketler `ProjectState.*` çevirisindedir. */
const PROJECT_STATES = [0, 1, 2, 3, 4] as const;

/**
 * Proje durum güncelleme çekmecesi (production ProjectStateDrawer portu).
 * API `PUT /projects/project/state` gövdesinde proje kimliğini `id` olarak bekler
 * (UpdateFineProjectStateCommand), `projectId` değil.
 */
export default function ProjectStateDrawer({
  isOpen,
  projectId,
  currentState,
  handleClose,
}: {
  isOpen: boolean;
  projectId: number;
  currentState?: number;
  handleClose: (isRefresh?: boolean) => void;
}) {
  const t = useTranslations();
  const [stateTo, setStateTo] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Çekmece her açıldığında önceki seçimin kalmaması için form sıfırlanır.
  useEffect(() => {
    if (isOpen) {
      setStateTo("");
      setReason("");
    }
  }, [isOpen]);

  const onSubmit = () => {
    if (stateTo === "") return;
    setSaving(true);
    axiosInstance
      .put(ApiRoutes.ProjectState, { id: projectId, stateTo, reason: reason.trim() || undefined })
      .then((res) => {
        if (res?.data?.isSuccess) handleClose(true);
      })
      .finally(() => setSaving(false));
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => handleClose(false)}
      sx={{
        "& .MuiDrawer-paper": {
          width: "100%",
          maxWidth: ["100%", 500, 600],
          overflowY: "auto",
          pt: 0,
          borderRadius: "10px",
          backgroundImage: "none",
          backgroundColor: "card2.main",
        },
      }}
    >
      <OpsModalHeader title={t("Tenant.TenantStatusUpdate")} handleClose={() => handleClose(false)} />
      <Divider />
      <Box sx={{ p: 3, mt: 3 }}>
        <FormControl fullWidth>
          <InputLabel>{t("Form.State")}</InputLabel>
          <Select
            label={t("Form.State")}
            value={stateTo}
            onChange={(event) => setStateTo(event.target.value as number)}
            data-cy="project-state-select"
          >
            {PROJECT_STATES.map((state) => (
              // Mevcut durumun tekrar seçilmesi anlamsız (API reddeder); listeden çıkarılır.
              <MenuItem key={state} value={state} disabled={state === currentState}>
                {t(`ProjectState.${state}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          sx={{ mt: 3 }}
          fullWidth
          multiline
          rows={6}
          label={t("Form.Reason")}
          placeholder={t("Form.PlaceHolderValue", { value: t("Form.Reason") })}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <Button
          fullWidth
          variant="contained"
          disableElevation
          color="primary"
          startIcon={<Save />}
          disabled={saving || stateTo === ""}
          onClick={onSubmit}
          sx={{ mt: 3, mb: 2 }}
          data-cy="project-state-save"
        >
          {t("Form.Save")}
        </Button>
      </Box>
    </Drawer>
  );
}
