import { NextRequest, NextResponse } from 'next/server'
import { CalendarService } from '@/services/calendarService'
import { ErrorCodes } from '@/types'

// GET /api/bookings/availability - 查詢可用時段
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')
    const barberId = searchParams.get('barberId')

    // 驗證必要參數
    if (!storeId || !serviceId || !date) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'storeId, serviceId, date 為必填參數',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // 驗證日期格式
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'date 格式不正確，請使用 YYYY-MM-DD 格式',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const availability = await CalendarService.getAvailableSlots({
      storeId,
      serviceId,
      date: targetDate,
      barberId: barberId || undefined
    })

    return NextResponse.json({
      date: date,
      storeId,
      serviceId,
      barberId: barberId || null,
      slots: availability.slots,
      totalSlots: availability.totalSlots,
      availableSlots: availability.availableSlots
    })

  } catch (error) {
    console.error('查詢可用時段失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '查詢可用時段失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}