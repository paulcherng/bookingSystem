import {
  timeToMinutes,
  minutesToTime,
  isTimeWithinBusinessHours,
  validateBusinessHoursLogic,
  getAvailableTimeSlots
} from '../businessHours'
import { BusinessHours } from '@/types'

describe('businessHours utils', () => {
  describe('timeToMinutes', () => {
    it('should convert time string to minutes correctly', () => {
      expect(timeToMinutes('09:00')).toBe(540)
      expect(timeToMinutes('12:30')).toBe(750)
      expect(timeToMinutes('18:45')).toBe(1125)
      expect(timeToMinutes('00:00')).toBe(0)
      expect(timeToMinutes('23:59')).toBe(1439)
    })
  })

  describe('minutesToTime', () => {
    it('should convert minutes to time string correctly', () => {
      expect(minutesToTime(540)).toBe('09:00')
      expect(minutesToTime(750)).toBe('12:30')
      expect(minutesToTime(1125)).toBe('18:45')
      expect(minutesToTime(0)).toBe('00:00')
      expect(minutesToTime(1439)).toBe('23:59')
    })
  })

  describe('isTimeWithinBusinessHours', () => {
    const businessHours: BusinessHours = {
      id: 'hours-1',
      storeId: 'store-1',
      dayOfWeek: 1,
      openTime: '09:00',
      closeTime: '18:00',
      isClosed: false
    }

    it('should return true for time within business hours', () => {
      expect(isTimeWithinBusinessHours('10:00', businessHours)).toBe(true)
      expect(isTimeWithinBusinessHours('09:00', businessHours)).toBe(true)
      expect(isTimeWithinBusinessHours('18:00', businessHours)).toBe(true)
      expect(isTimeWithinBusinessHours('12:30', businessHours)).toBe(true)
    })

    it('should return false for time outside business hours', () => {
      expect(isTimeWithinBusinessHours('08:59', businessHours)).toBe(false)
      expect(isTimeWithinBusinessHours('18:01', businessHours)).toBe(false)
      expect(isTimeWithinBusinessHours('20:00', businessHours)).toBe(false)
    })

    it('should return false for closed day', () => {
      const closedDay = { ...businessHours, isClosed: true }
      expect(isTimeWithinBusinessHours('10:00', closedDay)).toBe(false)
    })
  })

  describe('validateBusinessHoursLogic', () => {
    it('should return no errors for valid business hours', () => {
      const validHours: BusinessHours[] = [
        {
          id: '1',
          storeId: 'store-1',
          dayOfWeek: 1,
          openTime: '09:00',
          closeTime: '18:00',
          isClosed: false
        },
        {
          id: '2',
          storeId: 'store-1',
          dayOfWeek: 0,
          openTime: '09:00',
          closeTime: '18:00',
          isClosed: true
        }
      ]

      const errors = validateBusinessHoursLogic(validHours)
      expect(errors).toHaveLength(0)
    })

    it('should return errors for invalid business hours', () => {
      const invalidHours: BusinessHours[] = [
        {
          id: '1',
          storeId: 'store-1',
          dayOfWeek: 1,
          openTime: '18:00',
          closeTime: '09:00',
          isClosed: false
        }
      ]

      const errors = validateBusinessHoursLogic(invalidHours)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('第 1 天的開始時間不能晚於或等於結束時間')
    })
  })

  describe('getAvailableTimeSlots', () => {
    const businessHours: BusinessHours = {
      id: 'hours-1',
      storeId: 'store-1',
      dayOfWeek: 1,
      openTime: '09:00',
      closeTime: '12:00',
      isClosed: false
    }

    it('should generate correct time slots', () => {
      const slots = getAvailableTimeSlots(businessHours, 60, 30) // 1 hour service, 30 min intervals
      
      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00'])
    })

    it('should return empty array for closed day', () => {
      const closedDay = { ...businessHours, isClosed: true }
      const slots = getAvailableTimeSlots(closedDay, 60, 30)
      
      expect(slots).toEqual([])
    })

    it('should handle service duration longer than business hours', () => {
      const slots = getAvailableTimeSlots(businessHours, 240, 30) // 4 hour service
      
      expect(slots).toEqual([])
    })
  })
})