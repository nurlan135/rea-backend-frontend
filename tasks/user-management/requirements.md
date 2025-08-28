# İstifadəçi İdarəetmə Sistemi - Tələblər (Requirements)

## İcmal

Bu sənəd REA INVEST əmlak idarəetmə sistemi üçün Admin Panel-də İstifadəçi İdarəetmə modulunun hərtərəfli implementasiyası üçün istifadəçi hekayələri və qəbul meyarlarını EARS (Easy Approach to Requirements Syntax) formatında təsvir edir.

## Kontekst və Problemin Təsviri

**Problem**: Sistemdə hazırda admin istifadəçi rollarını və icazələrini idarə edə bilmək üçün müstəqil interfeys mövcud deyil. İstifadəçi yaratma, rol dəyişdirməsi və icazə təyini manual database əməliyyatları tələb edir.

**Biznes Konteksti**: REA INVEST sistemində 5 əsas rol var:
- `admin`: Sistem administratoru - tam giriş, bütün istifadəçiləri idarə edə bilər
- `director`: Direktor - yüksək səviyyəli qərarlar və sistem konfiqurasiyası
- `vp`: Sədr müavini (Vice President) - büdcə və strateji qərarlar
- `manager`: Manager - filial/komanda idarəetmə və agent yarada bilər  
- `agent`: Agent - əmlak və müştəri idarəetmə

**Təhlükəsizlik Konteksti**: RBAC (Role-Based Access Control) sistemi, audit trail və PDPL uyğunluğu tələb olunur.

## User Stories (EARS Format)

### US-01: İstifadəçi Siyahısı və Filtrlər

#### US-01.1: İstifadəçi Siyahısının Göstərilməsi
**WHEN** admin İstifadəçi İdarəetmə səhifəsinə daxil olur  
**THEN** sistem bütün istifadəçilərin siyahısını göstərməlidir  
**AND** hər istifadəçi üçün əsas məlumatları (ad, email, rol, status, son giriş) göstərməlidir

**Acceptance Criteria:**
- AC-01.1.1: Siyahıda ad, soyad, email, rol, filial, status və son giriş tarixi göstərilir
- AC-01.1.2: Server-side pagination tətbiq edilir (20 istifadəçi hər səhifədə)
- AC-01.1.3: Rol badge-ləri fərqli rənglər ilə göstərilir
- AC-01.1.4: Status indikatorları (aktiv/qeyri-aktiv/dayandırılıb) aydın şəkildə göstərilir
- AC-01.1.5: Son giriş tarixi relative format-da göstərilir (məs: "2 gün əvvəl")

#### US-01.2: İstifadəçi Axtarışı və Filtrlər
**WHEN** admin istifadəçiləri axtarır  
**THEN** sistem ad, email və filial üzrə axtarış imkanı təqdim etməlidir  
**AND** rol və status üzrə filtrlər olmalıdır

**Acceptance Criteria:**
- AC-01.2.1: Real-time axtarış ad/soyad və email sahələri üzrə
- AC-01.2.2: Rol filtri: hamısı/admin/director/vp/manager/agent
- AC-01.2.3: Status filtri: hamısı/aktiv/qeyri-aktiv/dayandırılıb
- AC-01.2.4: Filial filtri: dropdown ilə mövcud filiallar
- AC-01.2.5: Filtrlər URL parametrləri ilə persist edilir
- AC-01.2.6: "Filtirləri sıfırla" funksionallığı

### US-02: İstifadəçi Yaratma və Redaktə

#### US-02.1: Yeni İstifadəçi Yaratma
**WHEN** admin "Yeni İstifadəçi" düyməsini basır  
**THEN** sistem istifadəçi yaratma formasını açmalıdır  
**AND** məcburi sahələr doldurulduqda istifadəçi yaradılmalıdır

**Acceptance Criteria:**
- AC-02.1.1: Məcburi sahələr: ad, soyad, email, rol
- AC-02.1.2: Opsional sahələr: telefon, filial kodu (rol əsaslı)
- AC-02.1.3: Email unikallıq yoxlaması real-time olaraq
- AC-02.1.4: Rol seçimi ilə icazələr avtomatik təyin edilir
- AC-02.1.5: Password avtomatik generasiya edilir
- AC-02.1.6: Form validasiya Zod schema ilə həyata keçirilir
- AC-02.1.7: Uğurlu yaratma halında sistem toast notification göstərir

#### US-02.2: Mövcud İstifadəçinin Redaktəsi  
**WHEN** admin istifadəçi sətirindəki edit düyməsini basır  
**THEN** sistem redaktə formasını açmalıdır  
**AND** dəyişikliklər qeydə alınmalıdır

