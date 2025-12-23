import { prisma } from '@/lib/prisma'
import { Service } from '@/types'
import { z } from 'zod'

// 驗證 schema
const createServiceSchema = z.object({
  name: z.string().min(1, '服務名稱不能為空').max(255, '服務名稱過長'),
  duration: z.number().min(1, '服務時間至少需要 1 分鐘').max(480, '服務時間不能超過 8 小時'),
  price: z.number().min(0, '價格不能為負數').optional(),
  description: z.string().max(1000, '描述過長').optional(),
  isActive: z.boolean().optional().default(true),
})

const updateServiceSchema = z.object({
  name: z.string().min(1, '服務名稱不能為空').max(255, '服務名稱過長').optional(),
  duration: z.number().min(1, '服務時間至少需要 1 分鐘').max(480, '服務時間不能超過 8 小時').optional(),
  price: z.number().min(0, '價格不能為負數').optional(),
  description: z.string().max(1000, '描述過長').optional(),
  isActive: z.boolean().optional(),
})

export class ServiceService {
  /**
   * 創建新服務項目
   */
  static async createService(
    storeId: string, 
    data: Omit<Service, 'id' | 'storeId'>
  ): Promise<Service> {
    // 驗證輸入資料
    const validatedData = createServiceSchema.parse(data)
    
    try {
      // 檢查店家是否存在
      const store = await prisma.store.findUnique({
        where: { id: storeId }
      })
      
      if (!store) {
        throw new Error('店家不存在')
      }
      
      // 檢查服務名稱是否已存在
      const existingService = await prisma.service.findFirst({
        where: { 
          storeId,
          name: validatedData.name,
          isActive: true
        }
      })
      
      if (existingService) {
        throw new Error('此服務名稱已存在')
      }
      
      // 創建服務項目
      const service = await prisma.service.create({
        data: {
          storeId,
          name: validatedData.name,
          duration: validatedData.duration,
          price: validatedData.price,
          description: validatedData.description,
          isActive: validatedData.isActive,
        }
      })
      
      return service
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('創建服務項目失敗')
    }
  }
  
  /**
   * 根據 ID 獲取服務項目
   */
  static async getServiceById(id: string): Promise<Service | null> {
    try {
      const service = await prisma.service.findUnique({
        where: { id },
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          },
          bookings: {
            where: {
              status: 'confirmed',
              startTime: {
                gte: new Date()
              }
            },
            select: {
              id: true,
              startTime: true,
              customerName: true
            },
            orderBy: {
              startTime: 'asc'
            },
            take: 5
          }
        }
      })
      
