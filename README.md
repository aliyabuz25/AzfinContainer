# AZFIN - Revize Edilmiş Uygulama Dosyaları

Bu repo, AZFIN projesinin Port 901 ve yerel backend (uploads) desteği ile revize edilmiş halidir.

## Proje Yapısı

- **`/frontend`**: React + Vite + Nginx tabanlı web arayüzü (Port 901).
- **`/backend`**: Node.js + Express tabanlı, dosya yükleme (`uploads`) işlemlerini yöneten servis (Port 3001).
- **`docker-compose.yml`**: Traefik ve Docker Edge network uyumlu kurulum dosyası.

## Kurulum Talimatları (Portainer)

1. Portainer üzerinde yeni bir **Stack** oluşturun.
2. Aşağıdaki servisleri ayağa kaldıracak olan `docker-compose.yml` dosyasını kullanın.
3. Sunucu üzerinde `/datastore/azfin/uploads` dizininin erişilebilir olduğundan emin olun (Resimlerin kalıcılığı için).

### Önemli Notlar
- Uygulama **901** portunda çalışacak şekilde yapılandırılmıştır.
- Tüm admin panel resim yüklemeleri Supabase yerine `/uploads` klasörüne (yerel backend) yapılır.
- Konteynırlar arası iletişim `azfin-backend` servis ismi üzerinden sağlanmaktadır.

## Kullanılan Teknolojiler
- React (Vite)
- Node.js (Express & Multer)
- Nginx
- Docker & Traefik
- Supabase (Veritabanı ve Auth için)
