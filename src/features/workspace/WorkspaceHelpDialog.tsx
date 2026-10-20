"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import LayersIcon from "@mui/icons-material/Layers";
import MouseIcon from "@mui/icons-material/Mouse";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

/**
 * Çeviri metinlerinde tuş adları `[chip]Q[/chip]` ile işaretli; burada Chip'e çevrilir.
 * Metni çeviri dosyasında işaretli tutmak, tuş adının dile göre yerinde kalmasını sağlar.
 */
const parseWithChips = (text: string): ReactNode[] =>
  text.split(/\[chip\](.*?)\[\/chip\]/g).map((part, index) =>
    index % 2 === 1 ? <Chip key={index} label={part} size="small" color="primary" sx={{ mx: 0.25 }} /> : <Fragment key={index}>{part}</Fragment>
  );

/** `DrawingHelper.<anahtar>.title|desc` çevirileri; sıra production yardım listesiyle aynı. */
const ACTIONS: { key: string; icon: ReactNode }[] = [
  { key: "startNewPolygon", icon: <AddCircleIcon color="primary" /> },
  { key: "addPointToPolygon", icon: <BorderColorIcon color="primary" /> },
  { key: "deleteSelection", icon: <DeleteIcon color="primary" /> },
  { key: "snapPoints", icon: <TouchAppIcon color="primary" /> },
  { key: "alignPointToEdge", icon: <TouchAppIcon color="primary" /> },
  { key: "autoSnapOnDrag", icon: <TouchAppIcon color="primary" /> },
  { key: "addPointToEdge", icon: <AddCircleIcon color="primary" /> },
  { key: "alignPolygon", icon: <KeyboardIcon color="primary" /> },
  { key: "moveSelection", icon: <KeyboardIcon color="primary" /> },
  { key: "cloneWithArrows", icon: <ContentCopyIcon color="primary" /> },
  { key: "undo", icon: <UndoIcon color="primary" /> },
  { key: "clearSnapGuides", icon: <TouchAppIcon color="primary" /> },
  { key: "resetCloneCounter", icon: <KeyboardIcon color="primary" /> },
  { key: "selectPolygon", icon: <LayersIcon color="primary" /> },
  { key: "selectPoint", icon: <CheckCircleIcon color="primary" /> },
  { key: "dragPoint", icon: <MouseIcon color="primary" /> },
  { key: "changeBackground", icon: <PhotoLibraryIcon color="primary" /> },
  { key: "alignmentGuides", icon: <VisibilityIcon color="primary" /> },
  { key: "zoom", icon: <ZoomInIcon color="primary" /> },
  { key: "visualEffect", icon: <VisibilityIcon color="primary" /> },
  { key: "undoHistoryLimit", icon: <UndoIcon color="primary" /> },
  { key: "clonePolygonBelow", icon: <ContentCopyIcon color="primary" /> },
  { key: "copySelection", icon: <ContentCopyIcon color="primary" /> },
  { key: "pasteSelection", icon: <ContentCopyIcon color="primary" /> },
  { key: "mergePoints", icon: <MouseIcon color="primary" /> },
];

/** Çizim kısayolları / yardım kılavuzu. Editör ayrı bir iç uygulama olduğundan burada yalnızca okunur liste var. */
export default function WorkspaceHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("DrawingHelper");
  const tCommon = useTranslations();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle>{t("helpTitle")}</DialogTitle>
      <DialogContent dividers>
        <Box>
          <List disablePadding>
            {ACTIONS.map((action) => (
              <ListItem key={action.key} alignItems="flex-start" disableGutters>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>{action.icon}</ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600 }}>{t(`${action.key}.title`)}</Typography>}
                  secondary={parseWithChips(t(`${action.key}.desc`))}
                  slotProps={{ secondary: { variant: "body2", component: "div", sx: { pt: 0.5 } } }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tCommon("Button.Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
