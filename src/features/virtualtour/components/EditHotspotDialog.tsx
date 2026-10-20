import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  VirtualTourScene,
  VirtualTourTranslation,
  InfoHotspot,
  LinkHotspot,
} from "../types";
import VirtualTourMultiLangInput from "./VirtualTourMultiLangInput";

interface EditHotspotDialogProps {
  open: boolean;
  onClose: () => void;
  hotspot: InfoHotspot | LinkHotspot | null;
  hotspotType: "info" | "link";
  scenes: VirtualTourScene[];
  currentSceneId: string | null;
  onUpdateHotspot: (
    hotspotId: string,
    hotspotType: "info" | "link",
    title: string,
    content?: string,
    targetScene?: string,
    yaw?: number,
    pitch?: number
  ) => void;
}

const EditHotspotDialog: React.FC<EditHotspotDialogProps> = ({
  open,
  onClose,
  hotspot,
  hotspotType,
  scenes,
  currentSceneId,
  onUpdateHotspot,
}) => {
  const t = useTranslations("VirtualTourBuilder");
  const [titleTranslations, setTitleTranslations] = useState<
    VirtualTourTranslation[]
  >([{ languageId: 21, value: "" }]);
  const [contentTranslations, setContentTranslations] = useState<
    VirtualTourTranslation[]
  >([{ languageId: 21, value: "" }]);
  const [targetScene, setTargetScene] = useState<string>("");
  const [yawDeg, setYawDeg] = useState("0");
  const [pitchDeg, setPitchDeg] = useState("0");

  // Initialize form with hotspot data
  useEffect(() => {
    if (hotspot) {
      setTitleTranslations([{ languageId: 21, value: hotspot.title || "" }]);

      if (hotspotType === "info") {
        const infoHotspot = hotspot as InfoHotspot;
        setContentTranslations([
          { languageId: 21, value: infoHotspot.content || "" },
        ]);
      } else if (hotspotType === "link") {
        const linkHotspot = hotspot as LinkHotspot;
        setTargetScene(linkHotspot.targetScene || "");
      }
      setYawDeg(((hotspot.yaw * 180) / Math.PI).toFixed(1));
      setPitchDeg(((hotspot.pitch * 180) / Math.PI).toFixed(1));
    }
  }, [hotspot, hotspotType]);

  const handleClose = () => {
    onClose();
    setTitleTranslations([{ languageId: 21, value: "" }]);
    setContentTranslations([{ languageId: 21, value: "" }]);
    setTargetScene("");
  };

  const handleUpdate = () => {
    if (!hotspot) return;

    const defaultTitle =
      titleTranslations.find((t) => t.languageId === 21)?.value || "";
    const defaultContent =
      contentTranslations.find((t) => t.languageId === 21)?.value || "";

    if (!defaultTitle.trim()) {
      return;
    }

    if (hotspotType === "link" && !targetScene) {
      return;
    }

    const yaw = (parseFloat(yawDeg) * Math.PI) / 180;
    const pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, (parseFloat(pitchDeg) * Math.PI) / 180));

    onUpdateHotspot(
      hotspot.id,
      hotspotType,
      defaultTitle,
      hotspotType === "info" ? defaultContent : undefined,
      hotspotType === "link" ? targetScene : undefined,
      Number.isFinite(yaw) ? yaw : hotspot.yaw,
      Number.isFinite(pitch) ? pitch : hotspot.pitch
    );

    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("editHotspot")} - {hotspotType === "info" ? t("info") : t("link")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <VirtualTourMultiLangInput
            label={t("hotspotTitle")}
            value={titleTranslations}
            onChange={setTitleTranslations}
            placeholder={t("hotspotTitlePlaceholder", {
              type: hotspotType === "info" ? t("info") : t("link"),
            })}
          />
        </Box>

        {hotspotType === "info" && (
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

        {hotspotType === "link" && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t("targetScene")}</InputLabel>
            <Select
              value={targetScene}
              onChange={(e) => setTargetScene(e.target.value)}
              label={t("targetScene")}
              disabled={scenes.length === 0}
            >
              {scenes
                .filter((s) => s.id !== currentSceneId)
                .map((scene) => (
                  <MenuItem key={scene.id} value={scene.id}>
                    {scene.nameTranslations?.find((t) => t.languageId === 21)
                      ?.value ||
                      scene.name ||
                      `Scene ${scene.id}`}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          {t("hotspotPosition")}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          {t("dragToMoveHotspot")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
          <TextField
            label={`${t("yaw")} (${t("degrees")})`}
            value={yawDeg}
            onChange={(e) => setYawDeg(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label={`${t("pitch")} (${t("degrees")})`}
            value={pitchDeg}
            onChange={(e) => setPitchDeg(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("cancel")}</Button>
        <Button onClick={handleUpdate} variant="contained">
          {t("update")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditHotspotDialog;
