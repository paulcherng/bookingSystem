import { LineService } from './lineService'
import { EmailService } from './emailService'
import { AutoReplyService, ReplyContext } from './autoReplyService'
import { BookingResult } from './bookingService'
import { prisma } from '@/lib/prisma'

export interface NotificationRequest {
  storeId: string
  customerContact: string
  contactType: 'line' | 'email'
  messageType: 'booking_confirmation' | 'booking_error' | 'format_error' | 'general_inquiry' | 'system_error'
  data?: any
}

export interface RetryConfig {
  maxAttempts: number
  backoffMs: number
  exponentialBackoff: boolean
}

export class NotificationService {
  private static readonly RETRY_CONFIGS: Record<string, RetryConfig> = {
    line: { maxAttempts: 3, backoffMs: 1000, exponentialBackoff: true },
    email: { maxAttempts: 3, backoffMs: 2000, exponentialBackoff: true }
  }

  /**
   * 發送通知訊息
   */
  static async sendNotification(request: NotificationRequest): Promise<{
    success: boolean
    error?: string
    retryCount?: number
  }> {
    try {
      // 取得店家資訊
      const store = await prisma.store.findUnique({
        where: { id: request.storeId },
        select: {
          name: true,
          lineChannelId: true,
          lineChannelSecret: true,
          lineAccessToken: true,
          email: true
        }
      })

      if (!store) {
        return { success: false, error: 'Store not found' }
      }

      // 建立回覆上下文
      const context: ReplyContext = {
        storeName: store.name,
        contactType: request.contactType,
        ...request.data
      }

      // 生成回覆內容
      const replyContent = this.generateReplyContent(request.messageType, context, request.data)
      
      if (!replyContent) {
        return { success: false, error: 'Failed to generate reply content' }
      }

      // 根據聯絡方式發送通知
      if (request.contactType === 'line') {
        return await this.sendLineNotification(
          request.customerContact,
          replyContent.content,
          store.lineAccessToken,
          request.storeId
        )
      } else {
        return await this.sendEmailNotification(
          request.customerContact,
          replyContent.content,
          replyContent.subject,
          request.storeId
        )
      }

    } catch (error) {
      console.error('Notification service error:', error)
      return { success: false, error: 'Internal notification error' }
    }
  }

