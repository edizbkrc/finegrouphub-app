# Referans projeden taşınmayan hatalar

> `finehub-app` yeniden yazılırken tespit edilen, **yeni projeye taşınmayan** kusurlar.
> Çoğu `typescript.ignoreBuildErrors: true` + `eslint.ignoreDuringBuilds: true` (D4)
> tarafından gizleniyordu; bu iki bayrak kapatılınca build sırasında ortaya çıktılar.
>
> Bu liste aynı zamanda **referans projede hâlâ açık olan hataların** kaydıdır.

| # | Bulgu | Nerede (referans) | Yeni projede |
|---|---|---|---|
| B1 | `export const lato` — Next 15 layout dosyalarından geçersiz alan export'u. Build'i kıran gerçek bir tip hatası; `ignoreBuildErrors` gizliyordu. | `app/[locale]/layout.tsx` | Font `src/assets/fonts.ts`'e taşındı. |
| B2 | `navIcon` palet slotu yalnızca `PaletteOptions`'a eklenmiş, `Palette`'e eklenmemiş → `theme.palette.navIcon` okuması tip hatası. | `src/assets/theme/theme.ts` | İki arayüze de eklendi. |
| B3 | `apple-touch-icon.png` linkleniyor ama dosyanın adı `apple-touch-ico.png` (eksik "n") → kalıcı 404. | `app/[locale]/layout.tsx` + `public/` | Dosya doğru adla kopyalandı. |
| B4 | `app/[locale]/not-found.tsx` hiçbir zaman render edilmiyor: catch-all route olmadığı için eşleşmeyen yollar Next'in yerleşik İngilizce 404'üne düşüyor. İçerik de çevirisiz (`<h1>NotFoundPage</h1>`). | `app/[locale]/not-found.tsx` | `app/[locale]/[...rest]/page.tsx` catch-all eklendi, sayfa çevrildi. |
| B5 | `@svgr/webpack` `next.config.ts` turbopack kuralında kullanılıyor ama `package.json`'da bağımlılık olarak yok. | `next.config.ts` | devDependencies'e eklendi. |
| B6 | Çeviri dosyaları senkron değil: 17 anahtar yalnızca `tr.json`'da, 3 anahtar yalnızca `en.json`'da. | `src/i18n/*.json` | Tam parite sağlandı (1150/1150). |
| B7 | `Modal.InfoCardCreate` / `Modal.InfoCardDetail` kod tarafından çağrılıyor; `en.json`'da bu anahtarlar yanlışlıkla `Form` grubunda → İngilizce'de anahtar adı ekranda görünür. | `src/i18n/en.json` | `Modal` grubuna taşındı. |
| B8 | `Span.Install:` — anahtar adında iki nokta üst üste yazım hatası; `tr.json`'daki `Span.Install` ile eşleşmiyor. | `src/i18n/en.json` | `Span.Install` olarak düzeltildi. |
| B9 | `manifest.json` `theme_color: "#009687"` (turkuaz) — marka rengi `#E7763D`, layout meta'sı ise `#ffffff`/`#060D12`. Üç ayrı değer. | `public/manifest.json` | Marka rengiyle hizalandı. |
| B10 | `.dockerignore` yok → `node_modules` ve `.next` build context'e giriyor. | depo kökü | Eklendi. |
| B11 | `SESSION_SECRET` ve `LOG_API_SECRET` `.env`, `.env.test`, `.env.production` içinde **commit edilmiş**; `.gitignore` yalnızca `.env*.local`'i dışlıyor. | `.gitignore` + `.env*` | Gizli alanlar boş bırakıldı, CI enjekte ediyor; `.env` gitignore'landı. |
| B12 | `localStorageService` şifreleme anahtarı koda gömülü. Client-side olduğu için sır olamaz — ama bu durum kodda hiçbir yerde belirtilmemiş, sır sanılma riski var. | `src/helpers/Common/localStorageService.ts` | Davranış korundu, sınırı açıklayan yorum eklendi. |

## Faz 3 (network katmanı) sırasında bulunanlar

