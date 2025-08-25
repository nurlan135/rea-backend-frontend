# Mündəricat (ToC)
- 1. İcmal
- 2. Problem Bəyannaməsi
- 3. Məqsədlər və Qeyri-məqsədlər
- 4. İstifadəçi Personaları
- 5. İstifadəçi Hekayələri və Ssenarilər
- 6. Funksional Tələblər
- 7. Qeyri-funksional Tələblər
- 8. Çərçivə və Hədəflənən Platformalar
- 9. Məlumat Modeli və API-lər
 - 10. Təməl Arxitektura
 - 11. Metriklər və Uğur Meayarları
 - 12. Risklər və Azaltma Planı
 - 13. Təhlükəsizlik Təhdid Modeli (STRIDE)
 - 14. Hədləndirmə (Out of Scope)
 - 15. Frontend Rendering Strategiyası (CSR/SSR/SSG/ISR)
 - 16. Hesabat Arxitekturası və Data Modelləri
 - 17. Booking (Bron) — Detallı Spesifikasiya
 - 18. Kommunikasiya (Zəng/SMS/WhatsApp) — Detallı Spesifikasiya
 - 19. Audit Log Standartı
 - 20. İcra Planı və Mərhələlər (Roadmap)
 - 21. Əməliyyat Runbook-u (Ops)
 - 22. Test Strategiyası
 - 23. Alıcı Sifarişi (Tələbat) — Modul Spesifikasiyası
 - 24. Vasitəçilik Satışı İş Axını

# Məhsul Tələbləri Sənədi (PRD)

## 1. İcmal
- Məhsulun adı: REA INVEST Hesabat və Əmlak İdarəetmə Sistemi
- Qısa təsvir: Əmlakların, bronların, xərclərin və əməliyyatların uçotu; çağrı və mesajlaşma qeydləri; audit izləri; rəhbərlik üçün KPI və hesabat paneli. On‑premises qurulum.
- Hədəf bazar/seqment: REA INVEST və eyni tip orta ölçülü daşınmaz əmlak agentlikləri (filiallı struktur).
- Ümumi məqsəd və dəyər təklifi: Excel asılılığını aradan qaldırmaq, şəffaflıq və nəzarəti artırmaq, bron→satış çevrilməsini yüksəltmək, uçotu standartlaşdırmaq.

## 2. Problem Bəyannaməsi
- İstifadəçilərin yaşadığı əsas problem(lər):
  - Excel ilə dağınıq idarəetmə, məlumat itkiləri və versiya konflikti.
  - Bronların üst‑üstə düşməsi, ikiqat satış riski, zəif görünürlük.
  - Xərclərin mülklə düzgün əlaqələndirilməməsi, xalis mənfəətin gec/gərəksiz hesablanması.
  - Filial/agent performansına real‑time baxışın olmaması; zəng və SMS qeydlərinin sistematik toplanmaması.
- Niyə indi həll etmək vacibdir:
  - Agentlik böyüyür, filial sayı artır; şəffaflıq və audit tələbləri sərtləşir.
  - On‑prem təhlükəsizlik və PDPL uyğunluğu prioritetdir.
- Alternativlər və mövcud həllər:
  - Davam edən Excel/Google Sheets (riskli və ölçəklənməyən).
  - SaaS CRM-lər (on‑prem və lokal inteqrasiya tələblərini tam ödəmir).

## 3. Məqsədlər və Qeyri-məqsədlər
- Məqsədlər (SMART):
  - [ ] Bronların ikiqat yaradılmasının qarşısı: 0 hadisə (unique ACTIVE constraint) — Go‑Live+30 gün.
  - [ ] KPI dashboard p95 yüklənmə ≤ 3s, ISR yenilənmə ≤ 5 dəq — V1.
  - [ ] XLSX mühasibat ixracı ≤ 60s p95 — V1.
  - [ ] Bütün mutasiyalar üçün 100% audit qeydi və diff — V1.
  - [ ] Agentlik rəhbərliyinin aylıq hesabat hazırlama vaxtı −80% — 3 ay.
- Qeyri-məqsədlər (nələri etməyəcəyik):
  - V1: Avtomatik VoIP inteqrasiyası (yalnız manual call log).
  - V1: Marketplace-lərə (Tap.az, bina.az) auto‑listinq.
  - V1: Agent komissiya hesablamalarının detallaşdırılması (mühasib xaricində).

## 4. İstifadəçi Personaları
- Persona 1 — Agent: Müştəri və əmlak portfelini idarə edir, bron yaradır/çevirir, zəng/SMS qeyd edir. Hədəf: tez və səhvsiz əməliyyat.
- Persona 2 — Rəhbər/Manager: Filial/komanda performansını izləyir, təsdiqlər və istisnaları idarə edir. Hədəf: şəffaflıq və sürətli qərar.
- Persona 3 — Mühasib: İxrac (XLSX), xərclərin doğruluğu və nizamlı audit izi. Hədəf: düzgün maliyyə hesabatı.
- Persona 4 — Çağrı mərkəzi operatoru: Gələn zəngləri müştəri/əmlakla əlaqələndirib əl ilə sistemə daxil edir.

## 5. İstifadəçi Hekayələri və Ssenarilər
- İstifadəçi hekayələri:
  - Agent kimi, eyni əmlak üçün yalnız bir aktiv bron ola bilsin ki, ikiqat bron/satış olmasın.
  - Operator kimi, gələn zəngi 30s içində müştəri kartına əlavə edim ki, itki olmasın.
  - Rəhbər kimi, filial üzrə net mənfəəti və bron→satış çevrilməsini günlük izləyim.
  - Mühasib kimi, ay sonu XLSX-i 1 dəqiqədən tez alım və sütunlar standart olsun.
- Əsas ssenarilər:
  - Happy path: Property → Expense daxil edərək yarat → Booking (ACTIVE) → Convert to transaction → Report.
  - Edge case: Aktiv bron varkən ikinci bron yaratma cəhdi → 409; expire olmuş bronun çevrilməsi → rədd.
  - Webhook təhlükəsizliyi: SMS DLR imzasız gəlirsə → rədd və auditə yaz.

## 6. Funksional Tələblər
- FR-1: Mülk CRUD və sahələr: sahə, otaq sayı, mərtəbə, ümumi mərtəbə, alış qiyməti, satış qiyməti, vasitəçilik satış qiyməti, sənəd növü, rayon/küçə, layihə adı, şəkil/video, xüsusiyyətlər, təmirli/təmirsiz flag.
- FR-2: Xərclər modulunda xərc kateqoriyaları (təmir, sənədləşmə, vergi, agent komissiyası, admin), valyuta AZN; xərclər maya dəyərinə daxil olsun; sonradan redaktə olunsun. Əmlak əlavə edilərkən ilkin xərclərin daxil edilməsi formda mümkün olsun.
- FR-3: Status axını: Gözləmədə → Aktiv → Satılıb (arxiv); kateqoriya: Satış və İcarə.
- FR-4: Təsdiq axını: Agent → Rəhbər → Sədr müavini (bütcə ayırır) → Direktor (təsdiq) → Rəhbər (yayımla). Approval və audit log saxlanılsın.
- FR-5: Bildirişlər: müraciət göndəriləndə Direktor/Sədr müavininə e‑poçt və/və ya sistemdaxili xəbərdarlıq.
- FR-6: Filial satışında komissiya: deal mənfəətinin 2.5%-i REA INVEST, 2.5%-i Filial; parametrik.
- FR-7: Vasitəçilik gəliri: ayrıca gəlir olaraq qeyd olunsun və hesabatlarda göstərilsin.
- FR-8: Listing/Layihe növü: `listing_type` = agency_owned | branch_owned | brokerage. Qaydalar:
  - agency_owned/branch_owned: alış qiyməti və xərclər məcburidir; Approval axınında büdcə addımı aktivdir.
  - branch_owned: alış qiyməti və xərclər məcburidir; Sədr müavininə büdcə ayrılması addımı SKIP.
  - brokerage: alış qiyməti və xərclər tələb olunmur; yalnız mülk sahibi məlumatları (ad/soyad/ata adı) və komissiya faizi (əl ilə) tələb olunur; Sədr müavininə büdcə ayrılması addımı SKIP.
