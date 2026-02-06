# TPlanet Deploy

TPlanet 部署專用 Repo - Microservices 架構

## 目錄結構

```
tplanet-deploy/
├── apps/                         # 應用程式 (獨立 repos)
│   ├── tplanet-AI/               # Frontend repo
│   ├── tplanet-daemon/           # Backend repo
│   ├── LLMTwins/                 # AI Service repo
│   └── ollama-gateway/           # LLM Gateway repo
│
├── docker-compose.yml            # Base compose
├── docker-compose.beta.yml       # Beta 環境
├── docker-compose.stable.yml     # Stable 環境
├── docker-compose.multi-tenant.yml
├── setup.sh                      # 自動 clone apps
├── nginx/
└── packages/
    └── multi-tenant/             # 共用套件
```

## 快速開始

```bash
# 1. Clone deploy repo
git clone git@github.com:town-intelligent/tplanet-deploy.git
cd tplanet-deploy

# 2. 執行 setup.sh 自動 clone 所有 apps
./setup.sh

# 3. 啟動服務
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
git pull origin main
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
3. 設定 DNS + Nginx (`nginx/` 目錄)
4. 重啟服務
