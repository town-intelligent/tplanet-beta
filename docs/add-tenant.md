# 新增租戶 SOP

新增一個租戶 (例如 `xxx.4impact.cc`) 的標準作業流程。

## 前置資訊

| 項目 | 範例值 |
|------|--------|
| Tenant ID | `xxx` |
| 網址 | `xxx.4impact.cc` |
| 顯示名稱 | `XXX 公司` |
| 主題色 | `#3b82f6` |
| 資料庫名稱 | `tplanet_xxx` |

---

## Step 1: Frontend - TenantContext 配置

編輯 `apps/tplanet-AI/src/utils/TenantContext.jsx`：

```jsx
const TENANT_CONFIG = {
  // ... 現有租戶 ...

  "xxx": {
    id: "xxx",
    name: "XXX 公司",
    primaryColor: "#3b82f6",
    bannerBg: "#1e40af",
    logo: "/assets/tenants/xxx/logo.svg",
    favicon: "/assets/tenants/xxx/favicon.ico",
  },
};
```

更新 `detectTenant()` 函數：

```jsx
function detectTenant() {
  const hostname = window.location.hostname;

  if (hostname.startsWith("xxx.")) return "xxx";
  if (hostname.startsWith("nantou.")) return "nantou-gov";

  return "default";
}
```

---

## Step 2: Frontend - 媒體檔案

```bash
# 建立租戶資料夾
mkdir -p apps/tplanet-AI/public/assets/tenants/xxx/

# 放入 logo 和 favicon
cp /path/to/xxx-logo.svg apps/tplanet-AI/public/assets/tenants/xxx/logo.svg
cp /path/to/xxx-favicon.ico apps/tplanet-AI/public/assets/tenants/xxx/favicon.ico
```

---

## Step 3: Backend - tenants.yml

編輯 `apps/tplanet-daemon/backend/config/tenants.yml`：

```yaml
tenants:
  default:
    # ... 現有 ...

  nantou-gov:
    # ... 現有 ...

  xxx:
    name: "XXX 公司"
    domains:
      - "xxx.4impact.cc"
      - "xxx.multi-tenant.4impact.cc"  # 測試用
    database:
      name: "tplanet_xxx"
      host: "${XXX_DB_HOST:-db-xxx}"
      user: "${XXX_DB_USER:-postgres}"
      password: "${XXX_DB_PASSWORD}"
    features:
      ai_secretary: true
```

---

## Step 4: 建立資料庫

### 方法 A: 使用現有 DB Server

```bash
# 連線到 PostgreSQL
psql -h <db-host> -U postgres

# 建立資料庫
CREATE DATABASE tplanet_xxx;
\q

# 執行 migration
cd apps/tplanet-daemon
python backend/manage.py migrate --database=xxx
```

### 方法 B: 使用獨立 DB Container

編輯 `docker-compose.multi-tenant.yml`：

```yaml
services:
  db-xxx:
    image: postgres:15-alpine
    container_name: tplanet-db-xxx
    environment:
      POSTGRES_DB: ${XXX_DB_NAME:-tplanet_xxx}
      POSTGRES_USER: ${XXX_DB_USER:-postgres}
      POSTGRES_PASSWORD: ${XXX_DB_PASSWORD}
    volumes:
      - db_xxx_data:/var/lib/postgresql/data
    networks:
      - tplanet-net

volumes:
  db_xxx_data:
```

---

## Step 5: 環境變數

編輯 `.env`：

```bash
# XXX Tenant Database
XXX_DB_NAME=tplanet_xxx
XXX_DB_HOST=db-xxx
XXX_DB_USER=postgres
XXX_DB_PASSWORD=your-secure-password
```

---

## Step 6: DNS 設定

在 DNS 管理介面新增 A Record：

```
xxx.4impact.cc  →  <server-ip>
```

---

## Step 7: Nginx 設定

編輯 `nginx/multi-tenant.4impact.cc` 或新增設定：

```nginx
server {
    listen 443 ssl;
    server_name xxx.4impact.cc;

    ssl_certificate /etc/letsencrypt/live/4impact.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/4impact.cc/privkey.pem;

    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-ID xxx;
    }

    location /api {
        proxy_pass http://backend:5567;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-ID xxx;
    }
}
```

---

## Step 8: 部署

```bash
cd /path/to/tplanet

# 重新啟動服務
docker compose -f docker-compose.yml -f docker-compose.multi-tenant.yml up -d

# 確認服務狀態
docker compose ps
```

---

## Step 9: 驗證

1. 訪問 `https://xxx.4impact.cc`
2. 確認顯示正確的租戶 banner (如果有)
3. 測試登入功能
4. 測試 AI 秘書功能
5. 確認資料庫隔離 (不同租戶看不到彼此資料)

---

## Checklist

- [ ] TenantContext.jsx 新增配置
- [ ] detectTenant() 新增判斷
- [ ] 媒體檔案放入 public/assets/tenants/xxx/
- [ ] tenants.yml 新增租戶
- [ ] 資料庫建立完成
- [ ] .env 環境變數設定
- [ ] DNS A Record 設定
- [ ] Nginx 設定
- [ ] 服務重啟
- [ ] 功能驗證通過
