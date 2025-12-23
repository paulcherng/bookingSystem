import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/services/emailService'
import { WebhookMiddleware } from '@/lib/middleware/webhook'

export async function POST(request: NextRequest) {
  try {
    // 驗證 webhook 請求
    const validation = await WebhookMiddleware.validateWebhookRequest(request)

    if (!validation.isValid) {
      await WebhookMiddleware.logWebhookEvent(
        validation.storeId || 'unknown',
        'email',
        'validation_failed',
        {},
        false,
        validation.error
      )
      return WebhookMiddleware.createErrorResponse(validation.error!)
    }

    const { storeId, body } = validation
    const signature = request.headers.get('x-sendgrid-signature')

    // 取得店家的郵件設定
    const emailConfig = await EmailService.getStoreEmailConfig(storeId!)
    
    if (!emailConfig?.email) {
      await WebhookMiddleware.logWebhookEvent(
        storeId!,
        'email',
        'config_not_found',
        {},
        false,
        'Store email configuration not found'
      )
      return WebhookMiddleware.createErrorResponse('Store email configuration not found', 404)
    }

    // 驗證 SendGrid webhook 簽名（如果有提供）
    if (signature) {
      const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY
      if (publicKey) {
        const isValidSignature = EmailService.verifyWebhookSignature(
          body!,
          signature,
          publicKey
        )

        if (!isValidSignature) {
          await WebhookMiddleware.logWebhookEvent(
            storeId!,
            'email',
            'invalid_signature',
            {},
            false,
            'Invalid signature'
          )
          return WebhookMiddleware.createErrorResponse('Invalid signature', 401)
        }
      }
    }

    // 解析 webhook 資料
    const emailData = JSON.parse(body!)

    // SendGrid webhook 可能包含多個郵件事件
    const emails = Array.isArray(emailData) ? emailData : [emailData]

    // 處理每個郵件事件（使用重試機制）
    let processedCount = 0
    await WebhookMiddleware.handleWebhookWithRetry(async () => {
      const emailService = new EmailService(process.env.SENDGRID_API_KEY!)
      
      for (const email of emails) {
        // 只處理收到的郵件（不是發送狀態更新）
        if (email.from && email.to && email.text) {
          await emailService.handleIncomingEmail({
            from: email.from,
            to: email.to,
            subject: email.subject || '',
            text: email.text,
            html: email.html
          }, storeId!)
          processedCount++
        }
      }
    })

    // 記錄成功事件
    await WebhookMiddleware.logWebhookEvent(
      storeId!,
      'email',
      'emails_processed',
      { emailCount: processedCount },
      true
    )

    return WebhookMiddleware.createSuccessResponse({ emailsProcessed: processedCount })

  } catch (error) {
    console.error('Email webhook error:', error)
    
    // 記錄錯誤事件
    const storeId = request.nextUrl.searchParams.get('storeId') || 'unknown'
    await WebhookMiddleware.logWebhookEvent(
      storeId,
      'email',
      'processing_error',
      {},
      false,
      error instanceof Error ? error.message : 'Unknown error'
    )

    return WebhookMiddleware.createErrorResponse('Internal server error', 500)
  }
}

// Email webhook 只接受 POST 請求
export async function GET() {
  return WebhookMiddleware.createErrorResponse('Method not allowed', 405)
}