| # | Bulgu | Nerede (referans) | Yeni projede |
|---|---|---|---|
| **B13** | **Token yenileme kuyruğu başarısızlıkta askıda kalıyor.** Request interceptor'da refresh başarısız olursa `subscribeTokenRefresh` ile kuyruğa alınan istekler için `onRefreshed` hiç çağrılmıyor → promise'ler **sonsuza kadar** çözülmüyor. Sayfa logout'a yönlendiği için gözden kaçıyor, ama askıdaki istekler sızıntı bırakıyor. | `src/network/axiosInstance.ts:129-152` | Kuyruk `{resolve, reject}` tutuyor; başarısızlıkta `flushQueue(null, error)` ile hepsi reddediliyor. Regresyon testi: `tests/tokenRefresh.test.ts` → *"refresh BAŞARISIZ olduğunda kuyruktaki istekler askıda kalmaz"*. |
| **B14** | **Logout API çağrısı `Bearer` öneki olmadan gönderiliyor.** Diğer tüm çağrılar `"Bearer " + token` kullanırken logout ham token yazıyor → istek 401 alıyor, `.catch` yutuyor, localStorage temizlenip yönlendirme yapıldığı için "çalışıyor" görünüyor. Sonuç: **cihaz oturumu sunucuda hiçbir zaman kapanmıyor.** | `src/helpers/Auth/logout.ts:44-47` | `getAccessToken()` kullanılıyor (önek ekler). |
| **B15** | `getToastVariantByMessageType` `default` dalı `"success"` döndürüyor. Sunucu yeni bir mesaj tipi eklerse (ör. `8`) hata mesajı **yeşil başarı toast'ı** olarak görünür. | `src/helpers/Common/getToastVariantByMessageType.ts` | `default → "info"` (nötr). Bilinen tiplerin eşlemesi aynen korundu. |
| **B16** | `AccessTokenExpiration` `moment().add(...).toString()` ile yazılıp `moment(string)` ile okunuyor. Bu format ISO 8601 değil → moment tarayıcının `Date` ayrıştırıcısına düşüyor (deprecation uyarısı) ve sonuç tarayıcıya göre değişebiliyor. Yanlış ayrıştırma = süresi dolmuş token'ın geçerli sayılması. | `src/network/axiosInstance.ts:24-30` | `toISOString()` + `moment(value, moment.ISO_8601)` + `isValid()` kontrolü. |
| **B17** | `Export = "v1/exports/export"` — başında `/` yok. Diğer 97 ucun hepsinde var. Göreli çözümlenip yanlış URL üretebilir. | `src/network/OpsApiRoutes.ts:23` | `"/v1/exports/export"`. |
| **B18** | Dosya adı yazım hatası: `getAccensToken.ts` (→ "Accens"). | `src/helpers/Auth/getAccensToken.ts` | `getAccessToken.ts`. |
| **B19** | `REBUILD_PROMPT.md §3.6` lookup uçlarını `POST /lookups` + düz gövde olarak tarif ediyor. Gerçek sözleşme: **`PATCH /v1/Lookups`** + gövde `{ parameters: [...] }` (dizi sarmalayıcı) ve **`GET /v1/Lookups/enum`**. Prompt'a göre yazılsaydı tüm `AUTO_COMPLETE` inputları çalışmazdı. | `REBUILD_PROMPT.md` | Doğru sözleşme `src/network/adapters/` içinde; testle kilitlendi. |
| **B20** | `REBUILD_PROMPT.md §3.7` kısmi güncellemeyi "yalnızca değişen alanlar + id" diye tarif ediyor. Gerçekte her alan `{ value, isUpdated }` zarfına sarılıyor (`UpdateProperty<T>`). | `REBUILD_PROMPT.md` | `docs/API_ADAPTER.md §3.7`'de doğru sözleşme belgelendi. |

## Not: B12 ve gerçek gizlilik

