"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Box, Button, Divider, Drawer, Typography } from "@mui/material";
import Send from "@mui/icons-material/Send";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import MultiArrayTextInput from "@common/inputs/MultiArrayTextInput";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import LoadingComponent from "@components/LoadingComponent";
import OpsModalHeader from "@components/OpsModalHeader";
import type { IOfferDetail } from "./types";

interface IOfferSendEmailDrawerProps {
  data?: IOfferDetail;
  isOpen: boolean;
  handleClose: (isRefresh?: boolean) => void;
}

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Teklif önizleme bağlantısını e-posta ile gönderir (POST /v1/offers/offer/mail).
 * API, liste boşsa firmanın genel iletişim adresine yollar ve taslak/reddedilmiş
 * teklifi "Müşteriye Gönderildi" durumuna alır — bu yüzden başarıda detay yenilenir.
 */
export default function OfferSendEmailDrawer({ isOpen, handleClose, data }: IOfferSendEmailDrawerProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ mailingList: string[] }>({ defaultValues: { mailingList: [] } });

  const onSubmit = (formData: { mailingList: string[] }) => {
    setLoading(true);
    axiosInstance
      .post(ApiRoutes.OfferMail, { offerId: data?.id, mailingList: formData.mailingList ?? [] })
      .then((res) => {
        if (res?.data?.isSuccess) handleClose(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

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
      <LoadingComponent open={loading} />
      <OpsModalHeader title={t("Offer.SendEmail")} handleClose={() => handleClose(false)} />
      <Divider />
      <Box sx={{ p: 3, mt: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("Offer.SendEmailInfo")}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <MultiArrayTextInput
            formItem={{
              name: "mailingList",
              label: "Form.MailingList",
              type: FormItemTypeEnum.MultiArrayTextInput,
              visibility: FormItemVisibilityEnum.Both,
              placeholder: t("Offer.SendEmailPlaceholder"),
              registerOptions: {
                pattern: { value: EMAIL_PATTERN, message: t("Offer.InvalidEmail") },
              },
            }}
            register={register as never}
            setValue={setValue as never}
            control={control as never}
            error={!!errors.mailingList}
            errorMessage={errors.mailingList?.message?.toString()}
            t={t}
            variant="outlined"
            defaultValue={[]}
          />
          <Button
            type="submit"
            disabled={isSubmitting || loading}
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<Send />}
            sx={{ mt: 3, mb: 2 }}
            data-cy="offer-email-submit"
          >
            {t("Offer.SendEmail")}
          </Button>
        </form>
      </Box>
    </Drawer>
  );
}
