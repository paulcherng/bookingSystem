import sgMail from '@sendgrid/mail'
import { prisma } from '@/lib/prisma'

export class EmailService {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey)
  }

  /**
   * 發送電子郵件
   */
  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    try {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@bookingsystem.com',
        subject,
        text: content,
        html: content.replace(/\n/g, '<br>')
      }

      await sgMail.send(msg)
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Email sending failed')
    }
  }

  /**
   * 處理收到的電子郵件 webhook
   */
  async handleIncomingEmail(emailData: {
    from: string
    to: string
    subject: string
    text: string
    html?: string
  }, storeId: string): Promise<void> {
    // 記錄收到的郵件
    await this.logMessage(storeId, emailData.from, 'incoming', emailData.text)

    // 這裡會整合訊息解析和預約處理邏輯
    // 目前先回覆確認收到郵件
    const replySubject = `Re: ${emailData.subject}`
    const replyContent = '收到您的郵件，我們正在處理您的預約需求，請稍候。'
    
    try {
      await this.sendEmail(emailData.from, replySubject, replyContent)

      // 記錄發送的回覆
      await this.logMessage(storeId, emailData.from, 'outgoing', replyContent)
    } catch (error) {
      console.error('Failed to reply email:', error)
    }
  }

  /**
   * 記錄郵件到資料庫
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
          contactType: 'email',
          messageType,
          content,
          processedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to log email message:', error)
    }
  }

  /**
   * 解析郵件內容提取預約資訊
   */
  static parseBookingFromEmail(content: string): {
    service?: string
    dateTime?: string
    customerName?: string
  } {
    const result: any = {}

    // 簡單的關鍵字匹配來提取預約資訊
    // 這裡可以根據需要實作更複雜的自然語言處理

    // 提取服務項目
    const serviceMatch = content.match(/(?:服務|service|剪髮|洗髮|染髮|燙髮)[:：]?\s*([^\n\r]+)/i)
    if (serviceMatch) {
      result.service = serviceMatch[1].trim()
    }

    // 提取日期時間
    const dateTimeMatch = content.match(/(?:時間|日期|date|time)[:：]?\s*([^\n\r]+)/i)
    if (dateTimeMatch) {
      result.dateTime = dateTimeMatch[1].trim()
    }

    // 提取客戶姓名
    const nameMatch = content.match(/(?:姓名|名字|name)[:：]?\s*([^\n\r]+)/i)
    if (nameMatch) {
      result.customerName = nameMatch[1].trim()
    }

    return result
  }

  /**
   * 驗證 SendGrid webhook 簽名
   */
  static verifyWebhookSignature(payload: string, signature: string, publicKey: string): boolean {
    try {
      const crypto = require('crypto')
      const elliptic = require('elliptic')
      
      // SendGrid 使用 ECDSA 簽名
      const ec = new elliptic.ec('p256')
      const key = ec.keyFromPublic(publicKey, 'base64')
      
      // 解析簽名
      const signatureBuffer = Buffer.from(signature, 'base64')
      const r = signatureBuffer.slice(0, 32)
      const s = signatureBuffer.slice(32, 64)
      
      // 計算 payload 的 SHA256 hash
      const hash = crypto.createHash('sha256').update(payload).digest()
      
      // 驗證簽名
      return key.verify(hash, { r, s })
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }

  /**
   * 取得店家的郵件設定
   */
  static async getStoreEmailConfig(storeId: string): Promise<{
    email?: string
  } | null> {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          email: true
        }
      })

      if (!store) return null

      return {
        email: store.email
      }
    } catch (error) {
      console.error('Failed to get store email config:', error)
      return null
    }
  }
}