**Acceptance Criteria:**
- AC-02.2.1: Bütün sahələr (password xaric) redaktə edilə bilər
- AC-02.2.2: Rol dəyişikliyi halında icazələr avtomatik yenilənir
- AC-02.2.3: Admin özünün rolunu aşağı sala bilməz
- AC-02.2.4: Superadmin hesabını dəyişə bilməz
- AC-02.2.5: Email dəyişikliyi yenidən unikallıq yoxlaması tətbiq edir
- AC-02.2.6: Bütün dəyişikliklər audit log-a yazılır

#### US-02.3: İstifadəçi İcazələrinin İdarəsi
**WHEN** admin istifadəçinin icazələrini redaktə edir  
**THEN** sistem rol əsaslı default icazələri göstərməlidir  
**AND** custom icazələr əlavə edilə bilməlidir

**Acceptance Criteria:**
- AC-02.3.1: İcazələr kateqoriya üzrə qruplaşdırılır (əmlak, istifadəçi, hesabat, sistem)
- AC-02.3.2: Rol əsaslı default icazələr avtomatik seçilir
- AC-02.3.3: Custom icazələr əlavə edilə və ya çıxarıla bilər
- AC-02.3.4: Icazə dəyişiklikləri visual diff ilə göstərilir
- AC-02.3.5: İcazə təsvirləri Azerbaijani dilində aydın şəkildə yazılır
- AC-02.3.6: Təhlükəli icazələr (sistem konfigurası) xüsusi rənglə işarələnir

### US-03: İstifadəçi Status İdarəsi və Təhlükəsizlik

#### US-03.1: İstifadəçi Status Dəyişdirməsi
**WHEN** admin istifadəçinin statusunu dəyişir  
**THEN** sistem dərhal status-u yeniləməlidir  
**AND** həmin istifadəçi növbəti girişində yeni status qüvvəyə minməlidir

**Acceptance Criteria:**
- AC-03.1.1: Aktiv → Qeyri-aktiv: istifadəçi sistemə girə bilməz
- AC-03.1.2: Aktiv → Dayandırılıb: mövcud sessions ləğv edilir
- AC-03.1.3: Status dəyişikliyi dərhal AuthContext-də əks etdirilir
- AC-03.1.4: Admin özünün statusunu dəyişə bilməz
- AC-03.1.5: Status dəyişikliyi səbəbi qeyd edilə bilər
- AC-03.1.6: Status dəyişikliyi audit log-a yazılır

#### US-03.2: Password İdarəetməsi
**WHEN** admin istifadəçinin password-ını reset edir  
**THEN** sistem temporary password generasiya etməlidir  
**AND** istifadəçi növbəti girişində password dəyişdirməyə məcbur olmalıdır

**Acceptance Criteria:**
- AC-03.2.1: "Password Reset" düyməsi hər istifadəçi üçün mövcuddur
- AC-03.2.2: Temporary password 8 simvol, kompleks və unikal olmalıdır
- AC-03.2.3: Password həm screen-də göstərilir həm də clipboard-a kopyalanır
- AC-03.2.4: force_password_change flag-ı true olaraq təyin edilir
- AC-03.2.5: Password reset hadisəsi audit log-a yazılır
- AC-03.2.6: İstifadəçi növbəti girişində yeni password təyin etməlidir

#### US-03.3: Hesab Kilidinin Açılması
**WHEN** istifadəçi hesabı yanlış password cəhdləri səbəbindən klidlənib  
**THEN** admin "Kilidi Aç" düyməsi ilə hesabı unlock edə bilməlidir  
**AND** istifadəçi dərhal yenidən giriş cəhdi edə bilməlidir

**Acceptance Criteria:**
- AC-03.3.1: Klidlənmiş hesablar siyahıda xüsusi işarə ilə göstərilir
- AC-03.3.2: "Kilidi Aç" düyməsi yalnız klidlənmiş hesablar üçün aktiv
- AC-03.3.3: Unlock əməliyyatı login_attempts-ı 0-a endirir
- AC-03.3.4: locked_until timestamp-ı clear edilir
- AC-03.3.5: Unlock hadisəsi audit log-a yazılır
- AC-03.3.6: İstifadəçiyə sistem bildirişi göndərilir (opsional)

### US-04: Rol Əsaslı Giriş Məhdudiyyətləri

#### US-04.1: RBAC Tətbiqi
**WHEN** admin olmayan istifadəçi İstifadəçi İdarəetmə səhifəsinə daxil olmaq istəyir  
**THEN** sistem 403 Forbidden xətası qaytarmalıdır  
**AND** istifadəçi unauthorized səhifəsinə yönləndirilməlidir