- FR-9: İcarə: REA/Filial icarələri üçün müqavilə başlanğıc/bitmə tarixləri saxlanılsın; icarə borcları və statuslar izlənilsin.
- FR-10: Hesabatlar: dövrlər üzrə müqayisə, qiymət artımı, mənfəət, ümumi xərclər, ən çox satış edən agent, layihə/bina/filial/agent kəsimləri. Rəhbər görünəcək hesabatları seçib redaktə edə bilir.
- FR-11: Export: XLSX/CSV export. (Mühasibat üçün əsas: XLSX)
- FR-12: Zənglərin əl ilə qeydiyyatı: çağrı mərkəzinə gələn zənglər agent tərəfindən sistemdə müştəri/mülk kartında loglanır (caller_id, tarix/saat, müddət, əlaqə kanalı, qeyd).
- FR-13: Admin paneli: vasitəçilik komissiyası faizinin təyini və dəyişdirilməsi.
- FR-14: SMS/WhatsApp inteqrasiyası: sistemdən SMS/WA göndərişi, cavab və çatdırılma statuslarının tarixçəsi; müştəri/mülk kartında jurnal.
- FR-15: Bron (Booking) axını: Müştəri və Əmlaka bağlı bron yaratmaq; yalnız 1 aktiv bron/əmlak; bitməmiş ACTIVE bronun “Satışa çevir” əməliyyatı ilə transaction-a çevrilməsi.

## 7. Qeyri-funksional Tələblər
- Performans: daxili hesabat filtrlərində P95 < 1s; əsas siyahılar (Əmlaklar, Deal-lar) server-side pagination ilə.
- Təhlükəsizlik: RBAC; audit log; ofis daxilindən və ya VPN üzərindən giriş; IP whitelist; parol siyasəti; 2FA opsional.
- Etibarlılıq: gündəlik tam, saatlıq differensial backup; RPO ≤ 24s, RTO ≤ 4s; monitorinq (CPU/RAM/DB), alarmlar (e‑poçt).
- Uyğunluq: şəxsi məlumatların qorunması (PDPL); məlumatların ən az 5 il saxlanması; audit izləri saxlanılır.
- Fayl saxlanması: on‑prem NAS və ya lokaldə şifrələnmiş storage (şəkil/video üçün ölçü kvotaları).
- Lokallaşdırma və valyuta: Dil — AZ; Valyuta — əsasən AZN, bəzən USD.

## 8. Çərçivə və Hədəflənən Platformalar
- Frontend: Next.js (SSR/ISR) — desktop-first, mobil uyğun UI.
- Backend: Node.js + Express (REST API), RBAC middlewares.
- Database: PostgreSQL (on‑prem), SQL migrate (Knex/Prisma) ilə sxem idarəsi.
- Bildirişlər: SMTP (on‑prem və ya provider), sistemdaxili notification inbox.
- Kommunikasiya: VoIP inteqrasiyası V1‑də yoxdur (zənglər əl ilə loglanır); SMS/WhatsApp provider ilə inteqrasiyası (internet tələb oluna bilər).
- Brauzer dəstəyi: son 2 versiya Chrome/Edge/Firefox; Safari son.
- Marketplaces (Tap.az, bina.az, korporativ sayt) — növbəti yenilənmələrdə avtomatik listinq inteqrasiyası (out-of-scope V1).
## 9. Məlumat Modeli və API-lər

### 9.1. API Endpoints (qısa spesifikasiya)
- POST /api/communications — manual call log yaradılması
- GET /api/communications?entity=property&id=... — jurnal siyahısı
- POST /api/sms/send; POST /webhooks/sms/dlr — SMS göndəriş və DLR
- POST /api/whatsapp/send (M2); POST /webhooks/whatsapp — WhatsApp inteqrasiyası
- GET /api/export/accounting.xlsx?from=YYYY-MM-DD&to=YYYY-MM-DD — XLSX stream
- POST /api/expenses — xərclərin yaradılması (property_id və ya deal_id ilə)
- POST /api/approvals/:dealId/submit | /approve | /reject — approval addımları
- GET /api/customers/[id]/bookings?status=ACTIVE — müştərinin aktiv bronları
- GET /api/properties/[id]/bookings?status=ACTIVE — əmlakın aktiv bronu
- POST /api/bookings/[id]/convert-to-transaction — bronu satışa çevirmək (idempotent)
- POST /api/bookings/[id]/cancel — bronun ləğvi

Qeyd: Bütün mutasiya endpointləri `AuditLog` yazmalıdır; `before/after` JSON saxlanılır. `convert-to-transaction` 409 qaytarırsa, eyni anda ikinci çevirmə cəhdi bloklanıb.

### 9.2. Müştəri və Sahib Profili
- __[Model xülasəsi]__
  - `Customer`: `id, first_name, last_name, father_name?, phone, email, type[seller|buyer|tenant], kyc(jsonb), created_at`.
  - `Property` (brokerage üçün sahib sahələri): `owner_first_name, owner_last_name, owner_father_name?, owner_contact, brokerage_commission_percent`.
- __[Validasiyalar]__
  - Ad komponentləri: `first_name` və `last_name` tələbdir; `father_name` opsional. Boşluq‑yalnız string və ya 2+ boşluq ardıcıllığı rədd edilir (`NAME_PARTS_REQUIRED`, `INVALID_NAME_PART`).
  - Əlaqə: ən azı `phone` və ya `email` sahələrindən biri tələbdir (`CONTACT_REQUIRED`); format yoxlanışı (`PHONE_INVALID`, `EMAIL_INVALID`).
  - `type` yalnız `seller|buyer|tenant` ola bilər (`INVALID_CUSTOMER_TYPE`).
  - Vasitəçilik sahibində `owner_*` sahələri tələbdir; `purchase_price/expenses[]` göndərilərsə 400 `BROKERAGE_DISALLOWED_FIELDS`.
- __[API qaydaları]__
  - Customers: `GET /api/customers?query=...`, `POST /api/customers`, `PATCH /api/customers/:id` — idempotency, audit məcburidir.
  - Property create/update (brokerage): `owner_*` sahələri required; `brokerage_commission_percent` required; RBAC ilə qorunur.
  - Duplicate yoxlama: `phone/email` üzrə potensial dublikatda policy warning (`POLICY_WARN_POTENTIAL_DUPLICATE`), UI‑də xəbərdarlıq.
- __[Qəbul meyarları (AC)]__
  - AC‑CUST‑1: `POST /api/customers` zamanı `first_name` və `last_name` boşdursa → 400 `NAME_PARTS_REQUIRED`.

