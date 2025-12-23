import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/services/bookingService'
import { NotificationService } from '@/services/notificationService'
import { AutoReplyService } from '@/services/autoReplyService'
import { ErrorCodes } from '@/types'

// POST /api/public/bookings - 客戶網頁預約
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 驗證必要欄位
    const requiredFields = ['storeId', 'serviceId', 'timeSlot', 'customerName', 'customerPhone']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '缺少必要欄位',
          details: { missingFields },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // 解析時段資訊
    const [startTimeStr, endTimeStr, barberId] = body.timeSlot.split('-')
    const startTime = new Date(`${body.date}T${startTimeStr}:00`)
    
    // 創建預約
    const bookingResult = await BookingService.createBooking({
      storeId: body.storeId,
      barberId: barberId || undefined,
      serviceId: body.serviceId,
      startTime,
      customerName: body.customerName,
      customerContact: body.customerPhone,
      contactType: 'email', // 網頁預約預設使用 email 聯絡
      notes: body.notes
    })

    if (!bookingResult.success) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: bookingResult.error,
          details: { alternatives: bookingResult.alternatives },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // 發送確認通知 (如果有提供 email)
    if (body.customerEmail && bookingResult.booking) {
      try {
        await NotificationService.sendNotification({
          storeId: body.storeId,
          customerContact: body.customerEmail,
          contactType: 'email',
          messageType: 'booking_confirmation',
          data: {
            bookingResult,
            storeName: '店家名稱', // 實際應該從資料庫取得
            customerName: body.customerName,
            serviceName: bookingResult.booking.serviceName,
            barberName: bookingResult.booking.barberName,
            startTime: bookingResult.booking.startTime,
            endTime: bookingResult.booking.endTime
          }
        })
      } catch (notificationError) {
        console.error('Failed to send confirmation email:', notificationError)
        // 不影響預約成功，只記錄錯誤
      }
    }

    return NextResponse.json({
      success: true,
      booking: bookingResult.booking,
      message: '預約成功！我們會盡快與您聯繫確認。'
    }, { status: 201 })

  } catch (error) {
    console.error('Public booking creation error:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '預約系統暫時無法使用，請稍後再試',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}