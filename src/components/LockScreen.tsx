"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Grid, Typography } from "@mui/material";
import { localStorageService } from "@helpers/Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import type { ILoginSystemInfo } from "@/types/ILoginSystemInfo";

const FIVE_MINUTES = 1000 * 60 * 5;
const CALCULATOR_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "reset", "0", "delete"] as const;

function CalculatorPad({ onKeyPress }: { onKeyPress: (key: string) => void }) {
  const t = useTranslations("Form");

  return (
    <Grid container spacing={2} sx={{ maxWidth: 400, margin: "0 auto" }}>
      {CALCULATOR_KEYS.map((key) => (
        <Grid size={4} key={key}>
          <Button variant="contained" fullWidth sx={{ minHeight: "80px", fontSize: "1.5rem" }} onClick={() => onKeyPress(key)}>
            {key === "delete" ? t("Delete") : key === "reset" ? t("Reset") : key}
          </Button>
        </Grid>
      ))}
    </Grid>
  );
}

function LockScreenContainer({ children, pinCode }: { children: ReactNode; pinCode: string }) {
  const t = useTranslations("Common");
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("");
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => setIsLocked(true), FIVE_MINUTES);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart"];
    const handleActivity = () => resetTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyPress = (key: string) => {
    if (key === "delete") setPin((prev) => prev.slice(0, -1));
    else if (key === "reset") setPin("");
    else setPin((prev) => prev + key);
  };

  useEffect(() => {
    if (pin === pinCode) {
      setIsLocked(false);
      setPin("");
    }
  }, [pin, pinCode]);

  return (
    <>
      <Box sx={{ filter: isLocked ? "blur(5px)" : "none", transition: "filter 0.3s ease" }}>{children}</Box>

      {isLocked && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            p: 2,
          }}
        >
          <Typography variant="h4" sx={{ mb: 2, color: "white" }}>
            {t("EnterPinCode")}
          </Typography>
          <Box sx={{ mb: 2, p: 1, borderRadius: "4px", minWidth: "200px", textAlign: "center", fontSize: "1.5rem" }}>
            {pin
              .split("")
              .map(() => "*")
              .join("")}
          </Box>
          <CalculatorPad onKeyPress={handleKeyPress} />
        </Box>
      )}
    </>
  );
}

/**
 * `systemInfo.lockScreenActive` açıksa uygulamayı PIN ekranıyla kilitler.
 *
 * ⚠️ PIN, düz metin olarak client tarafında karşılaştırılır — bu bir güvenlik
 * sınırı DEĞİLDİR, yalnızca "masaya bırakılmış cihaz" sürtünmesidir. Gerçek
 * yetkilendirme her zaman API tarafındadır.
 *
 * ⚠️ Referansta `JSON.parse(localStorageService.getItem(...))` yazılıyordu.
 * `getItem` zaten parse edilmiş nesne döndürür; bir nesne üzerinde `JSON.parse`
 * çağrısı HER ZAMAN fırlar. Bu, kilit ekranının render sırasında patlayıp
 * (veya sessizce yutulup) özelliğin hiç çalışmamasına yol açıyordu.
 */
export default function LockScreen({ children }: { children: ReactNode }) {
  const systemInfo = localStorageService.getItem(LocalStorageKeysEnum.SystemInfo) as ILoginSystemInfo | null;

  if (systemInfo?.lockScreenActive && systemInfo.pinCode) {
    return <LockScreenContainer pinCode={systemInfo.pinCode}>{children}</LockScreenContainer>;
  }

  return <>{children}</>;
}
