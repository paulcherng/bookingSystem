import { NextRequest, NextResponse } from 'next/server'
import { WebhookEvent } from '@line/bot-sdk'
import { LineService } from '@/services/lineService'
import { WebhookMiddleware } from '@/lib/middleware/webhook'

export async function POST(request: NextRequest) {
  try {
    // 驗證 webhook 請求
    const validation = await WebhookMiddleware.validateWebhookRequest(
      request,
      ['x-line-signature']
    )

    if (!validation.isValid) {
      await WebhookMiddleware.logWebhookEvent(
        validation.storeId || 'unknown',
        'line',
        'validation_failed',
        {},
        false,
        validation.error
      )
      return WebhookMiddleware.createErrorResponse(validation.error!)
    }

    const { storeId, body } = validation
    const signature = request.headers.get('x-line-signature')!

    // 取得店家的 LINE 設定
    const lineConfig = await LineService.getStoreLineConfig(storeId!)
    
    if (!lineConfig?.channelSecret || !lineConfig?.accessToken) {
      await WebhookMiddleware.logWebhookEvent(
        storeId!,
        'line',
        'config_not_found',
        {},
        false,
        'Store LINE configuration not found'
      )
      return WebhookMiddleware.createErrorResponse('Store LINE configuration not found', 404)
    }

    // 驗證 LINE webhook 簽名
    const isValidSignature = LineService.verifySignature(
      body!,
      signature,
      lineConfig.channelSecret
    )

    if (!isValidSignature) {
      await WebhookMiddleware.logWebhookEvent(
        storeId!,
        'line',
        'invalid_signature',
        {},
        false,
        'Invalid signature'
      )
      return WebhookMiddleware.createErrorResponse('Invalid signature', 401)
    }

    // 解析 webhook 事件
    const webhookData = JSON.parse(body!)
    const events: WebhookEvent[] = webhookData.events || []

    // 處理事件（使用重試機制）
    await WebhookMiddleware.handleWebhookWithRetry(async () => {
      const lineService = new LineService(lineConfig.accessToken!)
      await lineService.handleWebhookEvents(events, storeId!)
    })

    // 記錄成功事件
    await WebhookMiddleware.logWebhookEvent(
      storeId!,
      'line',
      'events_processed',
      { eventCount: events.length },
      true
    )

    return WebhookMiddleware.createSuccessResponse({ eventsProcessed: events.length })

  } catch (error) {
    console.error('LINE webhook error:', error)
    
    // 記錄錯誤事件
    const storeId = request.nextUrl.searchParams.get('storeId') || 'unknown'
    await WebhookMiddleware.logWebhookEvent(
      storeId,
      'line',
      'processing_error',
      {},
      false,
      error instanceof Error ? error.message : 'Unknown error'
    )

    return WebhookMiddleware.createErrorResponse('Internal server error', 500)
  }
}

// LINE webhook 只接受 POST 請求
export async function GET() {
  return WebhookMiddleware.createErrorResponse('Method not allowed', 405)
}