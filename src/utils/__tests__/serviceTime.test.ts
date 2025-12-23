import {
  isValidServiceDuration,
  formatServiceDuration,
  calculateServiceEndTime,
  canServiceFitInTimeSlot,
  getServiceDurationCategory,
  isValidServicePrice,
  formatServicePrice
} from '../serviceTime'

describe('serviceTime utils', () => {
  describe('isValidServiceDuration', () => {
    it('should validate service duration correctly', () => {
      expect(isValidServiceDuration(30)).toBe(true)
      expect(isValidServiceDuration(60)).toBe(true)
      expect(isValidServiceDuration(480)).toBe(true)
      
      expect(isValidServiceDuration(0)).toBe(false)
      expect(isValidServiceDuration(-10)).toBe(false)
      expect(isValidServiceDuration(481)).toBe(false)
      expect(isValidServiceDuration(30.5)).toBe(false)
    })
  })

  describe('formatServiceDuration', () => {
    it('should format duration correctly', () => {
      expect(formatServiceDuration(30)).toBe('30 分鐘')
      expect(formatServiceDuration(60)).toBe('1 小時')
      expect(formatServiceDuration(90)).toBe('1 小時 30 分鐘')
      expect(formatServiceDuration(120)).toBe('2 小時')
      expect(formatServiceDuration(150)).toBe('2 小時 30 分鐘')
    })
  })

  describe('calculateServiceEndTime', () => {
    it('should calculate end time correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const endTime = calculateServiceEndTime(startTime, 90)
      
      expect(endTime.getHours()).toBe(11)
      expect(endTime.getMinutes()).toBe(30)
    })
  })

  describe('canServiceFitInTimeSlot', () => {
    it('should check if service fits in time slot', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const endTime = new Date('2024-01-01T12:00:00')
      
      expect(canServiceFitInTimeSlot(startTime, endTime, 60)).toBe(true)
      expect(canServiceFitInTimeSlot(startTime, endTime, 120)).toBe(true)
      expect(canServiceFitInTimeSlot(startTime, endTime, 150)).toBe(false)
    })
  })

  describe('getServiceDurationCategory', () => {
    it('should categorize service duration correctly', () => {
      expect(getServiceDurationCategory(15)).toBe('快速服務')
      expect(getServiceDurationCategory(30)).toBe('快速服務')
      expect(getServiceDurationCategory(45)).toBe('標準服務')
      expect(getServiceDurationCategory(60)).toBe('標準服務')
      expect(getServiceDurationCategory(90)).toBe('長時間服務')
      expect(getServiceDurationCategory(120)).toBe('長時間服務')
      expect(getServiceDurationCategory(180)).toBe('特殊服務')
    })
  })

  describe('isValidServicePrice', () => {
    it('should validate service price correctly', () => {
      expect(isValidServicePrice(0)).toBe(true)
      expect(isValidServicePrice(100)).toBe(true)
      expect(isValidServicePrice(999999.99)).toBe(true)
      
      expect(isValidServicePrice(-1)).toBe(false)
      expect(isValidServicePrice(1000000)).toBe(false)
    })
  })

  describe('formatServicePrice', () => {
    it('should format price correctly', () => {
      expect(formatServicePrice(100)).toBe('NT$100')
      expect(formatServicePrice(1500)).toBe('NT$1,500')
      expect(formatServicePrice(0)).toBe('NT$0')
    })
  })
})