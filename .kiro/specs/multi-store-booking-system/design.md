# 設計文件

## 概述

多店家預約系統是一個基於 Next.js 的 web 應用程式，部署在 Vercel 平台上。系統整合 LINE Bot API 和電子郵件服務，為理髮店等服務業提供自動化預約管理功能。系統採用 serverless 架構，支援多店家、多理髮師的預約管理。

## 架構

### 整體架構
```
客戶端 (LINE/Email) → Webhook → Next.js API Routes → 業務邏輯 → 資料庫
                                      ↓
                              自動回覆服務 → 客戶端
```

### 技術棧
- **前端**: Next.js 14 with App Router, React, TypeScript
- **後端**: Next.js API Routes (Serverless Functions)
- **資料庫**: Vercel Postgres
- **部署**: Vercel
- **外部整合**: LINE Bot API, 電子郵件服務 (SendGrid)
- **驗證**: NextAuth.js
- **樣式**: Tailwind CSS

### 系統架構圖
```mermaid
graph TB
    A[LINE 客戶端] --> B[LINE Webhook]
    C[Email 客戶端] --> D[Email Webhook]
    
    B --> E[Next.js API Routes]
    D --> E
    
    E --> F[訊息解析服務]
    F --> G[預約管理服務]
    G --> H[行事曆服務]
    H --> I[Vercel Postgres]
    
    G --> J[通知服務]
    J --> K[LINE Bot API]
    J --> L[SendGrid API]
    
    M[店家管理介面] --> E
    E --> N[認證服務]
```

## 元件和介面

### 核心元件

#### 1. 認證與授權
- **StoreAuthService**: 店家帳戶認證
- **SessionManager**: 會話管理
- **RoleGuard**: 權限控制

#### 2. 店家管理
- **StoreService**: 店家 CRUD 操作
- **BarberService**: 理髮師管理
- **ServiceItemService**: 服務項目管理
- **BusinessHoursService**: 營業時段管理

#### 3. 預約系統
- **BookingService**: 預約核心邏輯
- **CalendarService**: 行事曆管理
- **AvailabilityChecker**: 時段可用性檢查
- **ConflictResolver**: 預約衝突處理

#### 4. 通訊整合
- **LineWebhookHandler**: LINE 訊息處理
- **EmailWebhookHandler**: 電子郵件處理
- **MessageParser**: 訊息內容解析
- **ResponseGenerator**: 自動回覆生成

#### 5. 通知系統
- **NotificationService**: 通知管理
- **LineNotifier**: LINE 訊息發送
- **EmailNotifier**: 電子郵件發送

### API 介面設計

#### 店家管理 API
```typescript
// POST /api/stores
interface CreateStoreRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

// GET /api/stores/:id/barbers
interface Barber {
  id: string;
  name: string;
  email?: string;
  specialties: string[];
  isActive: boolean;
}

// POST /api/stores/:id/services
interface ServiceItem {
  id: string;
  name: string;
  duration: number; // 分鐘
  price?: number;
  description?: string;
}
```

#### 預約管理 API
```typescript
// POST /api/bookings
interface CreateBookingRequest {
  storeId: string;
  barberId?: string; // 可選，未指定則自動分配
  serviceId: string;
  dateTime: string; // ISO 8601
  customerInfo: {
    name: string;
    contact: string; // LINE ID 或 email
    contactType: 'line' | 'email';
  };
}

// GET /api/stores/:id/availability
interface AvailabilityRequest {
  date: string;
  serviceId: string;
  barberId?: string;
}
```

#### Webhook API
```typescript
// POST /api/webhooks/line
interface LineWebhookPayload {
  events: LineEvent[];
}

// POST /api/webhooks/email
interface EmailWebhookPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}
```

## 資料模型

### 資料庫 Schema

