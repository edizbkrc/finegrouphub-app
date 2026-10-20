# API Adaptör Karar Defteri (Faz 0)

> Durum: **onaylandı** — K1, K2, K3 karara bağlandı (bkz. Bölüm 6)
> Tarih: 2026-09-20
> Kapsam: FineHub panelinin Laravel API üzerine yeniden inşası, REBUILD_PROMPT.md Faz 0 çıktısı.

---

## 1. Durum tespiti

Faz 0 "verilen Laravel endpoint listesini sözleşmelerle karşılaştır" diyor. Karşılaştırılacak
liste yok — çünkü **Laravel API henüz yazılmamış**. Doğrulanan durum:

| Depo | Durum |
|---|---|
| `finegrouphub-app` (hedef panel) | **Boş dizin.** Hiç dosya yok. |
| `finegrouphub-api` (Laravel) | Çıplak Laravel 12 iskeleti. `app/` altında 3 dosya (`User`, `Controller`, `AppServiceProvider`), `routes/` altında sadece `web.php` + `console.php`. **Sıfır endpoint, sıfır model.** |
| `finehub-app` (referans panel) | Tam, çalışır. 522 dosya / ~62k satır. |
| `finehub-api` (referans .NET API) | **Tam kaynak kodu mevcut.** 40+ controller, 241 endpoint, 52 tablo. |

İki şey Faz 0'ı yeniden çerçeveliyor:

1. **REBUILD_PROMPT.md Bölüm 9'un boş kalmasının sebebi eksik dokümantasyon değil; backend'in
   var olmaması.** Adapte edilecek bir API yok.
2. **Buna karşılık .NET kaynağı elimizde.** Yani sözleşmeler tahmin edilmek zorunda değil —
   satır satır doğrulanabiliyor. Bu dokümandaki her sözleşme kaynaktan teyit edildi.

Sonuç: "Laravel'e uyarla" işi aslında **"Laravel API'yi sıfırdan yaz"** işi. Bu, 23 fazlık
planın hiçbir yerinde yer almıyor ve plandaki iş yükünü ciddi biçimde aşıyor.

---

## 2. Ana karar: Seçenek (a) — Laravel sözleşmeye uysun

Faz 0 her sapma için *(a)* Laravel'i uyarla / *(b)* adaptörde çevir seçimi istiyor.
**Tüm sözleşmeler için (a) öneriliyor.** Gerekçe:

Adaptör yaklaşımı (b), backend'in **zaten var olduğu ve değiştirilemediği** durumda doğru
araçtır. Burada backend 0 satır. (b)'yi seçmek şu anlama gelir: önce Laravel-idiomatik bir API
tasarla, *sonra* onu panelin konuştuğu sözleşmeye çeviren bir katman yaz — yani iki tasarım +
bir çeviri katmanı + iki taraflı hata ayıklama. (a) ise tek tasarım: panelin hâlihazırda
konuştuğu sözleşmeyi Laravel'de uygula.

Ek olarak sözleşme, .NET tarafında **tamamen mekanik** bir kalıp izliyor (241 endpoint, tek
şablon — bkz. Bölüm 5.1). Laravel'de tek bir base controller + trait seti ile karşılanabilir;
modül başına tekrar eden iş küçük.

> **Bu kararın maliyeti:** Laravel API'nin bu sözleşmeye göre yazılması gerekir. Panel ekibi
> ile backend ekibi aynı kişi/ekip değilse bu, plana eklenmesi gereken ayrı bir iş kalemidir.

`src/network/adapters/` katmanı yine de yazılacak — ama çeviri için değil, **izolasyon** için:
Bölüm 4'teki bilinçli sapmalar ve ileride çıkacak farklar tek yerde toplansın diye. Kodlama
kuralı değişmiyor: adaptör dışında hiçbir dosya backend'in Laravel olduğunu bilmeyecek.

---

## 3. Sözleşme tablosu (beklenen ↔ doğrulanan ↔ Laravel stratejisi)

Aşağıdaki "doğrulanan" sütunu REBUILD_PROMPT.md'den değil, **kaynak koddan** çıkarıldı.
Dosya referansları teyit içindir.

### 3.1 Yanıt zarfı

| | |
|---|---|
| **Doğrulanan** | `{ messages[], statusCode, isSuccess, data, metadatas[] }` — `finehub-app/src/common/types/IBaseResponse.ts` |
| **Laravel** | Global `ResponseMiddleware` + `ApiResponse` sarmalayıcı. `messages[].type` → toast varyantı (0=info,1=success,2=warning,3=error — teyit edilmeli). |
| **Karar** | (a) — birebir uygula. |

