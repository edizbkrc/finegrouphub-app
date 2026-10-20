# finegrouphub-app — Claude Code notları

> Ortak bağlam üst klasördeki `../CLAUDE.md` dosyasındadır (ürün, tuzaklar, açık işler).
> Burada yalnızca bu repoya özgü olanlar var.

## Ne

FineHub yönetim paneli. Next.js 15 (App Router, Turbopack) + MUI 7 + Redux Toolkit,
Milvasoft "OPS Framework" üzerine. Laravel API'ye (`/hubapi`) bağlanır.

## Çalıştırma

```bash
npm run build:local && npm run start:local   # standalone, hızlı — önerilen
npm run dev                                   # geliştirme, hot reload ama yavaş
npx tsc --noEmit                              # tip kontrolü
npx next lint                                 # lint
npx jest                                      # test
```

Panel API'ye `/hubapi` rewrite'ı üzerinden gider (`next.config.ts`), API `:5000`'de.

**Yeniden derlemenin gerçekten olduğunu** `.next/BUILD_ID` zaman damgasından doğrulayın.

## Yapı

```
app/[locale]/(pages)/<modül>/page.tsx    liste sayfaları (OpsTableProvider)
app/[locale]/workspace/project/[id]/     tam ekran çizim alanı (kabuk dışında)
app/api/draw/route.ts                    çizim editörü proxy'si (aynı origin)
src/common/                              çekirdek framework — modülden bağımsız
src/features/<alan>/                     workspace, virtualtour, project, offer…
src/forms/<Modül>Form.tsx                form şeması: IFormItem[], JSX YOK
src/network/ApiRoutes.ts                 tüm uç adresleri
src/i18n/tr.json | en.json               arayüz çevirileri
```

## Bu repoya özgü kurallar

- **Form dosyaları JSX içermez.** Yalnızca `IFormItem[]` + callback döndürür.
- **Şema tek kaynaktır.** Excel şablonu (`src/common/excel/`) form şemasından üretilir;
  forma alan eklenince şablon kendiliğinden değişir. Şemayı ayrı dosyaya çıkarma deseni:
  `src/forms/project/unitTemplateScheme.ts`.
- **Palet slotu silmeyin** — `theme.ts`'teki özel slotları panelin her yeri okuyor.
- **Proje kapsamlı liste istekleri** `projectId`'yi gövdede düz alan olarak alır
  (bkz. `src/features/project/useProjectTable.ts`). Filtre olarak gönderilirse
  boş liste döner ve **hata vermez**.
- **Çizim editörü köprüsü** `public/draw-bridge.js`; `/api/draw` içine **satır içi**
  gömülür. `<base>` etiketi yüzünden kök-göreli script adresi 404 olur.
- next-intl: eksik çeviri anahtarı çalışma anında patlar. Yeni metin eklerken
  `tr.json` **ve** `en.json`'a birlikte ekleyin.

## Sık karşılaşılanlar

- macOS'tan kopyalanmış `._*` çöp dosyaları var; jest onları yok sayıyor
  (`jest.config.js` → `testPathIgnorePatterns`). Yeni araç eklerken aynısını yapın.
- `next lint` ESLint ayarı yoksa soru sorup **takılır** → `.eslintrc.json` repoda olmalı.
- İsimsiz bileşen (`react/display-name`) `next build`'i kırar.
