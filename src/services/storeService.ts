import { prisma } from '@/lib/prisma'
import { Store, CreateStoreRequest } from '@/types'
import { z } from 'zod'
import { logger } from '@/lib/logging/logger'
import { ErrorTracker } from '@/lib/monitoring/errorTracker'
import { PerformanceMonitor } from '@/lib/monitoring/performanceMonitor'
import { BusinessLogicError, SystemError, ErrorCodes } from '@/lib/errors/errorHandler'

// 驗證 schema
const createStoreSchema = z.object({
  name: z.string().min(1, '店家名稱不能為空').max(255, '店家名稱過長'),
  email: z.string().email('請輸入有效的電子郵件地址'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const updateStoreSchema = z.object({
  name: z.string().min(1, '店家名稱不能為空').max(255, '店家名稱過長').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  lineChannelId: z.string().optional(),
  lineChannelSecret: z.string().optional(),
  lineAccessToken: z.string().optional(),
})

export class StoreService {
  /**
   * 創建新店家
   */
  static async createStore(data: CreateStoreRequest): Promise<Store> {
    const operationId = `createStore_${Date.now()}`
    PerformanceMonitor.startOperation(operationId, 'StoreService.createStore', { data })
    
    // 驗證輸入資料
    const validatedData = createStoreSchema.parse(data)
    
    try {
      logger.info('開始創建店家', { email: validatedData.email }, { category: 'STORE_SERVICE' })
      
      // 檢查 email 是否已存在
      const existingStore = await prisma.store.findUnique({
        where: { email: validatedData.email }
      })
      
      if (existingStore) {
        const error = new BusinessLogicError('此電子郵件已被使用', ErrorCodes.DUPLICATE_EMAIL)
        ErrorTracker.trackError(error, { details: { email: validatedData.email } }, 'medium')
        throw error
      }
      
      // 創建店家
      const store = await prisma.store.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
        }
      })
      
      logger.info('成功創建店家', { 
        storeId: store.id, 
        name: store.name 
      }, { 
        category: 'STORE_SERVICE',
        storeId: store.id 
      })
      
      PerformanceMonitor.endOperation(operationId, 'StoreService.createStore', true)
      return store
    } catch (error) {
      PerformanceMonitor.endOperation(operationId, 'StoreService.createStore', false)
      
      if (error instanceof BusinessLogicError) {
        throw error
      }
      
      const systemError = new SystemError('創建店家失敗', error)
      ErrorTracker.trackError(systemError, { details: { storeData: data } }, 'high')
      throw systemError
    }
  }
  
  /**
   * 根據 ID 獲取店家
   */
  static async getStoreById(id: string): Promise<Store | null> {
    try {
      const store = await prisma.store.findUnique({
        where: { id },
        include: {
          businessHours: true,
          barbers: {
            where: { isActive: true }
          },
          services: {
            where: { isActive: true }
          }
        }
      })
      
      return store
    } catch (error) {
      throw new Error('獲取店家資訊失敗')
    }
  }
  
  /**
   * 根據 email 獲取店家
   */
  static async getStoreByEmail(email: string): Promise<Store | null> {
    try {
      const store = await prisma.store.findUnique({
        where: { email }
      })
      
      return store
    } catch (error) {
      throw new Error('獲取店家資訊失敗')
    }
  }
  
  /**
   * 更新店家資訊
   */
  static async updateStore(id: string, data: Partial<Store>): Promise<Store> {
    // 驗證輸入資料
    const validatedData = updateStoreSchema.parse(data)
    
    try {
      // 檢查店家是否存在
      const existingStore = await prisma.store.findUnique({
        where: { id }
      })
      
      if (!existingStore) {
        throw new Error('店家不存在')
      }
      
      // 更新店家
      const updatedStore = await prisma.store.update({
        where: { id },
        data: validatedData
      })
      
      return updatedStore
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('更新店家資訊失敗')
    }
  }
  
  /**
   * 刪除店家
   */
  static async deleteStore(id: string): Promise<void> {
    try {
      // 檢查店家是否存在
      const existingStore = await prisma.store.findUnique({
        where: { id }
      })
      
      if (!existingStore) {
        throw new Error('店家不存在')
      }
      
      // 刪除店家（會級聯刪除相關資料）
      await prisma.store.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('刪除店家失敗')
    }
  }
  
  /**
   * 獲取所有店家列表
   */
  static async getAllStores(): Promise<Store[]> {
    try {
      const stores = await prisma.store.findMany({
        orderBy: { createdAt: 'desc' }
      })
      
      return stores
    } catch (error) {
      throw new Error('獲取店家列表失敗')
    }
  }
  
  /**
   * 驗證店家資料
   */
  static validateStoreData(data: CreateStoreRequest): { isValid: boolean; errors: string[] } {
    try {
      createStoreSchema.parse(data)
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
   * 設定 LINE 整合資訊
   */
  static async setLineIntegration(
    storeId: string, 
    lineConfig: {
      channelId: string;
      channelSecret: string;
      accessToken: string;
    }
  ): Promise<Store> {
    try {
      const updatedStore = await prisma.store.update({
        where: { id: storeId },
        data: {
          lineChannelId: lineConfig.channelId,
          lineChannelSecret: lineConfig.channelSecret,
          lineAccessToken: lineConfig.accessToken,
        }
      })
      
      return updatedStore
    } catch (error) {
      throw new Error('設定 LINE 整合失敗')
    }
  }
  
  /**
   * 檢查店家是否已設定 LINE 整合
   */
  static async hasLineIntegration(storeId: string): Promise<boolean> {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          lineChannelId: true,
          lineChannelSecret: true,
          lineAccessToken: true,
        }
      })
      
      return !!(store?.lineChannelId && store?.lineChannelSecret && store?.lineAccessToken)
    } catch (error) {
      return false
    }
  }
}