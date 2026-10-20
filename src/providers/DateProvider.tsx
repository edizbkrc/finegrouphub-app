"use client";

import { useLocale } from "next-intl";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

export default function DateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={locale}>
      {children}
    </LocalizationProvider>
  );
}
