"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Box, Button, Chip, Stack } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import { readAttachments, toAcceptAttribute, type IAttachment } from "@common/helpers/attachments";

interface IAttachmentPickerProps {
  value: IAttachment[];
  onChange: (value: IAttachment[]) => void;
  fileType: OpsFileTypeEnum;
  label: string;
  disabled?: boolean;
}

/**
 * react-hook-form'a bağlı olmayan diyalog/mesaj kutuları için hafif dosya seçici.
 * OpsForm içindeki FileInput (dropzone) bu yüzden kullanılamıyor: orada form durumu zorunlu.
 */
export default function AttachmentPicker({ value, onChange, fileType, label, disabled }: IAttachmentPickerProps) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Aynı dosya tekrar seçilebilsin diye input sıfırlanır.
    event.target.value = "";
    if (files.length === 0) return;

    const { accepted, invalid, oversized } = await readAttachments(files, fileType);

    if (invalid.length > 0) {
      enqueueSnackbar(`${t("Ticket.InvalidAttachment")}: ${invalid.join(", ")}`, { variant: "warning", autoHideDuration: 4000 });
    }
    if (oversized.length > 0) {
      enqueueSnackbar(`${t("Form.FileSizeTooLarge")}: ${oversized.join(", ")}. ${t("Form.MaxFileSize")}: 50 MB`, {
        variant: "warning",
        autoHideDuration: 4000,
      });
    }
    if (accepted.length > 0) onChange([...value, ...accepted]);
  };

  return (
    <Box>
      <input ref={inputRef} type="file" multiple hidden accept={toAcceptAttribute(fileType)} onChange={handleFiles} />
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button size="small" startIcon={<AttachFileIcon />} onClick={() => inputRef.current?.click()} disabled={disabled}>
          {label}
        </Button>
        {value.map((item) => (
          <Chip
            key={item.id}
            size="small"
            label={item.fileName}
            onDelete={disabled ? undefined : () => onChange(value.filter((file) => file.id !== item.id))}
          />
        ))}
      </Stack>
    </Box>
  );
}
