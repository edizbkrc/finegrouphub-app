"use client";

import { useTranslations } from "next-intl";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import InfoRow from "@components/InfoRow";
import NotFoundComponent from "@components/NotFoundComponent";
import OpsModalHeader from "@components/OpsModalHeader";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Drawer, Stack, Typography } from "@mui/material";

type TennatTransactionHistoryProps = {
  data?: any;
  isOpen: boolean;
  handleClose: (isRefresh?: boolean) => void;
};

const formatDate = (value?: string | null) => (value ? getLocalizedMoment(value).format("LLL") : "-");

/** Firmanın durum geçmişi (askıya alma / aktif etme kayıtları) çekmecesi. */
const TennatTransactionHistory = ({ isOpen, handleClose, data }: TennatTransactionHistoryProps) => {
  const t = useTranslations();
  const tf = useTranslations("Form");
  const list: any[] = data?.transactionHistory || [];

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => handleClose(false)}
      sx={{
        "& .MuiDrawer-paper": {
          width: "100%",
          maxWidth: ["100%", 500, 600],
          overflow: "hidden",
          overflowY: "auto",
          pt: 0,
          borderRadius: "10px",
          backgroundImage: "none",
          backgroundColor: "card2.main",
        },
      }}
    >
      <OpsModalHeader title={tf("TransactionHistory")} handleClose={() => handleClose(false)} />
      <Divider />
      <Box sx={{ p: 3 }}>
        {list.length > 0 ? (
          list.map((item, index) => (
            // Referanstaki `OpsPageAccordionInfoList` bu projede yok; aynı görünüm
            // MUI Accordion + InfoRow ile kuruldu.
            <Accordion key={item?.id ?? index} square sx={{ mb: 2 }} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack>
                  <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>{item?.transaction}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(item?.auditInfo?.creationDate)}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <InfoRow label={tf("Operation")} value={t(`TenantOperationType.${item?.operation}`)} />
                <InfoRow label={tf("Transaction")} value={item?.transaction} />
                <InfoRow label={tf("Reason")} value={item?.reason} />
                <InfoRow label={tf("creatorUserName")} value={item?.auditInfo?.creatorUserName} />
                <InfoRow label={tf("creationDate")} value={formatDate(item?.auditInfo?.creationDate)} />
                {/* Referansta kullanıcı adı yanlışlıkla tarih olarak biçimleniyordu. */}
                <InfoRow label={tf("lastModifierUserName")} value={item?.auditInfo?.lastModifierUserName || "-"} />
                <InfoRow label={tf("lastModificationDate")} value={formatDate(item?.auditInfo?.lastModificationDate)} />
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <NotFoundComponent />
        )}
      </Box>
    </Drawer>
  );
};

export default TennatTransactionHistory;
