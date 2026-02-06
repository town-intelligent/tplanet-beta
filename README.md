# TPlanet

TPlanet 平台 - Multi-tenant CMS with LLM RAG & Agent

## 目錄結構

```
tplanet/
├── apps/                         # 應用程式 (獨立 repos)
│   ├── tplanet-AI/               # Frontend (React + Vite) → main
│   ├── tplanet-daemon/           # Backend (Django) → beta
│   ├── LLMTwins/                 # AI Service (FastAPI) → beta-tplanet-AI
│   └── ollama-gateway/           # LLM Gateway → main
│
├── docker-compose.yml            # Base compose
├── docker-compose.beta.yml       # Beta 環境
├── docker-compose.stable.yml     # Stable 環境
├── docker-compose.multi-tenant.yml
├── setup.sh                      # 自動 clone apps + 設定 branch
├── nginx/
└── packages/
    └── multi-tenant/             # 共用套件
```

## 快速開始

```bash
# 1. Clone repo
git clone git@github.com:town-intelligent/tplanet.git
cd tplanet

# 2. 執行 setup.sh 自動 clone 所有 apps 並設定 branch
./setup.sh

# 3. 複製環境變數
cp .env.example .env

# 4. 啟動服務
docker compose -f docker-compose.yml -f docker-compose.beta.yml up -d
```

## 部署指令

```bash
# Beta 環境
docker compose -f docker-compose.yml -f docker-compose.beta.yml up -d

# Stable 環境
docker compose -f docker-compose.yml -f docker-compose.stable.yml up -d

# Multi-tenant 環境
docker compose -f docker-compose.yml -f docker-compose.multi-tenant.yml up -d
```

## Apps 分支對應

| App | Branch | 說明 |
|-----|--------|------|
| tplanet-AI | main | Frontend |
| tplanet-daemon | beta | Backend with multi-tenant |
| LLMTwins | beta-tplanet-AI | AI Service |
| ollama-gateway | main | LLM Gateway |

## 開發流程

各 app 在 `apps/` 內保持獨立的 git repo：

```bash
# 開發 frontend
cd apps/tplanet-AI
git pull origin main
# ... 修改 ...
git add . && git commit && git push

# 開發 backend
cd apps/tplanet-daemon
git pull origin beta
# ... 修改 ...
git add . && git commit && git push
```

## Multi-tenant 測試網址

| 網址 | Tenant |
|------|--------|
| https://multi-tenant.4impact.cc | default |
| https://nantou.multi-tenant.4impact.cc | nantou-gov |

## 架構

```
                    ┌─────────────────┐
                    │     Nginx       │
                    │  (X-Tenant-ID)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Frontend     │ │    Backend      │ │   LLMTwins      │
│   tplanet-AI    │ │ tplanet-daemon  │ │    Wrapper      │
│  (React/Vite)   │ │    (Django)     │ │   (FastAPI)     │
└─────────────────┘ └────────┬────────┘ └────────┬────────┘
                             │                   │
                    ┌────────┴────────┐          ▼
                    │   Databases     │   ┌─────────────┐
                    │  (per tenant)   │   │  LLMTwins   │
                    └─────────────────┘   │  (RAG/AI)   │
                                          └──────┬──────┘
                                                 │
                                          ┌──────▼──────┐
                                          │   Ollama    │
                                          │   Gateway   │
                                          └──────┬──────┘
                                                 │
                                          ┌──────▼──────┐
                                          │   Ollama    │
                                          │    (LLM)    │
                                          └─────────────┘
```

## 新增 Tenant

1. 編輯 `apps/tplanet-daemon/backend/config/tenants.yml`
2. 建立對應的資料庫
3. 新增 tenant 媒體檔案到 `apps/tplanet-AI/public/assets/tenants/{tenant}/`
4. 更新 `apps/tplanet-AI/src/utils/TenantContext.jsx` 的 `TENANT_CONFIG`
5. 設定 DNS + Nginx (`nginx/` 目錄)
6. 重啟服務
