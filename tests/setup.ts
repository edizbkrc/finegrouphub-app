// jsdom localStorage gerçek bir implementasyon sunuyor; testler arasında temizlenir.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom'da navigator.onLine varsayılan true; testlerin açıkça değiştirebilmesi için
// yazılabilir hâle getirilir.
Object.defineProperty(window.navigator, "onLine", {
  configurable: true,
  writable: true,
  value: true,
});