Laravel'in 422 doğrulama hatası `errors{}` formatı **zarfa çevrilmeli**: her alan hatası bir
`messages[]` girdisi (`key` = alan adı, `type` = error), `isSuccess = false`.

### 3.2 Liste isteği — en kritik

| | |
|---|---|
| **Doğrulanan** | **PATCH** `{listUrl}`, gövde `{ pageNumber, rowCount, filtering?, sorting?, aggregation? }`, header `M-Metadata: true`, `withoutToast: true` — `OpsTableServices.ts:107-118` |
| **Yanıt** | `IBaseResponse<T[]>` **artı kök seviyede** `currentPageNumber`, `totalPageCount`, `totalDataCount`, `aggregationResults[]` — `ITableResponse.ts`. Bu alanlar `data` içinde **değil**, `data` ile kardeş. |
| **Laravel** | `PATCH` ile listeleme Laravel'de alışılmadık ama tamamen geçerli. `spatie/laravel-query-builder` gövdeden beslenecek şekilde sarılır. |
| **Karar** | (a) — PATCH + gövde korunur. `TableService` ve URL↔state senkronizasyonu dokunulmadan çalışır. |

Enum değerleri (`finehub-app/src/common/enums/`):

```
SortType:      0=Asc, 1=Des
ConnectorType: 0=And, 1=Or          (filtering.mergeType)
Aggregation:   0=Avg, 1=Sum, 2=Min, 3=Max, 4=Count
FilterType:    0=Between, 1=Contains, 2=DoesNotContain, 3=StartsWith, 4=EndsWith,
               5=EqualTo, 6=NotEqualTo, 7=GreaterThan, 8=GreaterThanOrEqualTo,
               9=LessThan, 10=LessThanOrEqualTo, 19=DateEqualTo
```

> `FilterType` 11–18 aralığı frontend'de yorum satırında (IsEmpty, IsNull, In, NotIn…).
> Laravel bunları desteklemeli ama panel şu an kullanmıyor. `19=DateEqualTo` boşluğu
> **kasıtlı** — Milvasoft numaralandırmasıyla hizalı, değiştirilmemeli.

### 3.3 Metadata (kolon şeması)

| | |
|---|---|
| **Doğrulanan** | `M-Metadata: true` header'ında yanıt kökünde `metadatas[]`. Tablo kolonları, görünürlük, filtre tipi, formatlama tamamen buradan üretiliyor — `OpsTableServices.ts:131-175`. Frontend'de sabit kolon tanımı yok. |
| **Şema** | `name, localizedName, type, display, pinned, mask, filterable, filterFormat, defaultValue, decimalPrecision, displayFormat, filterComponentType, tooltipFormat, metadatas[]` |
| **Karar** | **Seçenek A — Laravel `MetadataResource` üretsin.** |

Seçenek B (client-side registry) reddedildi: metadata sadece kolon başlığı değil — `display`,
`filterable`, `filterComponentType`, `decimalPrecision` tablo davranışını belirliyor ve DTO ile
birlikte değişiyor. Client'ta tutulursa DTO her değiştiğinde iki depoda senkron bakım gerekir;
bu, mimarinin "tek kaynak" ilkesini bozar.

Laravel'de `spatie/laravel-data` DTO'larına attribute eklenerek üretilmesi öneriliyor:
DTO alanı → metadata girdisi, `localizedName` Laravel'in `Accept-Language`'ine göre çeviri
dosyasından.

### 3.4 Kimlik doğrulama

| | |
|---|---|
| **Login** | `POST /v1/Account/login` `{ userName, password, deviceId }` → `{ id, token: { accessToken, expiresIn, refreshTokenExpiresIn, refreshToken, tokenType }, accessibleMenuItems[], pageInformations[], systemInfo }` |
| **Refresh** | `POST /v1/account/login/refresh` `{ refreshToken, deviceId, userName }` — **eski access token `Authorization` header'ında gönderilir** (`axiosInstance.ts:59-70`). Laravel bunu kabul etmeli: süresi dolmuş ama imzası geçerli token. |
| **Logout** | `POST /v1/Account/logout` `{ userName, deviceId }` |
| **Şifre** | `PUT /v1/Account/password/change` |
| **Detay** | `GET /v1/Account/detail?userId={id}` |
| **Karar** | (a) — `lcobucci/jwt` zaten composer.json'da. Sanctum değil, JWT. |