**Acceptance Criteria:**
- AC-04.1.1: Yalnız admin rollu istifadəçilər giriş edə bilər
- AC-04.1.2: Backend API endpointləri requireRole(['admin']) middleware-i istifadə edir
- AC-04.1.3: Frontend komponenti hasPermission('users:manage') yoxlaması edir
- AC-04.1.4: Unauthorized giriş cəhdi audit log-a yazılır
- AC-04.1.5: Navigation menu-da link yalnız admin üçün göstərilir

#### US-04.2: IP Whitelisting
**WHEN** admin əməliyyatları icra edilir  
**THEN** sistem IP ünvanını yoxlamalıdır  
**AND** whitelist-də olmayan IP-lər əməliyyat icra edə bilməməlidir

**Acceptance Criteria:**
- AC-04.2.1: Admin əməliyyatları üçün IP whitelist yoxlaması
- AC-04.2.2: Whitelist konfigurası environment variable ilə təyin edilir
- AC-04.2.3: VPN IP aralıqları dəstəklənir
- AC-04.2.4: Qeyri-qanuni IP cəhdi audit log-a yazılır
- AC-04.2.5: IP restriction bypass yalnız superadmin üçün mümkündür

### US-05: Audit və Compliance

#### US-05.1: Hərtərəfli Audit Trail
**WHEN** admin istifadəçi məlumatlarında dəyişiklik edir  
**THEN** sistem bütün dəyişiklikləri detail audit log-da saxlamalıdır  
**AND** before/after state qeyd edilməlidir

**Acceptance Criteria:**
- AC-05.1.1: Bütün CRUD əməliyyatları audit log-a yazılır
- AC-05.1.2: Actor (admin), timestamp, IP address qeyd edilir
- AC-05.1.3: Before və after state JSON formatında saxlanılır
- AC-05.1.4: Rol və icazə dəyişiklikləri ayrıca izlənilir
- AC-05.1.5: Password reset və unlock əməliyyatları loglanır
- AC-05.1.6: Audit loglar 5+ il müddətində saxlanılır

#### US-05.2: PDPL Uyğunluğu
**WHEN** istifadəçi məlumatları işlənir  
**THEN** sistem şəxsi məlumat qoruma qaydalarına uymalıdır  
**AND** məlumat minimize edilməlidir

**Acceptance Criteria:**
- AC-05.2.1: Şəxsi məlumatlar loglarda maskalanır (məs: email → a***@***.com)
- AC-05.2.2: Yalnız lazım olan sahələr databasedə saxlanılır
- AC-05.2.3: İstifadəçi silmə əməliyyatında məlumatlar anonimləşdirilir
- AC-05.2.4: Məlumat ixracı zamanı PII sahələr filter edilir
- AC-05.2.5: Data retention policy tətbiq edilir

### US-06: Performans və İstifadəçi Təcrübəsi

#### US-06.1: Sürətli Yükləmə və Cavabverics
**WHEN** admin İstifadəçi İdarəetmə səhifəsini açır  
**THEN** sistem 2 saniyədən tez yüklənməlidir  
**AND** məlumatlar progressive şəkildə göstərilməlidir

**Acceptance Criteria:**
- AC-06.1.1: İlkin səhifə yükləmə müddəti P95 <2s
- AC-06.1.2: API response müddəti P95 <500ms
- AC-06.1.3: Server-side pagination 1000+ istifadəçi üçün optimize edilib
- AC-06.1.4: Lazy loading images və heavy komponentlər
- AC-06.1.5: Skeleton loading states tətbiq edilib
- AC-06.1.6: Debounced search 300ms delay ilə

#### US-06.2: Responsiv və Accessible UI
**WHEN** admin müxtəlif cihazlardan sistem istifadə edir  
**THEN** interfeys tam funksional olmalıdır  
**AND** accessibility standartlarına uymalıdır

**Acceptance Criteria:**
- AC-06.2.1: Desktop, tablet və mobile tam dəstəklənir
- AC-06.2.2: Keyboard navigation 100% işləyir
- AC-06.2.3: Screen reader compatibility WCAG 2.1 AA səviyyəsində
- AC-06.2.4: Color contrast minimum 4.5:1 ratio
- AC-06.2.5: Focus management düzgün tətbiq edilib
- AC-06.2.6: Error messages aydın və actionable-dır

## Business Rules və Constraints

