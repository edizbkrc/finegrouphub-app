"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
  Info as InfoIcon,
  Link as LinkIcon,
  CameraAlt as CameraIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface ContextMenuPosition {
  mouseX: number;
  mouseY: number;
}

interface VirtualTourContextMenuProps {
  contextMenu: ContextMenuPosition | null;
  onClose: () => void;
  menuType: "panorama" | "hotspot";
  hotspotType?: "info" | "link";
  onAddInfoHotspot?: () => void;
  onAddLinkHotspot?: () => void;
  onSetCameraView?: () => void;
  onEditHotspot?: () => void;
  onDeleteHotspot?: () => void;
}

export default function VirtualTourContextMenu({
  contextMenu,
  onClose,
  menuType,
  hotspotType,
  onAddInfoHotspot,
  onAddLinkHotspot,
  onSetCameraView,
  onEditHotspot,
  onDeleteHotspot,
}: VirtualTourContextMenuProps) {
  const t = useTranslations("VirtualTourBuilder");

  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      slotProps={{
        paper: {
          sx: {
            minWidth: 200,
            boxShadow: 3,
          },
        },
      }}
    >
      {menuType === "panorama" && (
        <>
          <MenuItem
            onClick={() => {
              onAddInfoHotspot?.();
              onClose();
            }}
          >
            <ListItemIcon>
              <InfoIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("addInfoHotspot")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAddLinkHotspot?.();
              onClose();
            }}
          >
            <ListItemIcon>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("addLinkHotspot")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSetCameraView?.();
              onClose();
            }}
          >
            <ListItemIcon>
              <CameraIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("setCameraView")}</ListItemText>
          </MenuItem>
        </>
      )}
      {menuType === "hotspot" && (
        <>
          <MenuItem
            onClick={() => {
              onEditHotspot?.();
              onClose();
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("editHotspot")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              onDeleteHotspot?.();
              onClose();
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: "error.main" }}>
              {t("deleteHotspot")}
            </ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