Token süresi **client tarafında** takip ediliyor: `expiresIn` (saniye) login anında
`moment().add(expiresIn,'s')` olarak saklanıyor; istek öncesi süre dolduysa proaktif refresh
tetikleniyor. Laravel `expiresIn`'i saniye cinsinden döndürmeli.

**Refresh sonrası zorunlu davranış:** yeni token alınınca `/v1/UI/pages` ve `/v1/UI/menuItems`
yeniden çekilip localStorage tazeleniyor (`axiosInstance.ts:88-115`). İzinler oturum ortasında
değişebildiği için bu şart.

### 3.5 Yetkilendirme

| | |
|---|---|
| **Doğrulanan** | `GET /v1/UI/menuItems` → hiyerarşik `IMenuItem[]`; `GET /v1/UI/pages` → `IPageDto[]`; `GET /v1/UI/pages/page?...` → tek sayfa |
| **Karar** | (a) — zorunlu. Sol menü ve her aksiyon butonu **tamamen** bu iki uca bağlı; karşılanmazsa panel boş açılır. |

Laravel tarafında bir izin paketi (Spatie Permission vb.) üzerine `hasCreate/userCanCreate`
türetmesi yazılmalı. Not: `hasX` = sayfa bu yeteneğe sahip mi, `userCanX` = bu kullanıcı
yapabilir mi. İkisi ayrı.

### 3.6 Lookup — ⚠️ REBUILD_PROMPT.md yanlış

REBUILD_PROMPT.md Bölüm 3.6 `POST /lookups` ve `POST /lookups/enum` diyor. Kaynak farklı:

| | Prompt'taki | **Doğrulanan** |
|---|---|---|
| Entity lookup | `POST /lookups` | **`PATCH /v1/Lookups`**, gövde `{ parameters: [ { entityName, requestedPropertyNames[], filtering?, sorting? } ] }` — dikkat: **`parameters` dizi sarmalayıcısı var** |
| Enum lookup | `POST /lookups/enum` | **`GET /v1/Lookups/enum?enumName=X`** |

Kaynak: `AutoSelect.tsx:108-116`, `FeatureGroupTechnicalSpecificationsForm.tsx:73-78`,
`finehub-api/.../LookupsController.cs`.

**Karar:** (a) — doğrulanan hâli uygulanır. Prompt'taki tarif kullanılmamalı.
Tüm `AUTO_COMPLETE` inputları bu iki uca bağlı olduğu için generic lookup controller şart.

### 3.7 CRUD — ⚠️ REBUILD_PROMPT.md eksik

Prompt Bölüm 3.7 güncellemeyi "yalnızca değişen alanlar + id" diye tarif ediyor. Gerçek
sözleşme daha spesifik: **her alan `{ value, isUpdated }` zarfına sarılıyor.**

```jsonc
// PUT /v1/Users/user
{
  "id": 42,
  "name":       { "value": "Yeni ad", "isUpdated": true },
  "roleIdList": { "value": [1, 3],    "isUpdated": true }
  // gönderilmeyen alanlara dokunulmaz
}
```

Kaynak: `finehub-app/src/common/helpers/diffFormObject.ts` (her diff girdisi `{value,isUpdated}`
üretiyor) ↔ `finehub-api/.../UpdateUserCommand.cs` (`UpdateProperty<T>` tipi, XML doc:
*"Only the fields that are sent as isUpdated true are updated"*).

Boş dizi anlamlıdır: `{ "value": [], "isUpdated": true }` → ilişkili kayıtları **temizle**.
Değişiklik yoksa alan ya hiç gönderilmez ya da `isUpdated: false` gider.

| İşlem | Yöntem |
|---|---|
| Liste | `PATCH {listUrl}` |
| Detay | `GET {listUrl}/{singular}?{key}={id}` |
| Oluştur | `POST {listUrl}/{singular}` |
| Güncelle | `PUT {listUrl}/{singular}` — `{value,isUpdated}` zarflı |
| Sil | `DELETE {listUrl}/{singular}?{key}={id}` veya `DELETE {listUrl}` gövde `{ ids: [] }` |

**Karar:** (a) — zarf korunur. Laravel'de bir `UnwrapsUpdateProperties` FormRequest trait'i
(~30 satır) zarfı açar ve sadece `isUpdated: true` olanları `validated()`'a koyar. Zarfı
kaldırmak `diffFormObject` + `OpsForm` + `OpsPageForm`'u değiştirmek demektir — form motorunun
göbeği; dokunulmamalı.

### 3.8 Dosya yükleme — iki fazlı presigned URL

