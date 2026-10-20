"use client";

import CryptoJS from "crypto-js";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";

/**
 * ⚠️ Bu anahtar bir SIR DEĞİLDİR ve olamaz.
 *
 * Client tarafında çalışan her şey bundle'a girer; tarayıcının DevTools'undan
 * okunabilir. Buradaki şifreleme, localStorage içeriğini **gizlemez** — yalnızca
 * gözle okunmasını ve kazara kopyalanmasını zorlaştırır (obfuscation).
 *
 * Bu yüzden anahtarı `.env`e taşımak güvenlik kazancı sağlamaz: NEXT_PUBLIC_*
 * değişkenleri de bundle'a gömülür. Gerçek koruma, token'ın kısa ömürlü olması
 * ve httpOnly session cookie'sidir (bkz. app/lib/session.ts, Faz 4).
 *
 * Buraya ASLA gerçek bir sır (API secret, imzalama anahtarı) konulmamalı.
 */
const OBFUSCATION_KEY = "LCxhpjjB2jvkGZGl08yUTrwxVdCtW_2QQkSprS3eJ4I=";

export const localStorageService = {
  setItem: (key: LocalStorageKeysEnum, value: unknown) => {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(value),
        OBFUSCATION_KEY
      ).toString();
      localStorage?.setItem(key, encrypted);
    } catch {
      /* private mode / kota dolu — sessizce geç */
    }
  },

  getItem: (key: LocalStorageKeysEnum): any => {
    try {
      const encrypted = localStorage?.getItem(key);
      if (!encrypted) return null;

      const bytes = CryptoJS.AES.decrypt(encrypted, OBFUSCATION_KEY);
      try {
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  },

  removeItem: (key: LocalStorageKeysEnum) => {
    try {
      localStorage?.removeItem(key);
    } catch {
      /* yoksay */
    }
  },
};
