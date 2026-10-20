# Dağıtım Mimarisi — Paylaşılan Sunucu Modeli

> Bu doküman, sunucudaki **tüm projelerin** (finegrouphub-app, finegrouphub-api ve
> diğerleri) ortak kullandığı altyapı modelini tarif eder. Bu repo yalnızca kendi
> uygulama container'ını ve kendi Nginx route parçasını sağlar — Nginx'in ve
> PostgreSQL'in kendisi bu repodan yönetilmez.

## 1. Topoloji

```
Sunucu
 ├── Nginx (TEK, paylaşılan — tüm projeler için ortak reverse proxy)
 │     conf.d/
 │       ├── finegrouphub-app/panel.conf   ← bu repodan gelir
 │       ├── finegrouphub-api/api.conf     ← finegrouphub-api reposundan gelir
 │       └── <diğer-proje>/...
 │
 ├── PostgreSQL (TEK, paylaşılan — tüm projelerin veritabanları aynı instance'ta)
 │     └── veritabanları: finegrouphub, <diğer-proje-db>, ...
 │
 └── container-network (TEK Docker bridge — tüm container'lar bu ağda)
       ├── finegrouphub_app     192.168.20.83
       ├── finegrouphub_api     (finegrouphub-api reposu tanımlar)
       ├── postgres             (paylaşılan altyapı reposu tanımlar)
       └── nginx                (paylaşılan altyapı reposu tanımlar)
```

**Kural:** Hiçbir proje kendi Nginx'ini veya kendi PostgreSQL'ini ayağa kaldırmaz.
Her proje yalnızca `container-network`'e bağlanır ve paylaşılan servisleri
**container adıyla** (Docker'ın gömülü DNS'i üzerinden) çağırır.

## 2. Bu reponun sorumluluğu

| Ne | Nerede | Ne YAPMAZ |
|---|---|---|
| Uygulama imajı | `Dockerfile` | Nginx/Postgres imajı içermez |
| Uygulama container'ı | `docker-compose-{test,prod}.yml` | `nginx:`/`postgres:` servisi TANIMLAMAZ |
| Nginx route parçası | `deploy/nginx/panel.conf` | Nginx container'ı başlatmaz — paylaşılan Nginx'in `conf.d/`'sine kopyalanacak TEK bir dosyadır |
| CI/CD | `pipeline-finegrouphub-app-{test,prod}.yml` | `main` → prod, `develop` → test tetikler |

## 3. finegrouphub-app'in PostgreSQL ile ilişkisi

**Yok.** Bu proje bir Next.js panelidir; hiçbir veriye doğrudan SQL ile erişmez,
her şeyi `NEXT_PUBLIC_API_URL` üzerinden finegrouphub-api'ye (Laravel) HTTP ile
sorar. Paylaşılan PostgreSQL'e bağlanan taraf **finegrouphub-api**'dir.

> finegrouphub-api reposu kurulurken: `DB_HOST` ortam değişkeni paylaşılan
> postgres container'ının **container adı** olmalı (ör. `DB_HOST=postgres`),
> IP değil — container'lar yeniden başladığında IP değişebilir ama Docker DNS
> adı sabit kalır. Bağlantı yalnızca `container-network` üzerinden, dışarıya
> port açmadan yapılmalı (bkz. Bölüm 5).

## 4. IP tahsis tablosu

Statik IP çakışmasını önlemek için sunucudaki tüm projeler bu tabloyu paylaşmalı
(bkz. REBUILD_PROMPT §8.4 "Statik IP çakışması" tuzağı — bu proje için zaten
karşılanmış durumda, yeni bir proje eklenince buraya satır eklenmeli):

| Servis | IP | Repo |
|---|---|---|
| finehub_app (eski/.NET sürüm) | 192.168.20.82 | finehub-app |
| finegrouphub_app (prod) | 192.168.20.83 | finegrouphub-app |
| finegrouphub_app (test) | 192.168.20.93 | finegrouphub-app |
| finegrouphub_api | *(finegrouphub-api reposunda tahsis edilecek)* | finegrouphub-api |
| postgres (paylaşılan) | *(paylaşılan altyapı reposunda tahsis edilecek)* | — |
| nginx (paylaşılan) | *(paylaşılan altyapı reposunda tahsis edilecek)* | — |

## 5. Güvenlik modeli — `ports:` yok

`docker-compose-{test,prod}.yml`'de uygulama container'ının **host'a port
mapping'i yoktur** (`ports:` bloğu bilinçli olarak eklenmedi). Container yalnızca
`container-network` üzerinden erişilebilir; dışarıya açılan tek kapı paylaşılan
Nginx'tir. Aynı kural PostgreSQL için de geçerli olmalı — host'ta `5432` portu
açılmamalı, yalnızca `container-network` üzerinden erişilmeli.

## 6. Kurulum sırası (yeni sunucu)

1. `docker network create --driver bridge --subnet=192.168.20.0/24 --gateway=192.168.20.1 container-network`
2. Paylaşılan Nginx ve PostgreSQL container'larını `container-network`'e bağlı olarak ayağa kaldır (ayrı bir altyapı reposu/compose dosyası — bu repoda değil).
3. Her proje reposunun kendi `docker-compose-prod.yml`'ini bu ağa bağlı olarak deploy et (bu repo dahil).
4. Her projenin `deploy/nginx/*.conf` dosyasını paylaşılan Nginx'in `conf.d/`'sine kopyala, reload et.
