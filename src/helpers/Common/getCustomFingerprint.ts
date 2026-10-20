/**
 * deviceId üretimi.
 *
 * Not: bu bir tarayıcı parmak izi DEĞİLDİR; kurulum başına bir kimliktir.
 * Üretimde `Date.now()` kullanıldığı için aynı cihazda bile her seferinde
 * farklı bir değer çıkar — kalıcılığı sağlayan tek şey localStorage'da
 * saklanmasıdır. localStorage temizlenirse yeni bir deviceId doğar ve API
 * tarafında yeni bir cihaz olarak görünür. (Referanstaki davranış korundu.)
 */
function generateDeviceId(): string {
  const parts = [
    Date.now(),
    navigator.language,
    navigator.hardwareConcurrency,
    navigator.userAgent,
  ].join("-");

  return hashCode(parts);
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `device-${Math.abs(hash)}`;
}

export function getDeviceID(): string {
  try {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  } catch {
    // private mode / storage kapalı — oturum boyunca geçerli geçici kimlik
    return generateDeviceId();
  }
}
