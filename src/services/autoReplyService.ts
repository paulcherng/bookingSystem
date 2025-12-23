import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { BookingResult } from './bookingService'

export interface ReplyContext {
  storeName: string
  customerName?: string
  serviceName?: string
  barberName?: string
  startTime?: Date
  endTime?: Date
  contactType: 'line' | 'email'
}

export class AutoReplyService {
  /**
   * 生成預約成功的回覆訊息
   */
  static generateBookingConfirmationReply(
    bookingResult: BookingResult,
    context: ReplyContext
  ): string {
    if (!bookingResult.success || !bookingResult.booking) {
      return this.generateBookingErrorReply(bookingResult.error || '預約失敗', context)
    }

    const { booking } = bookingResult
    const timeStr = format(booking.startTime, 'yyyy年MM月dd日 HH:mm', { locale: zhTW })
    const endTimeStr = format(booking.endTime, 'HH:mm', { locale: zhTW })

    let reply = `✅ 預約確認成功！\n\n`
    reply += `📋 預約詳情：\n`
    reply += `👤 客戶：${booking.customerName}\n`
    reply += `💇 理髮師：${booking.barberName}\n`
    reply += `✂️ 服務：${booking.serviceName}\n`
    reply += `🕐 時間：${timeStr} - ${endTimeStr}\n`
    reply += `🏪 店家：${context.storeName}\n\n`
    
    reply += `📝 預約編號：${booking.id}\n\n`
    
    reply += `⚠️ 注意事項：\n`
    reply += `• 請準時到達，如需取消請提前通知\n`
    reply += `• 如有任何問題，請隨時聯絡我們\n\n`
    
    reply += `感謝您的預約！期待為您服務 😊`

    return reply
  }

  /**
   * 生成預約失敗的回覆訊息
   */
  static generateBookingErrorReply(
    error: string,
    context: ReplyContext,
    alternatives?: {
      barberId: string
      barberName: string
      startTime: Date
      endTime: Date
    }[]
  ): string {
    let reply = `❌ 預約失敗\n\n`
    reply += `原因：${error}\n\n`

    if (alternatives && alternatives.length > 0) {
      reply += `💡 建議的替代時段：\n\n`
      
      alternatives.slice(0, 3).forEach((alt, index) => {
        const timeStr = format(alt.startTime, 'MM月dd日 HH:mm', { locale: zhTW })
        const endTimeStr = format(alt.endTime, 'HH:mm', { locale: zhTW })
        reply += `${index + 1}. ${alt.barberName} - ${timeStr}~${endTimeStr}\n`
      })
      
      reply += `\n如需預約以上時段，請重新發送預約訊息。\n\n`
    }

    reply += `📞 如需協助，請聯絡 ${context.storeName}\n`
    reply += `或重新發送正確格式的預約訊息。`

    return reply
  }

  /**
   * 生成格式錯誤的回覆訊息
   */
  static generateFormatErrorReply(
    errors: string[],
    context: ReplyContext
  ): string {
    let reply = `❓ 預約訊息格式有誤\n\n`
    
    reply += `請檢查以下問題：\n`
    errors.forEach((error, index) => {
      reply += `${index + 1}. ${error}\n`
    })
    
    reply += `\n📝 正確格式範例：\n`
    reply += `姓名：王小明\n`
    reply += `服務：剪髮\n`
    reply += `時間：2024-01-15 14:00\n`
    reply += `理髮師：張師傅（可選）\n\n`
    
    reply += `💡 小提示：\n`
    reply += `• 時間格式：YYYY-MM-DD HH:MM\n`
    reply += `• 也可以用「明天下午2點」等自然語言\n`
    reply += `• 不指定理髮師會自動安排\n\n`
    
    reply += `請重新發送正確格式的預約訊息，謝謝！`

    return reply
  }

  /**
   * 生成營業時間外的回覆訊息
   */
  static generateOutsideBusinessHoursReply(
    context: ReplyContext,
    businessHours?: { openTime: string; closeTime: string }
  ): string {
    let reply = `⏰ 預約時間超出營業時間\n\n`
    
    if (businessHours) {
      reply += `📅 營業時間：${businessHours.openTime} - ${businessHours.closeTime}\n\n`
    }
    
    reply += `請選擇營業時間內的時段重新預約。\n\n`
    reply += `如有疑問，歡迎聯絡 ${context.storeName}。`

    return reply
  }

  /**
   * 生成一般查詢的回覆訊息
   */
  static generateGeneralInquiryReply(context: ReplyContext): string {
    let reply = `👋 您好！歡迎聯絡 ${context.storeName}\n\n`
    
    reply += `📋 如需預約，請提供以下資訊：\n`
    reply += `• 姓名\n`
    reply += `• 服務項目\n`
    reply += `• 希望的時間\n`
    reply += `• 指定理髮師（可選）\n\n`
    
    reply += `📝 預約格式範例：\n`
    reply += `姓名：王小明\n`
    reply += `服務：剪髮\n`
    reply += `時間：明天下午2點\n\n`
    
    reply += `💬 其他問題也歡迎直接詢問！`

    return reply
  }