`localStorageService`'teki AES anahtarı tarayıcı bundle'ına girer; DevTools'tan okunabilir.
Bu bir **gizleme (obfuscation)** önlemidir, şifreleme güvencesi değildir. Anahtarı
`NEXT_PUBLIC_*` bir değişkene taşımak hiçbir şey değiştirmez — o da bundle'a gömülür.
Gerçek koruma access token'ın kısa ömrü ve httpOnly session cookie'sidir.

## Faz 6-7 (layout + OpsTable) sırasında bulunanlar

| # | Bulgu | Nerede (referans) | Yeni projede |
|---|---|---|---|
| **B21** | `getMenuIcon`: `item.url ? ICON_LOOKUP[item.url] : ICON_LOOKUP.default` — url doluysa ama tabloda karşılığı yoksa `undefined` dönüyor, menüde ikonsuz boşluk oluşuyordu. | `OpsNavigationBarIcon.tsx` | `(url ? ICON_LOOKUP[url] : undefined) ?? DEFAULT_ICON` — her durumda fallback. |
| **B22** | `OpsNavigationBar` dil değişimini algılayan `useEffect`'in bağımlılık listesinde `locale` yoktu (eslint-disable ile bastırılmış) — dil değiştiğinde eski dildeki menü cache'i kalabiliyordu. | `OpsNavigationBar.tsx` | `locale` bağımlılığa eklendi. |
| **B23** | `generateNavigationList` içinde `item?.childrens?.sort(...)` **yerinde** sıralama yapıyordu — localStorage'dan gelen dizi mutasyona uğruyordu. | `OpsNavigationBar.tsx` | `.slice().sort(...)` ile kopya üzerinde sıralama. |
| **B24** | `OpsLayoutPage`'de `defaultAddButton` ve `addButonRoute` birlikte verilince İKİ ayrı `<Button>` render ediliyordu (yazım hatası: "addButonRoute"). | `OpsLayoutPage.tsx` | Tek buton, tek karar: route → link, yoksa callback, o da yoksa modal. |
| **B25** | `OpsLayoutContent` arka planı `tableBg.main` — temada böyle bir palet slotu **tanımlı değil**, arka plan hiç uygulanmıyordu. | `OpsLayoutContent.tsx` | `contentBackground.main` (temada gerçekten var). |
| **B26** | `useProfileInfo`, tanımsız `IIAccountDetailDto` (çift "I") tipine referans veriyordu. | `hooks/useProfileInfo.ts` | `IAccountDetailDto` tipi oluşturuldu ve kullanıldı. |
| **B27** | `OpsLayoutToolBar`'da tam ekran ikonu yalnızca butona tıklanınca güncelleniyordu; kullanıcı Esc ile çıkınca ikon yanlış durumda kalıyordu. | `OpsLayoutToolBar.tsx` | `fullscreenchange` olayı dinlenip state senkronize ediliyor. |
| **B28** | `data-cy={\`ops-table-cell-${flexRender(...)}\`}` — `flexRender` bir React elemanı döndürür; template string'e konunca `[object Object]` üretir. **Tüm hücrelerin data-cy'si aynıydı**, e2e testlerinde kullanılamaz hâldeydi. | `Body/CustomTableCells.tsx` | `cell.column.id` kullanılıyor. |
| **B29** | `AggregationsRow`'da `columnVisibility[header.id.toLowerCase()]` kontrolü — kolon id'leri genelde camelCase/PascalCase olduğundan lowercase anahtar hep `undefined` dönüyor, kontrol etkisizdi (sütun gizlense bile aggregation satırı görünmeye devam ediyordu). | `Body/AggregationsRow.tsx` | `header.column.getIsVisible()` — doğru TanStack API'si. |
| **B30** | `getAggregationTypeString`: `case Max` iki kez yazılmış, `Count` hiç yoktu — Count aggregation'ında etiket "UNKNOWN" görünüyordu. | `helpers/getAggregationTypeString.ts` | Kayıt tablosu (Record) ile tek tek eşleme, Count dâhil. |
| **B31** | `AggregationPopover`'da tip seçimi kontrolü `aggregations.some(agg => agg.type === value)` — bir tip HERHANGİ bir sütunda kullanılınca TÜM sütunlarda devre dışı kalıyordu (bir sütuna Sum eklenince başka sütuna Sum eklenemiyordu). | `Popovers/Aggregation.tsx` | Kontrol `agg.column === aggregation.column && agg.type === value` — yalnızca aynı sütun+tip tekrarı engellenir. |
| **B32** | `BetweenDecimalValueComponent`'te `otherValue` alanı da `value` alanıyla **aynı** `data-cy` değerini kullanıyordu; e2e testleri ikisini ayırt edemiyordu. | `Popovers/Filters.tsx` | `ops-table-filter-otherValue-${index}` olarak düzeltildi. |
| **B33** | `NotFoundComponent`'teki "Geri Dön" butonu sabit Türkçe metin — İngilizce arayüzde de Türkçe görünüyordu (kural #8 ihlali). | `components/NotFoundComponent.tsx` | `Button.Back` çeviri anahtarı eklendi. |
| **B34** | `humanizeDays` çıktısı sabit Türkçe birim isimleri ("yıl", "ay", "gün") — İngilizce arayüzde de öyle görünüyordu. | `helpers/humanizeDays.ts` | `Intl.NumberFormat(locale, {style:"unit"})` ile locale'e duyarlı. |
| **B35** | `getCurrencyFormat`: `JSON.parse(localStorageService.getItem(...))` — `getItem` zaten parse edilmiş nesne döndürür; bir nesne üzerinde `JSON.parse` çağrısı her zaman fırlar, catch bloğu sistem para birimi ne olursa olsun TRY'ye düşürüyordu. | `helpers/Common/getCurrencyFormat.ts` | Doğrudan `getItem()` sonucu kullanılıyor. |
| **B36** | `useAccessibleMenuItems`: `getItem(KEY || "[]")` — `|| "[]"` yanlış yere, `getItem`'ın argümanına yazılmış; enum değeri hiç falsy olmadığından fallback ölü koddu. | `hooks/useAccessibleMenuItems.ts` | Doğru fallback `Array.isArray(data) ? data : []`. |
| **B37** | `MUI Button/IconButton/Chip`'te `color="tertiary"` kullanan 11 yerde `@ts-ignore` vardı — palet augment edilmiş ama ilgili bileşenlerin `*PropsColorOverrides` arayüzleri genişletilmemişti. | `assets/theme/theme.ts` | `ButtonPropsColorOverrides`, `IconButtonPropsColorOverrides`, `ChipPropsColorOverrides` genişletildi; `@ts-ignore` gerekmiyor. |

