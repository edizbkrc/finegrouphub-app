"use client";

import { useTranslations } from "next-intl";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export default function OpsPageFormDeleteDialog({
  deleteModalProps,
  deleteModalVisible,
  handleDeleteModalClose,
  handleDelete,
}: {
  deleteModalProps?: { title?: string; info?: string };
  deleteModalVisible: boolean;
  handleDeleteModalClose: () => void;
  handleDelete: () => void;
}) {
  const t = useTranslations("DeleteModal");

  return (
    <Dialog open={deleteModalVisible} onClose={handleDeleteModalClose}>
      <DialogTitle>{deleteModalProps?.title || t("Title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{deleteModalProps?.info || t("Info")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleDeleteModalClose} data-cy="ops-form-delete-cancel-button" size="large">
          {t("Cancel")}
        </Button>
        <Button onClick={handleDelete} data-cy="ops-form-delete-confirm-button" size="large">
          {t("Delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