  /**
   * 發送 LINE 通知
   */
  private static async sendLineNotification(
    customerContact: string,
    message: string,
    accessToken?: string | null,
    storeId?: string
  ): Promise<{ success: boolean; error?: string; retryCount?: number }> {
    if (!accessToken) {
      return { success: false, error: 'LINE access token not configured' }
    }

    const retryConfig = this.RETRY_CONFIGS.line
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const lineService = new LineService(accessToken)
        await lineService.sendMessage(customerContact, message)

        // 記錄成功發送的訊息
        if (storeId) {
          await this.logNotification(storeId, customerContact, 'line', 'outgoing', message, true)
        }

        return { success: true, retryCount: attempt - 1 }

      } catch (error) {
        lastError = error as Error
        console.error(`LINE notification attempt ${attempt} failed:`, error)

        // 如果不是最後一次嘗試，等待後重試
        if (attempt < retryConfig.maxAttempts) {
          const delay = retryConfig.exponentialBackoff 
            ? retryConfig.backoffMs * Math.pow(2, attempt - 1)
            : retryConfig.backoffMs
          
          await this.sleep(delay)
        }
      }
    }

    // 記錄失敗的通知
    if (storeId) {
      await this.logNotification(
        storeId, 
        customerContact, 
        'line', 
        'outgoing', 
        message, 
        false, 
        lastError?.message
      )
    }

    return { 
      success: false, 
      error: lastError?.message || 'LINE notification failed',
      retryCount: retryConfig.maxAttempts
    }
  }

  /**
   * 發送電子郵件通知
   */
  private static async sendEmailNotification(
    customerContact: string,
    message: string,
    subject?: string,
    storeId?: string
  ): Promise<{ success: boolean; error?: string; retryCount?: number }> {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey || apiKey === '' || apiKey === 'temp_api_key') {
      console.warn('SendGrid API key not configured, skipping email notification')
      return { success: false, error: 'SendGrid API key not configured' }
    }

    const retryConfig = this.RETRY_CONFIGS.email
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const emailService = new EmailService(apiKey)
        await emailService.sendEmail(
          customerContact,
          subject || '預約系統自動回覆',
          message
        )

        // 記錄成功發送的郵件
        if (storeId) {
          await this.logNotification(storeId, customerContact, 'email', 'outgoing', message, true)
        }

        return { success: true, retryCount: attempt - 1 }

      } catch (error) {
        lastError = error as Error
        console.error(`Email notification attempt ${attempt} failed:`, error)

        // 如果不是最後一次嘗試，等待後重試
        if (attempt < retryConfig.maxAttempts) {
          const delay = retryConfig.exponentialBackoff 
            ? retryConfig.backoffMs * Math.pow(2, attempt - 1)
            : retryConfig.backoffMs
          
          await this.sleep(delay)
        }
      }
    }

    // 記錄失敗的通知
    if (storeId) {
      await this.logNotification(
        storeId, 
        customerContact, 
        'email', 
        'outgoing', 
        message, 
        false, 
        lastError?.message
      )
    }

    return { 
      success: false, 
      error: lastError?.message || 'Email notification failed',
      retryCount: retryConfig.maxAttempts
    }
  }

  /**
   * 生成回覆內容
   */
  private static generateReplyContent(
    messageType: string,
    context: ReplyContext,
    data?: any
  ): { content: string; subject?: string } | null {
    let reply: string

    switch (messageType) {
      case 'booking_confirmation':
        if (data?.bookingResult) {
          reply = AutoReplyService.generateBookingConfirmationReply(data.bookingResult, context)
        } else {
          return null
        }
        break

      case 'booking_error':
        reply = AutoReplyService.generateBookingErrorReply(
          data?.error || '預約失敗',
          context,
          data?.alternatives
        )
        break

      case 'format_error':
        reply = AutoReplyService.generateFormatErrorReply(
          data?.errors || ['訊息格式錯誤'],
          context
        )
        break

      case 'general_inquiry':
        reply = AutoReplyService.generateGeneralInquiryReply(context)
        break

      case 'system_error':
        reply = AutoReplyService.generateSystemErrorReply(context)
        break

      default:
        return null
    }

    return AutoReplyService.formatReplyForContactType(
      reply,
      context.contactType,
      data?.subject
    )
  }

  /**
   * 記錄通知日誌
   */
  private static async logNotification(
    storeId: string,
    customerContact: string,
    contactType: 'line' | 'email',
    messageType: 'incoming' | 'outgoing',
    content: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await prisma.messageLog.create({
        data: {
          storeId,
          customerContact,
          contactType,
          messageType,
          content: success ? content : `FAILED: ${error || 'Unknown error'} - ${content}`,
          processedAt: new Date()
        }
      })
    } catch (logError) {
      console.error('Failed to log notification:', logError)
    }
  }

  /**
   * 批量發送通知
   */
  static async sendBulkNotifications(
    requests: NotificationRequest[]
  ): Promise<{
    successful: number
    failed: number
    results: { success: boolean; error?: string }[]
  }> {
    const results = await Promise.allSettled(
      requests.map(request => this.sendNotification(request))
    )

    let successful = 0
    let failed = 0
    const processedResults = results.map(result => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successful++
          return result.value
        } else {
          failed++
          return result.value
        }
      } else {
        failed++
        return { success: false, error: result.reason?.message || 'Unknown error' }
      }
    })

    return {
      successful,
      failed,
      results: processedResults
    }
  }

  /**
   * 發送預約提醒通知
   */
  static async sendBookingReminder(
    bookingId: string,
    reminderType: 'day_before' | 'hour_before'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          store: {
            select: {
              name: true,
              lineAccessToken: true
            }
          },
          barber: {
            select: { name: true }
          },
          service: {
            select: { name: true }
          }
        }
      })

      if (!booking) {
        return { success: false, error: 'Booking not found' }
      }

      if (booking.status !== 'confirmed') {
        return { success: false, error: 'Booking is not confirmed' }
      }

      const reminderMessage = this.generateReminderMessage(booking, reminderType)
      
      return await this.sendNotification({
        storeId: booking.storeId,
        customerContact: booking.customerContact,
        contactType: booking.contactType as 'line' | 'email',
        messageType: 'booking_confirmation',
        data: {
          storeName: booking.store.name,
          customerName: booking.customerName,
          serviceName: booking.service.name,
          barberName: booking.barber.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          customMessage: reminderMessage
        }
      })

    } catch (error) {
      console.error('Error sending booking reminder:', error)
      return { success: false, error: 'Failed to send reminder' }
    }
  }

  /**
   * 生成提醒訊息
   */
  private static generateReminderMessage(
    booking: any,
    reminderType: 'day_before' | 'hour_before'
  ): string {
    const timeStr = new Date(booking.startTime).toLocaleString('zh-TW')
    
    if (reminderType === 'day_before') {
      return `🔔 預約提醒\n\n您明天有預約：\n時間：${timeStr}\n服務：${booking.service.name}\n理髮師：${booking.barber.name}\n\n請準時到達，謝謝！`
    } else {
      return `⏰ 預約提醒\n\n您一小時後有預約：\n時間：${timeStr}\n服務：${booking.service.name}\n理髮師：${booking.barber.name}\n\n請準備出發，謝謝！`
    }
  }

  /**
   * 延遲函數
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 取得通知統計
   */
  static async getNotificationStats(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSent: number
    successful: number
    failed: number
    byContactType: {
      line: { sent: number; successful: number; failed: number }
      email: { sent: number; successful: number; failed: number }
    }
  }> {
    try {
      const logs = await prisma.messageLog.findMany({
        where: {
          storeId,
          messageType: 'outgoing',
          processedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          contactType: true,
          content: true
        }
      })

      const stats = {
        totalSent: logs.length,
        successful: 0,
        failed: 0,
        byContactType: {
          line: { sent: 0, successful: 0, failed: 0 },
          email: { sent: 0, successful: 0, failed: 0 }
        }
      }

      logs.forEach(log => {
        const isSuccess = !log.content.startsWith('FAILED:')
        const contactType = log.contactType as 'line' | 'email'

        stats.byContactType[contactType].sent++
        
        if (isSuccess) {
          stats.successful++
          stats.byContactType[contactType].successful++
        } else {
          stats.failed++
          stats.byContactType[contactType].failed++
        }
      })

      return stats

    } catch (error) {
      console.error('Error getting notification stats:', error)
      return {
        totalSent: 0,
        successful: 0,
        failed: 0,
        byContactType: {
          line: { sent: 0, successful: 0, failed: 0 },
          email: { sent: 0, successful: 0, failed: 0 }
        }
      }
    }
  }
}