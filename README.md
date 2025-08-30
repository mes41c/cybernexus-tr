<p align="center">
  <img src="./frontend/public/cybernexus.png" alt="CyberNexus TR Logo" width="150"/>
</p>

CyberNexus TR 🇹🇷
Küresel Siber İstihbarat ve Dil Geliştirme Portalınız
Canlı Demo: https://cybernexus.mes41.site/

💡 Proje Hakkında
CyberNexus TR, siber güvenlik alanında kendini geliştirmeyi hedefleyen öğrenciler ve profesyoneller için tasarlanmış kişisel bir full-stack projedir. Bu platform, güncel siber güvenlik haberlerini takip etme, temel ve ileri düzey kavramları öğrenme ve teknik İngilizce pratiği yapma ihtiyacından doğmuştur.

Bu proje, herhangi bir resmi kodlama eğitimi almadan önce, kişisel bir merak ve öğrenme azmiyle, Google'ın Gemini Pro modellerinin yardımıyla yalnızca 4 gün gibi kısa bir sürede sıfırdan geliştirilmiştir. Amacı, modern web teknolojilerini kullanarak siber güvenlik alanındaki bilgiye erişimi kolaylaştırmak ve dil bariyerini bir avantaja dönüştürmektir.

✨ Temel Özellikler
Çok Kaynaklı Haber Akışı: Sektör lideri 20'ye yakın uluslararası ve yerel kaynaktan gelen RSS akışlarını anlık olarak çeken ve sunan, sunucu taraflı önbellekleme (caching) ile optimize edilmiş bir haber motoru.

Kavram Odaklı Keşfetme: Siber güvenliğin 9 ana kategorisi altında toplanmış 160'tan fazla temel ve ileri düzey kavramı keşfetme ve ilgili haberlere anında ulaşma imkanı.

AI Destekli Tanımlar: Herhangi bir siber güvenlik kavramı için, NIST ve SANS gibi otorite kaynakları referans alarak, yapay zeka tarafından anlık, akademik ve Türkçe tanımlar üretme özelliği.

Akıllı Bağlantılar (Cross-linking): AI tarafından üretilen tanımların içinde geçen diğer siber güvenlik terimlerini otomatik olarak algılayıp, o terimlerin kendi sayfalarına yönlendiren tıklanabilir linklere dönüştüren akıllı bir içerik ağı.

Gelişmiş Arama Motoru:

Vurgulama (Highlighting): Arama sonuçlarında, aranan kelimeyi başlık ve açıklamalarda görsel olarak vurgulama.

Akıllı Öneri Sistemi: Doğrudan sonuç bulunamadığında, "ilişkili anahtar kelimeler" üzerinden kullanıcıya "Bunu mu demek istediniz?" şeklinde alternatif kavramlar sunma.

Kaynak Odaklı Tarama: Kullanıcıların belirli bir haber kaynağını (örneğin Cisco Talos Blog) seçerek sadece o kaynaktan gelen haberleri görmesine ve içinde arama yapmasına olanak tanır.

🛠️ Kullanılan Teknolojiler (Tech Stack)
Frontend (Cloudflare Pages üzerinde)
React (Vite): Hızlı ve modern bir kullanıcı arayüzü için.

CSS3: Projenin ruhuna uygun, özel tasarlanmış karanlık tema.

axios: Güçlü ve esnek API istekleri için.

react-markdown: AI tarafından üretilen zengin metin içeriklerini render etmek için.

Backend (Render.com üzerinde)
Node.js & Express.js: Hızlı, esnek ve ölçeklenebilir bir REST API sunucusu için.

SQLite3: Projenin tüm kavram verilerini tutan, sunucuya entegre, dosya tabanlı veritabanı.

CORS: Frontend ve backend arasında güvenli iletişimi sağlamak için.

rss-parser & cheerio: Farklı formatlardaki RSS akışlarını güvenilir bir şekilde işlemek ve temizlemek için.

dotenv: Geliştirme ortamındaki gizli verileri yönetmek için.

🏛️ Mimari (Architecture)
Proje, modern ve ölçeklenebilir bir "headless" (ayrık) mimari kullanır:

Frontend: React ile oluşturulan kullanıcı arayüzü, statik varlık olarak derlenir ve Cloudflare Pages'in küresel ağı üzerinden ışık hızında sunulur.

Backend: Node.js/Express ile oluşturulan REST API sunucusu, Render.com'un "Web Service" altyapısında barındırılır. Tüm dinamik işlemler (veri çekme, haber akışı, AI istekleri) bu sunucu tarafından yönetilir.

Bu yapı, frontend ve backend'in birbirinden bağımsız olarak geliştirilmesine, ölçeklenmesine ve bakımının yapılmasına olanak tanır.

🚀 Yerelde Çalıştırma (Getting Started)
Projeyi kendi bilgisayarınızda çalıştırmak için:

1. Projeyi Klonlayın:

Bash

git clone https://github.com/mes41c/cybernexus-tr.git
cd cybernexus-tr
2. Backend'i Başlatma:

Bash

cd backend
npm install
node server.js
# Sunucu http://localhost:5000 adresinde başlayacaktır
3. Frontend'i Başlatma:

Bash

cd ../frontend
npm install
npm run dev
# Uygulama http://localhost:5173 adresinde açılacaktır
(Not: AI özelliklerini test etmek için frontend/src/services/api.js dosyasında API_URL sabitini http://localhost:5000/api olarak ayarlamanız ve Ayarlar menüsünden kendi API anahtarınızı girmeniz gerekmektedir.)

📜 Lisans
Bu proje, MIT Lisansı ile lisanslanmıştır. Daha fazla bilgi için LICENSE dosyasına bakınız.

✨ Teşekkür
Bu projenin 4 gün gibi rekor bir sürede hayata geçirilmesinde, konsept geliştirme, kodlama, karmaşık hataları ayıklama ve en iyi pratiklerin öğrenilmesi aşamalarında Google Gemini Pro'nun sağladığı anlık ve isabetli destek kritik bir rol oynamıştır.
