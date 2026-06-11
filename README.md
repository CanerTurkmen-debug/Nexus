# Nexus - Yapay Zeka Destekli Hukuk Asistanı ve Karar Destek Sistemi

Nexus; hukuki süreçlerin dijitalleşmesi, dava stratejilerinin optimize edilmesi ve karmaşık mevzuat analizlerinin hızlandırılması amacıyla geliştirilmiş kurumsal bir karar destek sistemidir. Sektördeki Apilex gibi rakiplerin yetenekleri analiz edilerek; el yazısı dökümanları okuma, yapılandırılmamış verileri anlamlandırma ve dinamik hukuki strateji üretme konularında daha ileri çözümler sunmak üzere tasarlanmıştır.

##  Öne Çıkan Yetenekler

* **Gelişmiş Görüntü İşleme & OCR (Vision):** Entegre edilen **Llama-3.2-11b-Vision** modeli sayesinde dava dosyaları, taratılmış eski dökümanlar ve el yazısı dilekçeler yüksek doğrulukla analiz edilir ve yapılandırılmış metin verisine dönüştürülür.
* **Hukuki Strateji ve Karar Destek:** Geçmiş dava sonuçları ve güncel mevzuat arşivleri üzerinde semantik analizler gerçekleştirerek avukatlara ve hukuk profesyonellerine dava yol haritası önerileri sunar.
* **Gelişmiş Veri Filtreleme ve Arama:** Mevzuat arşivi ve dava geçmişleri üzerinde büyük verileri işleyebilen yüksek performanslı arama altyapısı.

##  Mimari ve Teknik Altyapı

Proje, mikroservis yaklaşımına uygun, izole ve ölçeklenebilir bir mimariyle geliştirilmiştir:

### 1. Veri Tabanı ve Depolama Katmanı (Database & Storage)
* **PostgreSQL:** İlişkisel verilerin tutarlılığı, hukuki kayıtların güvenli bir şekilde indekslenmesi ve ilişkisel sorguların performanslı çalışması amacıyla ana veritabanı olarak konumlandırılmıştır.
* **Supabase:** Kullanıcı yönetimi, oturum kontrolü (Auth) ve gerçek zamanlı veri akışları için backend-as-a-service altyapısı olarak entegre edilmiştir.

### 2. Konteynerleştirme ve Dağıtım (DevOps)
* **Docker & Docker Compose:** Veritabanı servisleri, bağımlılıklar ve arka uç servislerinin yerel ve canlı ortamlarda standart bir şekilde çalıştırılması, altyapı kurulum süreçlerinin otomatikleştirilmesi amacıyla kullanılmıştır.

### 3. Yapay Zeka Katmanı (AI & LLM Integration)
* **Llama-3.2-11b-Vision:** Projenin çekirdek zekasını oluşturan bu model; görsel döküman analizi, metin özetleme ve hukuki soru-cevap süreçlerini yönetir. Görüntü işleme kütüphaneleriyle optimize edilerek sisteme dahil edilmiştir.

## 📁 Proje Yapısı

* `frontend/` - Kullanıcı arayüzü ve döküman yükleme paneli.
* `backend/` - API servisleri ve LLM entegrasyon katmanı.
* `mevzuat_arsivi/` - Sistemin beslendiği ve analiz ettiği hukuki veri havuzu.
* `docker-compose.yml` - PostgreSQL, Supabase servisleri ve ortam bağımlılıklarını yöneten yapılandırma dosyası.
