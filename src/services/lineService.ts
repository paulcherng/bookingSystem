import { Client, WebhookEvent, MessageEvent, TextMessage, ClientConfig } from '@line/bot-sdk'
import { prisma } from '@/lib/prisma'
import { MessageLog } from '@/types'

export class LineService {
  private client: Client

  constructor(channelAccessToken: string) {
    const config: ClientConfig = {
      channelAccessToken
    }
    this.client = new Client(config)
  }

  /**
   * 發送文字訊息到 LINE
   */
  async sendMessage(to: string, message: string): Promise<void> {
    try {
      await this.client.pushMessage(to, {
        type: 'text',
        text: message
      })
    } catch (error) {
      console.error('Failed to send LINE message:', error)
      throw new Error('LINE message sending failed')
    }
  }

  /**
   * 處理 LINE webhook 事件
   */
  async handleWebhookEvents(events: WebhookEvent[], storeId: string): Promise<void> {
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await this.handleTextMessage(event as MessageEvent, storeId)
      }
    }
  }

  /**
   * 處理文字訊息
   */
  private async handleTextMessage(event: MessageEvent, storeId: string): Promise<void> {
    const message = event.message as TextMessage
    const userId = event.source.userId

    if (!userId) {
      console.warn('No user ID in LINE message event')
      return
    }

    // 記錄收到的訊息
    await this.logMessage(storeId, userId, 'incoming', message.text)

    // 這裡會整合訊息解析和預約處理邏輯
    // 目前先回覆確認收到訊息
    const replyMessage = '收到您的訊息，我們正在處理您的預約需求，請稍候。'
    
    try {
      await this.client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyMessage
      })

      // 記錄發送的回覆
      await this.logMessage(storeId, userId, 'outgoing', replyMessage)
    } catch (error) {
      console.error('Failed to reply LINE message:', error)
    }
  }

  /**
   * 記錄訊息到資料庫
   */
  private async logMessage(
    storeId: string, 
    customerContact: string, 
    messageType: 'incoming' | 'outgoing', 
    content: string
  ): Promise<void> {
    try {
      await prisma.messageLog.create({
        data: {
          storeId,
          customerContact,
          contactType: 'line',
          messageType,
          content,
          processedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to log message:', error)
    }
  }

  /**
   * 驗證 LINE webhook 簽名
   */
  static verifySignature(body: string, signature: string, channelSecret: string): boolean {
    const crypto = require('crypto')
    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body)
      .digest('base64')
    
    return hash === signature
  }

  /**
   * 取得店家的 LINE 設定
   */
  static async getStoreLineConfig(storeId: string): Promise<{
    channelId?: string
    channelSecret?: string
    accessToken?: string
  } | null> {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          lineChannelId: true,
          lineChannelSecret: true,
          lineAccessToken: true
        }
      })

      if (!store) return null

      return {
        channelId: store.lineChannelId || undefined,
        channelSecret: store.lineChannelSecret || undefined,
        accessToken: store.lineAccessToken || undefined
      }
    } catch (error) {
      console.error('Failed to get store LINE config:', error)
      return null
    }
  }
}