### 9.3. Əsas Obyektlər (ER qısa təsvir)
- Property: id, code, project, building, apt_no, floor, floors_total, area_m2, status[pending|active|sold|archived], category[sale|rent], docs_type, address, features(jsonb), images(jsonb), buy_price_azn, target_price_azn, sell_price_azn, is_renovated, created_at, updated_at, listing_type[agency_owned|branch_owned|brokerage], owner_first_name, owner_last_name, owner_father_name?, owner_contact, brokerage_commission_percent
- Deal: id, property_id(FK), type[buy|sell|rent|brokerage], branch_id, buy_price_azn, sell_price_azn, closed_at, created_at, updated_at, deal_type[direct|brokerage], brokerage_percent, brokerage_amount, payout_status[pending|approved|paid], payout_date, invoice_no, partner_agency, notes
- Expense: id, deal_id(FK), property_id(FK), category[repair|docs|tax|agent_comm|admin|other], amount_azn, currency, fx_rate, note, spent_at, created_at
- Customer: id, first_name, last_name, father_name?, phone, email, type[seller|buyer|tenant], kyc(jsonb), created_at
- Contract: id, deal_id(FK), lease_start, lease_end, files(jsonb), created_at
- Approval: id, deal_id(FK), step[manager|vp|director], status[pending|approved|rejected], user_id(FK), note, approved_at, created_at
- CommissionRule: id, type[branch|brokerage], percent_rea, percent_branch, valid_from, valid_to
- User: id, name, email, phone, role_id(FK), is_active, created_at
- Role: id, name[agent|manager|accountant|director|vp], permissions(jsonb)
- AuditLog: id, actor_id, entity, entity_id, action[CREATE|UPDATE|DELETE|APPROVE], before(jsonb), after(jsonb), ip, created_at
- Communication: id, contact_id(NULLABLE), property_id(NULLABLE), deal_id(NULLABLE), type[call|sms|whatsapp], direction[in|out], status[logged|sent|delivered|failed], caller_id, recipient, duration_sec, message, provider, meta(jsonb), created_at
- FxRate: id, date, currency, rate_azn, created_at
- BrokerageSettings: id, percent_default, valid_from, valid_to, created_at
- Booking: id, property_id(FK), customer_id(FK), deposit_amount?, end_date, status[ACTIVE|EXPIRED|CONVERTED|CANCELLED], created_by_id(FK), created_at

Əlaqələr: Property 1—N Deal; Deal 1—N Expense; Deal 1—N Approval; Deal 1—1 Contract(opsional); User 1—N AuditLog; Property/Deal 1—N Communication; Property 1—N Booking; Customer 1—N Booking.

 

### 9.4. Backend Validation Qaydaları
- Property (create/update):
  - listing_type=agency_owned → `purchase_price` NOT NULL; `expenses[]` ən az 1 bənd tövsiyə (policy), yoxdursa warning (opsional).
  - listing_type=branch_owned → `purchase_price` NOT NULL; ən azı 1 `expense` tələb olunur; uyğunsuzluqda 400 `code=BRANCH_OWNED_REQUIREMENTS_MISSING`.
  - listing_type=brokerage → `owner_first_name`, `owner_last_name`, `owner_contact`, `brokerage_commission_percent` MƏCBURİDİR; `purchase_price` və `expenses[]` göndərilərsə 400 `BROKERAGE_DISALLOWED_FIELDS`.
- Approvals:
  - `POST /api/approvals/:propertyId/start` → listing_type=brokerage və ya branch_owned olduqda “Bütcə” addımı avtomatik SKIP edilir; `AuditLog.reason=SKIPPED_BY_RULE(listing_type=...)`.
- Deals:
  - deal_type=brokerage → `brokerage_percent` NOT NULL; bağlanma zamanı `brokerage_amount` serverdə hesablanır və audit diff-ə düşür.
+
+-- Əlavə qaydalar --
+- Property (ümumi sahələr):
+  - `status` yalnız `pending|active|sold|archived` enum (400 `INVALID_STATUS`).
+  - `category` yalnız `sale|rent` (400 `INVALID_CATEGORY`).
+  - `area_m2 > 0`, `floor >= 0`, `floors_total >= floor` (400 `INVALID_DIMENSIONS`).
+  - `target_price_azn >= 0`, `sell_price_azn >= 0` (400 `INVALID_PRICE`).
+  - `branch_owned` → `branch_id` MƏCBURİ (400 `BRANCH_REQUIRED`).
+  - `agency_owned|branch_owned` → `activation` (status=active) YALNIZ approval tamamlandıqdan sonra (400 `APPROVAL_REQUIRED`).
+  - Unikal kod: `code` unikal (400 `PROPERTY_CODE_EXISTS`).
+
+- Booking:
+  - Bir əmlak üçün yalnız 1 ACTIVE booking (409 `BOOKING_CONFLICT`); DB partial unique index: `(property_id) where status='ACTIVE'`.
+  - Booking müddəti: `expires_at > now()` (400 `BOOKING_EXPIRES_INVALID`).
+  - Cancel/convert yalnız `status=ACTIVE` olduqda (400 `BOOKING_NOT_ACTIVE`).
+
+- Deal:
+  - `sell` deal → `sell_price_azn > 0` (400 `SELL_PRICE_REQUIRED`).
+  - `rent` deal → `lease_start < lease_end` (400 `LEASE_RANGE_INVALID`).
+  - `deal.close` yalnız bağlı Property `status=active` olduqda (400 `PROPERTY_NOT_ACTIVE`).
+  - `brokerage` deal → Property.listing_type=brokerage olmalıdır (400 `BROKERAGE_MISMATCH`).
+
+- Expense:
+  - `category` enum: `repair|docs|tax|agent_comm|admin|other` (400 `INVALID_EXPENSE_CATEGORY`).
+  - `amount_azn > 0`; `currency` `AZN|USD|EUR`; `fx_rate > 0` əgər currency!=AZN (400 `INVALID_EXPENSE_AMOUNT`).
+  - `spent_at` ≤ now() (400 `EXPENSE_DATE_INVALID`).
+  - `brokerage` listing-lərdə expense YASAQLANIR (400 `BROKERAGE_DISALLOWED_FIELDS`).
+
+- Buyer Request (tələbat):
+  - `budget_min <= budget_max`; hər ikisi > 0 (400 `BUDGET_RANGE_INVALID`).
+  - `locations[]` boş ola bilməz (400 `LOCATION_REQUIRED`).
+  - `status` yalnız `open|in_progress|closed_won|closed_lost` (400 `INVALID_BUYER_REQUEST_STATUS`).
+
+- Müştəri/Əlaqə:
+  - `phone` formatı: E.164 və ya `+994` prefiks doğrulaması (400 `PHONE_INVALID`).
+  - `email` RFC5322 sadə regex (400 `EMAIL_INVALID`).
+  - Duplicates: eyni `phone` + `first_name` + `last_name` kombinasiya üçün ehtiyatlı duplicate warning (409 `POTENTIAL_DUPLICATE`, opsional override with `?force=true`).
+  - Ad sahələri: `first_name` və `last_name` MƏCBURİ; `father_name` opsional (400 `NAME_PARTS_REQUIRED`).
+
+- Fayl yükləmələri (images/docs):
+  - Max ölçü: şəkil ≤ 5MB, sənəd ≤ 10MB; MIME whitelist (400 `FILE_INVALID`).
+  - Maks say: property images ≤ 30 (400 `TOO_MANY_FILES`).
+
+- Valyuta/FX:
+  - `currency` yalnız whitelist; `fx_rate` mənbəyi audit-lə qeyd olunur; serverədək 6 onluğa kəsim (400 `FX_INVALID`).
+
+- Səhifələmə və limitlər:
+  - `limit` 1..100; default 20 (400 `INVALID_PAGINATION`).
+  - Sort fields whitelist; əks halda 400 `INVALID_SORT_FIELD`.
+
+- Idempotency və yarış şərtləri:
+  - Mutasiya endpointləri `Idempotency-Key` dəstəyi (409/412 qaydaları sənədləşdirilsin).
+  - Double‑convert və double‑approve halları 409 qaytarırsa, eyni anda ikinci çevirmə cəhdi bloklanıb.
+
+- RBAC əsasında şərti validasiya:
+  - `brokerage_percent` override yalnız `role in [Director, Finance]` (403 `FORBIDDEN_OVERRIDE`).
+  - Approval addımı SKIP qaydalarının dəyişdirilməsi yalnız `Admin` (403 `FORBIDDEN_RULE_CHANGE`).
+
+- Audit məcburiliyi:
+  - Hər `CREATE/UPDATE/DELETE/APPROVE/SKIP` üçün `actor_id, role, ip, before, after, ts` saxlanılır; əks halda 500 (server guard, AC-lərdə yoxlanır).

