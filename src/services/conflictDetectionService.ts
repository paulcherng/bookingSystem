import { prisma } from '@/lib/prisma'
import { parseISO, isWithinInterval, addMinutes, format } from 'date-fns'

export interface ConflictCheckResult {
  hasConflict: boolean
  conflictType?: 'time_overlap' | 'outside_business_hours' | 'barber_unavailable' | 'service_unavailable'
  conflictDetails?: string
  suggestedAlternatives?: {
    barberId: string
    barberName: string
    startTime: Date
    endTime: Date
  }[]
}

export interface BookingConflictCheck {
  storeId: string
  barberId?: string
  serviceId: string
  startTime: Date
  endTime: Date
  excludeBookingId?: string // 用於更新現有預約時排除自己
}

export class ConflictDetectionService {
  /**
   * 檢查預約是否有衝突
   */
  static async checkBookingConflicts(check: BookingConflictCheck): Promise<ConflictCheckResult> {
    try {
      const { storeId, barberId, serviceId, startTime, endTime, excludeBookingId } = check

      // 1. 檢查服務是否存在且可用
      const serviceCheck = await this.checkServiceAvailability(storeId, serviceId)
      if (!serviceCheck.isAvailable) {
        return {
          hasConflict: true,
          conflictType: 'service_unavailable',
          conflictDetails: serviceCheck.reason
        }
      }

      // 2. 檢查營業時間
      const businessHoursCheck = await this.checkBusinessHours(storeId, startTime, endTime)
      if (!businessHoursCheck.isWithinHours) {
        return {
          hasConflict: true,
          conflictType: 'outside_business_hours',
          conflictDetails: businessHoursCheck.reason
        }
      }

      // 3. 如果指定了理髮師，檢查該理髮師的可用性
      if (barberId) {
        const barberCheck = await this.checkBarberAvailability(
          storeId, 
          barberId, 
          startTime, 
          endTime, 
          excludeBookingId
        )
        
        if (!barberCheck.isAvailable) {
          // 尋找替代理髮師
          const alternatives = await this.findAlternativeBarbers(
            storeId, 
            startTime, 
            endTime, 
            excludeBookingId
          )
          
          return {
            hasConflict: true,
            conflictType: 'barber_unavailable',
            conflictDetails: barberCheck.reason,
            suggestedAlternatives: alternatives
          }
        }
      } else {
        // 如果沒有指定理髮師，尋找可用的理髮師
        const availableBarbers = await this.findAvailableBarbers(
          storeId, 
          startTime, 
          endTime, 
          excludeBookingId
        )
        
        if (availableBarbers.length === 0) {
          return {
            hasConflict: true,
            conflictType: 'time_overlap',
            conflictDetails: '該時段所有理髮師都已被預約'
          }
        }
      }

      return { hasConflict: false }

    } catch (error) {
      console.error('Error checking booking conflicts:', error)
      return {
        hasConflict: true,
        conflictType: 'time_overlap',
        conflictDetails: '檢查預約衝突時發生錯誤'
      }
    }
  }

