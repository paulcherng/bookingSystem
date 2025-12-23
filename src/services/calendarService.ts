import { prisma } from '@/lib/prisma'
import { addMinutes, format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

export interface TimeSlot {
  startTime: Date
  endTime: Date
  barberId: string
  barberName: string
  isAvailable: boolean
}

export interface AvailabilityQuery {
  storeId: string
  date: string // YYYY-MM-DD
  serviceId: string
  barberId?: string
  duration?: number // 分鐘，如果不提供則從服務中取得
}

export class CalendarService {
  /**
   * 查詢指定日期的可用時段
   */
  static async getAvailableTimeSlots(query: AvailabilityQuery): Promise<TimeSlot[]> {
    try {
      const { storeId, date, serviceId, barberId, duration } = query

      // 取得服務資訊
      const service = await prisma.service.findFirst({
        where: { id: serviceId, storeId, isActive: true }
      })

      if (!service) {
        throw new Error('Service not found')
      }

      const serviceDuration = duration || service.duration

      // 取得營業時間
      const businessHours = await this.getBusinessHours(storeId, date)
      if (!businessHours) {
        return []
      }

      // 取得理髮師列表
      const barbers = await this.getAvailableBarbers(storeId, barberId)
      if (barbers.length === 0) {
        return []
      }

      // 取得現有預約
      const existingBookings = await this.getExistingBookings(storeId, date, barbers.map(b => b.id))

      // 生成可用時段
      const availableSlots: TimeSlot[] = []

      for (const barber of barbers) {
        const barberSlots = await this.generateBarberTimeSlots(
          barber,
          date,
          businessHours,
          serviceDuration,
          existingBookings.filter(b => b.barberId === barber.id)
        )
        availableSlots.push(...barberSlots)
      }

      return availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    } catch (error) {
      console.error('Error getting available time slots:', error)
      throw error
    }
  }

  /**
   * 檢查特定時段是否可用
   */
  static async isTimeSlotAvailable(
    storeId: string,
    barberId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      // 檢查營業時間
      const dateStr = format(startTime, 'yyyy-MM-dd')
      const businessHours = await this.getBusinessHours(storeId, dateStr)
      
      if (!businessHours) {
        return false
      }

      const businessStart = parseISO(`${dateStr}T${businessHours.openTime}:00`)
      const businessEnd = parseISO(`${dateStr}T${businessHours.closeTime}:00`)

      if (!isWithinInterval(startTime, { start: businessStart, end: businessEnd }) ||
          !isWithinInterval(endTime, { start: businessStart, end: businessEnd })) {
        return false
      }

      // 檢查是否有衝突的預約
      const conflictingBookings = await prisma.booking.findMany({
        where: {
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
      })

      return conflictingBookings.length === 0

    } catch (error) {
      console.error('Error checking time slot availability:', error)
      return false
    }
  }

  /**
   * 取得營業時間
   */
  private static async getBusinessHours(storeId: string, date: string): Promise<{
    openTime: string
    closeTime: string
  } | null> {
    try {
      const dayOfWeek = new Date(date).getDay()
      
      const businessHours = await prisma.businessHours.findFirst({
        where: {
          storeId,
          dayOfWeek,
          isClosed: false
        }
      })

      if (!businessHours) {
        return null
      }

      return {
        openTime: businessHours.openTime,
        closeTime: businessHours.closeTime
      }
    } catch (error) {
      console.error('Error getting business hours:', error)
      return null
    }
  }

  /**
   * 取得可用的理髮師
   */
  private static async getAvailableBarbers(storeId: string, barberId?: string) {
    const where: any = {
      storeId,
      isActive: true
    }

    if (barberId) {
      where.id = barberId
    }

    return await prisma.barber.findMany({
      where,
      select: {
        id: true,
        name: true
      }
    })
  }

  /**
   * 取得現有預約
   */
  private static async getExistingBookings(storeId: string, date: string, barberIds: string[]) {
    const startOfDate = startOfDay(parseISO(date))
    const endOfDate = endOfDay(parseISO(date))

    return await prisma.booking.findMany({
      where: {
        storeId,
        barberId: { in: barberIds },
        status: { not: 'cancelled' },
        startTime: {
          gte: startOfDate,
          lte: endOfDate
        }
      },
      select: {
        barberId: true,
        startTime: true,
        endTime: true
      }
    })
  }

  /**
   * 為特定理髮師生成時段
   */
  private static async generateBarberTimeSlots(
    barber: { id: string; name: string },
    date: string,
    businessHours: { openTime: string; closeTime: string },
    serviceDuration: number,
    existingBookings: { startTime: Date; endTime: Date }[]
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = []
    
    const businessStart = parseISO(`${date}T${businessHours.openTime}:00`)
    const businessEnd = parseISO(`${date}T${businessHours.closeTime}:00`)

    // 以30分鐘為間隔生成時段
    const slotInterval = 30 // 分鐘
    let currentTime = businessStart

    while (currentTime < businessEnd) {
      const slotEnd = addMinutes(currentTime, serviceDuration)
      
      // 確保服務時間不超過營業時間
      if (slotEnd <= businessEnd) {
        // 檢查是否與現有預約衝突
        const hasConflict = existingBookings.some(booking => 
          (currentTime < booking.endTime && slotEnd > booking.startTime)
        )

        slots.push({
          startTime: currentTime,
          endTime: slotEnd,
          barberId: barber.id,
          barberName: barber.name,
          isAvailable: !hasConflict
        })
      }

      currentTime = addMinutes(currentTime, slotInterval)
    }

    return slots
  }

  /**
   * 取得理髮師的預約行事曆
   */
  static async getBarberCalendar(
    storeId: string,
    barberId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          storeId,
          barberId,
          startTime: {
            gte: parseISO(startDate),
            lte: parseISO(endDate)
          }
        },
        include: {
          service: {
            select: {
              name: true,
              duration: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      })

      return bookings.map(booking => ({
        id: booking.id,
        customerName: booking.customerName,
        serviceName: booking.service.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes
      }))

    } catch (error) {
      console.error('Error getting barber calendar:', error)
      throw error
    }
  }

  /**
   * 取得店家的所有預約概覽
   */
  static async getStoreCalendarOverview(
    storeId: string,
    date: string
  ) {
    try {
      const startOfDate = startOfDay(parseISO(date))
      const endOfDate = endOfDay(parseISO(date))

      const bookings = await prisma.booking.findMany({
        where: {
          storeId,
          startTime: {
            gte: startOfDate,
            lte: endOfDate
          }
        },
        include: {
          barber: {
            select: {
              name: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      })

      return bookings.map(booking => ({
        id: booking.id,
        customerName: booking.customerName,
        barberName: booking.barber.name,
        serviceName: booking.service.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        contactType: booking.contactType
      }))

    } catch (error) {
      console.error('Error getting store calendar overview:', error)
      throw error
    }
  }
}