### 9.4.A. Severity və tətbiq
- Hard Fail (bloklayıcı): 4xx/5xx ilə request rədd edilir; əməliyyat icra olunmur.
  - Kategoriyalar: `INVALID_*`, `REQUIRED`, `MISMATCH`, `CONFLICT`, `FORBIDDEN_*`, `APPROVAL_REQUIRED`, `BROKERAGE_DISALLOWED_FIELDS`, `BRANCH_OWNED_REQUIREMENTS_MISSING`, `PROPERTY_CODE_EXISTS`, `IDEMPOTENCY_KEY_REQUIRED`, və s.
- Policy Warning (bloklamır): əməliyyat icra olunur, lakin `warnings[]` massivinə əlavə olunur və auditə yazılır. UI xəbərdarlıq göstərir.
  - `agency_owned` üçün `expenses[]` ≥ 1 tövsiyəsi (code: `POLICY_WARN_EXPENSE_RECOMMENDED`).
  - Müştəri potensial dublikat: pre‑submit yoxlama xəbərdarlığı (code: `POLICY_WARN_POTENTIAL_DUPLICATE`). Backend-də submit zamanı hələ də 409 `POTENTIAL_DUPLICATE` qaydası qüvvədədir, lakin UI `?force=true` ilə təsdiq edə bilər.
  - Böyük şəkil sayı 25–30 arası: `POLICY_WARN_MANY_FILES` (30+ isə Hard Fail `TOO_MANY_FILES`).
  - FX mənbə boşdursa, lakin AZN istifadə olunub: `POLICY_WARN_FX_SOURCE_MISSING`.
- Qeyd: Policy warning-lərin blocking-ə çevrilməsi admin parametridir (config: `policyWarnings.asHardFail[]`).

### 9.4.B. Error Code Lüğəti (seçilmiş)
- `INVALID_STATUS`, `INVALID_CATEGORY`, `INVALID_DIMENSIONS`, `INVALID_PRICE`
- `BRANCH_REQUIRED`, `APPROVAL_REQUIRED`, `PROPERTY_CODE_EXISTS`
- `BOOKING_CONFLICT`, `BOOKING_EXPIRES_INVALID`, `BOOKING_NOT_ACTIVE`
- `SELL_PRICE_REQUIRED`, `LEASE_RANGE_INVALID`, `PROPERTY_NOT_ACTIVE`, `BROKERAGE_MISMATCH`
- `INVALID_EXPENSE_CATEGORY`, `INVALID_EXPENSE_AMOUNT`, `EXPENSE_DATE_INVALID`
- `BUDGET_RANGE_INVALID`, `LOCATION_REQUIRED`, `INVALID_BUYER_REQUEST_STATUS`
- `PHONE_INVALID`, `EMAIL_INVALID`, `POTENTIAL_DUPLICATE`
- `FILE_INVALID`, `TOO_MANY_FILES`, `FX_INVALID`, `INVALID_PAGINATION`, `INVALID_SORT_FIELD`
- `ALREADY_CONVERTED`, `ALREADY_APPROVED`, `FORBIDDEN_OVERRIDE`, `FORBIDDEN_RULE_CHANGE`
- `BROKERAGE_DISALLOWED_FIELDS`, `BRANCH_OWNED_REQUIREMENTS_MISSING`, `IDEMPOTENCY_KEY_REQUIRED`
- Policy warnings: `POLICY_WARN_EXPENSE_RECOMMENDED`, `POLICY_WARN_POTENTIAL_DUPLICATE`, `POLICY_WARN_MANY_FILES`, `POLICY_WARN_FX_SOURCE_MISSING`

### 9.4.C. Approval üçün Qəbul Meyarları (AC-lər)
- AC-APP-AG-1: listing_type=agency_owned olduğunda approval başladıqda BÜDCƏ addımı TƏTBİQ OLUNUR; addım təsdiqlənmədən növbəti mərhələyə keçid bloklanır.
- AC-APP-BRANCH-1: listing_type=branch_owned üçün approval başladıqda BÜDCƏ addımı avtomatik SKIP; `AuditLog.reason=SKIPPED_BY_RULE(listing_type=branch_owned)` yazılır.
- AC-APP-BRANCH-2: listing_type=branch_owned üçün property create/update zamanı `purchase_price` və ən azı 1 `expense` yoxdursa 400 `BRANCH_OWNED_REQUIREMENTS_MISSING`.
- AC-APP-BROK-1: listing_type=brokerage üçün approval başladıqda BÜDCƏ addımı avtomatik SKIP; `AuditLog.reason=SKIPPED_BY_RULE(listing_type=brokerage)` yazılır.
- AC-APP-BROK-2: listing_type=brokerage üçün property create/update zamanı `owner_first_name`, `owner_last_name`, `owner_contact`, `brokerage_commission_percent` yoxdursa 400; `purchase_price/expenses[]` göndərilərsə 400 `BROKERAGE_DISALLOWED_FIELDS`.

## 10. Təməl Arxitektura
- Topologiya (on‑prem):
  - Reverse proxy: Nginx → Next.js (SSR) və Express API.
  - App runtimes: PM2 ya da systemd servisləri; .env secrets serverdə.
  - Database: PostgreSQL (ayrı VM/fiziki server), gündəlik/saatlıq backup; PITR aktiv.
  - Fayllar: NAS və ya lokaldə şifrələnmiş storage (şəkil/video üçün ölçü kvotaları).
- Təhlükəsizlik: Ofis daxili şəbəkə + VPN; IP whitelist; DB portu yalnız daxili şəbəkədə; audit log hər bir approval və status dəyişikliyini saxlayır.
- Keşləmə: API üçün HTTP caching headers; Next.js ISR; lazım olduqda Redis (opsional).
- Müşahidə: node-exporter + Prometheus/Grafana; log toplanması (Loki/ELK) — opsional.
- Konfiqurasiya: Komissiya qaydaları və limitlər parametrik cədvəllərdə saxlanılır.
- Approval tətbiqi: Property create/update və “İlkin xərclər” əvvəlcə approval queue-ya düşür; APPROVED olduqda əsas cədvəllərə tətbiq edilir.

## 11. Metriklər və Uğur Meayarları
- Aktivlik metrikləri (DAU/WAU/MAU, dönüşüm)
- Keyfiyyət metrikləri (error rate, latency)
- Biznes metrikləri (gelir, retention)
- KPI-lar (əlavə):
  - Booked → Sold Conversion Rate
  - Orta bron müddəti (gün)
  - Bitməzdən əvvəl çevrilən bronların faizi
  - Listing Aging (orta gün aktivdə)
  - Expense-to-Profit ratio
  - Lead→Booking conversion
  - Missed calls sayı, First Response Time (FRT)

### 11.1. SLO/SLA
- API latency: P95 < 300ms (daxili şəbəkə), P99 < 600ms.
- XLSX export: ≤ 60s (async job), UI-də status/polling ilə bildiriş.
- SMS DLR yenilənməsi: ≤ 10s içində status UI-də.
- Uptime: İş saatları ≥ 99.9%, qeyri‑iş saatları ≥ 99.5%.

### 11.2. Error Budgets
- Ay ərzində SLO sapması üçün ≤ 43m (99.9%) boşluq.
- Retry strategiyaları SLO büdcəsini aşmamaq üçün limitlənir.

### 11.3. Data Quality
- Required fields coverage ≥ 98% (property, customer, deal).
- Audit log coverage = 100% bütün mutasiyalar üçün.
- FX snapshot mövcudluğu USD əməliyyatlarında = 100%.

### 11.4. Monitoring & Alerting
- Metrics: req/sec, P50/P95/P99 latency, error rate, queue depth, job durations.
- Probes: liveness/readiness; DB connection pool health.
- Alerts: SLO breach, DLR failure rate ↑, export overrun, ISR revalidate backlog.

