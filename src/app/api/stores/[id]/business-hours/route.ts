import { NextRequest, NextResponse } from 'next/server'
import { BusinessHoursService } from '@/services/businessHoursService'
import { ErrorCodes } from '@/types'

// GET /api/stores/[id]/business-hours - 獲取營業時段
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessHours = await BusinessHoursService.getBusinessHours(params.id)
    
    return NextResponse.json(businessHours)
  } catch (error) {
    console.error('獲取營業時段失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取營業時段失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST /api/stores/[id]/business-hours - 設定營業時段
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // 驗證資料
    const validation = BusinessHoursService.validateBusinessHours(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '營業時段資料驗證失敗',
          details: validation.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const businessHours = await BusinessHoursService.setBusinessHours(params.id, body)
    
    return NextResponse.json(businessHours, { status: 201 })
  } catch (error) {
    console.error('設定營業時段失敗:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '設定營業時段失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT /api/stores/[id]/business-hours - 更新營業時段
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // 驗證資料
    const validation = BusinessHoursService.validateBusinessHours(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '營業時段資料驗證失敗',
          details: validation.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const businessHours = await BusinessHoursService.setBusinessHours(params.id, body)
    
    return NextResponse.json(businessHours)
  } catch (error) {
    console.error('更新營業時段失敗:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '更新營業時段失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}