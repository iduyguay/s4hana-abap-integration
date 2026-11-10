# SAP S/4HANA & ABAP Integration — Mülakat & Başvuru Notları

Teknik mülakatlarda sorulabilecek konular ve mimari detaylar:

---

## 1. Proje Özeti (2 Dakikalık Açıklama)

"Bu projede SAP S/4HANA üzerinde modern ABAP geliştirme pratiklerini kullanarak uçtan uca bir entegrasyon mimarisi kurguladım.

Veri modelleme katmanında Core Data Services (CDS) view'ları tanımlayarak SAP veritabanı (VBAK, VBAP, KNA1 tabloları) üzerinde mantığı veritabanı katmanına ittik (code pushdown).

Üzerine ABAP RESTful Application Programming Model (RAP) ile transactional davranışları (Validations, Determinations ve setOrderCompleted gibi custom Action'lar) ekledim. Bu modeli OData V4 Service Definition ve Binding ile dış dünyaya açtım. Klasik mimarilere hakimiyet açısından klasik SAP NetWeaver Gateway (SEGW / DPC_EXT) implementasyonunu da yapıya dahil ettim.

Bulut tarafında SAP BTP üzerinde Cloud Foundry standartlarına uygun Multi-Target Application (mta.yaml), XSUAA rol tanımları ve Destination Service konfigürasyonlarını hazırladım.

Web backend katmanında TypeScript/Node.js ile SAP Gateway'in CSRF Token handshake (X-CSRF-Token: Fetch) ve session yönetimini gerçekleştiren bir entegrasyon köprüsü geliştirdim.

Kalite tarafında ise Eclipse ADT üzerinde ABAP Unit (AUnit) testlerini ve web backend tarafında otomatik Jest birim testlerini koşturdum."

---

## 2. Teknik Mülakat Soruları ve Cevapları

### S1: Neden klasik SEGW yerine modern RAP (RESTful Application Programming Model) tercih edilmeli?
- RAP, SAP S/4HANA Cloud ve On-Premise için güncel standart programlama modelidir.
- Eski SEGW'de iş mantığı ABAP sınıflarında (DPC_EXT) toplanırken, RAP'te veri modeli (CDS) ile davranış (Behavior Definition - BDEF) birbirinden ayrılır.
- Draft handling (taslak kaydetme), transactional tutarlılık (determinations, validations) ve Fiori Elements uyumluluğu yerel olarak gelir.

### S2: CDS View'larda "Code Pushdown" ne anlama gelir?
- Klasik ABAP'ta veriler uygulama sunucusuna (Application Server) çekilip döngülerde (LOOP AT) işlenirdi.
- Code Pushdown ile filtreleme, JOIN, toplam hesaplamaları ve semantik kontroller doğrudan SAP HANA In-Memory Database katmanında yapılır. Uygulama sunucusuna sadece ihtiyaç duyulan sonuç aktarılır.

### S3: OData servislerinde CSRF token mekanizması nasıl çalışır?
- SAP NetWeaver Gateway'de veri değiştiren işlemler (POST, PUT, DELETE) CSRF korumasına tabidir.
- İstemci önce bir GET isteğinde `X-CSRF-Token: Fetch` başlığı gönderir.
- SAP Gateway yanıt başlığında üretilen token'ı (`X-CSRF-Token`) ve oturum çerezlerini (`set-cookie`) döner.
- Ardından gelen POST/PUT isteğinde bu token ve çerezler gönderilerek işlem tamamlanır; aksi halde Gateway 403 Forbidden döner.

### S4: OData V2 ile OData V4 arasındaki temel farklar nelerdir?
- OData V4 daha hafiftir; metadata boyutu optimize edilmiştir.
- V4'te payload optimizasyonları ve çoklu nested `$expand` desteği daha gelişmiştir.
- V4'te custom action ve function binding'leri standartlaştırılmıştır. RAP doğrudan OData V4 servis binding'i ile tam uyumludur.

### S5: Behavior Definition'da "Validation" ile "Determination" farkı nedir?
- **Determination**: Bir alan değiştiğinde veya kaydedilirken başka alanları hesaplamak/türetmek için kullanılır (örneğin sipariş kalemleri eklendiğinde üst başlıktaki GrossAmount toplam tutarını hesaplamak).
- **Validation**: Verinin doğruluğunu kontrol eder (örneğin CustomerID girilmiş mi veya Müşteri tablosunda mevcut mu). Şart sağlanmazsa işlemi durdurur ve FAILED / REPORTED tablolarına hata mesajı döndürür.

### S6: SAP BTP üzerinde "Destination Service" ve "Cloud Connector" ne işe yarar?
- Bulutta (SAP BTP) çalışan bir uygulamanın, kurum içi ağdaki (On-Premise) S/4HANA sistemine güvenli erişmesini sağlar.
- Cloud Connector dışarıya firewall portu açmadan BTP ile ters tünel (reverse tunnel) kurar.
- Destination Service ise URL, kullanıcı kimlik bilgileri, proxy tipi ve sertifikaları merkezi olarak yönetir.

### S7: Eclipse ADT (ABAP Development Tools) neden SE80'in yerini aldı?
- SE80 ortamı modern CDS, RAP, AMDP gibi yeni nesil yapıları desteklemez.
- Eclipse ADT kod tamamlama, refactoring, abapGit entegrasyonu, ABAP Unit koşumu ve ATC (ABAP Test Cockpit) analizlerini modern IDE deneyimiyle sunar.

### S8: ABAP Unit (AUnit) testlerinde "Test Double Framework" nedir?
- Test edilen mantığın veritabanındaki canlı verilere veya dış servislere bağımlı olmadan izole bir şekilde test edilmesini sağlar.
- `cl_abap_unit_assert` metodları ile beklenen (`exp`) ve gerçekleşen (`act`) değerler doğrulanır.

### S9: OData `$batch` isteği nedir ve ne zaman kullanılır?
- Birden çok HTTP isteğini tek bir HTTP çağrısında birleştirerek ağ gecikmesini azaltır.
- Başlık ve kalemleri tek bir transactional changeset içinde kaydeder; hata durumunda tamamı geri alınır (All-or-Nothing prensibi).

### S10: XSUAA (SAP BTP) mimarisinde Role Templates ve Scopes nedir?
- OAuth2 tabanlı yetkilendirme sağlar. `xs-security.json` dosyasında tanımlanan scopelar kullanıcı gruplarına atanır. Web backend katmanında gelen JWT token doğrulanarak yetkilendirme denetlenir.

---

## 3. Ön Yazı (Cover Letter) Taslağı

"Sayın Yetkili,

SAP S/4HANA & ABAP ekosistemindeki güncel pozisyonunuzla ilgileniyorum.

Geliştirdiğim projelerde, SAP S/4HANA ortamında Core Data Services (CDS Views) ve ABAP RESTful Application Programming Model (RAP) ile kurumsal transactional iş mantıklarını kurguladım; OData V4/V2 servisleri üzerinden modern web ve bulut sistemleriyle entegrasyonlar sağladım.

Ayrıca SAP BTP Cloud Foundry (MTA, Destination ve XSUAA servisleri), Eclipse ADT üzerinde ABAP Test Cockpit ve ABAP Unit metodolojileriyle yazılım geliştirme süreçlerine hakimim.

İlgili referans ve kaynak kodları içeren portföy projemi ve detaylı teknik çalışmaları incelemelerinize sunmaktan memnuniyet duyarım."