## 12. Risklər və Azaltma Planı
- Risk 1 — ehtimal/təsir — mitigasiya
- Risk 2 — ...
- Risk (double-convert): Eyni bronun iki dəfə çevrilməsi — idempotent endpoint, DB constraint (unique active booking per property), transaksiya idarəsi.
- Risk (xərc girişində səhvlər): Zod validator min/max, decimal presiziya, audit geri dönüş.
- Risk (backup RPO/RTO pozulması): Rüblük bərpa testi, offsite nüsxə, bərpa runbook.
- Risk (FX snapshot səhvi): Orijinal məbləğ + valyuta saxlanması, nightly konsistensiya yoxlaması.
- Risk (webhook spoofing): HMAC imza, IP allowlist, replay window, idempotency.
- Risk (provider kəsinti): Circuit breaker, retry backoff, provider fallback (gələcək mərhələ).
- Risk (cache/invalidation): ISR revalidate strategiyası və manual revalidate proseduru.

## 13. Təhlükəsizlik Təhdid Modeli (STRIDE)

Bu bölmə REA INVEST-in on‑prem arxitekturasına uyğun STRIDE əsasında təhdidləri və qarşısını alma tədbirlərini müəyyənləşdirir.

### 13.1. Aktivlər və Aktorlar
- Aktivlər: PII (müştəri əlaqə məlumatları, KYC), maliyyə məlumatları (xərclər, qiymətlər, komissiyalar), müqavilələr və fayllar, kommunikasiya qeydləri (zəng/SMS/WA), audit loglar, XLSX exportlar, admin konfiqurasiyası, sirlər (.env).
- Aktorlar: Agent, Rəhbər, Mühasib, Direktor, Sədr müavini, Çağrı mərkəzi operatoru, Sistem xidmətləri (Next.js, API), DB admini, Xarici providerlər (SMS/WA webhook).

### 13.2. Etibar Sərhədləri (Trust Boundaries)
- Brauzer ↔ API (HTTPS) — authentikasiya və RBAC.
- API ↔ DB — yalnız daxili şəbəkə; ən az imtiyazlı DB hesabları.
- Provider Webhook ↔ API — internetdən gələn daxilolmalar; imza doğrulaması və IP filtrləmə.
- Admin sahələri ↔ Publik sahələr — IP whitelist və 2FA.

### 13.3. STRIDE Təhdidləri və Qarşı Təd­birlər
- S — Spoofing (Şəxsiyyət saxtalaşdırma)
  - Mitigasiya: RBAC (role/permission), qısa müddətli JWT (≤60m) + refresh flow, opsional 2FA (TOTP), admin üçün IP whitelist/VPN, güclü parol siyasəti, session invalidation (logout‑all), device logları.
- T — Tampering (Dəyişdirmə)
  - Mitigasiya: Parametrik sorğular/ORM, input zod validatorları, bütün mutasiyalarda `AuditLog(before/after, actor, ip)`, fayl checksum (opsional), DB rol səviyyəli məhdudiyyətlər, yalnız serverdə revalidate (ISR invalidation access control).
- R — Repudiation (İnkar)
  - Mitigasiya: Dəqiq audit trail (timestamp, actor, IP, entity, action), server saat sinxronu (NTP), audit loglar üçün retention ≥5 il, dəyişməz (WORM‑like) backup snapshotları, imzalanmış webhook hadisələri və idempotency logu.
- I — Information Disclosure (Məlumat sızması)
  - Mitigasiya: TLS 1.2+ hər yerdə, disk şifrələmə (BitLocker/LUKS) və ya Postgres səviyyəsində şifrələmə, ən az imtiyaz prinsipi (DB/user/role), PII masklama (loglarda və eksport siyahılarında), fayl icazələri (umask), secrets yalnız serverdə və rota məhdud.
- D — Denial of Service (Xidmətin rədd edilməsi)
  - Mitigasiya: Rate limiting (IP+user), server‑side pagination limitləri, vaxt/ölçü limitləri (upload, export), queue/async işləmə ağır işlər üçün, circuit breaker, healthchecks; webhook endpointlərinə timeout və retry‑safe emal.
- E — Elevation of Privilege (Səlahiyyət artırılması)
  - Mitigasiya: İncə‑dane RBAC (route+endpoint+field səviyyəsi), admin əməliyyatlarında ikinci təsdiq (approval), defolt admin hesabı yoxdur, təhlükəsiz konfiqurasiya (secure headers, CSP), CSRF qorunması (cookie‑based auth olduqda), SSR‑də server‑side permission yoxlaması.

### 13.4. Webhook Təhlükəsizliyi (SMS/WhatsApp)
- HMAC‑SHA256 imzası və `X‑Signature` başlığı; mesaj gövdəsi üzrə imza yoxlanışı.
- Replay qorunması üçün `X‑Timestamp` və 5 dəq zaman pəncərəsi.
- Idempotency‑Key və ya provider message_id ilə təkrar emalın qarşısı.
- IP allowlist (mümkünsə), yalnız lazım olan route‑lara giriş.

### 13.5. Konfiqurasiya və İnfrastruktur Sərtləşdirilməsi
- Nginx: TLS güclü siyahı, HTTP→HTTPS redirect, HSTS, `X‑Frame‑Options=DENY`, `X‑Content‑Type‑Options=nosniff`, `Referrer‑Policy=strict‑origin`.
- Next.js/API: error detalları prod‑da gizli, `helmet` başlıqları, fayl yükləmələrində content‑type yoxlanışı və ölçü limiti, antivirus skan (opsional), yalnız serverdə revalidate (ISR invalidation access control).
- Postgres: yalnız daxili şəbəkə, audit uzantıları (pgaudit opsional), per‑service userlər, müntəmadi backup və bərpa testi (rüblük), PITR aktiv.
- Şifrələr/Sirlər: .env yalnız serverdə, secret rotation planı, 1Password/KeyVault (opsional on‑prem ekvivalent).

### 13.6. Uyğunluq və Retensiya
- PDPL uyğunluğu: şəxsi məlumatların qorunması (PDPL); məlumatların ən az 5 il saxlanması; audit izləri saxlanılır.
- Retensiya: ən az 5 il audit və əməliyyat logları; müştəri sorğusuna əsasən silmə/anonimləşdirmə proseduru.

### 13.7. Təhlükəsizlik Qəbul Meyarları (selektiv)
- SEC‑AC‑1: Admin route‑ları yalnız whitelist‑də olan IP‑lərdən və/və ya VPN üzərindən əlçatandır.
- SEC‑AC‑2: Bütün mutasiyalar `AuditLog`‑a actor, IP, before/after ilə yazılır; audit gözləntiləri üçün nümunə sorğular işləyir.
- SEC‑AC‑3: SMS/WA webhooklarında imza doğrulaması uğursuz olduqda 401/403 qaytarılır və hadisə emal edilmir.
- SEC‑AC‑4: Rate limiting aktivdir; eyni IP‑dən /login üçün 5 dəqiqədə ≥N uğursuz cəhd bloklanır (temporary lockout).

## 14. Hədləndirmə (Out of Scope)
- Agent komissiyalarının mühasibat uçotu.
- Marketinq kampaniyaları və lead generation alətləri.
- Marketplaces-ə avtomatik listinq (Tap.az, bina.az, korporativ sayt) — gələcək mərhələ.

## 17. Booking (Bron) — Detallı Spesifikasiya

Bu bölmə PRD §6 (FR‑15), §9 (Model/API), §16 (Hesabat) və qəbul meyarlarına uyğunlaşdırılıb.

### 17.1. Statuslar
- ACTIVE — aktiv və bitməmiş bron
- EXPIRED — bitmə tarixi keçdiyi üçün avtomatik bağlanıb
- CONVERTED — satış/əməliyyata çevrilib
- CANCELLED — istifadəçi ləğv edib

Qeyd:
- Eyni `property_id` üçün eyni anda yalnız 1 ACTIVE bron ola bilər.

