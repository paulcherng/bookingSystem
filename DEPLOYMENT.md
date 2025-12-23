# 多店家預約系統部署指南

本指南將協助您將多店家預約系統部署到 Vercel 平台，並完成所有必要的設定。

## 目錄

1. [前置準備](#前置準備)
2. [Vercel 部署步驟](#vercel-部署步驟)
3. [環境變數設定](#環境變數設定)
4. [資料庫設定](#資料庫設定)
5. [外部服務整合](#外部服務整合)
6. [部署後驗證](#部署後驗證)
7. [故障排除](#故障排除)

## 前置準備

### 必要帳戶
在開始部署前，請確保您已擁有以下帳戶：

- [Vercel 帳戶](https://vercel.com)
- [GitHub 帳戶](https://github.com) (用於程式碼託管)
- [LINE Developers 帳戶](https://developers.line.biz/) (用於 LINE Bot 整合)
- [SendGrid 帳戶](https://sendgrid.com) (用於電子郵件服務)

### 本地開發環境
- Node.js 18.0 或更高版本
- npm 或 yarn 套件管理器
- Git

## Vercel 部署步驟

### 步驟 1: 準備程式碼庫

1. **推送程式碼到 GitHub**
   ```bash
   # 如果尚未初始化 git repository
   git init
   git add .
   git commit -m "Initial commit"
   
   # 推送到指定的 repository
   git remote add origin https://github.com/paulcherng/bookingSystem.git
   git branch -M main
   git push -u origin main
   ```

### 步驟 2: 連接 Vercel

1. **登入 Vercel Dashboard**
   - 前往 [Vercel Dashboard](https://vercel.com/dashboard)
   - 使用您的 GitHub 帳戶登入

2. **匯入專案**
   - 點擊 "New Project"
   - 選擇 "Import Git Repository"
   - 選擇 `paulcherng/bookingSystem` repository
   - 點擊 "Import"

### 步驟 3: 設定專案

1. **專案設定**
   - Project Name: `booking-system` (或您偏好的名稱)
   - Framework Preset: `Next.js`
   - Root Directory: `./` (保持預設)

2. **建置設定**
   - Build Command: `npm run vercel-build` (已在 package.json 中設定)
   - Output Directory: `.next` (Next.js 預設)
   - Install Command: `npm install`

3. **點擊 "Deploy"**
   - 初次部署可能會失敗，因為尚未設定環境變數
   - 這是正常現象，我們將在下一步設定環境變數

## 環境變數設定

### 步驟 1: 設定 Vercel 環境變數

1. **進入專案設定**
   - 在 Vercel Dashboard 中，進入您的專案
   - 點擊 "Settings" 標籤
   - 選擇 "Environment Variables"

2. **新增環境變數**
   根據以下清單新增所有必要的環境變數：

#### 資料庫設定 (Supabase)
```
名稱: DATABASE_URL
值: postgres://postgres.jxgrhjtonxnoyjixyvqc:3XVb7IvlLaKJ8poC@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
環境: Production, Preview, Development

名稱: POSTGRES_URL
值: postgres://postgres.jxgrhjtonxnoyjixyvqc:3XVb7IvlLaKJ8poC@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
環境: Production, Preview, Development

名稱: POSTGRES_URL_NON_POOLING
值: postgres://postgres.jxgrhjtonxnoyjixyvqc:3XVb7IvlLaKJ8poC@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
環境: Production, Preview, Development

名稱: POSTGRES_PRISMA_URL
值: postgres://postgres.jxgrhjtonxnoyjixyvqc:3XVb7IvlLaKJ8poC@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
環境: Production, Preview, Development

名稱: SUPABASE_URL
值: https://jxgrhjtonxnoyjixyvqc.supabase.co
環境: Production, Preview, Development

名稱: SUPABASE_ANON_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Z3JoanRvbnhub3lqaXh5dnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzM2ODEsImV4cCI6MjA4MjA0OTY4MX0.OtzHVZzfvRtiW0d4n74PC5qHwpg2pVDW7DQUlFcARrE
環境: Production, Preview, Development

名稱: SUPABASE_SERVICE_ROLE_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Z3JoanRvbnhub3lqaXh5dnFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ3MzY4MSwiZXhwIjoyMDgyMDQ5NjgxfQ.Mfu102z4k2wU8-htTOqNL7d7gc4LcqEMoUc3AIWXCBc
環境: Production, Preview, Development

名稱: NEXT_PUBLIC_SUPABASE_URL
值: https://jxgrhjtonxnoyjixyvqc.supabase.co
環境: Production, Preview, Development

名稱: NEXT_PUBLIC_SUPABASE_ANON_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Z3JoanRvbnhub3lqaXh5dnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzM2ODEsImV4cCI6MjA4MjA0OTY4MX0.OtzHVZzfvRtiW0d4n74PC5qHwpg2pVDW7DQUlFcARrE
環境: Production, Preview, Development
```

#### LINE Bot API 設定
```
名稱: LINE_CHANNEL_ID
值: 您的 LINE Channel ID
環境: Production, Preview, Development

名稱: LINE_CHANNEL_SECRET
值: 您的 LINE Channel Secret
環境: Production, Preview, Development

名稱: LINE_CHANNEL_ACCESS_TOKEN
值: 您的 LINE Channel Access Token
環境: Production, Preview, Development
```

#### SendGrid 設定
```
名稱: SENDGRID_API_KEY
值: 您的 SendGrid API Key
環境: Production, Preview, Development

名稱: SENDGRID_FROM_EMAIL
值: noreply@yourdomain.com
環境: Production, Preview, Development
```

#### NextAuth 設定
```
名稱: NEXTAUTH_SECRET
值: 隨機生成的 32 字元密鑰
環境: Production, Preview, Development

名稱: NEXTAUTH_URL
值: https://your-domain.vercel.app
環境: Production, Preview, Development
```

#### 應用程式設定
```
名稱: NODE_ENV
值: production
環境: Production

名稱: WEBHOOK_BASE_URL
值: https://your-domain.vercel.app
環境: Production, Preview, Development
```

### 步驟 2: 生成安全密鑰

**生成 NEXTAUTH_SECRET:**
```bash
# 使用 OpenSSL 生成隨機密鑰
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 資料庫設定

### 選項 A: 使用 Supabase PostgreSQL (推薦)

1. **建立 Supabase 專案**
   - 前往 [Supabase Dashboard](https://supabase.com/dashboard)
   - 點擊 "New Project"
   - 選擇您的組織
   - 輸入專案名稱 (例如: `booking-system`)
   - 輸入資料庫密碼 (請記住此密碼)
   - 選擇區域 (建議選擇與您的 Vercel 部署相同的區域)
   - 點擊 "Create new project"

2. **取得資料庫連接字串**
   - 專案建立完成後，前往 "Settings" > "Database"
   - 在 "Connection string" 區域找到 "URI"
   - 複製連接字串，格式如下：
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
   - 將 `[YOUR-PASSWORD]` 替換為您設定的資料庫密碼

3. **設定 Supabase 環境變數**
   在 Vercel 中新增以下環境變數：
   ```
   名稱: DATABASE_URL
   值: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   環境: Production, Preview, Development
   
   名稱: SUPABASE_URL
   值: https://[PROJECT-REF].supabase.co
   環境: Production, Preview, Development
   
   名稱: SUPABASE_ANON_KEY
   值: 您的 Supabase Anonymous Key
   環境: Production, Preview, Development
   ```

4. **取得 Supabase API Keys**
   - 在 Supabase Dashboard 中，前往 "Settings" > "API"
   - 複製 "Project URL" 和 "anon public" key
   - 這些將用於前端直接連接 (如果需要)

### 選項 B: 使用 Vercel Postgres

1. **在 Vercel Dashboard 中**
   - 進入您的專案
   - 點擊 "Storage" 標籤
   - 點擊 "Create Database"
   - 選擇 "Postgres"
   - 輸入資料庫名稱 (例如: `booking-system-db`)
   - 選擇區域 (建議選擇與您的應用程式相同的區域)
   - 點擊 "Create"

2. **取得資料庫連接字串**
   - 資料庫建立後，Vercel 會自動將 `DATABASE_URL` 新增到您的環境變數
   - 您可以在 "Settings" > "Environment Variables" 中確認

### 步驟 2: 執行資料庫遷移

#### 使用 Supabase 的遷移步驟

1. **本地設定**
   ```bash
   # 複製環境變數範本
   cp .env.example .env.local
   
   # 編輯 .env.local，填入您的 Supabase 連接資訊
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   SUPABASE_URL="https://[PROJECT-REF].supabase.co"
   SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```

2. **執行遷移**
   ```bash
   # 生成 Prisma Client
   npm run db:generate
   
   # 推送資料庫 schema 到 Supabase
   npm run db:push
   
   # 執行種子資料 (可選)
   npm run db:seed
   ```

3. **驗證 Supabase 中的資料表**
   - 前往 Supabase Dashboard
   - 點擊 "Table Editor"
   - 確認所有資料表已正確建立：
     - stores
     - business_hours
     - barbers
     - services
     - bookings
     - message_logs

#### 使用 Vercel Postgres 的遷移步驟

1. **本地設定**
   ```bash
   # 複製環境變數範本
   cp .env.example .env.local
   
   # 編輯 .env.local，填入您的資料庫連接字串
   # DATABASE_URL="your_vercel_postgres_connection_string"
   ```

2. **執行遷移**
   ```bash
   # 生成 Prisma Client
   npm run db:generate
   
   # 推送資料庫 schema
   npm run db:push
   
   # 執行種子資料 (可選)
   npm run db:seed
   ```

### 步驟 3: 生產環境資料庫遷移

部署後，資料庫遷移會自動執行，因為我們在 `package.json` 中設定了 `postinstall` 腳本。

如需手動執行遷移：
```bash
# 使用 Vercel CLI
vercel env pull .env.production
npm run db:migrate:prod
```

## 外部服務整合

### LINE Bot 設定

1. **建立 LINE Bot**
   - 前往 [LINE Developers Console](https://developers.line.biz/console/)
   - 建立新的 Provider (如果尚未建立)
   - 建立新的 Messaging API Channel
   - 記錄 Channel ID、Channel Secret 和 Channel Access Token

2. **設定 Webhook URL**
   - 在 LINE Developers Console 中
   - 進入您的 Messaging API Channel
   - 在 "Webhook settings" 中設定：
     ```
     Webhook URL: https://your-domain.vercel.app/api/webhooks/line
     ```
   - 啟用 "Use webhook"

3. **設定 LINE Bot 功能**
   - 啟用 "Allow bot to join group chats"
   - 停用 "Auto-reply messages" (我們使用自訂回覆)
   - 停用 "Greeting messages"

### SendGrid 設定

1. **取得 API Key**
   - 登入 [SendGrid Dashboard](https://app.sendgrid.com/)
   - 前往 "Settings" > "API Keys"
   - 建立新的 API Key，權限設定為 "Full Access"
   - 記錄 API Key (只會顯示一次)

2. **設定 Webhook**
   - 前往 "Settings" > "Mail Settings" > "Event Webhook"
   - 設定 HTTP POST URL：
     ```
     https://your-domain.vercel.app/api/webhooks/email
     ```
   - 選擇要接收的事件類型

3. **驗證寄件者身份**
   - 前往 "Settings" > "Sender Authentication"
   - 驗證您的寄件者電子郵件地址或網域

## 部署後驗證

### 步驟 1: 重新部署

設定完所有環境變數後：
1. 前往 Vercel Dashboard
2. 進入您的專案
3. 點擊 "Deployments" 標籤
4. 點擊 "Redeploy" 重新部署最新版本

### 步驟 2: 健康檢查

部署完成後，驗證以下端點：

```bash
# 基本健康檢查
curl https://your-domain.vercel.app/health

# 資料庫連接檢查
curl https://your-domain.vercel.app/api/monitoring/health

# 系統狀態檢查
curl https://your-domain.vercel.app/api/monitoring/status
```

預期回應：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "services": {
    "line": "configured",
    "sendgrid": "configured"
  }
}
```

### 步驟 3: 功能測試

1. **測試 LINE Webhook**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/webhooks/line \
     -H "Content-Type: application/json" \
     -d '{"events": []}'
   ```

2. **測試電子郵件 Webhook**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/webhooks/email \
     -H "Content-Type: application/json" \
     -d '{"from": "test@example.com", "to": "store@example.com", "subject": "Test", "text": "Test message"}'
   ```

3. **測試管理介面**
   - 前往 `https://your-domain.vercel.app`
   - 嘗試註冊新的店家帳戶
   - 登入並測試各項功能

## 故障排除

### 常見問題

#### 1. 部署失敗
**錯誤**: Build failed
**解決方案**:
- 檢查 Vercel 建置日誌
- 確認所有環境變數已正確設定
- 檢查 `package.json` 中的建置腳本

#### 2. 資料庫連接失敗
**錯誤**: Database connection failed

**Supabase 解決方案**:
```bash
# 檢查 Supabase 連接字串格式
# 正確格式: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 確認 Supabase 專案狀態
# 前往 Supabase Dashboard 檢查專案是否正常運行

# 測試本地連接
npm run db:health
```

**Vercel Postgres 解決方案**:
```bash
# 檢查資料庫連接字串格式
# 正確格式: postgresql://username:password@host:port/database

# 測試本地連接
npm run db:health
```

#### 3. Supabase 特定問題

**錯誤**: Connection pool timeout
**解決方案**:
- Supabase 免費方案有連接數限制 (最多 60 個並發連接)
- 在 Prisma schema 中設定連接池：
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // 用於遷移
}
```
- 考慮升級到 Supabase Pro 方案以獲得更多連接數

**錯誤**: Row Level Security (RLS) 阻擋存取
**解決方案**:
- 在 Supabase Dashboard 中前往 "Authentication" > "Policies"
- 暫時停用 RLS 或設定適當的存取政策
- 對於後端 API，通常需要停用 RLS 或使用 service role key

**錯誤**: Migration failed on Supabase
**解決方案**:
```bash
# 使用 Prisma 的 shadow database 功能
# 在 .env 中新增：
SHADOW_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=shadow"

# 或使用 db push 而非 migrate
npm run db:push
```

#### 4. LINE Webhook 無法接收訊息
**錯誤**: LINE webhook not receiving messages
**解決方案**:
- 確認 Webhook URL 設定正確
- 檢查 LINE Channel Secret 和 Access Token
- 驗證 SSL 憑證 (Vercel 自動提供)

#### 4. 電子郵件無法發送
**錯誤**: Email sending failed
**解決方案**:
- 檢查 SendGrid API Key 權限
- 確認寄件者電子郵件已驗證
- 檢查 SendGrid 帳戶狀態

### 日誌檢查

1. **Vercel 日誌**
   ```bash
   # 安裝 Vercel CLI
   npm i -g vercel
   
   # 登入
   vercel login
   
   # 查看即時日誌
   vercel logs --follow
   ```

2. **應用程式日誌**
   - 前往 Vercel Dashboard
   - 進入您的專案
   - 點擊 "Functions" 標籤查看 serverless function 日誌

### 效能監控

1. **設定監控**
   - 使用 Vercel Analytics 監控效能
   - 設定 Uptime 監控服務 (如 UptimeRobot)

2. **關鍵指標**
   - API 回應時間 < 500ms
   - Webhook 處理時間 < 200ms
   - 資料庫查詢時間 < 100ms

## 維護和更新

### 定期維護

1. **資料庫備份**
   ```bash
   # 執行資料庫備份
   npm run db:backup
   ```

2. **清理舊備份**
   ```bash
   # 清理 30 天前的備份
   npm run cleanup:backups
   ```

3. **更新相依套件**
   ```bash
   # 檢查過時的套件
   npm outdated
   
   # 更新套件
   npm update
   ```

### 部署新版本

1. **推送程式碼**
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```

2. **Vercel 會自動部署**
   - 每次推送到 main 分支都會觸發自動部署
   - 可在 Vercel Dashboard 中監控部署狀態

## 安全性考量

### 環境變數安全
- 絕不在程式碼中硬編碼敏感資訊
- 定期輪換 API 金鑰和密鑰
- 使用 Vercel 的環境變數加密功能

### HTTPS 和 SSL
- Vercel 自動提供 SSL 憑證
- 所有 API 端點都使用 HTTPS
- Webhook 簽名驗證已實作

### 存取控制
- 實作適當的身份驗證和授權
- 使用 CORS 限制跨域請求
- 實作 rate limiting 防止濫用

## 支援和聯絡

如果您在部署過程中遇到問題：

1. 檢查本指南的故障排除章節
2. 查看 Vercel 官方文件
3. 檢查專案的 GitHub Issues
4. 聯絡技術支援團隊

---

**注意**: 請妥善保管所有 API 金鑰和密鑰，避免洩露到公開的程式碼庫中。