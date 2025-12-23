import { BusinessHours } from '@/types'

/**
 * 將時間字串轉換為分鐘數
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 將分鐘數轉換為時間字串
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * 檢查時間是否在營業時間內
 */
export function isTimeWithinBusinessHours(
  timeString: string,
  businessHours: BusinessHours
): boolean {
  if (businessHours.isClosed) {
    return false
  }
  
  const timeMinutes = timeToMinutes(timeString)
  const openMinutes = timeToMinutes(businessHours.openTime)
  const closeMinutes = timeToMinutes(businessHours.closeTime)
  
  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes
}

/**
 * 獲取日期的星期幾（0=週日，1=週一...）
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay()
}

/**
 * 獲取日期的時間字串（HH:mm）
 */
export function getTimeString(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

/**
 * 檢查營業時段設定是否有效
 */
export function validateBusinessHoursLogic(businessHours: BusinessHours[]): string[] {
  const errors: string[] = []
  
  for (const hours of businessHours) {
    if (!hours.isClosed) {
      const openMinutes = timeToMinutes(hours.openTime)
      const closeMinutes = timeToMinutes(hours.closeTime)
      
      if (openMinutes >= closeMinutes) {
        errors.push(`第 ${hours.dayOfWeek} 天的開始時間不能晚於或等於結束時間`)
      }
    }
  }
  
  return errors
}

/**
 * 獲取營業日名稱
 */
export function getDayName(dayOfWeek: number): string {
  const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  return dayNames[dayOfWeek] || '未知'
}

/**
 * 格式化營業時段顯示
 */
export function formatBusinessHours(businessHours: BusinessHours): string {
  if (businessHours.isClosed) {
    return '休息'
  }
  
  return `${businessHours.openTime} - ${businessHours.closeTime}`
}

/**
 * 獲取下週同一天的日期
 */
export function getNextWeekSameDay(date: Date): Date {
  const nextWeek = new Date(date)
  nextWeek.setDate(nextWeek.getDate() + 7)
  return nextWeek
}

/**
 * 檢查兩個時間段是否重疊
 */
export function isTimeRangeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)
  
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes
}

/**
 * 計算營業時間內的可用時段
 */
export function getAvailableTimeSlots(
  businessHours: BusinessHours,
  serviceDuration: number, // 分鐘
  slotInterval: number = 30 // 時段間隔，預設 30 分鐘
): string[] {
  if (businessHours.isClosed) {
    return []
  }
  
  const slots: string[] = []
  const openMinutes = timeToMinutes(businessHours.openTime)
  const closeMinutes = timeToMinutes(businessHours.closeTime)
  
  for (let minutes = openMinutes; minutes + serviceDuration <= closeMinutes; minutes += slotInterval) {
    slots.push(minutesToTime(minutes))
  }
  
  return slots
}