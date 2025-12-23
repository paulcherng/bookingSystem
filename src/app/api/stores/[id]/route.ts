import { NextRequest, NextResponse } from 'next/server'
import { StoreService } from '@/services/storeService'
import { ErrorCodes } from '@/types'
import { ValidationMiddleware, StoreValidationRules } from '@/lib/middleware/validation'

// GET /api/stores/[id] - 獲取特定店家
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = await StoreService.getStoreById(params.id)
    
    if (!store) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: '店家不存在',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(store)
  } catch (error) {
    console.error('獲取店家資訊失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取店家資訊失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT /api/stores/[id] - 更新店家資訊
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // 使用驗證中介軟體驗證資料（更新時某些欄位可能為選填）
    const updateRules = StoreValidationRules.map(rule => ({ ...rule, required: false }))
    const validation = ValidationMiddleware.validateRequest(body, updateRules)
    if (!validation.isValid) {
      return ValidationMiddleware.createValidationResponse(validation.errors)
    }
    
    const updatedStore = await StoreService.updateStore(params.id, body)
    
    return NextResponse.json(updatedStore)
  } catch (error) {
    console.error('更新店家資訊失敗:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('不存在')) {
        return NextResponse.json(
          {
            code: ErrorCodes.BUSINESS_LOGIC_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '更新店家資訊失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE /api/stores/[id] - 刪除店家
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await StoreService.deleteStore(params.id)
    
    return NextResponse.json({ message: '店家已刪除' })
  } catch (error) {
    console.error('刪除店家失敗:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('不存在')) {
        return NextResponse.json(
          {
            code: ErrorCodes.BUSINESS_LOGIC_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '刪除店家失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}