| | |
|---|---|
| **Doğrulanan** | Form submit → yanıtta `data.uploadInfos[] = [{ fileId, preSignedUrl }]` (veya tekil `data.uploadInfo`) → client base64'ü blob'a çevirir, `browser-image-compression` ile sıkıştırır, **doğrudan S3'e PUT** eder. Base64 asla API gövdesinde gitmez. Kaynak: `s3ImageUpload.ts`. |
| **Laravel** | `Storage::temporaryUploadUrl()` — `league/flysystem-aws-s3-v3` zaten composer.json'da. |
| **Karar** | (a) — aynı akış. |

**Tuzak (prompt Bölüm 7 ile aynı fikirde):** Faz 2 (S3 PUT) başarısız olsa bile kayıt Faz 1'de
zaten oluşmuştur. Kullanıcıya ayrı bir hata toast'ı gösterilmeli; kayıt geri alınmamalı.

### 3.9 Çok dilli içerik

`LANGUAGE_*` form alanları submit'te düzleşip `translations: [{ languageId, <alan>: "..." }]`
olur; yalnızca değişiklik varsa gönderilir (`hasTranslationsChanged`). Desteklenen diller
`PATCH /v1/languages` ucundan çekilip cache'lenir.

**Karar:** (a) — `translations[]` gömülü dizi olarak korunur, ayrı `/translations` uçları **değil**.

### 3.10 Header'lar

`Accept-Language: tr|en` · `Authorization: Bearer <accessToken>` · `M-Metadata: "true"|"false"`

`M-Metadata` her istekte gönderiliyor (`"false"` dâhil) — `axiosInstance.ts:127`.
**Karar:** (a).

---

## 4. Bilinçli sapmalar (eski sözleşmeden kasıtlı ayrılmalar)

Sözleşme genel olarak korunuyor; şu dört noktada **kasıtlı olarak düzeltiliyor**. Dördü de
REBUILD_PROMPT.md Bölüm 7'nin kendi tespitleri.

| # | Eski davranış | Yeni | Etki |
|---|---|---|---|
| D1 | `crudPropertyName` modülden modüle farklı (`id`, `UserId`, `TenantId`, `ProjectId`…) | **Her modülde `id`** | `TableService` ve `OpsPageFetcher` çağrılarında tek tip. Adaptörde sabitlenir. |
| ~~D2~~ | Poligon `relatedEntityId` / `navigationId` int64 → JS `Number` taşması | ~~Laravel `string` döndürsün~~ | **REDDEDİLDİ.** ID'ler sayısal kalır; taşma client tarafında çözülmeye devam eder — bkz. aşağıdaki not. |
| D3 | `SESSION_SECRET` `app/lib/session.ts` içinde hardcoded | `process.env.SESSION_SECRET` | Faz 4. Commit'lenmez. |
| D4 | `next.config.ts` → `typescript.ignoreBuildErrors: true`, `eslint.ignoreDuringBuilds: true` | **İkisi de kapalı** | Tip hataları build'de yakalanır. Faz 1. |

D1 **backend tarafında** uygulanmalı; D3 ve D4 sadece panelde (ikisi de uygulandı).

### D2 reddedildi — sonucu

Poligon ID'leri sayısal (int64) kalacağı için `Number.MAX_SAFE_INTEGER` (2^53−1) üstündeki
değerler JS'te sessizce bozulur. Bu yüzden referans projedeki çözüm **aynen taşınmalıdır**:

