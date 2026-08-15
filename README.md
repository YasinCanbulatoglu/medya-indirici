# Medya İndirici (Media Downloader)

## 📌 Projenin Durumu (Aşama Analizi)

Bu proje **Geliştirme Aşamasındadır**.
Next.js kullanılarak geliştirilmiş, Puppeteer ile web scraping yapabilen ve HLS yayınlarını (`hls.js`) oynatabilen gelişmiş bir medya yönetim/indirme aracıdır.

### 🚀 Tamamlanan Kısımlar:
- **Teknoloji Yığını:** Next.js 16 (App Router), React 19, Tailwind CSS 4.
- **Modüller:** 
  - `puppeteer`: Headless tarayıcı otomasyonu ile sayfalardan medya linki (video/görsel) yakalama.
  - `hls.js`: Canlı yayın formatlarındaki (m3u8) videoları tarayıcı üzerinde oynatabilme.
  - `qrcode.react`: İndirme bağlantılarını veya medya linklerini QR kod olarak sunma.
  - `framer-motion`: Arayüzdeki etkileşimli geçiş animasyonları.
- **Tasarım:** Modern UI prensipleriyle Tailwind 4 ve Lucide React kullanılarak hazırlanmış.

### 🛠️ Geliştirilmeye Açık / Eksik Kısımlar:
- Puppeteer'ın sunucu (server-side) tarafında stabil çalışması için gerekli ortam değişkenleri veya Dockerizasyon ayarları gerekebilir.
- Çeşitli video siteleri için scraping kurallarının (selectors) genişletilmesi.

## 📸 Ekran Görüntüleri

![Arayüz - Çalışırken](./screenshot_medya.png)

## ⚙️ Kurulum ve Çalıştırma

```bash
npm install
npm run dev
```
