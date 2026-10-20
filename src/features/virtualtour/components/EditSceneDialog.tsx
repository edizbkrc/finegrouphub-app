import React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
} from "@mui/material";
import { EditingScene } from "../types";

interface EditSceneDialogProps {
  open: boolean;
  onClose: () => void;
  editingScene: EditingScene;
  setEditingScene: React.Dispatch<React.SetStateAction<EditingScene>>;
  onUpdateScene: () => void;
}

const EditSceneDialog: React.FC<EditSceneDialogProps> = ({
  open,
  onClose,
  editingScene,
  setEditingScene,
  onUpdateScene,
}) => {
  const t = useTranslations("VirtualTourBuilder");

  const handleClose = () => {
    onClose();
    setEditingScene({
      id: "",
      name: "",
      description: "",
      yaw: "0",
      pitch: "0",
      fov: "90",
      faceSize: "1500",
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("editScene")}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label={t("sceneName")}
          value={editingScene.name}
          onChange={(e) =>
            setEditingScene({ ...editingScene, name: e.target.value })
          }
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          fullWidth
          label={t("description")}
          multiline
          rows={3}
          value={editingScene.description}
          onChange={(e) =>
            setEditingScene({
              ...editingScene,
              description: e.target.value,
            })
          }
          sx={{ mb: 2 }}
        />

        <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
          {t("initialCameraPosition")}
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={4}>
            <TextField
              fullWidth
              label={`${t("yaw")} (${t("degrees")})`}
              type="number"
              value={editingScene.yaw}
              onChange={(e) =>
                setEditingScene({ ...editingScene, yaw: e.target.value })
              }
              inputProps={{ step: 0.1, min: -180, max: 180 }}
              helperText="Horizontal rotation"
            />
          </Grid>
          <Grid size={4}>
            <TextField
              fullWidth
              label={`${t("pitch")} (${t("degrees")})`}
              type="number"
              value={editingScene.pitch}
              onChange={(e) =>
                setEditingScene({ ...editingScene, pitch: e.target.value })
              }
              inputProps={{ step: 0.1, min: -90, max: 90 }}
              helperText="Vertical rotation"
            />
          </Grid>
          <Grid size={4}>
            <TextField
              fullWidth
              label={`${t("fov")} (${t("degrees")})`}
              type="number"
              value={editingScene.fov}
              onChange={(e) =>
                setEditingScene({ ...editingScene, fov: e.target.value })
              }
              inputProps={{ step: 0.1, min: 10, max: 179 }}
              helperText="Field of view (zoom)"
            />
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
          Technical Settings
        </Typography>
        <TextField
          fullWidth
          label={t("faceSize")}
          type="number"
          value={editingScene.faceSize}
          onChange={(e) =>
            setEditingScene({ ...editingScene, faceSize: e.target.value })
          }
          inputProps={{ step: 1, min: 512, max: 4096 }}
          helperText="Cube map face size for panorama processing"
          sx={{ mb: 2 }}
        />

        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Tip:</strong> Use the camera button next to each scene to
          capture the current camera position as initial view.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("cancel")}</Button>
        <Button onClick={onUpdateScene} variant="contained">
          {t("update")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSceneDialog;
