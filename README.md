# AZFIN - Revize Edilmiş Uygulama Dosyaları

Bu repo, AZFIN projesinin Port 901 ve yerel backend (uploads) desteği ile revize edilmiş halidir.

## Proje Yapısı

- **`/frontend`**: React + Vite + Nginx tabanlı web arayüzü (Port 901).
- **`/backend`**: Node.js + Express tabanlı, dosya yükleme (`uploads`) işlemlerini yöneten servis (Port 3001).
- **`docker-compose.yml`**: Traefik ve Docker Edge network uyumlu kurulum dosyası.

## Kurulum Talimatları (Portainer)

1. Portainer üzerinde yeni bir **Stack** oluşturun.
2. Aşağıdaki servisleri ayağa kaldıracak olan `docker-compose.yml` dosyasını kullanın.
3. Kalıcı veri için `AZFIN_DATA_ROOT` tanımlayın. Tanımlamazsanız varsayılan olarak proje içindeki `./datastore` klasörü kullanılır.
4. Bu klasör altında en az `mysql/` ve `uploads/` dizinlerinin kalıcı olarak tutulduğundan emin olun.

### Önemli Notlar
- Uygulama **901** portunda çalışacak şekilde yapılandırılmıştır.
- Tüm admin panel resim yüklemeleri `/uploads` klasörüne yapılır ve `current-site-content.json`, `current-sitemap.json`, `current-smtp-settings.json` dosyaları da aynı kalıcı klasörde tutulur.
- Site ayarları, sitemap ve SMTP ayarları her kayıtta MySQL içinde geçmiş tablolara da yazılır: `site_settings_history`, `sitemap_history`, `smtp_settings_history`.
- Her kayıt işleminde aynı klasör altında `_snapshots/` içine zaman damgalı yedek alınır ve `_change-log.ndjson` içine değişiklik kaydı yazılır.
- Konteyner restart veya redeploy sonrası düzenlemelerin kaybolmaması için stack'i aynı `AZFIN_DATA_ROOT` ile çalıştırın.
- Konteynırlar arası iletişim `azfin-backend` servis ismi üzerinden sağlanmaktadır.

## Kullanılan Teknolojiler
- React (Vite)
- Node.js (Express, Multer, mysql2)
- Nginx
- Docker & Traefik
- MySQL 8
