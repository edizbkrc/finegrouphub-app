"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Drawer,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import type { ISvgPolygon } from "./types";

/**
 * Seçili karenin poligon JSON'unu görüntüleme / düzenleme çekmecesi.
 * Production WorkspaceJson ile aynı amaç; sade textarea ile.
 */
export default function WorkspaceJsonDrawer({
  open,
  polygons,
  onClose,
  onApply,
}: {
  open: boolean;
  polygons?: ISvgPolygon[] | null;
  onClose: () => void;
  onApply: (polygons: ISvgPolygon[]) => Promise<void> | void;
}) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const [text, setText] = useState("[]");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText(JSON.stringify(polygons ?? [], null, 2));
  }, [open, polygons]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(t("Draw.CopySucces"), { variant: "success" });
    } catch {
      enqueueSnackbar(t("Draw.CopyError"), { variant: "error" });
    }
  };

  const handlePaste = async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      JSON.parse(clipboard);
      setText(clipboard);
      enqueueSnackbar(t("Draw.PasteSucces"), { variant: "success" });
    } catch {
      enqueueSnackbar(t("Draw.PasteError"), { variant: "error" });
    }
  };

  const handleApply = async () => {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) {
        enqueueSnackbar(t("Draw.FormatError"), { variant: "warning" });
        return;
      }
      setSaving(true);
      await onApply(parsed as ISvgPolygon[]);
      onClose();
    } catch {
      enqueueSnackbar(t("Draw.FormatError"), { variant: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
      <Box sx={{ width: { xs: "100vw", sm: 480, md: 560 }, height: "100%", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("Draw.Points")}
          </Typography>
          <Button startIcon={<CloseIcon />} color="inherit" onClick={onClose}>
            {t("Button.Close")}
          </Button>
        </Stack>

        <DialogContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Seçili karenin poligon JSON&apos;u. Düzenleyip kaydedebilirsiniz.
          </Typography>
          <TextField
            value={text}
            onChange={(event) => setText(event.target.value)}
            multiline
            fullWidth
            minRows={18}
            maxRows={28}
            InputProps={{
              sx: {
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
                alignItems: "flex-start",
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 2, gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
            {t("Draw.Copy")}
          </Button>
          <Button variant="outlined" startIcon={<ContentPasteIcon />} onClick={handlePaste}>
            {t("Draw.Paste")}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleApply} disabled={saving}>
            {t("Draw.Save")}
          </Button>
        </DialogActions>
      </Box>
    </Drawer>
  );
}
