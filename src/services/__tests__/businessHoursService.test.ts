import { BusinessHoursService } from '../businessHoursService'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma')
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('BusinessHoursService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setBusinessHours', () => {
    it('should set business hours successfully', async () => {
      const storeId = 'store-1'
      const businessHours = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false },
        { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: true }
      ]

      const mockCreatedHours = businessHours.map((hours, index) => ({
        id: `hours-${index}`,
        storeId,
        ...hours
      }))

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          businessHours: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
            findMany: jest.fn().mockResolvedValue(mockCreatedHours)
          }
        } as any)
      })

      const result = await BusinessHoursService.setBusinessHours(storeId, businessHours)

      expect(result).toEqual(mockCreatedHours)
    })

    it('should validate time format', () => {
      const invalidHours = [
        { dayOfWeek: 1, openTime: '25:00', closeTime: '18:00', isClosed: false }
      ]

      const validation = BusinessHoursService.validateBusinessHours(invalidHours)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('時間格式'))).toBe(true)
    })

    it('should validate open time before close time', () => {
      const invalidHours = [
        { dayOfWeek: 1, openTime: '18:00', closeTime: '09:00', isClosed: false }
      ]

      const validation = BusinessHoursService.validateBusinessHours(invalidHours)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('第 1 天的營業時間設定錯誤')
    })
  })

  describe('isWithinBusinessHours', () => {
    it('should return true for time within business hours', async () => {
      const storeId = 'store-1'
      const testDate = new Date('2024-01-01T10:00:00') // Monday 10:00
      
      const mockBusinessHours = {
        id: 'hours-1',
        storeId,
        dayOfWeek: 1, // Monday
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: false
      }

      mockPrisma.businessHours.findFirst.mockResolvedValue(mockBusinessHours)

      const result = await BusinessHoursService.isWithinBusinessHours(storeId, testDate)

      expect(result).toBe(true)
    })

    it('should return false for closed day', async () => {
      const storeId = 'store-1'
      const testDate = new Date('2023-12-31T10:00:00') // Sunday 10:00
      
      const mockBusinessHours = {
        id: 'hours-1',
        storeId,
        dayOfWeek: 0, // Sunday
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: true
      }

      mockPrisma.businessHours.findFirst.mockResolvedValue(mockBusinessHours)

      const result = await BusinessHoursService.isWithinBusinessHours(storeId, testDate)

      expect(result).toBe(false)
    })

    it('should return false for time outside business hours', async () => {
      const storeId = 'store-1'
      const testDate = new Date('2024-01-01T20:00:00') // Monday 20:00
      
      const mockBusinessHours = {
        id: 'hours-1',
        storeId,
        dayOfWeek: 1, // Monday
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: false
      }

      mockPrisma.businessHours.findFirst.mockResolvedValue(mockBusinessHours)

      const result = await BusinessHoursService.isWithinBusinessHours(storeId, testDate)

      expect(result).toBe(false)
    })
  })
})