### 17.2. DB Məhdudiyyətləri və Qaydalar
- Unique constraint: `(property_id, status)` yalnız `status=ACTIVE` üçün unikal (unique ACTIVE per property).
- `end_date` NULL deyil; `created_by_id` saxlanılır (audit üçün).
- `convert-to-transaction` əməliyyatı idempotent olmalıdır: transaction + unikal açar (məs. operation key).

### 17.3. API Endpoints
- GET `/api/customers/:id/bookings?status=ACTIVE` — müştərinin aktiv bronları
- GET `/api/properties/:id/bookings?status=ACTIVE` — əmlakın aktiv bronu
- POST `/api/bookings` — yeni bron yaratmaq
- POST `/api/bookings/:id/convert-to-transaction` — satışa çevirmək (idempotent; 409 double‑convert cəhdi)
- POST `/api/bookings/:id/cancel` — ləğv etmək

Bütün mutasiya endpointləri `AuditLog` yazır.

### 17.4. UI Axını
- Əmlak/Müştəri kartında “Bron yarat” düyməsi
- Aktiv bron kartında: “Satışa çevir” və “Ləğv et” əməliyyatları
- Siyahılarda `activeBookingsCount` badge; filter: “Aktiv brona malik müştərilər”

### 17.5. Qəbul Meyarları (AC)
- AC‑B1: Given `property_id` üçün ACTIVE bron var, When ikinci bron yaratmağa cəhd edilir, Then 409 qaytarılır.
- AC‑B2: Given ACTIVE bron, When “Satışa çevir” çağırılır, Then transaction yaradılır, booking.status=CONVERTED olur, əməliyyat idempotentdir.
- AC‑B3: Given `end_date` keçdi, When sistem yoxlaması işləyir, Then booking.status=EXPIRED olur və UI‑də aktiv kimi görünmür.
- AC‑B4: Yarat/çəvir/ləğv mutasiyalarında `AuditLog`‑da actor, ip, before/after yazılır.

### 17.6. Hesabat Inteqrasiyası
- `fact_bookings`: booking_id, property_id, customer_id, status, deposit_amount, start_at, end_date, converted_at
- KPI-lar: Booked→Sold Conversion Rate, Orta bron müddəti, vaxtından əvvəl çevrilmə faizi

## V1 — Əlavə Tələblər (2025-08-14)

- __[Kommunikasiya]__ Zənglər əl ilə qeyd olunur; VoIP inteqrasiyası V1‑də yoxdur. SMS/WhatsApp M2‑yə təxirə salındı (provider seçimi sonradan).
- __[Mühasibat ixracı]__ XLSX əsas formatdır (CSV dəstək opsional).
- __[Audit log]__ Kim nəyi nə vaxt dəyişdi — məcburidir.
- __[Dil/Valyuta]__ AZ; valyuta AZN, bəzən USD.
- __[Marketplaces]__ Tap.az, bina.az, korporativ sayt inteqrasiyası növbəti yenilənmələrdə.
- __[Vasitəçilik]__ Komissiya faizləri admin panelindən təyin edilir.
- __[Xərclər]__ Əmlak əlavə edilərkən ilkin xərclərin daxil edilməsi tələb olunur.

## 15. Frontend Rendering Strategiyası (CSR/SSR/SSG/ISR)

Məqsəd: UX performansı, SEO və keş arasında tarazlıq yaratmaq üçün hər route üçün uyğun render strategiyasını müəyyənləşdirmək.

### 15.1. Qısa təriflər
- CSR: HTML brauzerdə JS ilə render olunur; yüksək interaktivlik, ilk render gecikməsi mümkündür.
- SSR: HTML serverdə formalaşır; daha yaxşı SEO və ilk content sürəti.
- SSG: Build zamanı statik HTML; çox sürətli, nadir dəyişən kontent üçün uyğundur.
- ISR: SSG + revalidate ilə periodik yenilənmə; yarı‑dinamik.

