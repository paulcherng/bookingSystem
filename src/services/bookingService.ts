import { prisma } from '@/lib/prisma'
import { addMinutes, parseISO } from 'date-fns'
import { ConflictDetectionService } from './conflictDetectionService'
import { CalendarService } from './calendarService'

export interface CreateBookingRequest {
  storeId: string
  barberId?: string
  serviceId: string
  startTime: Date
  customerName: string
  customerContact: string
  contactType: 'line' | 'email'
  notes?: string
}

export interface UpdateBookingRequest {
  bookingId: string
  barberId?: string
  serviceId?: string
  startTime?: Date
  customerName?: string
  customerContact?: string
  notes?: string
  status?: 'confirmed' | 'cancelled' | 'completed'
}

export interface BookingResult {
  success: boolean
  booking?: {
    id: string
    barberId: string
    barberName: string
    serviceName: string
    startTime: Date
    endTime: Date
    customerName: string
    status: string
  }
  error?: string
  alternatives?: {
    barberId: string
    barberName: string
    startTime: Date
    endTime: Date
  }[]
}

export class BookingService {
  /**
   * 創建新預約
   */
  static async createBooking(request: CreateBookingRequest): Promise<BookingResult> {
    try {
      const { storeId, barberId, serviceId, startTime, customerName, customerContact, contactType, notes } = request

      // 取得服務資訊
      const service = await prisma.service.findFirst({
        where: { id: serviceId, storeId, isActive: true }
      })

      if (!service) {
        return { success: false, error: '找不到指定的服務項目' }
      }

      const endTime = addMinutes(startTime, service.duration)

      // 驗證預約時間
      const timeValidation = ConflictDetectionService.validateBookingTime(startTime)
      if (!timeValidation.isValid) {
        return { success: false, error: timeValidation.error }
      }

      // 如果沒有指定理髮師，自動分配
      let assignedBarberId = barberId
      if (!assignedBarberId) {
        const availableBarbers = await this.findAvailableBarber(storeId, startTime, endTime)
        if (availableBarbers.length === 0) {
          return { success: false, error: '該時段沒有可用的理髮師' }
        }
        assignedBarberId = availableBarbers[0].barberId
      }

      // 檢查衝突
      const conflictCheck = await ConflictDetectionService.checkBookingConflicts({
        storeId,
        barberId: assignedBarberId,
        serviceId,
        startTime,
        endTime
      })

      if (conflictCheck.hasConflict) {
        return {
          success: false,
          error: conflictCheck.conflictDetails,
          alternatives: conflictCheck.suggestedAlternatives
        }
      }

      // 創建預約
      const booking = await prisma.booking.create({
        data: {
          storeId,
          barberId: assignedBarberId,
          serviceId,
          customerName,
          customerContact,
          contactType,
          startTime,
          endTime,
          status: 'confirmed',
          notes
        },
        include: {
          barber: {
            select: { name: true }
          },
          service: {
            select: { name: true }
          }
        }
      })

      return {
        success: true,
        booking: {
          id: booking.id,
          barberId: booking.barberId,
          barberName: booking.barber.name,
          serviceName: booking.service.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          customerName: booking.customerName,
          status: booking.status
        }
      }

    } catch (error) {
      console.error('Error creating booking:', error)
      return { success: false, error: '創建預約時發生錯誤' }
    }
  }