```sql
-- 店家表
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  line_channel_id VARCHAR(255),
  line_channel_secret VARCHAR(255),
  line_access_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 營業時段表
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ...
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE
);

-- 理髮師表
CREATE TABLE barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  specialties TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 服務項目表
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL, -- 分鐘
  price DECIMAL(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 預約表
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_contact VARCHAR(255) NOT NULL,
  contact_type VARCHAR(10) NOT NULL, -- 'line' or 'email'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 訊息記錄表
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_contact VARCHAR(255) NOT NULL,
  contact_type VARCHAR(10) NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- 'incoming', 'outgoing'
  content TEXT NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript 型別定義

```typescript
interface Store {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  lineChannelId?: string;
  lineChannelSecret?: string;
  lineAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BusinessHours {
  id: string;
  storeId: string;
  dayOfWeek: number; // 0-6
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isClosed: boolean;
}

interface Barber {
  id: string;
  storeId: string;
  name: string;
  email?: string;
  specialties: string[];
  isActive: boolean;
  createdAt: Date;
}

interface Service {
  id: string;
  storeId: string;
  name: string;
  duration: number; // 分鐘
  price?: number;
  description?: string;
  isActive: boolean;
}

interface Booking {
  id: string;
  storeId: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  customerContact: string;
  contactType: 'line' | 'email';
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
}
```

## 正確性屬性

*屬性是一個特徵或行為，應該在系統的所有有效執行中保持為真——本質上是關於系統應該做什麼的正式陳述。屬性作為人類可讀規範和機器可驗證正確性保證之間的橋樑。*

### 屬性反思

在分析所有可測試的屬性後，我識別出以下可以合併或簡化的冗餘屬性：
- 通訊管道連結屬性 (2.1, 2.2) 可以合併為一個通用的連結驗證屬性
- 訊息解析屬性 (6.1, 6.2) 可以合併為一個通用的訊息解析屬性
- 回覆發送屬性 (8.3, 8.4) 可以合併為一個通用的回覆屬性

### 核心屬性

**屬性 1: 店家帳戶創建一致性**
*對於任何*有效的店家資訊，創建帳戶應該成功並發送確認郵件，且相同email不能重複註冊
**驗證需求: 1.1, 1.2, 1.3**

**屬性 2: 通訊管道連結驗證**
*對於任何*有效的通訊管道資訊（LINE或email），連結到店家帳戶後應該能夠接收來自該管道的訊息
**驗證需求: 2.1, 2.2, 2.3, 2.4**

**屬性 3: 營業時段約束**
*對於任何*預約請求，只有在營業時間內的請求才會被接受，非營業時間的請求應該被拒絕
**驗證需求: 3.1, 3.2, 3.3**

**屬性 4: 理髮師行事曆獨立性**
*對於任何*理髮師，新增時應該創建獨立行事曆，刪除時應該正確處理現有預約
**驗證需求: 4.1, 4.3**

**屬性 5: 服務項目資料一致性**
*對於任何*服務項目的CRUD操作，資料應該保持一致性，刪除服務時應該正確處理相關預約
**驗證需求: 5.1, 5.2, 5.3**

**屬性 6: 訊息解析通用性**
*對於任何*包含預約資訊的訊息（LINE或email），系統應該能夠正確解析並提取服務項目和時間資訊
**驗證需求: 6.1, 6.2, 6.3**

**屬性 7: 理髮師分配邏輯**
*對於任何*預約請求，如果指定理髮師則查詢該理髮師行事曆，如果未指定則查詢所有理髮師並找出可用時段
**驗證需求: 7.1, 7.2**

**屬性 8: 時段衝突檢測**
*對於任何*預約請求，系統應該正確識別時段衝突，確保服務時段完全可用且在營業時間內
**驗證需求: 7.3, 7.4, 7.5**

**屬性 9: 自動回覆一致性**
*對於任何*預約請求，系統應該根據可用性自動回覆，成功時確認預約並指定理髮師，失敗時說明原因
**驗證需求: 8.1, 8.2**

**屬性 10: 通訊管道回覆對應**
*對於任何*通過特定管道（LINE或email）收到的請求，回覆應該通過相同管道發送
**驗證需求: 8.3, 8.4**

**屬性 11: 服務時間格式驗證**
*對於任何*服務時間設定，系統應該驗證時間格式為有效的分鐘數
**驗證需求: 5.4**

## 錯誤處理

### 錯誤分類

#### 1. 輸入驗證錯誤
- 不完整的註冊資訊
- 無效的時間格式
- 重複的email註冊
- 不完整的理髮師或服務資訊

#### 2. 業務邏輯錯誤
- 預約時段衝突
- 非營業時間預約
- 無效的通訊管道
- 理髮師不存在

#### 3. 外部服務錯誤
- LINE API 調用失敗
- 電子郵件發送失敗
- 資料庫連接錯誤
- Webhook 接收失敗

#### 4. 系統錯誤
- 服務器內部錯誤
- 記憶體不足
- 超時錯誤

### 錯誤處理策略

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// 錯誤代碼定義
enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  
  // 具體錯誤
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  INVALID_TIME_SLOT = 'INVALID_TIME_SLOT',
  BARBER_NOT_FOUND = 'BARBER_NOT_FOUND',
  OUTSIDE_BUSINESS_HOURS = 'OUTSIDE_BUSINESS_HOURS',
  LINE_API_ERROR = 'LINE_API_ERROR',
  EMAIL_SEND_ERROR = 'EMAIL_SEND_ERROR'
}
```

### 重試機制

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  exponentialBackoff: boolean;
}

