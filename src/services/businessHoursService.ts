import { prisma } from '@/lib/prisma'
import { BusinessHours } from '@/types'
import { z } from 'zod'

// 驗證 schema
const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0=Sunday, 6=Saturday
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間格式應為 HH:mm'),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間格式應為 HH:mm'),
  isClosed: z.boolean().optional().default(false),
})

const businessHoursArraySchema = z.array(businessHoursSchema)

export class BusinessHoursService {
  /**
   * 設定店家營業時段
   */
  static async setBusinessHours(storeId: string, businessHours: Omit<BusinessHours, 'id' | 'storeId'>[]): Promise<BusinessHours[]> {
    // 驗證輸入資料
    const validatedData = businessHoursArraySchema.parse(businessHours)
    
    try {
      // 驗證時間邏輯
      for (const hours of validatedData) {
        if (!hours.isClosed && hours.openTime >= hours.closeTime) {
          throw new Error(`第 ${hours.dayOfWeek} 天的營業時間設定錯誤：開始時間不能晚於或等於結束時間`)
        }
      }
      
      // 使用事務處理
      const result = await prisma.$transaction(async (tx) => {
        // 刪除現有的營業時段
        await tx.businessHours.deleteMany({
          where: { storeId }
        })
        
        // 創建新的營業時段
        const createdHours = await tx.businessHours.createMany({
          data: validatedData.map(hours => ({
            storeId,
            ...hours
          }))
        })
        
        // 返回創建的營業時段
        return await tx.businessHours.findMany({
          where: { storeId },
          orderBy: { dayOfWeek: 'asc' }
        })
      })
      
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('設定營業時段失敗')
    }
  }
  
  /**
   * 獲取店家營業時段
   */
  static async getBusinessHours(storeId: string): Promise<BusinessHours[]> {
    try {
      const businessHours = await prisma.businessHours.findMany({
        where: { storeId },
        orderBy: { dayOfWeek: 'asc' }
      })
      
      return businessHours
    } catch (error) {
      throw new Error('獲取營業時段失敗')
    }
  }
  
  /**
   * 更新特定日期的營業時段
   */
  static async updateDayBusinessHours(
    storeId: string, 
    dayOfWeek: number, 
    hours: { openTime: string; closeTime: string; isClosed: boolean }
  ): Promise<BusinessHours> {
    // 驗證輸入資料
    const validatedHours = businessHoursSchema.parse({ dayOfWeek, ...hours })
    
    try {
      // 驗證時間邏輯
      if (!validatedHours.isClosed && validatedHours.openTime >= validatedHours.closeTime) {
        throw new Error('開始時間不能晚於或等於結束時間')
      }
      
      // 查找現有記錄
      const existingHours = await prisma.businessHours.findFirst({
        where: { storeId, dayOfWeek }
      })
      
      if (existingHours) {
        // 更新現有記錄
        return await prisma.businessHours.update({
          where: { id: existingHours.id },
          data: {
            openTime: validatedHours.openTime,
            closeTime: validatedHours.closeTime,
            isClosed: validatedHours.isClosed,
          }
        })
      } else {
        // 創建新記錄
        return await prisma.businessHours.create({
          data: {
            storeId,
            dayOfWeek: validatedHours.dayOfWeek,
            openTime: validatedHours.openTime,
            closeTime: validatedHours.closeTime,
            isClosed: validatedHours.isClosed,
          }
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('更新營業時段失敗')
    }
  }
  
  /**
   * 檢查指定時間是否在營業時間內
   */
  static async isWithinBusinessHours(storeId: string, dateTime: Date): Promise<boolean> {
    try {
      const dayOfWeek = dateTime.getDay()
      const timeString = dateTime.toTimeString().slice(0, 5) // HH:mm
      
      const businessHours = await prisma.businessHours.findFirst({
        where: { 
          storeId, 
          dayOfWeek 
        }
      })
      
      if (!businessHours || businessHours.isClosed) {
        return false
      }
      
      return timeString >= businessHours.openTime && timeString <= businessHours.closeTime
    } catch (error) {
      return false
    }
  }
  
  /**
   * 獲取指定日期的營業時段
   */
  static async getBusinessHoursForDay(storeId: string, dayOfWeek: number): Promise<BusinessHours | null> {
    try {
      const businessHours = await prisma.businessHours.findFirst({
        where: { storeId, dayOfWeek }
      })
      
      return businessHours
    } catch (error) {
      return null
    }
  }
  
  /**
   * 檢查營業時段設定是否完整
   */
  static async isBusinessHoursComplete(storeId: string): Promise<boolean> {
    try {
      const businessHours = await prisma.businessHours.findMany({
        where: { storeId }
      })
      
      // 檢查是否有 7 天的設定
      const daysSet = new Set(businessHours.map(h => h.dayOfWeek))
      return daysSet.size === 7
    } catch (error) {
      return false
    }
  }
  
  /**
   * 獲取下一個營業日
   */
  static async getNextBusinessDay(storeId: string, fromDate: Date): Promise<Date | null> {
    try {
      const businessHours = await this.getBusinessHours(storeId)
      
      if (businessHours.length === 0) {
        return null
      }
      
      // 從指定日期開始，找到下一個營業日
      let checkDate = new Date(fromDate)
      checkDate.setDate(checkDate.getDate() + 1) // 從明天開始檢查
      
      for (let i = 0; i < 7; i++) { // 最多檢查 7 天
        const dayOfWeek = checkDate.getDay()
        const dayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek)
        
        if (dayHours && !dayHours.isClosed) {
          return checkDate
        }
        
        checkDate.setDate(checkDate.getDate() + 1)
      }
      
      return null
    } catch (error) {
      return null
    }
  }
  
  /**
   * 驗證營業時段資料
   */
  static validateBusinessHours(businessHours: Omit<BusinessHours, 'id' | 'storeId'>[]): { isValid: boolean; errors: string[] } {
    try {
      businessHoursArraySchema.parse(businessHours)
      
      // 額外驗證
      const errors: string[] = []
      
      for (const hours of businessHours) {
        if (!hours.isClosed && hours.openTime >= hours.closeTime) {
          errors.push(`第 ${hours.dayOfWeek} 天的營業時間設定錯誤`)
        }
      }
      
      // 檢查是否有重複的日期
      const days = businessHours.map(h => h.dayOfWeek)
      const uniqueDays = new Set(days)
      if (days.length !== uniqueDays.size) {
        errors.push('不能有重複的日期設定')
      }
      
      return { isValid: errors.length === 0, errors }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => err.message)
        }
      }
      return { isValid: false, errors: ['驗證失敗'] }
    }
  }
}