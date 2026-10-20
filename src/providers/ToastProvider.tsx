"use client";

import { SnackbarProvider } from "notistack";

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      autoHideDuration={1600}
    >
      {children}
    </SnackbarProvider>
  );
}
