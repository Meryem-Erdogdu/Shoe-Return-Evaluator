# 👟 Shoe-Return-Evaluator
Ayakkabı iade süreçlerini hızlandırmak, hata payını en aza indirmek ve işletme verimliliğini artırmak için geliştirilmiş uçtan uca kurgulanmış bir sistemdir.
Satış danışmanları yalnızca ayakkabı fotoğrafını yükler; sistem ise saniyeler içinde ürünün durumunu değerlendirir ve uygun kategoriye atar.

Sınıflandırma Kategorileri:
- İade Edilebilir
- İade Kabul Edilemez
- Üreticiye Gönderilecek ( Üretim Hatası vs. )
- Bağış Yapılacak
- İmha Edilecek

## 🌟 Özellikler

### AI Analiz Sistemi
- **Google Gemini 2.5 Pro** ile güçlendirilmiş görüntü analizi
- **75+ hasar türü** algılama kapasitesi
- **Türkçe dil desteği** ve yerel terminoloji
- **Güven skoru** ve detaylı gerekçe sunumu
- **Gerçek zamanlı** analiz sonuçları

### Modern Kullanıcı Arayüzü
- **Responsive tasarım** - tüm cihazlarda optimum görünüm
- **Drag & Drop** dosya yükleme sistemi
- **Shadcn/ui** bileşenleri ile modern tasarım
- **Tailwind CSS** ile hızlı ve tutarlı styling
- **Real-time** güncellemeler

### Yönetim Paneli
- **Günlük istatistikler** ve analiz trendleri
- **Son analizler** listesi ve filtreleme
- **Manuel düzenleme** ve onay sistemi
- **Detaylı raporlama** araçları

### Güvenlik Özellikleri
- **Rate limiting** - API endpoint koruması
- **Helmet.js** ile HTTP güvenlik başlıkları
- **CORS** yapılandırması
- **Input validation** ve sanitizasyon
- **File type** ve boyut kontrolü
- **SQL injection** koruması

## 💻 Teknolojiler

### Frontend
- React 18 + TypeScript
- Vite (Build Tool)
- Tailwind CSS
- Shadcn/ui Components
- TanStack Query (State Management)
- Wouter (Routing)

### Backend  
- Node.js + Express.js
- TypeScript + ESM
- Google Gemini AI API
- Multer (File Upload)
- Helmet + CORS (Security)
- Express Rate Limit

### Database
- PostgreSQL (Neon Serverless)
- Drizzle ORM
- Type-safe Queries
- Auto-migrations

## 📱 Kullanım Kılavuzu

1. Ana sayfada "Fotoğraf Yükle" alanına ayakkabı fotoğrafınızı sürükleyin veya kamera ile çekin.
2. İsteğe bağlı olarak müşteri notu ekleyin.
3. "Analiz Et" butonuna tıklayın.
4. Sonuçlar 3-5 saniye içinde ekrana gelir; ürünün garanti süresi durumu ve markası hakkında detaylı bilgi sunar.
5. Gerekirse manuel düzenleme yapın ve "Onayla" butonuna basın.
6. Detaylı rapor ile 75+ hasar türünden hangilerinin tespit edildiğini görebilirsiniz.
7. Yan panelden günlük istatistikleri, son analizleri ve trend raporlarını takip edin.

## 🔮 Gelecek Geliştirmeler

- Mobil uygulama entegrasyonu
- Otomatik fatura/iade belgeleri oluşturma
- Çoklu dil desteği (İngilizce, Almanca vb.)
- ERP / CRM entegrasyonu
- Self-learning model (yeni hasar tiplerini sistemin otomatik öğrenmesi)
- Sesli komut desteği ile hızlı kullanım
- API Marketplace entegrasyonu (diğer lojistik ve e-ticaret sistemleriyle kolay bağlantı)
...

## 🧩 Uygulama Görüntüsü

<img width="1920" height="2175" alt="screencapture-27a8bdeb-0a61-4d96-9b44-2b69f84dce8f-00-kclg86cvtmgt-kirk-replit-dev-2025-08-24-11_58_18" src="https://github.com/user-attachments/assets/8d1845c8-101b-42a9-8af2-363223ea8769" />

- This project was developed by Meryem Erdoğdu.
