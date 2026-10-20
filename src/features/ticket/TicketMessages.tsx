"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import PersonIcon from "@mui/icons-material/Person";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import AttachmentPicker from "@components/AttachmentPicker";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import { toUploadRequests, type IAttachment } from "@common/helpers/attachments";
import { uploadPendingFiles } from "@common/helpers/processFormUploads";
import type { ITicketMessage } from "./types";

interface ITicketMessagesProps {
  ticketId: number;
  messages: ITicketMessage[];
  /** Talep çözülmüşse yeni mesaj kutusu gizlenir. */
  solved: boolean;
  canReply: boolean;
  onSent: () => void;
}

/** Talep yazışması: destek ekibi mesajları sağda, müşteri mesajları solda; ekler indirilebilir. */
export default function TicketMessages({ ticketId, messages, solved, canReply, onSent }: ITicketMessagesProps) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const [text, setText] = useState("");
  const [markSolved, setMarkSolved] = useState(false);
  const [attachments, setAttachments] = useState<IAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Yeni mesaj gelince (gönderim sonrası yeniden yükleme) liste sonuna inilir; uzun yazışmada kullanıcı kaydırmak zorunda kalmasın.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  const send = () => {
    const message = text.trim();
    if (!message) {
      enqueueSnackbar(t("Form.Required"), { variant: "warning", autoHideDuration: 3000 });
      return;
    }

    setSending(true);
    axiosInstance
      .post(ApiRoutes.TicketMessage, { ticketId, solved: markSolved, message, documents: toUploadRequests(attachments) })
      .then(async (res) => {
        if (!res?.data?.isSuccess) return;
        // Mesaj önce kaydedilir; ekler API'nin döndüğü imzalı adreslere ardından yüklenir. Yükleme hatası mesajı geri almaz, yalnızca uyarılır.
        await uploadPendingFiles(res.data, attachments, () =>
          enqueueSnackbar(t("Toast.ImageUploadError"), { variant: "error", autoHideDuration: 5000 })
        );
        setText("");
        setMarkSolved(false);
        setAttachments([]);
        onSent();
      })
      .catch(() => {})
      .finally(() => setSending(false));
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t("Ticket.Messages")}
        </Typography>

        <Stack spacing={2} data-cy="ticket-messages" sx={{ maxHeight: "55vh", overflowY: "auto", pr: 0.5 }}>
          {messages.length === 0 && <Typography color="text.secondary">{t("Ticket.NoMessages")}</Typography>}

          {messages.map((item, index) => (
            <Stack key={item.id ?? index} direction={item.sendBySupporter ? "row-reverse" : "row"} spacing={1.5} alignItems="flex-start">
              <Avatar sx={{ bgcolor: item.sendBySupporter ? "primary.main" : "grey.600", width: 36, height: 36 }}>
                {item.sendBySupporter ? <SupportAgentIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
              </Avatar>
              <Box
                sx={{
                  maxWidth: { xs: "85%", md: "70%" },
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: item.sendBySupporter ? "action.selected" : "action.hover",
                }}
              >
                <Typography variant="caption" color="text.secondary" component="div">
                  {t("Ticket.MessageIndex", { index: index + 1 })} · {item.writer ?? "-"}
                  {item.creationDate ? ` · ${getLocalizedMoment(item.creationDate).format("LLL")}` : ""}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                  {item.message}
                </Typography>
                {(item.documents ?? []).length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {(item.documents ?? []).map((document, docIndex) => (
                      <Chip
                        key={document.id ?? docIndex}
                        size="small"
                        icon={<AttachFileIcon />}
                        component="a"
                        // URL API'nin ürettiği kısa ömürlü imzalı adrestir; yeni sekmede açılır, oradan indirilir.
                        href={document.url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable={!!document.url}
                        label={document.fileName ?? t("Form.Download")}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          ))}
          <div ref={endRef} />
        </Stack>

        {canReply && !solved && (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("Ticket.WriteReply")}
              inputProps={{ maxLength: 5000, "data-cy": "ticket-reply" }}
            />
            <Box sx={{ mt: 1 }}>
              <AttachmentPicker value={attachments} onChange={setAttachments} fileType={OpsFileTypeEnum.Image} label={t("Ticket.AttachImage")} disabled={sending} />
              <Typography variant="caption" color="text.secondary">
                {t("Ticket.AttachmentsInfo")}
              </Typography>
            </Box>
            <Stack direction={["column", "row"]} justifyContent="space-between" alignItems={["stretch", "center"]} sx={{ mt: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={markSolved} onChange={(event) => setMarkSolved(event.target.checked)} />}
                label={t("Ticket.MarkAsSolved")}
              />
              <Button variant="contained" endIcon={<SendIcon />} onClick={send} disabled={sending} data-cy="ticket-send">
                {t("Ticket.Send")}
              </Button>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
