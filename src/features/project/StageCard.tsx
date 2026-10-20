"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Paper, Popover, Stack, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpsIconButton from "@components/OpsIconButton";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";

export interface IStageCardData {
  id: number;
  name?: string;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
}

const formatDate = (value?: string) => (value ? getLocalizedMoment(value).format("LL") : "-");

/**
 * Etap kartı (production StageCard karşılığı): kartın kendisi bloklara gider,
 * sağ üstteki menü düzenle/sil içindir. Menü tıklaması Link'e sızmasın diye
 * olaylar durdurulur; aksi halde "Düzenle"ye basmak blok sayfasını açardı.
 */
export default function StageCard({
  data,
  blocksHref,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  data: IStageCardData;
  blocksHref: string;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = (event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const showMenu = canEdit || canDelete;

  return (
    <Link href={blocksHref} style={{ textDecoration: "none", color: "inherit" }} data-cy={`stage-card-${data.id}`}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          height: 150,
          position: "relative",
          overflow: "hidden",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "border-color .2s ease, box-shadow .2s ease",
          "&:hover": { borderColor: "primary.main", boxShadow: 2 },
        }}
      >
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => closeMenu()}
          onClick={(event) => event.stopPropagation()}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <List dense>
            {canEdit && (
              <ListItemButton
                data-cy={`stage-edit-${data.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  closeMenu(event);
                  onEdit();
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                  <EditIcon />
                </ListItemIcon>
                <ListItemText primary={t("Form.EditStage")} />
              </ListItemButton>
            )}
            {canDelete && (
              <ListItemButton
                data-cy={`stage-delete-${data.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  closeMenu(event);
                  onDelete();
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                  <DeleteOutlineIcon />
                </ListItemIcon>
                <ListItemText primary={t("Form.Delete")} />
              </ListItemButton>
            )}
          </List>
        </Popover>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, position: "relative", zIndex: 2 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, maxWidth: "70%" }}>
            {data.name}
          </Typography>
          {showMenu && (
            <OpsIconButton size="small" onClick={openMenu} data-cy={`stage-menu-${data.id}`}>
              <MoreVertIcon />
            </OpsIconButton>
          )}
        </Stack>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("Form.Order")}: {data.displayOrder ?? "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("Form.Start")}: {formatDate(data.startDate)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("Form.End")}: {formatDate(data.endDate)}
          </Typography>
        </Box>

        {/* Production'daki köşeden taşan çizim; metnin arkasında kalır. */}
        <Box sx={{ position: "absolute", top: -30, right: -50, opacity: 0.9 }}>
          <Image src="/svgs/project-block.svg" alt="" width={230} height={230} unoptimized />
        </Box>
      </Paper>
    </Link>
  );
}
