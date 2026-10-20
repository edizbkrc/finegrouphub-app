"use client";

import { useStorageListenerLogout } from "@hooks/useStorageListenerLogout";
import { useConnection } from "@hooks/useConnection";
import { ClientErrorBoundary } from "./ClientErrorBoundary";
import ReduxProvider from "./ReduxProvider";
import CustomThemeProvider from "./ThemeProvider";
import ToastProvider from "./ToastProvider";
import DateProvider from "./DateProvider";
import GeneralLoading from "./GeneralLoading";
import { useGlobalErrorListener } from "./useGlobalErrorListener";

/**
 * Provider zinciri.
 *
 * Sıra önemli: ToastProvider, GeneralLoading'den ÖNCE gelmeli ki yükleme
 * sırasında oluşan hatalar toast'a basılabilsin. Tema, toast'ın üstünde
 * olmalı ki snackbar'lar doğru paleti alsın.
 */
export default function BaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useGlobalErrorListener();
  useStorageListenerLogout();
  useConnection();

  return (
    <ClientErrorBoundary>
      <ReduxProvider>
        <CustomThemeProvider>
          <ToastProvider>
            <DateProvider>
              <GeneralLoading>{children}</GeneralLoading>
            </DateProvider>
          </ToastProvider>
        </CustomThemeProvider>
      </ReduxProvider>
    </ClientErrorBoundary>
  );
}
