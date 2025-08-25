# PostgreSQL və pgAdmin Docker Quraşdırımı

Bu layihədə PostgreSQL və pgAdmin Docker konteynerləri ilə quraşdırılmışdır.

## Servislər

### PostgreSQL
- **Port**: 5432
- **Verilənlər bazası**: myapp_db
- **İstifadəçi adı**: admin
- **Şifrə**: admin123

### pgAdmin
- **URL**: http://localhost:8080
- **E-poçt**: admin@admin.com
- **Şifrə**: admin123

## Əsas Əmrlər

### Konteyneri işə salma
```bash
docker-compose up -d
```

### Konteynerlərin statusunu yoxlama
```bash
docker-compose ps
```

### Konteynerləri dayandırma
```bash
docker-compose down
```

### Konteynerləri və verilənləri silmək
```bash
docker-compose down -v
```

### Logları görməK
```bash
# Bütün servislər
docker-compose logs

# Yalnız PostgreSQL
docker-compose logs postgres

# Yalnız pgAdmin
docker-compose logs pgadmin
```

## pgAdmin ilə PostgreSQL-ə qoşulma

1. Brauzerinizde http://localhost:8080 ünvanını açın
2. admin@admin.com / admin123 ilə daxil olun
3. Yeni server əlavə edin:
   - **Adı**: PostgreSQL (istəyə görə)
   - **Host**: postgres (konteyner adı)
   - **Port**: 5432
   - **Verilənlər bazası**: myapp_db
   - **İstifadəçi adı**: admin
   - **Şifrə**: admin123

## Xarici tətbiqlərdən qoşulma

Xarici tətbiqlərdən (Node.js, Python və s.) qoşulmaq üçün:
- **Host**: localhost
- **Port**: 5432
- **Database**: myapp_db
- **Username**: admin
- **Password**: admin123

## Qeydlər

- Verilənlər Docker volume-larda saxlanılır və konteyner restart edildikdə qorunur
- pgAdmin konfiqurasiyası da volume-da saxlanılır
- Şifrələri dəyişmək istəsəniz docker-compose.yml faylını redaktə edin və `docker-compose up --force-recreate -d` əmrini çalışdırın
