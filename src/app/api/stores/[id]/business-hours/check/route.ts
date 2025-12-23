import { NextRequest, NextResponse } from 'next/server'
import { BusinessHoursService } from '@/services/businessHoursService'
import { ErrorCodes } from '@/types'

// GET /api/stores/[id]/business-hours/check?datetime=2024-01-01T10:00:00Z
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const datetimeParam = searchParams.get('datetime')
    
    if (!datetimeParam) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '請提供 datetime 參數',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const datetime = new Date(datetimeParam)
    
    if (isNaN(datetime.getTime())) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '無效的日期時間格式',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const isWithinHours = await BusinessHoursService.isWithinBusinessHours(params.id, datetime)
    const dayOfWeek = datetime.getDay()
    const businessHours = await BusinessHoursService.getBusinessHoursForDay(params.id, dayOfWeek)
    
    return NextResponse.json({
      storeId: params.id,
      datetime: datetime.toISOString(),
      isWithinBusinessHours: isWithinHours,
      dayOfWeek,
      businessHours: businessHours ? {
        openTime: businessHours.openTime,
        closeTime: businessHours.closeTime,
        isClosed: businessHours.isClosed
      } : null
    })
  } catch (error) {
    console.error('檢查營業時間失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '檢查營業時間失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}