import { NextRequest, NextResponse } from 'next/server'
import { CalendarService } from '@/services/calendarService'
import { ErrorCodes } from '@/types'

// GET /api/public/stores/[id]/availability - 取得店家的可用時段
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const barberId = searchParams.get('barberId')

    if (!date || !serviceId) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '缺少必要參數: date, serviceId',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const availableSlots = await CalendarService.getAvailableTimeSlots({
      storeId: params.id,
      date,
      serviceId,
      barberId: barberId || undefined
    })

    // 轉換為前端需要的格式
    const formattedSlots = availableSlots.map(slot => ({
      startTime: slot.startTime.toTimeString().slice(0, 5), // HH:MM
      endTime: slot.endTime.toTimeString().slice(0, 5),     // HH:MM
      barberId: slot.barberId,
      barberName: slot.barberName,
      isAvailable: slot.isAvailable
    }))

    return NextResponse.json(formattedSlots)

  } catch (error) {
    console.error('Failed to fetch availability:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '無法取得可用時段',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}