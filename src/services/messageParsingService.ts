import { prisma } from '@/lib/prisma'

export interface ParsedBookingInfo {
  serviceName?: string
  serviceId?: string
  dateTime?: string
  customerName?: string
  barberName?: string
  barberId?: string
  isValidRequest: boolean
  errors: string[]
}

export class MessageParsingService {
  /**
   * 解析訊息內容提取預約資訊
   */
  static async parseBookingMessage(
    message: string, 
    storeId: string
  ): Promise<ParsedBookingInfo> {
    const result: ParsedBookingInfo = {
      isValidRequest: false,
      errors: []
    }

    try {
      // 清理訊息內容
      const cleanMessage = message.trim().toLowerCase()

      // 提取客戶姓名
      result.customerName = this.extractCustomerName(message)

      // 提取服務項目
      const serviceInfo = await this.extractServiceInfo(cleanMessage, storeId)
      result.serviceName = serviceInfo.name
      result.serviceId = serviceInfo.id

      // 提取理髮師資訊
      const barberInfo = await this.extractBarberInfo(cleanMessage, storeId)
      result.barberName = barberInfo.name
      result.barberId = barberInfo.id

      // 提取日期時間
      result.dateTime = this.extractDateTime(message)

      // 驗證必要資訊
      this.validateBookingInfo(result)

      return result

    } catch (error) {
      console.error('Message parsing error:', error)
      result.errors.push('訊息解析過程中發生錯誤')
      return result
    }
  }

  /**
   * 提取客戶姓名
   */
  private static extractCustomerName(message: string): string | undefined {
    // 尋找姓名相關的關鍵字
    const namePatterns = [
      /(?:我是|我叫|姓名|名字|name)[:：]?\s*([^\n\r,，。.]+)/i,
      /^([^\n\r,，。.]{2,10})\s*(?:想要|要|預約)/i
    ]

    for (const pattern of namePatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        const name = match[1].trim()
        // 過濾掉明顯不是姓名的內容
        if (name.length >= 2 && name.length <= 10 && !name.includes('預約')) {
          return name
        }
      }
    }

    return undefined
  }

  /**
   * 提取服務項目資訊
   */
  private static async extractServiceInfo(
    message: string, 
    storeId: string
  ): Promise<{ name?: string; id?: string }> {
    try {
      // 取得店家的所有服務項目
      const services = await prisma.service.findMany({
        where: { 
          storeId,
          isActive: true
        },
        select: {
          id: true,
          name: true
        }
      })

      // 尋找服務相關的關鍵字
      const servicePatterns = [
        /(?:服務|service)[:：]?\s*([^\n\r,，。.]+)/i,
        /(?:想要|要|預約)[:：]?\s*([^\n\r,，。.]+)/i
      ]

      for (const pattern of servicePatterns) {
        const match = message.match(pattern)
        if (match && match[1]) {
          const serviceText = match[1].trim()
          
          // 嘗試匹配店家的服務項目
          for (const service of services) {
            if (serviceText.includes(service.name) || service.name.includes(serviceText)) {
              return { name: service.name, id: service.id }
            }
          }
          
          return { name: serviceText }
        }
      }

      // 如果沒有明確的服務關鍵字，檢查是否包含常見的服務名稱
      const commonServices = ['剪髮', '洗髮', '染髮', '燙髮', '護髮', '造型']
      for (const commonService of commonServices) {
        if (message.includes(commonService)) {
          // 尋找匹配的店家服務
          const matchingService = services.find(s => 
            s.name.includes(commonService) || commonService.includes(s.name)
          )
          if (matchingService) {
            return { name: matchingService.name, id: matchingService.id }
          }
          return { name: commonService }
        }
      }

      return {}
    } catch (error) {
      console.error('Error extracting service info:', error)
      return {}
    }
  }

  /**
   * 提取理髮師資訊
   */
  private static async extractBarberInfo(
    message: string, 
    storeId: string
  ): Promise<{ name?: string; id?: string }> {
    try {
      // 取得店家的所有理髮師
      const barbers = await prisma.barber.findMany({
        where: { 
          storeId,
          isActive: true
        },
        select: {
          id: true,
          name: true
        }
      })

      // 尋找理髮師相關的關鍵字
      const barberPatterns = [
        /(?:理髮師|師傅|老師|barber)[:：]?\s*([^\n\r,，。.]+)/i,
        /(?:指定|找|要)[:：]?\s*([^\n\r,，。.]+)(?:師傅|老師|理髮師)/i
      ]

      for (const pattern of barberPatterns) {
        const match = message.match(pattern)
        if (match && match[1]) {
          const barberText = match[1].trim()
          
          // 嘗試匹配店家的理髮師
          for (const barber of barbers) {
            if (barberText.includes(barber.name) || barber.name.includes(barberText)) {
              return { name: barber.name, id: barber.id }
            }
          }
          
          return { name: barberText }
        }
      }

      return {}
    } catch (error) {
      console.error('Error extracting barber info:', error)
      return {}
    }
  }

  /**
   * 提取日期時間
   */
  private static extractDateTime(message: string): string | undefined {
    // 尋找日期時間相關的關鍵字
    const dateTimePatterns = [
      /(?:時間|日期|date|time)[:：]?\s*([^\n\r,，。.]+)/i,
      /(?:明天|後天|今天|下週|下個月)\s*([^\n\r,，。.]*)/i,
      /(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|\d{4}-\d{1,2}-\d{1,2})\s*([^\n\r,，。.]*)/i,
      /(\d{1,2}:\d{2}|\d{1,2}點\d{0,2}分?)/i
    ]

    for (const pattern of dateTimePatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return undefined
  }

  /**
   * 驗證預約資訊的完整性
   */
  private static validateBookingInfo(info: ParsedBookingInfo): void {
    info.errors = []

    if (!info.serviceName) {
      info.errors.push('請提供您需要的服務項目')
    }

    if (!info.dateTime) {
      info.errors.push('請提供您希望的預約時間')
    }

    if (!info.customerName) {
      info.errors.push('請提供您的姓名')
    }

    info.isValidRequest = info.errors.length === 0
  }

  /**
   * 生成格式說明訊息
   */
  static generateFormatInstructions(): string {
    return `請按照以下格式發送預約訊息：

姓名：您的姓名
服務：剪髮/洗髮/染髮等
時間：YYYY-MM-DD HH:MM 或 明天下午2點
理髮師：指定理髮師（可選）

範例：
姓名：王小明
服務：剪髮
時間：2024-01-15 14:00
理髮師：張師傅`
  }

  /**
   * 生成錯誤回覆訊息
   */
  static generateErrorResponse(errors: string[]): string {
    let response = '很抱歉，您的預約訊息有以下問題：\n\n'
    
    errors.forEach((error, index) => {
      response += `${index + 1}. ${error}\n`
    })

    response += '\n' + this.generateFormatInstructions()
    
    return response
  }
}