## Faz 8 (input kütüphanesi) sırasında bulunanlar

| # | Bulgu | Nerede (referans) | Yeni projede |
|---|---|---|---|
| **B38 — kritik** | `CheckboxInput`'ta `{...field}` sonrasında `onChange={(e, checked) => formItem?.onChange?.(apiData, checked)}` yazılmıştı — bu, spread edilen `field.onChange`'i **eziyordu**. Sonuç: checkbox'a tıklamak react-hook-form state'ini **hiç güncellemiyordu**; form submit'i checkbox'ın gerçek değerini asla görmüyordu. | `inputs/CheckboxInput.tsx` | `field.onChange(checked)` önce çağrılır, sonra `formItem.onChange` yan etkisi. |
| **B39** | `NumericInput`: `inputMode: FormItemTypeEnum.Decimal ? "decimal" : "numeric"` — sağ taraf `formItem?.type` değil, enum'un KENDİSİYDİ (her zaman truthy `"decimal"` string'i). Tam sayı (NUMBER) alanlarında bile mobilde ondalık nokta tuşlu klavye açılıyordu. | `inputs/NumericInput.tsx` | `isDecimal = formItem?.type === FormItemTypeEnum.Decimal` değişkeni kullanılıyor. |
| **B40** | `ColorPickerInput`'ta `label={formItem.label}` — `t()` uygulanmamış ham etiket metni (kural #8 ihlali). | `inputs/ColorPickerInput.tsx` | `t(formItem.label)`. |
| **B41** | `MultiLangFileInput` tek başına `useTranslations()` (KÖK, namespace'siz) kullanıp `t("RequiredWithLang", ...)` ve `t("FileSelectText.root")` çağırıyordu — ikisi de yanlış anahtar yolu (gerçek anahtarlar `Form.RequiredWithLang`, `Form.FileSelectText`). Kardeş MultiLang* bileşenleri doğru şekilde `useTranslations("Form")` kullanıyordu. | `inputs/MultiLangFileInput.tsx` | `useTranslations("Form")` ile tutarlı hâle getirildi. |
| **B42** | `MultiArrayTextInput`/`MultiArrayObjectInput`'ta `t("items")`, `t("InvalidFormat")` gibi anahtarlar **hiç tanımlı değildi**; `\|\| "öğe"` gibi fallback'ler next-intl `t()` asla falsy dönmediği için ölü kod. | `inputs/MultiArrayTextInput.tsx` | `Form.items`, `Form.InvalidFormat` çeviri anahtarları eklendi, ölü fallback'ler kaldırıldı. |
| **B43** | `MultiArrayObjectInput`'ta sabit Türkçe metinler: "Anonim Kullanıcı", `` `En az ${minLength} öğe gereklidir` ``, "Sil"; ayrıca `` `Item ${index+1}` `` sabit İngilizce (kural #8, iki dilde de tutarsız). | `inputs/MultiArrayObjectInput.tsx` | `Form.AnonymousUser`, `Form.MinItemsRequired`, `Form.Delete`, `Form.ItemN` çeviri anahtarları eklendi. |
| — | `MultiLangInput/Array/Editor/FileInput`'ta `apiData.translations[]` → `{alan:{dil:değer}}` dönüştürme mantığı 4 dosyada birebir kopyalanmıştı. | 4 ayrı dosya | `inputs/multiLangHelpers.ts` — tek paylaşılan fonksiyon. |
| — | `DateInput`/`DateTimeInput` neredeyse birebir aynı (yalnızca `DatePicker`/`DateTimePicker` ve `timeSteps` farklı). | 2 dosya | Yapı korundu (davranış riski taşımadan birleştirmek için ortak bir saran gerekirdi); ikisi de ayrı ayrı doğrulandı. |

## Faz 9 (form motorları) sırasında bulunanlar

| # | Bulgu | Nerede (referans) | Yeni projede |
|---|---|---|---|
| — | `OpsFormGenerator` (modal) ve `OpsPageFormGenerator` (tam sayfa) tip→bileşen eşleme haritası (`fieldRenderers`, ~35 satır × 2) birebir kopyalanmıştı. | 2 dosya | `OpsFormGeneratorShared.tsx` → `buildFieldRenderers()` tek kaynak. |
| — | `OpsForm` (modal) ve `OpsPageForm` (tam sayfa) S3_IMAGE/FILE yükleme işleme mantığı (~150 satır) birebir kopyalanmıştı. | 2 dosya | `processFormUploads.ts` → `processUploadFields()` + `uploadPendingFiles()`. |
| — | `OpsFormAuditInfo` (modal) ve `OpsPageFormHeader` (tam sayfa) audit alanları render mantığı birebir kopyalanmıştı. | 2 dosya | `AuditFieldsList.tsx` tek paylaşılan bileşen. |
| — | `OpsPageFormSkeleton`'da 6 adet birebir aynı `<Grid><Paper>...</Paper></Grid>` bloğu kopyalanmıştı. | `page/OpsPageFormSkeleton.tsx` | `SkeletonCard` + `Array.from({length:6}).map(...)`. |
| **B44** | `OpsPageFetcher`: ilk yükleme ve `reFetch` için neredeyse aynı gövde iki kez yazılmıştı; **daha önemlisi** `reFetch` çağrıldığında (`params`/`url` değişince) `loading` tekrar `true` yapılmıyordu — kullanıcı bir an eski veriyi/"bulunamadı" durumunu görebiliyordu. | `page/OpsPageFetcher.tsx` | Tek `fetchData` fonksiyonu, her çağrıda `setLoading(true)` ile başlıyor. |

## Faz 10 (paylaşılan bileşenler) sırasında bulunanlar

| # | Bulgu | Nerede (referans) | Yeni projede |
|---|---|---|---|
| **B45 — kritik** | `LockScreen`: `JSON.parse(localStorageService.getItem(...))` — `getItem` zaten parse edilmiş nesne döndürür; bir nesne üzerinde `JSON.parse` çağrısı HER ZAMAN fırlar. **PIN kilit ekranı özelliği hiç çalışmıyordu** (render sırasında patlıyor ya da sessizce yutuluyordu — `lockScreenActive: true` olsa bile kilit hiç devreye girmiyordu). | `components/LockScreen.tsx` | Doğrudan `getItem()` sonucu kullanılıyor. |
| **B46** | `LockScreen`'de "Sil", "Sıfırla", "PIN Kodu Giriniz" sabit Türkçe metinlerdi — İngilizce arayüzde de Türkçe görünüyordu (kural #8). | `components/LockScreen.tsx` | `Form.Delete`/`Form.Reset` (mevcut) + yeni `Common.EnterPinCode` anahtarı. |

> Not: PIN karşılaştırması client tarafında düz metin olarak yapılıyor — bu bir güvenlik sınırı değil, yalnızca "masaya bırakılmış cihaz" sürtünmesi. Koda bu sınırı açıklayan bir yorum eklendi; mimari değiştirilmedi (kapsam dışı).

## Faz 20-23 (test altyapısı + dağıtım) sırasında bulunanlar

| # | Bulgu | Nerede (referans) | Yeni projede |
|---|---|---|---|
| **B47** | Cypress e2e testleri (`Desk-Setting`, `Kitchen-Deparment`, `Menus`, `Product`, `Portion-Form`…) eski bir restoran/POS ürününden kalmaydı — FineHub/FineGroupHub ile hiçbir ilgisi yok. `TestRoutes.ts`, login testi (`tenantId` alanı, sabit "opsiyonRoot" kimlik bilgileri) ve layout testi (`#DeskManagement-menu`, `"MilvaToken"` localStorage anahtarı) de aynı şekilde stale'di. REBUILD_PROMPT'un kendi tespiti (Bölüm 7) doğrulandı. | `cypress/e2e/*.cy.tsx`, `cypress/support/TestRoutes.ts` | Modül-özel eski testler taşınmadı. `TestRoutes.ts` gerçek `Routes.ts`'ten türetildi; `login.cy.ts`/`layout.cy.ts` gerçek `LoginScreen`/middleware davranışına göre sıfırdan yazıldı, yalnızca API'siz doğrulanabilen senaryoları kapsıyor. |
| **B48** | `cypress.config.ts` kökte olduğu için ana `tsconfig.json`'a dahil oluyordu; `import { defineConfig } from "cypress"` Cypress'in global Chai/sinon-chai tiplerini programa sokuyor, bu da Jest'in `expect()` global'iyle çakışıp **tüm Jest testlerinin typecheck'ini kırıyordu** (referans projede bu çakışma hiç ortaya çıkmamıştı çünkü orada Jest kurulu değildi — Faz 20'de ilk kez bir araya geliyorlar). | — (yeni proje kaynaklı, referansta yok) | `tsconfig.json` `exclude`'una `cypress.config.ts` eklendi; Cypress kendi `cypress/tsconfig.json`'unu kullanıyor. |
| **B50** | MUI tema tipografisi `"Lato, serif"` yazıyordu; `next/font` hash'li bir aile adı ürettiği için `Lato` eşleşmiyor, MUI bileşenleri serif'e düşüyordu. | `src/assets/theme/theme.ts` | Font kullanıcı kararıyla Google Sans Flex'e (`public/fonts/googleFlex.ttf`, `next/font/local`) geçti; tema `var(--font-app)` CSS değişkenini kullanır. Fontta ₺ glifi yok → sistem fontuna fallback. |
| **B51** | `UserForm` referansta parola alanını `FormItemTypeEnum.TEXT` ile tanımlıyordu → tarayıcı parolayı düz metin gösteriyordu (bu proje ilk kez Faz 13'te gerçek bir CRUD formu yazınca ortaya çıktı, referansta hiç fark edilmemiş). | `src/forms/UserForm.tsx` | `FormItemTypeEnum.Password` (`TextInput`'ta `type={formItem.type}` doğrudan HTML `input type`'a gidiyor — native maskeleme). |
| **B52** | `OpsFormGeneratorShared.tsx`, 12 input bileşenini `"../inputs"` barrel'ından (`src/common/inputs/index.ts`) named import ediyordu. `package.json`'da `sideEffects` alanı tanımsız olduğundan webpack barrel'ı tree-shake edemiyor; barrel'ın re-export ettiği **her** modül (dolayısıyla `MuiIconAutocomplete.tsx`'in `import * as MuiIcons from "@mui/icons-material"` namespace import'u — ~13.000 ikon modülü, ~4.6 MB) her tüketiciye gömülüyordu. `OpsPageForm`'u ilk kullanan sayfa (`/users/user`, hiç `MUI_ICON_AUTOCOMPLETE` alanı içermiyor) bunu ortaya çıkardı: First Load JS 1.88 MB → 446 kB (Faz 11-18 API'siz olduğu için önceden hiç ölçülmemişti). | `src/common/form/OpsFormGeneratorShared.tsx`, `OpsFormGenerator.tsx`, `OpsPageFormGenerator.tsx` | 12 input artık kendi dosya yolundan import ediliyor (barrel'a hiç dokunulmuyor); `MuiIconAutocomplete` `next/dynamic()` ile kod bölünüyor (diğer ağır input'larla aynı desen). `sideEffects: false` gibi paket-geneli bir çözüme gidilmedi — bu boyutta bir kod tabanında her modülün yan etkisiz olduğunu tek tek doğrulamadan riskli. |
| **B53** | `OpsNavigationBar`'da menü grubu `Accordion`'ı `defaultExpanded={entry.children.some(child => child.segment === activePath)}` ile açılıyordu — `defaultExpanded` yalnızca ilk mount'ta okunur, her render'da `activePath`'ten yeniden hesaplanması MUI'nin "uncontrolled Accordion'ın expanded state'i initialize sonrası değişiyor" uyarısına yol açıyordu VE gerçek işlevsel etkisi vardı: sayfalar arası geçişte aktif menü grubu gerçekte açılıp kapanmıyordu, yalnızca ilk mount anındaki gruba takılı kalıyordu. Yalnızca Dashboard varken (tek grup) hiç fark edilmemişti; Users/Roles farklı menü gruplarına eklenince ortaya çıktı. | `src/common/layout/OpsNavigationBar.tsx` | `Accordion` controlled hale getirildi: `expanded = manuallyToggled[entry.title] ?? isActiveGroup`, `onChange` kullanıcının elle aç/kapa tercihini `manuallyToggled` state'inde tutar. |
| — | İmaj adı `milvasoft/finegrouphub-app` olarak sabitlenmişti — orijinal vendor'un (Milvasoft) Docker Hub namespace'i, yeni proje için anlamsız. | `docker-compose-*.yml` | `IMAGE_NAME` ortam değişkeniyle parametrik hâle getirildi (varsayılan: `finegrouphub-app`); Azure DevOps pipeline'ındaki `imageRepository` variable group değeriyle beslenir. |