- `json-bigint` bağımlılığı korunur (`package.json`'da mevcut).
- Workspace uçlarında axios `transformResponse` ile gövde `json-bigint` üzerinden ayrıştırılır;
  `polygons[].relatedEntityId` ve `navigationId` string/BigInt olarak korunur.
- Bu ID'ler **asla** `Number()`'dan geçirilmez, aritmetiğe sokulmaz, sadece taşınır ve karşılaştırılır.
- Faz 17 kabul kriteri buna bağlı: *"Çizilen poligonlar kaydedilip geri yüklendiğinde ID'ler bozulmuyor."*

> Bu, Faz 17'nin bilinen en kırılgan noktasıdır ve bilinçli olarak kabul edilmiştir.
> Laravel tarafında en azından **`JSON_BIGINT_AS_STRING` benzeri bir tutarlılık** ve bu
> alanların dokümante edilmesi önerilir.

Ayrıca: `lastDisabledRowId` ile korunan seed kayıtlar Laravel'de **policy ile de** doğrulanmalı
— salt UI kontrolü yetersiz.

---

## 5. Bölüm 9 — Laravel endpoint hedef spesifikasyonu

REBUILD_PROMPT.md Bölüm 9 boş. Aşağıdaki tablo onun yerini alıyor: **Laravel API'nin
karşılaması gereken sözleşme**, .NET kaynağından türetildi.

### 5.1 Kalıp — 241 endpoint'in tamamı bunu izliyor

```
PATCH   /v1/{resource}                     → liste   (gövde: IListRequest, header M-Metadata)
GET     /v1/{resource}/{singular}?id=      → detay
POST    /v1/{resource}/{singular}          → oluştur
PUT     /v1/{resource}/{singular}          → güncelle ({value,isUpdated} zarflı)
DELETE  /v1/{resource}/{singular}?id=      → sil
```

Bu kalıbın mekanik oluşu Laravel portunu ciddi biçimde ucuzlatıyor: tek bir
`ResourceController` taban sınıfı + kaynak kayıt defteri (resource registry) ile modüllerin
büyük kısmı üretilebilir. Modül başına özel iş yalnızca "özel uçlar" sütununda.

> `.NET` toplam 241 endpoint sunuyor; **panel bunların yalnızca ~98'ini kullanıyor**
> (`finehub-app/src/network/OpsApiRoutes.ts`). Laravel'de önceliklendirme bu 98 üzerinden
> yapılmalı. `Developer`, `Notifications`, `Presentations`, `Sites`, `Templating`,
> `ProjectBriefs`, `Dollhouses`, `Currencies` controller'ları panelin dışında.

### 5.2 Kimlik ve oturum

| İşlev | Metod | Path | Gövde / Parametre |
|---|---|---|---|
| Login | POST | `/v1/Account/login` | `{ userName, password, deviceId }` |
| Refresh | POST | `/v1/account/login/refresh` | `{ refreshToken, deviceId, userName }` + eski Bearer |
| Logout | POST | `/v1/Account/logout` | `{ userName, deviceId }` |
| Şifre değiştir | PUT | `/v1/Account/password/change` | |
| Hesap detayı | GET | `/v1/Account/detail` | `?userId=` |

### 5.3 Yetkilendirme / UI

| İşlev | Metod | Path |
|---|---|---|
| Menü öğeleri | GET | `/v1/UI/menuItems` |
| Sayfa izinleri | GET | `/v1/UI/pages` |
| Tek sayfa izni | GET | `/v1/UI/pages/page` |
| İzin listesi | PATCH | `/v1/permissions` |
| Roller | PATCH/GET/POST/PUT/DELETE | `/v1/Roles` + `/v1/roles/role` |

### 5.4 Ortak altyapı

| İşlev | Metod | Path | Not |
|---|---|---|---|
| Lookup (entity) | **PATCH** | `/v1/Lookups` | gövde `{ parameters: [...] }` |
| Lookup (enum) | **GET** | `/v1/Lookups/enum` | `?enumName=` |
| Export | POST | `/v1/exports/export` | `{ listRequest, exportType }` → blob |
| Diller | PATCH | `/v1/languages` | |
| Dil güncelle | PUT | `/v1/languages/language` | |

### 5.5 Modül uçları (panelin kullandıkları)

Hepsi 5.1 kalıbını izler; tabloda kaynak kökü ve **kalıp dışı** özel uçlar verilmiştir.

| Modül | Kaynak kökü | Tekil | Özel uçlar |
|---|---|---|---|
| Kullanıcılar | `/v1/Users` | `user` | — |
| Şirketler (Tenants) | `/v1/tenants` | `tenant` | `PUT /tenant/status` |
| Projeler | `/v1/projects` | `project` | `PUT /project/state`, `GET /project/block` |
| Etaplar | `/v1/projectstages` | `projectstage` | — |
| Bloklar | `/v1/blocks` | `block` | `POST/PUT/DELETE /block/floors/floor` |
| Daireler | `/v1/units` | `unit` | `PATCH /units/search` |
| Daire şablonları | `/v1/unittemplates` | `unittemplate` | — |
| Daire durumları | `/v1/unitstates` | `unitstate` | — |
| Daire tipleri | `/v1/unittypes` | `unittype` | — |
| Kat şablonları | `/v1/floortemplates` | `floortemplate` | — |
| Galeri grupları | `/v1/gallery/groups` | `/v1/gallery/group` | kalıp dışı: grup/öğe ayrı kök |
| Galeri öğeleri | `/v1/gallery/items` | `/v1/gallery/item` | çoklu yükleme |
| Bilgi kartları | `/v1/infocards` | `infocard` | — |
| Teklifler | `/v1/offers` | `offer` | `PUT /offer/state`, `PUT /offer/complete`, `GET /offer/history`, `PATCH /offer/preview`, `POST /offer/mail`; public `PATCH /v1/preview/offer` |
| Siparişler | `/v1/orders` | `order` | `PUT /order/state`, `POST /order/payment`, `GET /order/payment` |
| Destek talepleri | `/v1/tickets` | `ticket` | `POST /ticketmessage` |
| Özellikler | `/v1/features` | `feature` | — |
| Özellik grupları | `/v1/featuregroups` | `finefeaturegroup` | — |
| Gelir-Gider | `/v1/expenserevenues` | `expenserevenue` | — |
| Gelir-Gider kategorileri | `/v1/expenserevenuecategories` | `expenserevenuecategory` | — |
| CMS Namespace | `/v1/cms/namespaces` | `namespace` | — |
| CMS ResourceGroup | `/v1/cms/resourcegroups` | `resourcegroup` | — |
| CMS Content | `/v1/cms/contents` | `content` | `PATCH /contents/query` |
| İletişim formları | `/v1/contactforms` | `contactform` | silme: `DELETE /` gövde `{ids}` |
| Banka hesapları | `/v1/bankaccounts` | `bankaccount` | — |
| Aktivite logları | `/v1/ActivityLogs` | — | salt okunur, sadece PATCH |
| Uygulama ayarları | `/v1/appsettings` | — | `GET /`, `PUT /` (liste yok) |
| Site ayarları | `/v1/sitesettings` | — | |
| Workspace | `/v1/workspaces/workspace` | — | `GET /`, `POST/PUT/DELETE /items`, `PUT /items/item/image`, `POST /lock`, `PUT /lock/renew`, `PUT /unlock`, `PUT /unlock/all` |
| Sanal turlar | `/v1/virtualtours` | `virtualtour` | `POST/PUT/DELETE /virtualtour/scenes` |
| Dashboard | `/v1/Dashboard` | — | `GET /statistics/users`, `/statistics/financial` |

> **Dashboard uyumsuzluğu:** panel `/v1/Dashboard/statistics/users` ve `/statistics/financial`
> çağırıyor; .NET controller'da `GET /general`, `/expenseRevenues`, `/orders` var. Yani referans
> panel ile referans API bu noktada zaten ayrışmış. Laravel'de **panelin beklediği** isimler
> uygulanmalı; içerik Faz 16'da netleşecek.

### 5.6 Veri modeli

`finegrouphub-api/database/schema/finehub-schema.json` — EF `InitialCreate` migration'ından
çıkarılmış: **52 tablo, 705 kolon, 111 index, 52 foreign key.** Laravel migration'ları bu
dosyadan üretilebilir. `tools/extract_schema_from_ef.py` üreticisi de depoda.

---

## 6. Kararlar (2026-09-20'de onaylandı)

| # | Karar | Sonuç |
|---|---|---|
| **K1** | Kapsam | **Sadece panel.** Laravel API ayrı bir iş kalemi; bu depoda yazılmayacak. Panel çerçeve fazları (5–10) API'den bağımsız ilerler. |
| **K2** | Sözleşme yönü | **(a) Laravel sözleşmeye uyar.** Adaptör katmanı çeviri için değil, izolasyon için yazılır. Bölüm 5 Laravel'in karşılaması gereken hedef spesifikasyondur. |
| **K3** | Sapmalar | **D1 onaylandı** (`crudPropertyName` → her yerde `id`). **D2 reddedildi** (ID'ler sayısal kalır; `json-bigint` korunur). D3, D4 uygulandı. |

### K1'in pratik sonucu

Faz 3 (`ApiRoutes.ts` + adaptörler) **yazılabilir**, çünkü (a) kararıyla hedef yollar bellidir
(Bölüm 5). Ancak canlı bir uca karşı doğrulanamaz; Faz 3'ün kabul kriteri ("sahte bir uçla
liste + detay + hata toast'ı + token yenileme kuyruğu test edilmiş olmalı") **mock** ile
karşılanacaktır.

Faz 11 ve sonrası (gerçek modüller) Laravel API hazır olmadan tamamlanamaz.

---

## 7. Faz 0 kabul kriteri

> *"Adaptör katmanı dışında hiçbir dosyanın Laravel'e özel kod içermeyeceği teyit edilmiş olmalı."*

**Karşılandı.** Seçenek (a) ile Laravel'e özel kod zaten oluşmuyor: panel, backend'in
teknolojisini bilmeyen bir sözleşme konuşuyor. `src/network/adapters/` katmanı yine de yazılacak
ve D1 sapması ile ileride çıkacak farklar orada toplanacak.

**Faz 0 kapandı.**

## 6. Laravel API bağlantısı — 2026-09-21 doğrulama kaydı

`finegrouphub-api` artık 56/241 uç sağlıyor (Account, Users, Roles, Permissions, UI,
Tenants, Projects, ProjectStages, FloorTemplates, UnitTemplates*, UnitStates, UnitTypes).
Yerel örnek `http://localhost:8000` üzerinde çalışıyor. Kaynak kod + canlı (kimliksiz) çağrılarla doğrulananlar:

| Konu | Sonuç |
|---|---|
| **Taban URL** | Laravel rotaları `hubapi/v{n}/...` altında. `NEXT_PUBLIC_API_URL` **`/hubapi` dahil** olmalı (`http://localhost:8000/hubapi`); panel rotaları `/v1/...` ile başlar. Eskiden `http://localhost:8000` yazıyordu → tüm istekler 404 olurdu. |
| Hata zarfı | İş hatası: HTTP **200** + gövde `statusCode: 400`. Kimliksiz: HTTP 401. Panelin `login.ts`/interceptor'ı bu iki yolu zaten karşılıyor. |
| CORS | Non-prod'da `*`; preflight (`m-metadata`, `authorization`, `accept-language`) geçiyor. |
| Login gövdesi | `{userName, password, deviceId}` ✓. Yanıt: `id, userType, token{accessToken,expiresIn,refreshTokenExpiresIn,refreshToken,tokenType,sessionState,scope}, accessibleMenuItems, pageInformations`. |
| **`systemInfo`** | Ne .NET ne Laravel login yanıtında döndürüyor (referans istemci tipinde hayalet alan). `ILoginResponse.systemInfo` opsiyonel yapıldı; `login.ts` yalnızca varsa yazıyor. Kilit ekranı ve para birimi bu yüzden API'den beslenmiyor — gerekiyorsa API'ye eklenmeli veya `Account/detail`'e bağlanmalı. |
| Refresh | Gövde `{refreshToken, deviceId, userName}` + eski access token `Authorization`'da ✓ (`RefreshLoginCommand`). |
| Logout | Gövde `{userName, deviceId}` ✓. |
| Menü/sayfa DTO | `MenuItemDto` (`childrens` yazımı dahil) ve `PageDto` panel tipleriyle birebir. Menü URL'leri panel `Routes` ile uyumlu (`/users`, `/roles`, `/companies`, `/projects`, `/unit-types`…). |
| Metadata | Laravel `MetadataGenerator` panelin `IMetadata` alanlarına ek olarak `aggregatable`, `options`, `info` üretiyor → tipe eklendi (panel `aggregatable`/`options`'ı `meta` üzerinden zaten okuyordu). |
| Lookups / Exports / Languages | **Laravel'de henüz yok** — panelin select/autocomplete girdileri ve dışa aktarma bu uçlar gelene kadar çalışmaz. |

Canlı, kimlikli doğrulama için: `E2E_USER=… E2E_PASSWORD=… yarn verify:api`
(`scripts/verify-api.mjs` — yalnızca okuma + oturum uçları; login, menü, profil, 9 liste ucu +
metadata biçimi, refresh, logout).

### 6.1 Canlı doğrulama sonucu (2026-09-21, yerel API + `rootuser`)

- `yarn verify:api` → **tüm kontroller geçti**: login/refresh/logout, menü, sayfalar, profil,
  9 liste ucu (zarf, kökte sayfalama, metadata alanları, `M-Metadata: false` → boş metadata).
  Liste satırlarındaki her alan `metadatas`'ta tanımlı.
- `yarn e2e:login` → gerçek Chrome'da panel login → `/api/session` → `/tr/dashboard`; CORS/konsol hatası yok.
- Logout yalnızca cihaz oturumunu (refresh token) kapatır; access token stateless JWT olduğundan
  süresi dolana kadar geçerli kalır (.NET ile aynı davranış) — panel logout'ta token'ı zaten siliyor.
- Yerel DB'de `rootuser` şifresi seed'de rastgele üretildiğinden bilinmiyordu; geliştirme için `string`
  yapıldı (yalnızca yerel `finehubdb`). Üretim/test ortamında kullanılmaz.
- `NEXT_PUBLIC_*` değerleri dev sunucusu başlarken gömülür: `.env` değişince `yarn dev` yeniden başlatılmalı
  (eski sunucu `/hubapi`'siz tabanla 404/CORS hatası veriyordu).

## 7. İlk gerçek modüller — Kullanıcılar ve Roller (2026-09-24)

`/users` ve `/roles` (liste + oluştur + düzenle) gerçek API'ye bağlandı; Faz 13'ün panel
tarafındaki ilk somut çıktısı. `src/forms/UserForm.tsx`, `src/forms/RolePermissionMatrix.tsx`,
ilgili `app/[locale]/(pages)/{users,roles}/**` rotaları.

**D1 netleşmesi — crudPropertyName ASLA gerçekte "id" değil:** K3'te "D1 onaylandı" denip
"backend tarafında uygulanmalı" notu düşülmüştü, ama backend (finegrouphub-api, ayrı bir çalışma)
bunu henüz normalize etmedi — her modülün detay/silme sorgu parametresi hâlâ kendi .NET adını
taşıyor (`GetUserDetailQuery.userId`, `DeleteUserCommand.userId`, `GetRoleDetailQuery.roleId`…).
Yeni bir modül eklerken **kaynağı `finegrouphub-api/app/Application/Features/{Grup}/Get{X}Detail/`
ve `Delete{X}/`'ten oku**, `id` varsayma. İstisna `TableService`'in 3. parametresi
(`crudPropertyName`) ve `OpsPageForm`/`OpsPageFetcher`'ın `deletePropertyName`/`params`'ında
BURADA (çağıran modülde), adaptör katmanında DEĞİL tanımlanır — `docs/API_ADAPTER.md`'nin D1
notunun kendisi de söylediği gibi ("bir modül istisna gerektirirse istisna BURADA tanımlanır").
Şimdiye kadar doğrulanan modüller: `Users`→`UserId`, `Roles`→`RoleId`. PUT gövdesindeki `id` alanı
ise her modülde gerçekten `id` (Update komutları hep `public int $id` kullanıyor) — yalnızca
GET-detail/DELETE sorgu parametresi farklı.

**Rol seçici geçici çözümü:** `PATCH /v1/Lookups` (genel entity lookup) henüz yok; `roleIdList`
alanı `AsyncAutocomplete`'in `getOptions` kaçış kapısıyla doğrudan `PATCH /v1/Roles`'tan besleniyor
(bkz. `UserForm.tsx` `getRoleOptions`). Jenerik Lookups ucu gelince `lookUpParams`'a dönülmeli.

**`UserType` çeviri sözlüğü ters kayıtlıydı:** `tr.json`/`en.json`'daki `UserType.{1,2}` referanstan
kopyalanmış ve gerçek API değerleriyle hiç karşılaştırılmamıştı (`1`↔`2` ters). Canlı
`GET /v1/Lookups/enum?enumName=UserType` ile doğrulanıp düzeltildi (1=Manager/Yönetici,
2=AppUser/Uygulama Kullanıcısı). AutoSelect'in kendisi enum seçeneklerini API'den (zaten
lokalize) çektiği için kullanıcı yanlış sözlükten hiç etkilenmiyordu, ama `getDefaultValue`'nun
kapalı-dropdown'daki ilk etiketi yanlış gösteriyordu.

**Bu geçişte bulunup düzeltilen iki gerçek framework hatası (B52, B53 — `REFERANS_BULGULAR.md`):**
barrel import + `sideEffects` eksikliği yüzünden `/users/user` sayfasının First Load JS'i 1.88 MB→
446 kB'a indi; `OpsNavigationBar`'daki controlled olmayan `Accordion` sayfalar arası gezinmede aktif
menü grubunu doğru açıp kapatmıyordu. İkisi de yalnızca gerçek bir sayfa-form ve iki farklı menü
grubu arasında gezinme olunca ortaya çıktı — önceki fazlarda hiç tetiklenmemişti.

**Canlı doğrulama (headless Chrome + CDP, `rootuser`):** giriş → `/users`, `/roles` listeleri
(gerçek satır, doğru sayfa başlığı — `pageInfo.localizedName`), `/users/user` ve `/roles/add`
oluşturma formları, `/users/user/1` ve `/roles/edit/1` düzenleme formları (API verisiyle dolu:
ad/soyad, `userType` "Yönetici", `roleIdList` chip "SuperAdmin", rol adı "SuperAdmin", 115 izinden
1'i işaretli — SuperAdmin'in tek `App.SuperAdmin` ilişkisi, seed'e göre beklenen), satıra tıklayınca
düzenleme sayfasına yönlenme. Konsol hatası veya CORS sorunu yok.