### İstifadəçi Hierarchiyası Qaydaları
1. **Self-modification restrictions**: İstifadəçi özünün rolunu aşağı sala bilməz
2. **Superadmin protection**: Superadmin hesabı heç kim tərəfindən dəyişdirilə bilməz
3. **Role hierarchy**: Admin < Director < VP < Manager < Agent
4. **Branch assignment**: Manager və Agent rollər üçün branch_code məcburi
5. **Permission inheritance**: Yuxarı rol aşağı rol icazələrini avtomatik alır
6. **Account lockout**: 5 uğursuz giriş cəhdi hesabı 15 dəqiqə kilitleir
7. **Password policy**: Minimum 8 simvol, böyük və kiçik hərf, rəqəm və xüsusi simvol

### Texniki Constraints
1. **Performance**: API response müddəti P95 <500ms
2. **Scalability**: 1000+ istifadəçi dəstəklənir
3. **Browser support**: Chrome/Edge/Firefox son 2 versiyası
4. **Database**: PostgreSQL JSONB permissions field
5. **Security**: TLS 1.2+, bcrypt password hashing
6. **Audit**: 5+ il məlumat saxlama
7. **Localization**: Tam Azerbaijani UI dəstəyi

## Error Scenarios və Edge Cases

### EC-01: Concurrent Modification
**WHEN** iki admin eyni istifadəçini eyni zamanda dəyişir  
**THEN** sistem optimistic locking tətbiq etməlidir  
**AND** ikinci dəyişiklik conflict xətası almalıdır

**Acceptance Criteria:**
- Version-based optimistic locking
- Clear conflict resolution mesajı
- Auto-refresh data with latest changes
- User confirmation for overwrite

### EC-02: Role Dependency Checking
**WHEN** admin directory rollu istifadəçini silməyə çalışır  
**THEN** sistem aktiv property və deal-ları yoxlamalıdır  
**AND** dependency varsa silinməyə imkan verməməlidir

**Acceptance Criteria:**
- Active property/deal dependency check
- Transfer ownership workflow təklifi
- Force delete option for admin (audit edilir)
- Clear error messaging about dependencies

### EC-03: Bulk Operations
**WHEN** admin multiple istifadəçilər üzərində bulk əməliyyat edir  
**THEN** sistem batch processing tətbiq etməlidir  
**AND** partial failure halında clear reporting olmalıdır

**Acceptance Criteria:**
- Checkbox selection for bulk operations
- Progress indicator for long operations
- Partial success/failure reporting
- Rollback capability for critical failures

## API Specifications

### Core Endpoints
- `GET /api/users` - İstifadəçi siyahısı (pagination, filters, search)
- `GET /api/users/:id` - İstifadəçi detalları
- `POST /api/users` - Yeni istifadəçi yaratma
- `PATCH /api/users/:id` - İstifadəçi məlumatlarını yeniləmə
- `DELETE /api/users/:id` - İstifadəçi silmə (soft delete)
- `POST /api/users/:id/reset-password` - Password reset
- `POST /api/users/:id/unlock` - Account unlock
- `GET /api/users/permissions` - Mövcud icazələrin siyahısı

### Request/Response Formats
```typescript
// GET /api/users response
interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  filters: FilterState;
}

// POST /api/users request
interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  branch_code?: string;
  permissions?: string[];
  status?: UserStatus;
}

// PATCH /api/users/:id request  
interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  branch_code?: string;
  permissions?: string[];
  status?: UserStatus;
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
}
```

## Success Metrics

### Functional Metrics
1. **User Management Accuracy**: 100% CRUD əməliyyat uğuru
2. **Role Assignment Accuracy**: 100% düzgün icazə təyini
3. **Search Functionality**: 100% axtarış nəticələrinin düzgünlüğü
4. **Audit Completeness**: 100% əməliyyat audit coverage
5. **Permission Enforcement**: 100% RBAC qaydalarına uyğunluq

### Performance Metrics
1. **Page Load Time**: P95 <2s, P99 <3s
2. **API Response Time**: P95 <500ms, P99 <800ms
3. **Search Response**: P95 <300ms
4. **Bulk Operations**: 100 istifadəçi <30s
5. **Concurrent Users**: 10+ admin eyni zamanda

### User Experience Metrics
1. **Form Completion Rate**: >95% uğurlu istifadəçi yaratma
2. **Error Recovery**: >90% user error-lardan recovery
3. **Mobile Usability**: 100% functionality mobil cihazlarda
4. **Accessibility Score**: WCAG 2.1 AA 100% uyğunluq
5. **User Satisfaction**: >4.5/5 admin feedback

Bu requirements REA INVEST sistemi üçün tam funksional və təhlükəsiz İstifadəçi İdarəetmə modulunun implementasiyasını təmin edəcək.