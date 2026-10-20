"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Box, Button, Chip, List, ListItemButton, ListItemIcon, ListItemText, Popover, Stack } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpsIconButton from "@components/OpsIconButton";
import LinkWraper from "@components/LinkWraper";

interface IFineImageItemProps {
  editOnClick?: () => void;
  editHref?: string;
  editText?: string;
  deleteOnClick?: () => void;
  imageSrc?: string;
  name?: string;
  chipList?: string[];
  buttonList?: { label: string; onClick?: () => void }[];
}

/** Galeri/liste kartı: görsel + isim + düzenle/sil menüsü. */
export default function FineImageItem({ imageSrc, name, editHref, editText, chipList = [], buttonList = [], editOnClick, deleteOnClick }: IFineImageItemProps) {
  const [hasError, setHasError] = useState(false);
  const t = useTranslations();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <Box
      sx={{ borderRadius: 2, boxShadow: 1, p: 2, bgcolor: "background.paper", height: "100%", cursor: editOnClick || editHref ? "pointer" : "default" }}
      onClick={
        editOnClick
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              editOnClick();
            }
          : undefined
      }
    >
      <Popover open={open} anchorEl={anchorEl} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }} transformOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <List dense>
          <LinkWraper href={editHref}>
            <ListItemButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleClose();
                editOnClick?.();
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                <EditIcon />
              </ListItemIcon>
              <ListItemText primary={editText || t("Form.Edit")} />
            </ListItemButton>
          </LinkWraper>
          <ListItemButton
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleClose();
              deleteOnClick?.();
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
              <DeleteOutlineIcon />
            </ListItemIcon>
            <ListItemText primary={t("Form.Delete")} />
          </ListItemButton>
        </List>
      </Popover>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Chip label={name} sx={{ fontWeight: 600, fontSize: "0.875rem", backgroundColor: "itemBackground.main", color: "text.primary", borderRadius: 2 }} />
        <OpsIconButton size="small" onClick={handleOpen}>
          <MoreVertIcon />
        </OpsIconButton>
      </Stack>

      <Box sx={{ width: "100%", mt: 2, borderRadius: "10px", height: 250, position: "relative" }}>
        <Image
          src={hasError ? "/placeholder.png" : imageSrc || "/placeholder.png"}
          alt={name ?? ""}
          fill
          // Plan görselleri farklı oranlarda; fill tek başına esnetiyordu, contain oranı korur.
          style={{ borderRadius: "10px", objectFit: "contain" }}
          unoptimized
          onError={() => setHasError(true)}
        />
      </Box>

      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
        <Stack direction="row" alignItems="center" spacing={1} flexGrow={1}>
          {chipList.map((chip, index) => (
            <Chip key={index} label={chip} sx={{ pointerEvents: "none", backgroundColor: "itemBackground.main", borderRadius: 2 }} />
          ))}
        </Stack>
        <Stack direction="row" spacing={1}>
          {buttonList.map((button, index) => (
            <Button key={index} variant="outlined" size="small" onClick={() => button?.onClick?.()}>
              {button.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