## CI/CD kararı — Azure DevOps tek hat, Jenkins kaldırıldı

Kullanıcı kararı (2026-09-20): Pipeline'lar Azure DevOps'a bağlanacak; Jenkins aynı işi
(imaj build + compose ile deploy) tekrar ettiği için **kaldırıldı**. `pipeline-finegrouphub-app-test.yml`
ve `pipeline-finegrouphub-app-prod.yml` geri getirildi (referans projedeki `Pipelines/templates`
şablon deposuna bağımlı yapı korunuyor — bu depo ve `finegrouphub-app-test`/`finegrouphub-app-prod`
variable group'ları kullanıcının Azure DevOps organizasyonunda önceden var olmalı, bu Faz 22'nin
ön koşuludur). `docker-compose-*.yml`'deki `IMAGE_NAME` parametrikleştirmesi korundu — CI aracından
bağımsız, pipeline'ın `imageRepository` değişkeniyle veya yerel build ile aynı şekilde çalışır.

**Branch tetikleme** (kullanıcı kararı): Referansta `trigger: none` idi — pipeline'lar bu
repodan asla otomatik tetiklenmiyordu, yalnızca manuel/merkezi orkestrasyon ile çalışıyordu.
Bu proje için gerçek branch tetikleyicileri eklendi: `main` → prod pipeline'ı,
`develop` → test pipeline'ı.

