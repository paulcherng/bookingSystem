import { NextRequest, NextResponse } from 'next/server'
import { ErrorCodes } from '@/types'

export interface WebhookValidationResult {
  isValid: boolean
  error?: string
  storeId?: string
  body?: string
}

export class WebhookMiddleware {
  /**
   * 驗證 webhook 請求的基本要求
   */
  static async validateWebhookRequest(
    request: NextRequest,
    requiredHeaders: string[] = []
  ): Promise<WebhookValidationResult> {
    try {
      // 檢查 HTTP 方法
      if (request.method !== 'POST') {
        return {
          isValid: false,
          error: 'Webhook 只接受 POST 請求'
        }
      }

      // 檢查必要的標頭
      for (const header of requiredHeaders) {
        if (!request.headers.get(header)) {
          return {
            isValid: false,
            error: `缺少必要的標頭: ${header}`
          }
        }
      }

      // 取得 store ID
      const storeId = request.nextUrl.searchParams.get('storeId')
      if (!storeId) {
        return {
          isValid: false,
          error: '缺少 storeId 參數'
        }
      }

      // 讀取請求內容
      const body = await request.text()
      if (!body) {
        return {
          isValid: false,
          error: '請求內容為空'
        }
      }

      return {
        isValid: true,
        storeId,
        body
      }

    } catch (error) {
      console.error('Webhook validation error:', error)
      return {
        isValid: false,
        error: '驗證 webhook 請求時發生錯誤'
      }
    }
  }

  /**
   * 創建 webhook 錯誤回應
   */
  static createErrorResponse(error: string, statusCode: number = 400): NextResponse {
    return NextResponse.json(
      {
        code: ErrorCodes.VALIDATION_ERROR,
        message: error,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }

  /**
   * 創建 webhook 成功回應
   */
  static createSuccessResponse(data?: any): NextResponse {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...data
    })
  }

  /**
   * 記錄 webhook 事件
   */
  static async logWebhookEvent(
    storeId: string,
    webhookType: 'line' | 'email',
    eventType: string,
    payload: any,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      // 這裡可以記錄到資料庫或日誌系統
      console.log('Webhook Event:', {
        storeId,
        webhookType,
        eventType,
        success,
        error,
        timestamp: new Date().toISOString(),
        payload: JSON.stringify(payload).substring(0, 1000) // 限制日誌長度
      })
    } catch (logError) {
      console.error('Failed to log webhook event:', logError)
    }
  }

  /**
   * 處理 webhook 重試邏輯
   */
  static async handleWebhookWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === maxRetries) {
          break
        }

        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }

    throw lastError
  }

  /**
   * 驗證 webhook 來源 IP（如果需要）
   */
  static validateWebhookIP(request: NextRequest, allowedIPs: string[]): boolean {
    if (allowedIPs.length === 0) {
      return true // 如果沒有限制 IP，則允許所有來源
    }

    const clientIP = this.getClientIP(request)
    if (!clientIP) {
      return false
    }

    return allowedIPs.includes(clientIP)
  }

  /**
   * 取得客戶端 IP 地址
   */
  private static getClientIP(request: NextRequest): string | null {
    // 檢查各種可能的 IP 標頭
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ]

    for (const header of headers) {
      const ip = request.headers.get(header)
      if (ip) {
        // 如果是逗號分隔的 IP 列表，取第一個
        return ip.split(',')[0].trim()
      }
    }

    return null
  }
}