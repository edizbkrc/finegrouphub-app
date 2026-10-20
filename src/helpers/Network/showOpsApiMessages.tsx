import React from "react";
import { enqueueSnackbar } from "notistack";
import { getToastVariantByMessageType } from "../Common/getToastVariantByMessageType";
import { getCommonErrorMessage } from "./getCommonErrorMessage";

/**
 * `IBaseResponse.messages[]` içeriğini toast'a basar.
 *
 * Hem camelCase hem PascalCase kabul eder (`messages`/`Messages`) — bazı hata
 * yanıtları serileştiriciden PascalCase geçiyor.
 */
export default function showOpsApiMessages(data: any) {
  const messages = data?.messages ?? data?.Messages;

  if (!messages?.length) {
    enqueueSnackbar(getCommonErrorMessage(), {
      variant: "error",
      autoHideDuration: 5000,
    });
    return;
  }

  messages.forEach((message: any) => {
    const variant = getToastVariantByMessageType(message?.type ?? message?.Type);
    const text: string | undefined = message?.message ?? message?.Message;

    if (!text) return;

    const autoHideDuration = variant === "success" ? 3000 : 5000;
    const isMultiLine = text.includes("\\n") || text.includes("\n");

    if (isMultiLine) {
      enqueueSnackbar(
        React.createElement(
          "div",
          { style: { whiteSpace: "pre-line" } },
          text.replace(/\\n/g, "\n")
        ),
        { variant, autoHideDuration }
      );
      return;
    }

    enqueueSnackbar(text, { variant, autoHideDuration });
  });
}
