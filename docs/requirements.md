# Tələblər Sənədi (Requirements)

## Məhsul İcmalı

**Məhsul Adı:** REA INVEST Hesabat və Əmlak İdarəetmə Sistemi  
**Məqsəd:** Excel asılılığını aradan qaldırmaq, şəffaflıq və nəzarəti artırmaq, bron→satış çevrilməsini yüksəltmək, uçotu standartlaşdırmaq  
**Hədəf Auditoriya:** REA INVEST və orta ölçülü daşınmaz əmlak agentlikləri (filiallı struktur)

## İş Tələbləri

### Problem Bəyanı
- Excel ilə dağınıq idarəetmə, məlumat itkiləri və versiya konflikti
- Bronların üst-üstə düşməsi, ikiqat satış riski, zəif görünürlük
- Xərclərin mülklə düzgün əlaqələndirilməməsi, xalis mənfəətin gec hesablanması
- Filial/agent performansına real-time baxışın olmaması
- Zəng və SMS qeydlərinin sistematik toplanmaması

### İstifadəçi Personaları

1. **Agent**: Müştəri və əmlak portfelini idarə edir, bron yaradır/çevirir, zəng/SMS qeyd edir
2. **Rəhbər/Manager**: Filial/komanda performansını izləyir, təsdiqlər və istisnaları idarə edir
3. **Mühasib**: İxrac (XLSX), xərclərin doğruluğu və nizamlı audit izi
4. **Çağrı mərkəzi operatoru**: Gələn zəngləri müştəri/əmlakla əlaqələndirib sisteme daxil edir

### İstifadəçi Hekayələri
- Agent: Eyni əmlak üçün yalnız bir aktiv bron yarada bilim
- Operator: Gələn zəngi 30s içində müştəri kartına əlavə edim
- Rəhbər: Filial üzrə net mənfəəti və bron→satış çevrilməsini günlük izləyim
- Mühasib: Ay sonu XLSX-i 1 dəqiqədən tez alım və sütunlar standart olsun

## Funksional Tələblər

### FR-1: Əmlak İdarəetməsi (CRUD)
- **Sahələr**: sahə, otaq sayı, mərtəbə, ümumi mərtəbə, alış qiyməti, satış qiyməti, vasitəçilik satış qiyməti, sənəd növü, rayon/küçə, layihə adı, şəkil/video, xüsusiyyətlər, təmirli/təmirsiz flag
- **Listing növləri**: agency_owned, branch_owned, brokerage
- **Status axını**: Gözləmədə → Aktiv → Satılıb (arxiv)
- **Kateqoriya**: Satış və İcarə

### FR-2: Xərc İdarəetməsi
- **Kateqoriyalar**: təmir, sənədləşmə, vergi, agent komissiyası, admin, digər
- **Valyuta**: əsasən AZN, bəzən USD
- **Xərclər maya dəyərinə daxil olur**
- **Əmlak yaradılarkən ilkin xərclər daxil edilməlidir**

### FR-3: Təsdiq İş Axını (Approval Workflow)
- **Addımlar**: Agent → Rəhbər → Sədr müavini (büdcə) → Direktor (təsdiq) → Rəhbər (yayımla)
- **İstisna qaydaları**:
  - branch_owned: büdcə addımı SKIP
  - brokerage: büdcə addımı SKIP
- **Audit log saxlanması məcburidir**

### FR-4: Komissiya İdarəetməsi
- **Filial satışı**: deal mənfəətinin 2.5%-i REA INVEST, 2.5%-i Filial
- **Vasitəçilik gəliri**: ayrıca gəlir olaraq qeydiyyat
- **Parametrik konfiqurasiya**: admin panelindən faizlərin təyin edilməsi

### FR-5: Bron (Booking) Sistemi
- **Unikal məhdudiyyət**: Əmlak üçün yalnız 1 aktiv bron
- **Statuslar**: ACTIVE, EXPIRED, CONVERTED, CANCELLED
- **İdempotent çevirmə**: "Satışa çevir" əməliyyatı
- **DB constraint**: Partial unique index (property_id) where status='ACTIVE'

### FR-6: Müştəri İdarəetməsi
- **Sahələr**: ad, soyad, ata adı (opsional), telefon, email, tip (alıcı/satıcı/kirayəçi), KYC
- **Validasiya**: ən azı telefon və ya email məcburidir
- **Dublikat yoxlaması**: telefon + ad + soyad kombinasiyası

### FR-7: Kommunikasiya İdarəetməsi
- **V1**: Yalnız manual zəng qeydiyyatı
- **Sahələr**: caller_id, tarix/saat, müddət, əlaqə kanalı, qeyd
- **M2**: SMS/WhatsApp inteqrasiyası (webhook, DLR tracking)
- **Linkage**: müştəri/əmlak/deal ilə əlaqələndirmə

### FR-8: Hesabat və İxrac
- **KPI dashboard**: net mənfəət, bron→satış çevrilməsi, yaşlanma paylanması
- **XLSX ixrac**: mühasibat üçün standart sütunlar (≤60s)
- **Filtrlər**: tarix aralığı, filial, agent, deal statusu
- **Rollara görə widgetlər**: Director, Manager, Agent səviyyələrində

