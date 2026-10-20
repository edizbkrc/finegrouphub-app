import type { ReactNode } from "react";

/**
 * `pageInfo.additionalActions` ile kayıtlı aksiyon butonlarını eşleştirir.
 * API'nin bildirmediği bir aksiyon render edilmez.
 */
export const getActionIcons = (
  actionButtons: Record<string, (row: any) => ReactNode>,
  additionalActions?: { actionName: string }[]
): ((row: any) => ReactNode)[] =>
  (additionalActions ?? [])
    .filter((action) => actionButtons[action.actionName])
    .map((action) => actionButtons[action.actionName]);
