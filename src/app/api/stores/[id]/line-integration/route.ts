import { NextRequest, NextResponse } from 'next/server'
import { StoreService } from '@/services/storeService'
import { ErrorCodes } from '@/types'
import { z } from 'zod'

const lineIntegrationSchema = z.object({
  channelId: z.string().min(1, 'Channel ID 不能為空'),
  channelSecret: z.string().min(1, 'Channel Secret 不能為空'),
  accessToken: z.string().min(1, 'Access Token 不能為空'),
})

// POST /api/stores/[id]/line-integration - 設定 LINE 整合
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // 驗證資料
    const validatedData = lineIntegrationSchema.parse(body)
    
    const updatedStore = await StoreService.setLineIntegration(params.id, validatedData)
    
    return NextResponse.json({
      message: 'LINE 整合設定成功',
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        hasLineIntegration: true
      }
    })
  } catch (error) {
    console.error('設定 LINE 整合失敗:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '資料驗證失敗',
          details: error.errors.map(err => err.message),
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '設定 LINE 整合失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET /api/stores/[id]/line-integration - 檢查 LINE 整合狀態
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hasIntegration = await StoreService.hasLineIntegration(params.id)
    
    return NextResponse.json({
      storeId: params.id,
      hasLineIntegration: hasIntegration
    })
  } catch (error) {
    console.error('檢查 LINE 整合狀態失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '檢查 LINE 整合狀態失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}