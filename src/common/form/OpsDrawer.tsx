"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Box, Drawer, useScrollTrigger } from "@mui/material";
import { useAppDispatch } from "@redux/hooks";
import { setGeneralLoading } from "@redux/appSlice";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import type { IFormItem } from "@common/types/IFormItem";
import type { IReactHookFormProps } from "@common/types/IReactHookFormProps";
import OpsFormGenerator from "./OpsFormGenerator";

interface IOpsDrawerProps {
  apiData?: any;
  isOpen: boolean;
  handleClose: () => void;
  handleSubmit?: (data: any, setSubmitLoading: (loading: boolean) => void) => void;
  schema: IFormItem[];
  title?: string;
  editTitle?: string;
  /** Form alanlarının üstüne ek içerik (RHF setValue ile dirty takibi için). */
  renderBefore?: (apiData: any, formState: IReactHookFormProps) => ReactNode;
  /** @deprecated Yerine renderBefore kullanın — RHF dışı state Kaydet’i açmaz. */
  extraContent?: ReactNode;
}

/**
 * OpsForm'un modal (Redux) durumuna bağlı OLMAYAN, doğrudan `isOpen` prop'uyla
 * kontrol edilen drawer varyantı. Özel akışlar (durum güncelleme, ödeme,
 * mail gönderme gibi CRUD dışı formlar) için kullanılır.
 */
export default function OpsDrawer({
  isOpen,
  handleClose,
  apiData,
  schema,
  handleSubmit,
  title,
  editTitle,
  renderBefore,
  extraContent,
}: IOpsDrawerProps) {
  const { supportedLanguage, loading, getLanguages, setLoading } = useSupportedLanguages();
  const dispatch = useAppDispatch();
  const [contentRef, setContentRef] = useState<HTMLElement | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0, target: contentRef ?? undefined });

  useEffect(() => {
    const hasLanguageText = schema.some((s) => s.type.startsWith("LANGUAGE_"));
    if (hasLanguageText) getLanguages();
    else setLoading(false);

    dispatch(setGeneralLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;

  const before =
    renderBefore ??
    (extraContent
      ? () => extraContent
      : undefined);

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: "100%",
          maxWidth: ["100%", 500, 600],
          overflow: "hidden",
          overflowY: "auto",
          p: 1,
          pt: 0,
          pl: 2,
          borderRadius: "10px",
          backgroundImage: "none",
          backgroundColor: "card2.main",
        },
      }}
    >
      <Box sx={{ p: 4, px: 2, borderRadius: "10px", overflowY: "auto", position: "relative", height: "100%" }} ref={setContentRef}>
        <OpsFormGenerator
          languages={supportedLanguage}
          trigger={trigger}
          submitLoading={submitLoading}
          apiData={apiData}
          schema={schema}
          onSubmit={(data) => handleSubmit?.(data, setSubmitLoading)}
          handleClose={handleClose}
          title={title}
          editTitle={editTitle}
          isEdit={!!apiData}
          submitButtonVisible
          renderBefore={before}
        />
      </Box>
    </Drawer>
  );
}