// 不同操作的重試設定
const RETRY_CONFIGS = {
  lineMessage: { maxAttempts: 3, backoffMs: 1000, exponentialBackoff: true },
  emailSend: { maxAttempts: 3, backoffMs: 2000, exponentialBackoff: true },
  databaseOperation: { maxAttempts: 2, backoffMs: 500, exponentialBackoff: false }
};
```

## 測試策略

### 雙重測試方法

系統將採用單元測試和屬性基礎測試的雙重方法：

#### 單元測試
- 驗證特定範例和邊界情況
- 測試元件間的整合點
- 專注於具體的錯誤情況和邊界值
- 使用 Jest 和 React Testing Library

#### 屬性基礎測試
- 驗證跨所有輸入的通用屬性
- 使用 fast-check 作為屬性測試庫
- 每個屬性測試運行最少 100 次迭代
- 每個屬性基礎測試必須用註解明確引用設計文件中的正確性屬性
- 使用格式：'**Feature: multi-store-booking-system, Property {number}: {property_text}**'

### 測試環境設定

```typescript
// 測試資料庫設定
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/booking_test';

// Mock 服務設定
const mockLineService = {
  sendMessage: jest.fn(),
  verifySignature: jest.fn()
};

const mockEmailService = {
  sendEmail: jest.fn(),
  parseIncomingEmail: jest.fn()
};
```

### 測試資料生成

```typescript
// 屬性測試的資料生成器
const storeGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  email: fc.emailAddress(),
  phone: fc.option(fc.string()),
  address: fc.option(fc.string())
});

const bookingRequestGenerator = fc.record({
  storeId: fc.uuid(),
  serviceId: fc.uuid(),
  dateTime: fc.date(),
  customerInfo: fc.record({
    name: fc.string({ minLength: 1 }),
    contact: fc.string({ minLength: 1 }),
    contactType: fc.constantFrom('line', 'email')
  })
});
```

### 整合測試

```typescript
// API 端點測試
describe('Booking API Integration', () => {
  test('complete booking flow', async () => {
    // 1. 創建店家
    // 2. 設定理髮師和服務
    // 3. 發送預約請求
    // 4. 驗證回覆
    // 5. 檢查資料庫狀態
  });
});
```

### 效能測試

```typescript
// 負載測試設定
const LOAD_TEST_CONFIG = {
  concurrent_users: 50,
  test_duration: '5m',
  ramp_up_time: '30s'
};

// 關鍵效能指標
const PERFORMANCE_THRESHOLDS = {
  api_response_time: '500ms',
  webhook_processing_time: '200ms',
  database_query_time: '100ms'
};
```

## 部署架構

### Vercel 部署設定

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "LINE_CHANNEL_SECRET": "@line-channel-secret",
    "LINE_CHANNEL_ACCESS_TOKEN": "@line-channel-access-token",
    "SENDGRID_API_KEY": "@sendgrid-api-key",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 環境變數

```bash
# 資料庫
DATABASE_URL=postgresql://username:password@host:port/database

# LINE Bot API
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app

# 應用設定
NODE_ENV=production
WEBHOOK_BASE_URL=https://your-domain.vercel.app
```

### 資料庫遷移

```typescript
// 使用 Prisma 進行資料庫遷移
const prisma = new PrismaClient();

// 遷移腳本
async function migrate() {
  await prisma.$executeRaw`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `;
  
  // 執行 schema 創建
  // ...
}
```

### 監控和日誌

```typescript
// 使用 Vercel Analytics 和自定義日誌
import { Analytics } from '@vercel/analytics/react';

// 錯誤追蹤
const logError = (error: Error, context: any) => {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// 效能監控
const logPerformance = (operation: string, duration: number) => {
  console.log('Performance Metric:', {
    operation,
    duration,
    timestamp: new Date().toISOString()
  });
};
```

### 安全性考量

#### 1. API 安全
- 使用 HTTPS 加密所有通訊
- 實施 rate limiting 防止濫用
- 驗證所有 webhook 簽名
- 使用 CORS 限制跨域請求

#### 2. 資料保護
- 加密敏感資料
- 實施資料存取控制
- 定期備份資料庫
- 遵循 GDPR 資料保護規範

#### 3. 認證授權
- 使用 NextAuth.js 進行身份驗證
- 實施角色基礎存取控制 (RBAC)
- 使用 JWT token 進行會話管理
- 定期輪換 API 金鑰

```typescript
// 安全中介軟體
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

### 擴展性考量

#### 1. 水平擴展
- Vercel 自動處理 serverless function 擴展
- 使用 CDN 快取靜態資源
- 實施資料庫連接池

#### 2. 效能優化
- 使用 Next.js 的 ISR (Incremental Static Regeneration)
- 實施適當的快取策略
- 優化資料庫查詢
- 使用圖片優化

#### 3. 可維護性
- 模組化架構設計
- 完整的 TypeScript 型別定義
- 自動化測試覆蓋
- 清晰的文件和註解