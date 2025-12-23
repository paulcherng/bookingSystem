import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/services/bookingService'
import { ErrorCodes } from '@/types'

// GET /api/bookings/[id] - 獲取特定預約
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await BookingService.getBookingById(params.id)
    
    if (!booking) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: '預約不存在',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(booking)
  } catch (error) {
    console.error('獲取預約資訊失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取預約資訊失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id] - 更新預約
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // 如果有 startTime，轉換格式
    if (body.startTime) {
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
      body.startTime = startTime
    }
    
    const result = await BookingService.updateBooking(params.id, body)
    
    if (!result.success) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      booking: result.booking
    })
  } catch (error) {
    console.error('更新預約失敗:', error)
    
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
        message: '更新預約失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id] - 取消預約
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || '客戶取消'
    
    const result = await BookingService.cancelBooking(params.id, reason)
    
    if (!result.success) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '預約已取消'
    })
  } catch (error) {
    console.error('取消預約失敗:', error)
    
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
        message: '取消預約失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}