  /**
   * 生成預約取消確認回覆
   */
  static generateCancellationReply(
    bookingId: string,
    customerName: string,
    context: ReplyContext
  ): string {
    let reply = `✅ 預約取消成功\n\n`
    reply += `👤 客戶：${customerName}\n`
    reply += `📝 預約編號：${bookingId}\n\n`
    reply += `您的預約已成功取消。\n\n`
    reply += `如需重新預約，歡迎隨時聯絡我們。\n`
    reply += `感謝您的理解！`

    return reply
  }

  /**
   * 生成預約查詢回覆
   */
  static generateBookingInquiryReply(
    bookings: {
      id: string
      serviceName: string
      barberName: string
      startTime: Date
      status: string
    }[],
    context: ReplyContext
  ): string {
    if (bookings.length === 0) {
      return `📋 查詢結果\n\n目前沒有找到您的預約記錄。\n\n如有疑問，請聯絡 ${context.storeName}。`
    }

    let reply = `📋 您的預約記錄\n\n`
    
    bookings.forEach((booking, index) => {
      const timeStr = format(booking.startTime, 'MM月dd日 HH:mm', { locale: zhTW })
      const statusEmoji = this.getStatusEmoji(booking.status)
      
      reply += `${index + 1}. ${statusEmoji} ${booking.serviceName}\n`
      reply += `   理髮師：${booking.barberName}\n`
      reply += `   時間：${timeStr}\n`
      reply += `   編號：${booking.id}\n\n`
    })
    
    reply += `如需修改或取消預約，請提供預約編號。`

    return reply
  }

  /**
   * 生成服務項目查詢回覆
   */
  static generateServiceInquiryReply(
    services: {
      name: string
      duration: number
      price?: number
      description?: string
    }[],
    context: ReplyContext
  ): string {
    let reply = `✂️ ${context.storeName} 服務項目\n\n`
    
    services.forEach((service, index) => {
      reply += `${index + 1}. ${service.name}\n`
      reply += `   時間：${service.duration}分鐘\n`
      
      if (service.price) {
        reply += `   價格：$${service.price}\n`
      }
      
      if (service.description) {
        reply += `   說明：${service.description}\n`
      }
      
      reply += `\n`
    })
    
    reply += `如需預約，請提供您的姓名、選擇的服務和希望的時間。`

    return reply
  }

  /**
   * 生成理髮師查詢回覆
   */
  static generateBarberInquiryReply(
    barbers: {
      name: string
      specialties: string[]
    }[],
    context: ReplyContext
  ): string {
    let reply = `👨‍💼 ${context.storeName} 理髮師介紹\n\n`
    
    barbers.forEach((barber, index) => {
      reply += `${index + 1}. ${barber.name}\n`
      
      if (barber.specialties.length > 0) {
        reply += `   專長：${barber.specialties.join('、')}\n`
      }
      
      reply += `\n`
    })
    
    reply += `預約時可指定理髮師，或由我們為您安排。`

    return reply
  }

  /**
   * 根據聯絡方式調整回覆格式
   */
  static formatReplyForContactType(
    reply: string,
    contactType: 'line' | 'email',
    subject?: string
  ): { content: string; subject?: string } {
    if (contactType === 'email') {
      return {
        content: reply.replace(/\n/g, '<br>'),
        subject: subject || '預約回覆 - 自動回覆系統'
      }
    }
    
    return { content: reply }
  }

  /**
   * 取得狀態對應的表情符號
   */
  private static getStatusEmoji(status: string): string {
    switch (status) {
      case 'confirmed':
        return '✅'
      case 'cancelled':
        return '❌'
      case 'completed':
        return '✨'
      default:
        return '📋'
    }
  }

  /**
   * 生成系統錯誤回覆
   */
  static generateSystemErrorReply(context: ReplyContext): string {
    let reply = `⚠️ 系統暫時無法處理您的請求\n\n`
    reply += `請稍後再試，或直接聯絡 ${context.storeName}。\n\n`
    reply += `造成不便，敬請見諒。`

    return reply
  }

  /**
   * 生成忙碌時段建議回覆
   */
  static generateBusyPeriodSuggestionReply(
    context: ReplyContext,
    suggestedTimes: Date[]
  ): string {
    let reply = `⏰ 您選擇的時段較為熱門\n\n`
    
    if (suggestedTimes.length > 0) {
      reply += `💡 建議以下較空閒的時段：\n\n`
      
      suggestedTimes.forEach((time, index) => {
        const timeStr = format(time, 'MM月dd日 HH:mm', { locale: zhTW })
        reply += `${index + 1}. ${timeStr}\n`
      })
      
      reply += `\n`
    }
    
    reply += `如堅持原時段，建議提早預約。\n`
    reply += `感謝您的理解！`

    return reply
  }
}