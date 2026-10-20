import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import {
  HotspotForm,
  VirtualTourScene,
  VirtualTourTranslation,
} from "../types";
import VirtualTourMultiLangInput from "./VirtualTourMultiLangInput";

interface HotspotDialogProps {
  open: boolean;
  onClose: () => void;
  hotspotForm: HotspotForm;
  setHotspotForm: React.Dispatch<React.SetStateAction<HotspotForm>>;
  scenes: VirtualTourScene[];
  currentSceneId: string | null;
  onAddHotspot: (title?: string, content?: string) => void;
}

const HotspotDialog: React.FC<HotspotDialogProps> = ({
  open,
  onClose,
  hotspotForm,
  setHotspotForm,
  scenes,
  currentSceneId,
  onAddHotspot,
}) => {
  const t = useTranslations("VirtualTourBuilder");
  const [titleTranslations, setTitleTranslations] = useState<
    VirtualTourTranslation[]
  >([{ languageId: 21, value: "" }]);
  const [contentTranslations, setContentTranslations] = useState<
    VirtualTourTranslation[]
  >([{ languageId: 21, value: "" }]);

  const handleClose = () => {
    onClose();
    setHotspotForm({
      type: "info",
      title: "",
      content: "",
      targetScene: "",
      position: null,
    });
    setTitleTranslations([{ languageId: 21, value: "" }]);
    setContentTranslations([{ languageId: 21, value: "" }]);
  };

  const handleAddHotspot = () => {
    const defaultTitle =
      titleTranslations.find((t) => t.languageId === 21)?.value || "";
    const defaultContent =
      contentTranslations.find((t) => t.languageId === 21)?.value || "";

    if (!defaultTitle.trim()) {
      return;
    }

    if (hotspotForm.type === "link" && !hotspotForm.targetScene) {
      return;
    }

    onAddHotspot(defaultTitle, defaultContent);

    setHotspotForm({
      type: "info",
      title: "",
      content: "",
      targetScene: "",
      position: null,
    });
    setTitleTranslations([{ languageId: 21, value: "" }]);
    setContentTranslations([{ languageId: 21, value: "" }]);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("addHotspot")} -{" "}
        {hotspotForm.type === "info" ? t("info") : t("link")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <VirtualTourMultiLangInput
            label={t("hotspotTitle")}
            value={titleTranslations}
            onChange={setTitleTranslations}
            placeholder={t("hotspotTitlePlaceholder", {
              type: hotspotForm.type === "info" ? t("info") : t("link"),
            })}
          />
        </Box>

        {hotspotForm.type === "info" && (
          <Box sx={{ mb: 2 }}>
            <VirtualTourMultiLangInput
              label={t("hotspotContent")}
              value={contentTranslations}
              onChange={setContentTranslations}
              multiline
              rows={4}
              placeholder={t("hotspotContentPlaceholder")}
            />
          </Box>
        )}

        {hotspotForm.type === "link" && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t("targetScene")}</InputLabel>
            <Select
              value={hotspotForm.targetScene}
              onChange={(e) =>
                setHotspotForm((prev) => ({
                  ...prev,
                  targetScene: e.target.value,
                }))
              }
              label={t("targetScene")}
              disabled={scenes.length === 0}
            >
              {scenes
                .filter((s) => s.id !== currentSceneId)
                .map((scene) => (
                  <MenuItem key={scene.id} value={scene.id}>
                    {scene.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        {hotspotForm.position && (
          <Typography variant="body2" color="textSecondary">
            Position: {hotspotForm.position.yaw.toFixed(3)},{" "}
            {hotspotForm.position.pitch.toFixed(3)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("cancel")}</Button>
        <Button onClick={handleAddHotspot} variant="contained">
          {t("addHotspot")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HotspotDialog;
