import { NextRequest, NextResponse } from 'next/server'
import { StoreService } from '@/services/storeService'
import { CreateStoreRequest, ErrorCodes } from '@/types'
import { ValidationMiddleware, StoreValidationRules } from '@/lib/middleware/validation'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'
import { BusinessLogicError, ValidationError } from '@/lib/errors/errorHandler'
import { PerformanceMonitor } from '@/lib/monitoring/performanceMonitor'
import { logger } from '@/lib/logging/logger'

// GET /api/stores - 獲取所有店家
export const GET = withErrorHandling(async () => {
  const timer = PerformanceMonitor.monitor('api.stores.get')
  
  logger.info('開始獲取店家列表', {}, { category: 'API' })
  
  const stores = await StoreService.getAllStores()
  
  logger.info('成功獲取店家列表', { count: stores.length }, { category: 'API' })
  
  return NextResponse.json(stores)
})

// POST /api/stores - 創建新店家
export const POST = withErrorHandling(async (request: NextRequest) => {
  const timer = PerformanceMonitor.monitor('api.stores.create')
  
  const body: CreateStoreRequest = await request.json()
  
  logger.info('開始創建店家', { email: body.email }, { category: 'API' })
  
  // 使用驗證中介軟體驗證資料
  const validation = ValidationMiddleware.validateRequest(body, StoreValidationRules)
  if (!validation.isValid) {
    throw new ValidationError('資料驗證失敗', validation.errors)
  }
  
  try {
    const store = await StoreService.createStore(body)
    
    logger.info('成功創建店家', { 
      storeId: store.id, 
      name: store.name 
    }, { 
      category: 'BUSINESS',
      storeId: store.id 
    })
    
    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('已被使用')) {
      throw new BusinessLogicError(error.message, ErrorCodes.DUPLICATE_EMAIL)
    }
    throw error
  }
})