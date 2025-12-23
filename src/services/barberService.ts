import { prisma } from '@/lib/prisma'
import { Barber } from '@/types'
import { z } from 'zod'

// 驗證 schema
const createBarberSchema = z.object({
  name: z.string().min(1, '理髮師姓名不能為空').max(255, '理髮師姓名過長'),
  email: z.string().email('請輸入有效的電子郵件地址').optional(),
  specialties: z.array(z.string()).min(1, '至少需要一項專長'),
  isActive: z.boolean().optional().default(true),
})

const updateBarberSchema = z.object({
  name: z.string().min(1, '理髮師姓名不能為空').max(255, '理髮師姓名過長').optional(),
  email: z.string().email('請輸入有效的電子郵件地址').optional(),
  specialties: z.array(z.string()).min(1, '至少需要一項專長').optional(),
  isActive: z.boolean().optional(),
})

export class BarberService {
  /**
   * 創建新理髮師
   */
  static async createBarber(
    storeId: string, 
    data: Omit<Barber, 'id' | 'storeId' | 'createdAt'>
  ): Promise<Barber> {
    // 驗證輸入資料
    const validatedData = createBarberSchema.parse(data)
    
    try {
      // 檢查店家是否存在
      const store = await prisma.store.findUnique({
        where: { id: storeId }
      })
      
      if (!store) {
        throw new Error('店家不存在')
      }
      
      // 如果提供了 email，檢查是否已存在
      if (validatedData.email) {
        const existingBarber = await prisma.barber.findFirst({
          where: { 
            storeId,
            email: validatedData.email 
          }
        })
        
        if (existingBarber) {
          throw new Error('此電子郵件已被使用')
        }
      }
      
      // 創建理髮師
      const barber = await prisma.barber.create({
        data: {
          storeId,
          name: validatedData.name,
          email: validatedData.email,
          specialties: validatedData.specialties,
          isActive: validatedData.isActive,
        }
      })
      
      return barber
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('創建理髮師失敗')
    }
  }
  
  /**
   * 根據 ID 獲取理髮師
   */
  static async getBarberById(id: string): Promise<Barber | null> {
    try {
      const barber = await prisma.barber.findUnique({
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
            orderBy: {
              startTime: 'asc'
            },
            take: 10
          }
        }
      })
      
      return barber
    } catch (error) {
      throw new Error('獲取理髮師資訊失敗')
    }
  }
  
  /**
   * 獲取店家的所有理髮師
   */
  static async getBarbersByStore(storeId: string, includeInactive: boolean = false): Promise<Barber[]> {
    try {
      const barbers = await prisma.barber.findMany({
        where: {
          storeId,
          ...(includeInactive ? {} : { isActive: true })
        },
        orderBy: { createdAt: 'asc' }
      })
      
      return barbers
    } catch (error) {
      throw new Error('獲取理髮師列表失敗')
    }
  }
  
  /**
   * 更新理髮師資訊
   */
  static async updateBarber(id: string, data: Partial<Barber>): Promise<Barber> {
    // 驗證輸入資料
    const validatedData = updateBarberSchema.parse(data)
    
    try {
      // 檢查理髮師是否存在
      const existingBarber = await prisma.barber.findUnique({
        where: { id }
      })
      
      if (!existingBarber) {
        throw new Error('理髮師不存在')
      }
      
      // 如果更新 email，檢查是否已存在
      if (validatedData.email && validatedData.email !== existingBarber.email) {
        const duplicateBarber = await prisma.barber.findFirst({
          where: { 
            storeId: existingBarber.storeId,
            email: validatedData.email,
            id: { not: id }
          }
        })
        
        if (duplicateBarber) {
          throw new Error('此電子郵件已被使用')
        }
      }
      
      // 更新理髮師
      const updatedBarber = await prisma.barber.update({
        where: { id },
        data: validatedData
      })
      
      return updatedBarber
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('更新理髮師資訊失敗')
    }
  }
  
  /**
   * 刪除理髮師
   */
  static async deleteBarber(id: string): Promise<void> {
    try {
      // 檢查理髮師是否存在
      const existingBarber = await prisma.barber.findUnique({
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
      
      if (!existingBarber) {
        throw new Error('理髮師不存在')
      }
      
      // 檢查是否有未來的預約
      if (existingBarber.bookings.length > 0) {
        // 如果有未來的預約，將理髮師設為非活躍狀態而不是刪除
        await prisma.barber.update({
          where: { id },
          data: { isActive: false }
        })
      } else {
        // 如果沒有未來的預約，可以安全刪除
        await prisma.barber.delete({
          where: { id }
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('刪除理髮師失敗')
    }
  }
  
  /**
   * 啟用/停用理髮師
   */
  static async toggleBarberStatus(id: string): Promise<Barber> {
    try {
      const existingBarber = await prisma.barber.findUnique({
        where: { id }
      })
      
      if (!existingBarber) {
        throw new Error('理髮師不存在')
      }
      
      const updatedBarber = await prisma.barber.update({
        where: { id },
        data: { isActive: !existingBarber.isActive }
      })
      
      return updatedBarber
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('更新理髮師狀態失敗')
    }
  }
  
  /**
   * 獲取理髮師的專長列表
   */
  static async getBarberSpecialties(storeId: string): Promise<string[]> {
    try {
      const barbers = await prisma.barber.findMany({
        where: { 
          storeId,
          isActive: true 
        },
        select: { specialties: true }
      })
      
      // 合併所有專長並去重
      const allSpecialties = barbers.flatMap(barber => barber.specialties)
      const uniqueSpecialties = [...new Set(allSpecialties)]
      
      return uniqueSpecialties
    } catch (error) {
      throw new Error('獲取專長列表失敗')
    }
  }
  
  /**
   * 根據專長搜尋理髮師
   */
  static async getBarbersBySpecialty(storeId: string, specialty: string): Promise<Barber[]> {
    try {
      const barbers = await prisma.barber.findMany({
        where: {
          storeId,
          isActive: true,
          specialties: {
            has: specialty
          }
        },
        orderBy: { createdAt: 'asc' }
      })
      
      return barbers
    } catch (error) {
      throw new Error('搜尋理髮師失敗')
    }
  }
  
  /**
   * 獲取理髮師的工作統計
   */
  static async getBarberStats(id: string): Promise<{
    totalBookings: number;
    completedBookings: number;
    upcomingBookings: number;
    cancelledBookings: number;
  }> {
    try {
      const [total, completed, upcoming, cancelled] = await Promise.all([
        prisma.booking.count({
          where: { barberId: id }
        }),
        prisma.booking.count({
          where: { 
            barberId: id,
            status: 'completed'
          }
        }),
        prisma.booking.count({
          where: { 
            barberId: id,
            status: 'confirmed',
            startTime: {
              gte: new Date()
            }
          }
        }),
        prisma.booking.count({
          where: { 
            barberId: id,
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
      throw new Error('獲取理髮師統計失敗')
    }
  }
  
  /**
   * 驗證理髮師資料
   */
  static validateBarberData(data: Omit<Barber, 'id' | 'storeId' | 'createdAt'>): { isValid: boolean; errors: string[] } {
    try {
      createBarberSchema.parse(data)
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
}