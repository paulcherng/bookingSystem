import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/services/bookingService'
import { ErrorCodes } from '@/types'
import { ValidationMiddleware } from '@/lib/middleware/validation'

// 預約驗證規則
const BookingValidationRules = [
  { field: 'storeId', required: true, type: 'string' as const },
  { field: 'serviceId', required: true, type: 'string' as const },
  { field: 'startTime', required: true, type: 'string' as const },
  { field: 'customerName', required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
  { field: 'customerContact', required: true, type: 'string' as const },
  { field: 'contactType', required: true, type: 'string' as const },
  { field: 'barberId', required: false, type: 'string' as const },
  { field: 'notes', required: false, type: 'string' as const, maxLength: 500 }
]

// GET /api/bookings - 獲取預約列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const barberId = searchParams.get('barberId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!storeId) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'storeId 為必填參數',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const filters = {
      storeId,
      barberId: barberId || undefined,
      date: date || undefined,
      status: status || undefined
    }

    const result = await BookingService.getBookings(filters, { page, limit })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('獲取預約列表失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取預約列表失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST /api/bookings - 創建新預約
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 驗證資料
    const validation = ValidationMiddleware.validateRequest(body, BookingValidationRules)
    if (!validation.isValid) {
      return ValidationMiddleware.createValidationResponse(validation.errors)
    }

    // 轉換時間格式
    const startTime = new Date(body.startTime)
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'startTime 格式不正確',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const bookingData = {
      ...body,
      startTime
    }

    const result = await BookingService.createBooking(bookingData)
    
    if (!result.success) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: result.error,
          details: { alternatives: result.alternatives },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: result.booking
    }, { status: 201 })

  } catch (error) {
    console.error('創建預約失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '創建預約失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}