### 15.2. Route səviyyəsində qərarlar
| Route | Strategiya | Revalidate | SEO | Qeydlər |
|---|---|---:|---|---|
| /login | CSR | — | Yox | Auth-only; sürətli init; SSR-ə ehtiyac yoxdur |
| /dashboard | CSR | — | Yox | Interaktiv widgetlər; client-side data fetch (SWR/React Query) |
| /properties | ISR | 60s | Var | Public siyahı; tez-tez yenilənir; SWR ilə client refresh mümkündür |
| /properties/[id] | SSR | — | Var | Detal səhifəsi; paylaşım/metatag üçün server render vacibdir |
| /admin/** | CSR | — | Yox | Form-heavy idarəetmə; RBAC yoxlaması client+API |
| /reports/kpi | ISR | 300s | Var (minimal) | Oxu yönümlü; periodik yenilənən metriklər; cache dostu |

Qeyd:
- ISR səhifələri üçün yazma əməliyyatlarından sonra müvafiq path-lar revalidatePath/revalidateTag ilə yenilənməlidir.
- Manual revalidate proseduru və audit izi.

## 16. Hesabat Arxitekturası və Data Modelləri

### 16.1. Data Marts / Cədvəllər
- fact_deals: deal_id, property_id, branch_id, agent_id, buy_price, sell_price, profit, closed_at, status
- fact_expenses: expense_id, property_id, deal_id, category, amount, incurred_at
- fact_bookings: booking_id, property_id, customer_id, status, deposit_amount, start_at, end_date, converted_at
- dim_property: property_id, type, building_type, area_m2, project, address, features
- dim_customer: customer_id, segment[buyer|seller|tenant], city, source(optional)
- dim_branch: branch_id, name
- dim_time: date_key, day, week, month, quarter, year

Qeyd: İlk mərhələdə bunlar Postgres materialized view-ları kimi qurulur.

### 16.2. ETL və Yenilənmə
- Nightly `REFRESH MATERIALIZED VIEW CONCURRENTLY`; month‑to‑date üçün on‑demand refresh.
- Yazma əməliyyatlarından sonra kritik səhifələr üçün `revalidatePath`/`revalidateTag`.

### 16.3. Hesabat və Export
- XLSX Accounting Export sütunları:
  - Date, Branch, Agent, PropertyCode, DealType, BuyPriceAZN, SellPriceAZN, ProfitAZN, ExpenseAZN, NetProfitAZN, Currency, OriginalAmount, FxRate
- Filtrlər: tarix aralığı, filial, agent, deal statusu.

### 16.4. Dashboard və Rollara görə Widgetlər
- Director: Net profit trend, pipeline conversion, aging distribution.
- Manager: Team KPIs, missed calls, follow‑up overdue, booking conversion per agent.
- Agent: My listings, my bookings, my tasks/follow‑ups.

### 16.5. Qəbul Meyarları (Reports)
- Given tarix aralığı seçilib, When export düyməsi basılır, Then XLSX 60s içində hazır olur və sütunlar yuxarıdakı kimi olur.
- Given month‑to‑date refresh tətiklənir, When dashboard açılır, Then metriklər yeni dəyərlərlə görünür (≤ 5 dəq içində).

## 18. Kommunikasiya (Zəng/SMS/WhatsApp) — Detallı Spesifikasiya

Bu bölmə §6 (FR‑12, FR‑14), §9 (Communication modeli və endpointlər) və §13 (STRIDE/webhook) ilə uyğunlaşdırılıb.

### 18.1. Zənglərin Əl ilə Qeydiyyatı (V1)
- Model: `Communication{ type=call, direction[in|out], status=logged, caller_id, recipient, duration_sec?, note, property_id?, customer_id?, deal_id?, created_by }`
- UI: Müştəri və Əmlak kartında “Zəng əlavə et” formu; jurnal tabı (filter: type=call).
- API: `POST /api/communications` (manual log), `GET /api/communications?entity=property|customer|deal&id=...`.

### 18.2. SMS (SMPP Gateway) — M2 (Sonrakı Yenilənmə)
- Status: V1‑dən çıxarılıb; M2‑də aktivləşdiriləcək.
- Göndəriş: `POST /api/sms/send {to, text, tag?}` → `Communication{type=sms, direction=out, status=sent}`.
- DLR Webhook: `POST /webhooks/sms/dlr` HMAC imzalı; status mapping: `DELIVERED|FAILED|EXPIRED` → `communications.status` yenilənir ≤10s.
- Retry: Provider failure üçün exponential backoff ≤ 3 cəhd; idempotency‑key ilə təkrarların qarşısı.

### 18.3. WhatsApp (Meta Cloud API) — M2
- Göndəriş: `POST /api/whatsapp/send {to, template|text}` → `Communication{type=whatsapp, direction=out, status=sent}`.
- Webhook: `POST /webhooks/whatsapp` HMAC + replay window ≤ 5 dəq; message statusları `sent|delivered|read|failed`.

### 18.4. Ümumi Qaydalar
- RBAC: Agent mesaj/zəng logu yaza bilir; Manager/Direktor bütününü görə bilir.
- Audit: Bütün `create/update` əməliyyatları `AuditLog`‑a yazılır (actor, ip, before/after).
- Gizlilik: PII masklama loglarda (telefonun son 4 rəqəmi xaric).

### 18.5. Çağrı Mərkəzi İş Axını və KPI-lar (V1)

- İş axını:
  - Gələn zəng → operator müştərini axtarır/yaradır → `POST /api/communications` ilə call log yazır → lazım gələrsə `BuyerRequest` (§25) və ya `Booking` (§19) yaradır → follow‑up tapşırığı təyin edilir.
- Forma sahələri:
  - direction[in|out], caller_id (telefon), recipient (daxili xətt/agent), started_at, duration_sec?, note (qısa məzmun), link: customer_id və ya property_id və ya deal_id.
- Validasiyalar:
  - `caller_id` məcburidir; ən azı `customer_id` və ya `property_id` göstərilməlidir.
  - duration_sec ≥ 0; note ≤ 1000 simvol.
- RBAC:
  - Operator/Agent: create/read öz zəngləri; Manager/Direktor: bütün zəngləri görür.
  - Düzəliş yalnız 15 dəq içində (audit diff saxlanılmaqla).
- KPI-lar (Report §16 ilə əlaqəli):
  - Missed call rate, First response time, Call→Booking conversion, Follow‑up overdue sayı, Agent utilization.
- Qəbul meyarları:
  - AC‑CC1: Given zəng daxil olur, When operator call log yaradır, Then qeydə alınır və audit yazılır ≤ 30s.
  - AC‑CC2: Given call log yaradılıb, When customer/property link seçilir, Then jurnal filtrində həmin entitidə görünür.
  - AC‑CC3: Given call log düzəlişi edilir, When 15 dəq keçib, Then update bloklanır (yalnız Manager icazəsi ilə mümkündür) və audit diff saxlanılır.

## 19. Audit Log Standartı

### 19.1. Əhatə və Hadisələr
- Əhatə: Bütün mutasiya endpointləri (Property, Deal, Expense, Booking, Communication, Approval, Settings).
- Hadisələr: `CREATE|UPDATE|DELETE|APPROVE|CONVERT|CANCEL|LOGIN|LOGOUT`.

### 19.2. Payload Standartı
```json
{
  "id": "uuid",
  "ts": "ISO-8601",
  "actor": {"id": "uuid", "role": "string"},
  "entity": {"type": "Property|Deal|...", "id": "uuid"},
  "action": "CREATE|UPDATE|...",
  "before": {...},
  "after": {...},
  "ip": "x.x.x.x",
  "ua": "user-agent",
  "meta": {"reqId": "uuid", "reason": "string"}
}
```

### 19.3. Saxlama və İndeksləmə
- Cədvəl: `audit_logs` (JSONB sütunları: before/after/meta), GIN index `meta`, B‑tree index `ts, entity_type, entity_id, action`.
- İxrac/Filter: tarix aralığı, entity, actor, action, IP üzrə.

### 19.4. Retensiya və Uyğunluq
- Retensiya: ≥ 5 il; aylıq arxiv (partitioning by month) tövsiyə olunur.
- Uyğunluq: PDPL; hüquqi sorğu zamanı audit export proseduru.

### 19.5. Qəbul Meyarları (Audit)
- Given mutasiya edilir, When əməliyyat tamamlanır, Then `audit_logs` qeydi yaranır və entity diff doğru saxlanır.
- Given audit filtresi tətbiq olunur, When tarix/actor/entity ilə axtarış edilir, Then nəticələr ≤ 1s (P95) qaytarılır.

## 20. İcra Planı və Mərhələlər (Roadmap)

### 20.1. V1 Əhatə (Confirm edilmiş)
- Booking (bron) axını və convert idempotency
- Manual Call Log
- Property create zamanı ilkin xərclər + approval
- KPI dashboard minimal (ISR) və XLSX export
- STRIDE əsas tədbirlər (RBAC, Audit, Webhook imzası)

### 20.2. Epiklər və İş Paketləri
- EP‑01: Data modeli və migrasiyalar (Property/Expense/Booking/Communication/Audit)
- EP‑02: API (Bookings, Communications, Expenses, Export, Approvals)
- EP‑03: Next.js UI (Properties, Bookings, Communications journal, Reports)
- EP‑04: Audit & Security (middleware, HMAC, rate‑limit)
- EP‑05: Reporting (materialized views, XLSX)

### 20.3. Asılılıqlar
- SMPP provider seçimi (SMS)
- ORM seçimi (Prisma/Knex)

## 21. Əməliyyat Runbook-u (Ops)

### 21.1. Deployment (on‑prem)
- Nginx reverse proxy → Next.js (SSR) və Express API (PM2/systemd)
- Konfiqurasiya: `.env` yalnız serverdə; prod build + healthchecks
- Mühitlər: dev, stage, prod (ayrı DB və media storage)

### 21.2. Backup və Bərpa
- Postgres: gündəlik full + saatlıq differential; mütəmadi bərpa testi
- Media: gündəlik snapshot (NAS) + offsite nüsxə (opsional)
- Bərpa runbook: DB stop → restore → app env check → canary yoxlama → serve

### 21.3. Migrations və Dəyişiklik İdarəetməsi
- ORM migrasiyaları (Prisma/Knex) — versiyalı, geri dönüş planı
- Change window: işdənkənar saatlar; rollback kriteriyaları

### 21.4. İnsident İdarəetməsi
- Aşkarlama: monitorinq alarmları (latency, error rate, DLR failures)
- Triyaj: təsir ölçümü, son dəyişikliklərin yoxlanması
- Həll: rollback/migration fix/revalidate; post‑mortem və düzəldici hərəkətlər

### 21.5. Keş və Revalidate
- ISR səhifələri üçün əməliyyatdan sonra `revalidatePath`/`revalidateTag`
- Manual revalidate proseduru və audit izi

## 22. Test Strategiyası

### 22.1. Səviyyələr
- Unit: model/validatorlar (zod), util funksiyalar
- Integration: API endpointləri (Bookings convert idempotency, Communications DLR)
- E2E: UI axınları (bron yarat/çevir, call log, export)
- Performance: əsas siyahılar və export job-ları
- Security: RBAC, webhook HMAC/replay, rate‑limit

### 22.2. Qəbul Testləri (Sample)
- Booking convert double‑click → 409 və idempotent nəticə
- SMS DLR gəldikdə status ≤ 10s yenilənir
- Property create + expenses[] → eyni transaksiyada yazılır, audit diff doğrulanır

## 23. Alıcı Sifarişi (Tələbat) — Modul Spesifikasiyası

Müştərinin axtardığı kriteriyaları sistemə qeyd edib aktiv elanlarla uyğunlaşdırmaq (matching) üçün modul.

### 23.1. Model və Sahələr
- BuyerRequest:
  - id (UUID), customer_id (FK), created_by_id (FK), assigned_to_id (FK?)
  - budget_min, budget_max, currency[AZN|USD]
  - locations[] (rayon/küçə və ya region id-ləri), project_names[]?
  - rooms_min, rooms_max, area_min, area_max (m²)
  - property_type[apartment|house|commercial|land]
  - building_type[new|old|panel|monolith|other]?
  - features[] (lift, parking, gas, heating, etc.)
  - must_have_title_deed (bool), repair_status[new|needs_repair|renovated]?
  - priority[low|medium|high]
  - status[NEW|IN_REVIEW|MATCHED|ASSIGNED|CLOSED|CANCELLED|EXPIRED]
  - notes, created_at, updated_at

Qeyd:
- `status=CLOSED` müştəri artıq uyğun əmlak alıb və ya tələbat bağlanıb deməkdir.

### 23.2. Matching Qaydaları
- Yalnız `Property.status=ACTIVE` elanlar namizəd olur.
- Filtrləmə: `price` ∈ [budget_min, budget_max] (valyuta konvertasiyası üçün günlük FX snapshot), `rooms` və `area` intervalları, `property_type`, `building_type`, `locations`, `features` (must‑have featurelər hamısı ödənməlidir).
- Skorlama (0–100):
  - Büdcə uyğunluğu (40%), otaq sayı (20%), sahə (20%), feature uyğunluğu (20%).
- Nəticə limiti: default top‑20; səhifələmə.
- Yenilənmə: manual “Match tap” düyməsi və ya saatlıq job (opsional).

### 23.3. API Endpoints (qısa)
- POST `/api/buyer-requests` — tələbat yaradılması
- GET `/api/buyer-requests?status=ACTIVE|...&customerId=...` — siyahı/filter
- GET `/api/buyer-requests/:id` — detal
- PATCH `/api/buyer-requests/:id` — yeniləmə (status/fields)
- GET `/api/buyer-requests/:id/matches?limit=20` — uyğun əmlakların siyahısı (score ilə)
- POST `/api/buyer-requests/:id/assign/:userId` — agent təyinatı

Bütün mutasiyalar `AuditLog` yazır.

### 23.4. UI Axını
- Müştəri kartında “Tələbat yarat” düyməsi (qısa forma: büdcə, rayon, otaq/sahə aralığı, tip).
- Tələbat siyahısı: filterlər, `status` və `priority` badge-ləri; Kanban (NEW → IN_REVIEW → MATCHED → ASSIGNED → CLOSED).
- Matching görünüşü: sol siyahıda tələbat kriteriyaları, sağda uyğun əmlaklar score ilə; “Bron yarat”/“Əlaqə et” qısa hərəkətləri.

### 23.5. Qəbul Meyarları (AC)
- AC‑BR1: Given minimal kriteriyalar daxil edilib, When tələbat yaradılır, Then status=NEW və audit qeydi yazılır.
- AC‑BR2: Given tələbat, When `GET /buyer-requests/:id/matches` çağırılır, Then yalnız `Property.status=ACTIVE` nəticələr score ilə qaytarılır.
- AC‑BR3: Given valyuta fərqi var, When matching edilir, Then qiymətlər son FX snapshot-a görə AZN-ə çevrilib müqayisə olunur.
- AC‑BR4: Given must‑have features seçilib, When matching edilir, Then həmin feature-ləri daşıyan əmlaklar qaytarılır.
- AC‑BR5: Given tələbat CLOSED edilir, When yenidən matching çağırılır, Then 400/disabled qaytarılır.

### 23.6. Hesabat Inteqrasiyası
- `fact_buyer_requests`: request_id, customer_id, created_at, closed_at, status, priority
- KPI: tələbat→bron çevrilmə faizi, orta cavab müddəti, tələbatın bağlanma müddəti

### 23.7. Təhlükəsizlik
- RBAC: Agent yalnız özünə təyin olunan tələbatları redaktə edə bilər; Manager/Direktor hamısını görə bilər.
- PII: Müştəri məlumatları maskalanır (exportlarda minimal sahələr).
- Audit: bütün `CREATE/UPDATE/ASSIGN/CLOSE` hadisələri `audit_logs`-da saxlanılır.

## 24. Vasitəçilik Satışı İş Axını

Vasitəçilik (brokerage) ilə daxil olan mülklərin xüsusi qaydaları və prosesləri.

### 24.1. Məntiq və Fərqlər
- Əmlak sistemə `listing_type=brokerage` ilə daxil edilir.
- Alış qiyməti və xərclər tələb olunmur (NULL). Büdcə ayrılması prosesi işləmir.
- Mütləq sahələr: `owner_first_name`, `owner_last_name`, `owner_contact`, `brokerage_commission_percent`.
- Komissiya faizi əl ilə daxil edilir; deal zamanı `brokerage_amount` hesablanır.

### 24.2. Model Dəyişiklikləri

- `Property` əlavələri: `listing_type`, `owner_first_name`, `owner_last_name`, `owner_father_name?`, `owner_contact`, `brokerage_commission_percent` (yuxarıda 9-cu bölmədə qeyd olunub).
- `Deal` əlavələri:
  - `deal_type[direct|brokerage]` (default: `direct`; brokerage property-dən avtomatik gəlir)
  - `brokerage_percent`, `brokerage_amount`, `payout_status[pending|approved|paid]`, `payout_date?`, `invoice_no?`, `partner_agency?`, `notes?`.

### 24.3. Qaydalar və Hesablanma

- `deal_type=brokerage` → `brokerage_percent` NOT NULL; bağlanma zamanı `brokerage_amount` serverdə hesablanır və audit diff-ə düşür.
- `brokerage_amount = sale_price * brokerage_percent/100` (icarə üçün 1 aylıq kirayə və ya PRD-də qərar verilən formula).
- Filial komissiyası (FR-6) agency/branch satışlarında tətbiq edilir; brokerage satışlarında yalnız REA INVEST komissiyası və tərəfdaş payı qaydaları tətbiq olunur (detallar admin parametrlərində).

### 24.4. Approval Axını

- Brokerage mülklərdə: Sədr müavini (bütcə) addımı SKIP; qalan addımlar eyni.
- Bütün dəyişikliklər `AuditLog`-a yazılır.

### 24.5. API-lər

- Property yaratmaq: `POST /api/properties` — `listing_type=brokerage` olduqda backend aşağıdakıları yoxlayır:
  - `owner_first_name`, `owner_last_name`, `owner_contact`, `brokerage_commission_percent` MƏCBURİDİR; `purchase_price` və `expenses[]` göndərilərsə 400.
- Deal brokerage detalları: `PATCH /api/deals/:id/brokerage` — {brokerage_percent?, partner_agency?, payout_status?, payout_date?, invoice_no?}

### 24.6. UI Axını

- Property formu: `listing_type` seçimi; brokerage seçilərsə uyğun sahələr aktivləşir, alış/xərc sahələri gizlənir.
- Deal kartında “Vasitəçilik” tabı: komissiya faizi/məbləğ, ödəniş statusu, sənədlər.

### 24.7. Qəbul Meyarları (AC)

- AC‑BRK‑1: Given listing_type=brokerage, When property yaradılır, Then owner_* və commission tələb olunur, acquisition_price/xərc qəbul edilmir (400).
- AC‑BRK‑2: Given listing_type=brokerage, When approval start, Then büdcə addımı SKIP edilir və auditdə qeyd olunur.
- AC‑BRK‑3: Given deal_type=brokerage, When satış bağlanır, Then brokerage_amount doğru formula ilə hesablanır və hesabatlarda düşür.
- AC‑BRK‑4: Given payout_status=paid, When qeyd edilir, Then payout_date və invoice_no tələb olunur.

### 24.8. Hesabatlar

- `fact_deals` genişlənsin: `deal_type`, `brokerage_percent`, `brokerage_amount`, `payout_status`.
- KPI-lar: Brokerage satış sayı, orta komissiya faizi, ödənmiş/borc qalan `brokerage_amount`.

Qeyd: Approval üçün qəbul meyarları §9.4-də toplanıb.