### FR-9: Tələbat (Buyer Request) İdarəetməsi
- **Matching sistemi**: büdcə, məkan, otaq/sahə, tip, xüsusiyyətlər
- **Skorlama**: 0-100 (büdcə 40%, otaq 20%, sahə 20%, feature 20%)
- **Status axını**: NEW → IN_REVIEW → MATCHED → ASSIGNED → CLOSED
- **FX dəstəyi**: valyuta çevrilməsi günlük snapshot ilə

### FR-10: Audit Log
- **100% coverage**: bütün mutasiyalar
- **Payload**: actor, entity, action, before/after, IP, timestamp
- **Retensiya**: ≥5 il
- **Hadisələr**: CREATE, UPDATE, DELETE, APPROVE, CONVERT, CANCEL

## Qeyri-funksional Tələblər

### Performans
- **API latency**: P95 < 300ms (daxili şəbəkə), P99 < 600ms
- **Dashboard yüklənmə**: P95 ≤ 3s
- **XLSX ixrac**: ≤ 60s (async job ilə)
- **Server-side pagination**: əsas siyahılar üçün

### Təhlükəsizlik
- **RBAC**: İncə-dane rol və icazə sistemi
- **İki faktorlu autentifikasiya**: opsional 2FA (TOTP)
- **IP whitelist**: admin əməliyyatları üçün
- **Audit log**: tam compliance üçün
- **On-prem**: VPN və ya ofis şəbəkəsi üzərindən giriş

### Etibarlılıq
- **Backup**: gündəlik tam, saatlıq differensial
- **RPO**: ≤ 24s, RTO ≤ 4s
- **Monitoring**: CPU/RAM/DB, alarm sistemi
- **Uptime**: iş saatları ≥99.9%, qeyri-iş saatları ≥99.5%

### Uyğunluq
- **PDPL**: şəxsi məlumatların qorunması
- **Məlumat saxlanması**: ən az 5 il
- **Audit trail**: compliance üçün tam izləmə

### Lokallaşdırma
- **Dil**: Azərbaycan dili
- **Valyuta**: əsasən AZN, bəzən USD
- **Telefon format**: E.164 və ya +994 prefiks

### Fayl Saxlanması
- **On-prem**: NAS və ya lokal şifrələnmiş storage
- **Limitlər**: şəkil ≤5MB, sənəd ≤10MB
- **Maksimum say**: property üçün ≤30 şəkil
- **MIME whitelist**: təhlükəsizlik üçün

## Texniki Tələblər

### Platform
- **Frontend**: Next.js 15 (SSR/ISR), TypeScript, Tailwind CSS
- **Backend**: Node.js + Express, REST API
- **Database**: PostgreSQL (on-prem), migration dəstəyi
- **Cache**: Next.js ISR, opsional Redis

### Brauzər Dəstəyi
- Chrome/Edge/Firefox: son 2 versiya
- Safari: son versiya

### İnteqrasiyalar
- **V1**: SMTP (bildirişlər üçün)
- **M2**: SMS/WhatsApp provider (webhook ilə)
- **Future**: VoIP, marketplace avtomatik listinq

## SMART Hədəflər

### Məqsədlər (V1 üçün)
- [ ] Bronların ikiqat yaradılmasının qarşısı: 0 hadisə (30 gün)
- [ ] KPI dashboard P95 yüklənmə ≤ 3s, ISR yenilənmə ≤ 5 dəq
- [ ] XLSX mühasibat ixracı ≤ 60s P95
- [ ] Bütün mutasiyalar üçün 100% audit qeydi və diff
- [ ] Agentlik rəhbərliyinin aylıq hesabat hazırlama vaxtı -80% (3 ay)

### Qeyri-məqsədlər (V1-də olmayacaq)
- Avtomatik VoIP inteqrasiyası
- Marketplace avtomatik listinq (Tap.az, bina.az)
- Agent komissiya hesablamalarının detallaşdırılması

## Qəbul Meyarları

### Booking Sistemi
- AC-B1: Property üçün ACTIVE bron varkən ikinci bron yaratma cəhdi → 409 error
- AC-B2: ACTIVE bronun "Satışa çevir" əməliyyatı transaction yaradır və idempotentdir
- AC-B3: Vaxtı keçmiş bronlar avtomatik EXPIRED statusuna keçir
- AC-B4: Bütün booking mutasiyaları audit log-a yazılır

### Approval Sistemi
- AC-APP-1: agency_owned üçün büdcə addımı məcburidir
- AC-APP-2: branch_owned və brokerage üçün büdcə addımı SKIP edilir
- AC-APP-3: Approval addımları audit log-a yazılır

### Təhlükəsizlik
- SEC-AC-1: Admin route-ları yalnız IP whitelist-dən əlçatandır
- SEC-AC-2: Bütün mutasiyalar audit log-a yazılır
- SEC-AC-3: Webhook imza doğrulaması uğursuz olarsa 401/403 error
- SEC-AC-4: Rate limiting aktiv, login cəhdləri limitlənir

## Riski və Məhdudiyyətlər

### Yüksək Risk
- Double-convert problemi (idempotency ilə həll edilir)
- Webhook spoofing (HMAC imzası ilə qorunur)
- Backup RPO/RTO pozulması (rəblük test edilir)

### Məhdudiyyətlar
- V1-də yalnız manual call log
- SMS/WhatsApp M2-yə təxirə salınır
- On-prem deployment tələbi

### Asılılıqlar
- ORM seçimi (Prisma/Knex)
- SMS provider seçimi (M2 üçün)
- İnfrastruktur hazırlığı (PostgreSQL, networking)