  /**
   * 更新預約
   */
  static async updateBooking(request: UpdateBookingRequest): Promise<BookingResult> {
    try {
      const { bookingId, barberId, serviceId, startTime, customerName, customerContact, notes, status } = request

      // 取得現有預約
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: true,
          barber: true
        }
      })

      if (!existingBooking) {
        return { success: false, error: '找不到指定的預約' }
      }

      // 準備更新資料
      const updateData: any = {}
      let newEndTime = existingBooking.endTime

      if (customerName) updateData.customerName = customerName
      if (customerContact) updateData.customerContact = customerContact
      if (notes !== undefined) updateData.notes = notes
      if (status) updateData.status = status

      // 如果更新了服務或時間，需要重新計算結束時間和檢查衝突
      if (serviceId || startTime || barberId) {
        let newService = existingBooking.service
        let newStartTime = existingBooking.startTime
        let newBarberId = existingBooking.barberId

        if (serviceId) {
          const foundService = await prisma.service.findFirst({
            where: { id: serviceId, storeId: existingBooking.storeId, isActive: true }
          })
          if (!foundService) {
            return { success: false, error: '找不到指定的服務項目' }
          }
          newService = foundService
          updateData.serviceId = serviceId
        }

        if (startTime) {
          const timeValidation = ConflictDetectionService.validateBookingTime(startTime)
          if (!timeValidation.isValid) {
            return { success: false, error: timeValidation.error }
          }
          newStartTime = startTime
          updateData.startTime = startTime
        }

        if (barberId) {
          newBarberId = barberId
          updateData.barberId = barberId
        }

        newEndTime = addMinutes(newStartTime, newService.duration)
        updateData.endTime = newEndTime

        // 檢查衝突（排除當前預約）
        const conflictCheck = await ConflictDetectionService.checkBookingConflicts({
          storeId: existingBooking.storeId,
          barberId: newBarberId,
          serviceId: newService.id,
          startTime: newStartTime,
          endTime: newEndTime,
          excludeBookingId: bookingId
        })

        if (conflictCheck.hasConflict) {
          return {
            success: false,
            error: conflictCheck.conflictDetails,
            alternatives: conflictCheck.suggestedAlternatives
          }
        }
      }

      // 執行更新
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          barber: {
            select: { name: true }
          },
          service: {
            select: { name: true }
          }
        }
      })

      return {
        success: true,
        booking: {
          id: updatedBooking.id,
          barberId: updatedBooking.barberId,
          barberName: updatedBooking.barber.name,
          serviceName: updatedBooking.service.name,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          customerName: updatedBooking.customerName,
          status: updatedBooking.status
        }
      }

    } catch (error) {
      console.error('Error updating booking:', error)
      return { success: false, error: '更新預約時發生錯誤' }
    }
  }

  /**
   * 取消預約
   */
  static async cancelBooking(bookingId: string, reason?: string): Promise<BookingResult> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      })

      if (!booking) {
        return { success: false, error: '找不到指定的預約' }
      }

      if (booking.status === 'cancelled') {
        return { success: false, error: '預約已經被取消' }
      }

      const updateData: any = { status: 'cancelled' }
      if (reason) {
        updateData.notes = booking.notes ? `${booking.notes}\n取消原因: ${reason}` : `取消原因: ${reason}`
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          barber: {
            select: { name: true }
          },
          service: {
            select: { name: true }
          }
        }
      })

      return {
        success: true,
        booking: {
          id: updatedBooking.id,
          barberId: updatedBooking.barberId,
          barberName: updatedBooking.barber.name,
          serviceName: updatedBooking.service.name,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          customerName: updatedBooking.customerName,
          status: updatedBooking.status
        }
      }

    } catch (error) {
      console.error('Error cancelling booking:', error)
      return { success: false, error: '取消預約時發生錯誤' }
    }
  }

  /**
   * 取得預約詳情
   */
  static async getBooking(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          barber: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              description: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true
            }
          }
        }
      })

      return booking

    } catch (error) {
      console.error('Error getting booking:', error)
      return null
    }
  }

  /**
   * 取得預約詳情 (別名方法)
   */
  static async getBookingById(bookingId: string) {
    return this.getBooking(bookingId)
  }

  /**
   * 取得預約列表
   */
  static async getBookings(
    filters: {
      storeId: string
      barberId?: string
      date?: string
      status?: string
    },
    pagination: {
      page: number
      limit: number
    }
  ) {
    try {
      const { storeId, barberId, date, status } = filters
      const { page, limit } = pagination

      const where: any = { storeId }

      if (barberId) {
        where.barberId = barberId
      }

      if (status) {
        where.status = status
      }

      if (date) {
        const targetDate = new Date(date)
        const nextDay = new Date(targetDate)
        nextDay.setDate(nextDay.getDate() + 1)

        where.startTime = {
          gte: targetDate,
          lt: nextDay
        }
      }

      const skip = (page - 1) * limit

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            barber: {
              select: {
                id: true,
                name: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          },
          skip,
          take: limit
        }),
        prisma.booking.count({ where })
      ])

      return {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      console.error('Error getting bookings:', error)
      return {
        bookings: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      }
    }
  }

  /**
   * 取得客戶的預約歷史
   */
  static async getCustomerBookings(customerContact: string, storeId?: string) {
    try {
      const where: any = { customerContact }
      if (storeId) {
        where.storeId = storeId
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          barber: {
            select: { name: true }
          },
          service: {
            select: { name: true, duration: true }
          },
          store: {
            select: { name: true }
          }
        },
        orderBy: {
          startTime: 'desc'
        }
      })

      return bookings

    } catch (error) {
      console.error('Error getting customer bookings:', error)
      return []
    }
  }

  /**
   * 尋找可用的理髮師
   */
  private static async findAvailableBarber(
    storeId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ barberId: string; barberName: string }[]> {
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
      const isAvailable = await CalendarService.isTimeSlotAvailable(
        storeId,
        barber.id,
        startTime,
        endTime
      )

      if (isAvailable) {
        availableBarbers.push({
          barberId: barber.id,
          barberName: barber.name
        })
      }
    }

    return availableBarbers
  }

  /**
   * 從訊息內容創建預約
   */
  static async createBookingFromMessage(
    storeId: string,
    customerContact: string,
    contactType: 'line' | 'email',
    parsedInfo: {
      serviceName?: string
      serviceId?: string
      dateTime?: string
      customerName?: string
      barberName?: string
      barberId?: string
    }
  ): Promise<BookingResult> {
    try {
      // 驗證必要資訊
      if (!parsedInfo.customerName) {
        return { success: false, error: '請提供您的姓名' }
      }

      if (!parsedInfo.serviceId && !parsedInfo.serviceName) {
        return { success: false, error: '請指定您需要的服務項目' }
      }

      if (!parsedInfo.dateTime) {
        return { success: false, error: '請提供預約時間' }
      }

      // 解析時間
      let startTime: Date
      try {
        // 這裡需要更複雜的時間解析邏輯
        // 目前假設是 ISO 格式或簡單的日期時間格式
        startTime = parseISO(parsedInfo.dateTime)
        if (isNaN(startTime.getTime())) {
          throw new Error('Invalid date')
        }
      } catch (error) {
        return { success: false, error: '無法解析預約時間，請使用 YYYY-MM-DD HH:MM 格式' }
      }

      // 如果沒有 serviceId，嘗試根據 serviceName 查找
      let serviceId = parsedInfo.serviceId
      if (!serviceId && parsedInfo.serviceName) {
        const service = await prisma.service.findFirst({
          where: {
            storeId,
            name: { contains: parsedInfo.serviceName },
            isActive: true
          }
        })
        if (service) {
          serviceId = service.id
        }
      }

      if (!serviceId) {
        return { success: false, error: '找不到指定的服務項目' }
      }

      // 創建預約
      return await this.createBooking({
        storeId,
        barberId: parsedInfo.barberId,
        serviceId,
        startTime,
        customerName: parsedInfo.customerName,
        customerContact,
        contactType
      })

    } catch (error) {
      console.error('Error creating booking from message:', error)
      return { success: false, error: '處理預約請求時發生錯誤' }
    }
  }
}