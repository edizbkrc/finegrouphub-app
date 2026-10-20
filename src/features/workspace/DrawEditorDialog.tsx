"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { AppBar, Box, Button, CircularProgress, Dialog, Stack, Toolbar, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import type { ISvgPolygon, IWorkspaceItem } from "./types";

/**
 * Çizim editörünü tam ekran açar.
 *
 * Editör `/api/draw` üzerinden **aynı origin'de** servis edilir (bkz. o route'un
 * açıklaması) ve içine `public/draw-bridge.js` enjekte edilir. Panel ile editör
 * yalnızca postMessage üzerinden konuşur — editörün içine elle dokunulmaz, böylece
 * editör güncellendiğinde burada bir şey değişmesi gerekmez.
 */
export default function DrawEditorDialog({
  item,
  open,
  onClose,
  onSave,
}: {
  item: IWorkspaceItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (polygons: ISvgPolygon[]) => Promise<void> | void;
}) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const post = useCallback((message: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    if (!open) setReady(false);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; json?: string; message?: string };
      if (!payload?.type?.startsWith("fgh:")) return;

      if (payload.type === "fgh:ready") {
        setReady(true);
        post({
          type: "fgh:load",
          json: JSON.stringify(item?.polygons ?? []),
          imageUrl: item?.image?.url ?? null,
        });
        return;
      }

      if (payload.type === "fgh:escape") {
        onClose();
        return;
      }

      if (payload.type === "fgh:error") {
        enqueueSnackbar(payload.message ?? t("Toast.Error"), { variant: "warning" });
        return;
      }

      if (payload.type === "fgh:saved") {
        try {
          const polygons = JSON.parse(payload.json ?? "[]") as ISvgPolygon[];
          await onSave(polygons);
        } catch {
          enqueueSnackbar(t("Toast.Error"), { variant: "error" });
        } finally {
          setSaving(false);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [open, item, post, onSave, onClose, enqueueSnackbar, t]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = () => {
    setSaving(true);
    post({ type: "fgh:request-save" });
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <AppBar position="relative" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Button color="inherit" startIcon={<ArrowBack />} onClick={onClose} disabled={saving} data-cy="draw-editor-back">
            {t("Form.Back")}
          </Button>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {item?.image?.fileName ?? t("Form.Workspace")}
            {item ? ` · #${item.id}` : ""}
          </Typography>
          <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave} disabled={!ready || saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : t("Button.Save")}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ position: "relative", flex: 1, bgcolor: "background.default" }}>
        {!ready && (
          <Stack alignItems="center" justifyContent="center" sx={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t("Form.Workspace")}…
            </Typography>
          </Stack>
        )}
        <Box
          component="iframe"
          key={item?.id ?? "empty"}
          ref={frameRef}
          src="/api/draw"
          title={t("Form.Workspace")}
          sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
        />
      </Box>
    </Dialog>
  );
}