## Altyapı kararı — paylaşılan Nginx + paylaşılan PostgreSQL + tek iç ağ

Kullanıcı kararı (2026-09-20): Sunucuda TEK bir Nginx ve TEK bir PostgreSQL çalışacak, tüm
projeler (bu proje dahil) aynı `container-network` iç ağına bağlanıp bu paylaşılan servisleri
kullanacak. Buna göre:

- `docker-compose-prod.yml`'den proje-özel `nginx:` servisi **kaldırıldı** — Nginx artık bu
  repodan yönetilmiyor, sunucuda ayrı bir paylaşılan altyapı kurulumunun parçası.
- `deploy/nginx/panel.conf` bir Nginx container'ı başlatan dosya değil, paylaşılan Nginx'in
  `conf.d/` dizinine eklenecek TEK bir route parçası olarak yeniden çerçevelendi.
- PostgreSQL bu projeyle hiç ilişkilendirilmedi (finegrouphub-app saf bir Next.js panelidir,
  veriye yalnızca finegrouphub-api üzerinden HTTP ile erişir) — ama mimari kararın tamamı
  ve finegrouphub-api'nin buna nasıl bağlanacağı yeni eklenen [DEPLOYMENT.md](DEPLOYMENT.md)'de
  belgelendi.
| — | `.dockerignore` yoktu — `node_modules`/`.next` build context'e giriyordu (B10 ile aynı bulgu, burada Dockerfile'la birlikte doğrulandı). | Depo kökü | `.dockerignore` Faz 1'de zaten eklenmişti. |
| — | Nginx yapılandırması repoda hiç yoktu (REBUILD_PROMPT §8.3'ün kendi tespiti — projenin "en büyük altyapı eksiği"). | — | `deploy/nginx/panel.conf` sıfırdan yazıldı; statik IP yerine compose servis adı (`finegrouphub_app`) kullanan, nginx'i de compose'a dahil eden önerilen yaklaşım uygulandı. |

**⚠️ Doğrulanamayan:** Bu ortamda Docker mevcut değil; `Dockerfile`, `docker-compose-*.yml` ve `deploy/nginx/panel.conf` fiilen build edilip çalıştırılarak doğrulanamadı. İçerik referans projenin kanıtlanmış yapısını birebir izliyor (yalnızca uygulama/network adları ve BUILD_ENV zorunluluğu değişti) ve `yarn build:production`/`build:test` script'leri bağımsız olarak doğrulandı, ama container'ın gerçekten ayağa kalktığı test edilmedi.

## Kalan uyumsuzluklar (karar bekliyor)

| Konu | Durum |
|---|---|
| `Meta.Title` hâlâ `"Fine Hub"` | Yeni ürün adı `FineGroupHub` ise `tr.json` + `en.json` içinde güncellenmeli. Ürün adı kararı kullanıcıya ait; mekanik olarak değiştirilmedi. |
| Dashboard uç adları | Panel `/Dashboard/statistics/users` çağırıyor, .NET `/Dashboard/general` sunuyor — referans ikili zaten ayrışmış. Bkz. API_ADAPTER.md §5.5. |
| `@mui/lab@7.0.0-beta.17` peer uyarısı | `@mui/material@^7.3.2` istiyor, 7.1.0 sabitli. Şimdilik sorun çıkarmadı; Faz 8–10'da lab bileşenleri kullanılınca yeniden değerlendir. |