  /**
   * 檢查服務可用性
   */
  private static async checkServiceAvailability(storeId: string, serviceId: string): Promise<{
    isAvailable: boolean
    reason?: string
  }> {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, storeId }
    })

    if (!service) {
      return { isAvailable: false, reason: '找不到指定的服務項目' }
    }

    if (!service.isActive) {
      return { isAvailable: false, reason: '該服務項目目前暫停提供' }
    }

    return { isAvailable: true }
  }

  /**
   * 檢查營業時間
   */
  private static async checkBusinessHours(
    storeId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<{
    isWithinHours: boolean
    reason?: string
  }> {
    const dayOfWeek = startTime.getDay()
    const dateStr = format(startTime, 'yyyy-MM-dd')

    const businessHours = await prisma.businessHours.findFirst({
      where: {
        storeId,
        dayOfWeek
      }
    })

    if (!businessHours) {
      return { isWithinHours: false, reason: '該日期沒有設定營業時間' }
    }

    if (businessHours.isClosed) {
      return { isWithinHours: false, reason: '該日期為休息日' }
    }

    const businessStart = parseISO(`${dateStr}T${businessHours.openTime}:00`)
    const businessEnd = parseISO(`${dateStr}T${businessHours.closeTime}:00`)

    const isStartWithinHours = isWithinInterval(startTime, { start: businessStart, end: businessEnd })
    const isEndWithinHours = isWithinInterval(endTime, { start: businessStart, end: businessEnd })

    if (!isStartWithinHours || !isEndWithinHours) {
      return { 
        isWithinHours: false, 
        reason: `營業時間為 ${businessHours.openTime} - ${businessHours.closeTime}` 
      }
    }

    return { isWithinHours: true }
  }

  /**
   * 檢查理髮師可用性
   */
  private static async checkBarberAvailability(
    storeId: string,
    barberId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<{
    isAvailable: boolean
    reason?: string
  }> {
    // 檢查理髮師是否存在且可用
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, storeId }
    })

    if (!barber) {
      return { isAvailable: false, reason: '找不到指定的理髮師' }
    }

    if (!barber.isActive) {
      return { isAvailable: false, reason: '該理髮師目前暫停服務' }
    }

    // 檢查時段衝突
    const whereClause: any = {
      storeId,
      barberId,
      status: { not: 'cancelled' },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    }

    // 如果是更新現有預約，排除該預約
    if (excludeBookingId) {
      whereClause.id = { not: excludeBookingId }
    }

    const conflictingBookings = await prisma.booking.findMany({
      where: whereClause,
      select: {
        startTime: true,
        endTime: true,
        customerName: true
      }
    })

    if (conflictingBookings.length > 0) {
      const conflictTime = format(conflictingBookings[0].startTime, 'HH:mm')
      return { 
        isAvailable: false, 
        reason: `該理髮師在 ${conflictTime} 已有其他預約` 
      }
    }

    return { isAvailable: true }
  }

  /**
   * 尋找可用的理髮師
   */
  private static async findAvailableBarbers(
    storeId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<{ barberId: string; barberName: string; startTime: Date; endTime: Date }[]> {
    const barbers = await prisma.barber.findMany({
      where: {
        storeId,
        isActive: true
      },
      select: {
        id: true,
        name: true
      }
    })

    const availableBarbers = []

    for (const barber of barbers) {
      const availability = await this.checkBarberAvailability(
        storeId,
        barber.id,
        startTime,
        endTime,
        excludeBookingId
      )

      if (availability.isAvailable) {
        availableBarbers.push({
          barberId: barber.id,
          barberName: barber.name,
          startTime,
          endTime
        })
      }
    }

    return availableBarbers
  }

  /**
   * 尋找替代理髮師和時段
   */
  private static async findAlternativeBarbers(
    storeId: string,
    preferredStartTime: Date,
    preferredEndTime: Date,
    excludeBookingId?: string
  ): Promise<{ barberId: string; barberName: string; startTime: Date; endTime: Date }[]> {
    const alternatives = []
    const serviceDuration = preferredEndTime.getTime() - preferredStartTime.getTime()

    // 首先嘗試相同時段的其他理髮師
    const sameTimeAlternatives = await this.findAvailableBarbers(
      storeId,
      preferredStartTime,
      preferredEndTime,
      excludeBookingId
    )
    alternatives.push(...sameTimeAlternatives)

    // 如果沒有相同時段的替代方案，尋找前後1小時內的時段
    if (alternatives.length === 0) {
      const timeSlots = [
        // 提前30分鐘
        {
          start: addMinutes(preferredStartTime, -30),
          end: addMinutes(preferredEndTime, -30)
        },
        // 延後30分鐘
        {
          start: addMinutes(preferredStartTime, 30),
          end: addMinutes(preferredEndTime, 30)
        },
        // 提前60分鐘
        {
          start: addMinutes(preferredStartTime, -60),
          end: addMinutes(preferredEndTime, -60)
        },
        // 延後60分鐘
        {
          start: addMinutes(preferredStartTime, 60),
          end: addMinutes(preferredEndTime, 60)
        }
      ]

      for (const slot of timeSlots) {
        const slotAlternatives = await this.findAvailableBarbers(
          storeId,
          slot.start,
          slot.end,
          excludeBookingId
        )
        alternatives.push(...slotAlternatives)
        
        // 限制替代方案數量
        if (alternatives.length >= 5) break
      }
    }

    return alternatives.slice(0, 5) // 最多返回5個替代方案
  }

  /**
   * 驗證服務時間格式
   */
  static validateServiceTime(duration: number): {
    isValid: boolean
    error?: string
  } {
    if (!Number.isInteger(duration)) {
      return { isValid: false, error: '服務時間必須是整數分鐘' }
    }

    if (duration <= 0) {
      return { isValid: false, error: '服務時間必須大於0分鐘' }
    }

    if (duration > 480) { // 8小時
      return { isValid: false, error: '服務時間不能超過8小時' }
    }

    if (duration % 15 !== 0) {
      return { isValid: false, error: '服務時間必須是15分鐘的倍數' }
    }

    return { isValid: true }
  }

  /**
   * 檢查預約時間是否合理（不能是過去時間）
   */
  static validateBookingTime(startTime: Date): {
    isValid: boolean
    error?: string
  } {
    const now = new Date()
    const minBookingTime = addMinutes(now, 30) // 至少提前30分鐘預約

    if (startTime < minBookingTime) {
      return { 
        isValid: false, 
        error: '預約時間必須至少提前30分鐘' 
      }
    }

    // 檢查是否超過3個月
    const maxBookingTime = addMinutes(now, 90 * 24 * 60) // 90天
    if (startTime > maxBookingTime) {
      return { 
        isValid: false, 
        error: '預約時間不能超過3個月' 
      }
    }

    return { isValid: true }
  }
}