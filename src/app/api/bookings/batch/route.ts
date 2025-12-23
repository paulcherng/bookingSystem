import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/services/bookingService'
import { ErrorCodes } from '@/types'

// POST /api/bookings/batch - 批次操作預約
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bookingIds, data } = body

    if (!action || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'action 和 bookingIds 為必填參數，且 bookingIds 必須為非空陣列',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    let results: any[] = []

    switch (action) {
      case 'cancel':
        const reason = data?.reason || '批次取消'
        for (const bookingId of bookingIds) {
          try {
            const result = await BookingService.cancelBooking(bookingId, reason)
            results.push({
              bookingId,
              success: result.success,
              error: result.success ? null : result.error
            })
          } catch (error) {
            results.push({
              bookingId,
              success: false,
              error: error instanceof Error ? error.message : '未知錯誤'
            })
          }
        }
        break

      case 'confirm':
        for (const bookingId of bookingIds) {
          try {
            const result = await BookingService.updateBooking(bookingId, { status: 'confirmed' })
            results.push({
              bookingId,
              success: result.success,
              error: result.success ? null : result.error
            })
          } catch (error) {
            results.push({
              bookingId,
              success: false,
              error: error instanceof Error ? error.message : '未知錯誤'
            })
          }
        }
        break

      case 'reschedule':
        if (!data?.startTime) {
          return NextResponse.json(
            {
              code: ErrorCodes.VALIDATION_ERROR,
              message: '重新安排時間需要提供 startTime',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        const newStartTime = new Date(data.startTime)
        if (isNaN(newStartTime.getTime())) {
          return NextResponse.json(
            {
              code: ErrorCodes.VALIDATION_ERROR,
              message: 'startTime 格式不正確',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        for (const bookingId of bookingIds) {
          try {
            const result = await BookingService.updateBooking(bookingId, { 
              startTime: newStartTime,
              barberId: data.barberId 
            })
            results.push({
              bookingId,
              success: result.success,
              error: result.success ? null : result.error
            })
          } catch (error) {
            results.push({
              bookingId,
              success: false,
              error: error instanceof Error ? error.message : '未知錯誤'
            })
          }
        }
        break

      default:
        return NextResponse.json(
          {
            code: ErrorCodes.VALIDATION_ERROR,
            message: '不支援的操作類型',
            details: { supportedActions: ['cancel', 'confirm', 'reschedule'] },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: failureCount === 0,
      totalProcessed: results.length,
      successCount,
      failureCount,
      results
    })

  } catch (error) {
    console.error('批次操作失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '批次操作失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}