      return service
    } catch (error) {
      throw new Error('獲取服務項目失敗')
    }
  }
  
  /**
   * 獲取店家的所有服務項目
   */
  static async getServicesByStore(storeId: string, includeInactive: boolean = false): Promise<Service[]> {
    try {
      const services = await prisma.service.findMany({
        where: {
          storeId,
          ...(includeInactive ? {} : { isActive: true })
        },
        orderBy: { name: 'asc' }
      })
      
      return services
    } catch (error) {
      throw new Error('獲取服務項目列表失敗')
    }
  }
  
  /**
   * 更新服務項目
   */
  static async updateService(id: string, data: Partial<Service>): Promise<Service> {
    // 驗證輸入資料
    const validatedData = updateServiceSchema.parse(data)
    
    try {
      // 檢查服務項目是否存在
      const existingService = await prisma.service.findUnique({
        where: { id }
      })
      
      if (!existingService) {
        throw new Error('服務項目不存在')
      }
      
      // 如果更新名稱，檢查是否已存在
      if (validatedData.name && validatedData.name !== existingService.name) {
        const duplicateService = await prisma.service.findFirst({
          where: { 
            storeId: existingService.storeId,
            name: validatedData.name,
            isActive: true,
            id: { not: id }
          }
        })
        
        if (duplicateService) {
          throw new Error('此服務名稱已存在')
        }
      }
      
      // 更新服務項目
      const updatedService = await prisma.service.update({
        where: { id },
        data: validatedData
      })
      
      return updatedService
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('更新服務項目失敗')
    }
  }
  
  /**
   * 刪除服務項目
   */
  static async deleteService(id: string): Promise<void> {
    try {
      // 檢查服務項目是否存在
      const existingService = await prisma.service.findUnique({
        where: { id },
        include: {
          bookings: {
            where: {
              status: 'confirmed',
              startTime: {
                gte: new Date()
              }
            }
          }
        }
      })
      
      if (!existingService) {
        throw new Error('服務項目不存在')
      }
      
      // 檢查是否有未來的預約
      if (existingService.bookings.length > 0) {
        // 如果有未來的預約，將服務設為非活躍狀態而不是刪除
        await prisma.service.update({
          where: { id },
          data: { isActive: false }
        })
      } else {
        // 如果沒有未來的預約，可以安全刪除
        await prisma.service.delete({
          where: { id }
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('刪除服務項目失敗')
    }
  }
  
  /**
   * 啟用/停用服務項目
   */
  static async toggleServiceStatus(id: string): Promise<Service> {
    try {
      const existingService = await prisma.service.findUnique({
        where: { id }
      })
      
      if (!existingService) {
        throw new Error('服務項目不存在')
      }
      
      const updatedService = await prisma.service.update({
        where: { id },
        data: { isActive: !existingService.isActive }
      })
      
      return updatedService
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('更新服務項目狀態失敗')
    }
  }
  
  /**
   * 根據時間長度搜尋服務項目
   */
  static async getServicesByDuration(
    storeId: string, 
    minDuration?: number, 
    maxDuration?: number
  ): Promise<Service[]> {
    try {
      const whereClause: any = {
        storeId,
        isActive: true
      }
      
      if (minDuration !== undefined || maxDuration !== undefined) {
        whereClause.duration = {}
        if (minDuration !== undefined) {
          whereClause.duration.gte = minDuration
        }
        if (maxDuration !== undefined) {
          whereClause.duration.lte = maxDuration
        }
      }
      
      const services = await prisma.service.findMany({
        where: whereClause,
        orderBy: { duration: 'asc' }
      })
      
      return services
    } catch (error) {
      throw new Error('搜尋服務項目失敗')
    }
  }
  
  /**
   * 根據價格範圍搜尋服務項目
   */
  static async getServicesByPriceRange(
    storeId: string, 
    minPrice?: number, 
    maxPrice?: number
  ): Promise<Service[]> {
    try {
      const whereClause: any = {
        storeId,
        isActive: true,
        price: { not: null }
      }
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        if (minPrice !== undefined) {
          whereClause.price.gte = minPrice
        }
        if (maxPrice !== undefined) {
          whereClause.price.lte = maxPrice
        }
      }
      
      const services = await prisma.service.findMany({
        where: whereClause,
        orderBy: { price: 'asc' }
      })
      
      return services
    } catch (error) {
      throw new Error('搜尋服務項目失敗')
    }
  }
  
  /**
   * 獲取服務項目統計
   */
  static async getServiceStats(id: string): Promise<{
    totalBookings: number;
    completedBookings: number;
    upcomingBookings: number;
    cancelledBookings: number;
    averageRating?: number;
  }> {
    try {
      const [total, completed, upcoming, cancelled] = await Promise.all([
        prisma.booking.count({
          where: { serviceId: id }
        }),
        prisma.booking.count({
          where: { 
            serviceId: id,
            status: 'completed'
          }
        }),
        prisma.booking.count({
          where: { 
            serviceId: id,
            status: 'confirmed',
            startTime: {
              gte: new Date()
            }
          }
        }),
        prisma.booking.count({
          where: { 
            serviceId: id,
            status: 'cancelled'
          }
        })
      ])
      
      return {
        totalBookings: total,
        completedBookings: completed,
        upcomingBookings: upcoming,
        cancelledBookings: cancelled
      }
    } catch (error) {
      throw new Error('獲取服務項目統計失敗')
    }
  }
  
  /**
   * 驗證服務項目資料
   */
  static validateServiceData(data: Omit<Service, 'id' | 'storeId'>): { isValid: boolean; errors: string[] } {
    try {
      createServiceSchema.parse(data)
      return { isValid: true, errors: [] }
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
  
  /**
   * 驗證服務時間格式
   */
  static validateServiceDuration(duration: number): boolean {
    return Number.isInteger(duration) && duration > 0 && duration <= 480
  }
  
  /**
   * 格式化服務時間顯示
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} 分鐘`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return `${hours} 小時`
    }
    
    return `${hours} 小時 ${remainingMinutes} 分鐘`
  }
}