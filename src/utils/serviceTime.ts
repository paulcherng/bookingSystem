import { Service } from '@/types'

/**
 * 驗證服務時間是否為有效的分鐘數
 */
export function isValidServiceDuration(duration: number): boolean {
  return Number.isInteger(duration) && duration > 0 && duration <= 480 // 最多 8 小時
}

/**
 * 格式化服務時間顯示
 */
export function formatServiceDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分鐘`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} 小時`
  }
  
  return `${hours} 小時 ${remainingMinutes} 分鐘`
}

/**
 * 將服務時間轉換為小時數（用於計算）
 */
export function durationToHours(minutes: number): number {
  return minutes / 60
}

/**
 * 將小時數轉換為分鐘數
 */
export function hoursToDuration(hours: number): number {
  return Math.round(hours * 60)
}

/**
 * 計算服務結束時間
 */
export function calculateServiceEndTime(startTime: Date, durationMinutes: number): Date {
  const endTime = new Date(startTime)
  endTime.setMinutes(endTime.getMinutes() + durationMinutes)
  return endTime
}

/**
 * 檢查服務時間是否適合在指定時段內完成
 */
export function canServiceFitInTimeSlot(
  startTime: Date,
  endTime: Date,
  serviceDuration: number
): boolean {
  const availableMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  return availableMinutes >= serviceDuration
}

/**
 * 獲取服務的時間分類
 */
export function getServiceDurationCategory(minutes: number): string {
  if (minutes <= 30) return '快速服務'
  if (minutes <= 60) return '標準服務'
  if (minutes <= 120) return '長時間服務'
  return '特殊服務'
}

/**
 * 計算一天內可以安排多少次該服務
 */
export function calculateMaxServicesPerDay(
  businessHoursMinutes: number,
  serviceDuration: number,
  bufferMinutes: number = 15 // 服務間的緩衝時間
): number {
  const totalServiceTime = serviceDuration + bufferMinutes
  return Math.floor(businessHoursMinutes / totalServiceTime)
}

/**
 * 生成服務時間的建議選項
 */
export function generateDurationOptions(): { value: number; label: string }[] {
  const options = [
    { value: 15, label: '15 分鐘' },
    { value: 30, label: '30 分鐘' },
    { value: 45, label: '45 分鐘' },
    { value: 60, label: '1 小時' },
    { value: 90, label: '1.5 小時' },
    { value: 120, label: '2 小時' },
    { value: 150, label: '2.5 小時' },
    { value: 180, label: '3 小時' },
    { value: 240, label: '4 小時' },
    { value: 300, label: '5 小時' },
    { value: 360, label: '6 小時' },
    { value: 420, label: '7 小時' },
    { value: 480, label: '8 小時' },
  ]
  
  return options
}

/**
 * 驗證服務價格
 */
export function isValidServicePrice(price: number): boolean {
  return price >= 0 && price <= 999999.99 // 最大價格限制
}

/**
 * 格式化服務價格顯示
 */
export function formatServicePrice(price: number): string {
  return `NT$${new Intl.NumberFormat('zh-TW').format(price)}`
}

/**
 * 計算服務的時薪
 */
export function calculateHourlyRate(price: number, durationMinutes: number): number {
  const hours = durationMinutes / 60
  return price / hours
}

/**
 * 根據服務時間排序服務列表
 */
export function sortServicesByDuration(services: Service[], ascending: boolean = true): Service[] {
  return [...services].sort((a, b) => {
    return ascending ? a.duration - b.duration : b.duration - a.duration
  })
}

/**
 * 根據價格排序服務列表
 */
export function sortServicesByPrice(services: Service[], ascending: boolean = true): Service[] {
  return [...services].sort((a, b) => {
    const priceA = a.price || 0
    const priceB = b.price || 0
    return ascending ? priceA - priceB : priceB - priceA
  })
}

/**
 * 過濾指定時間範圍內的服務
 */
export function filterServicesByDuration(
  services: Service[],
  minDuration?: number,
  maxDuration?: number
): Service[] {
  return services.filter(service => {
    if (minDuration !== undefined && service.duration < minDuration) {
      return false
    }
    if (maxDuration !== undefined && service.duration > maxDuration) {
      return false
    }
    return true
  })
}

/**
 * 過濾指定價格範圍內的服務
 */
export function filterServicesByPrice(
  services: Service[],
  minPrice?: number,
  maxPrice?: number
): Service[] {
  return services.filter(service => {
    const price = service.price || 0
    if (minPrice !== undefined && price < minPrice) {
      return false
    }
    if (maxPrice !== undefined && price > maxPrice) {
      return false
    }
    return true
  })
}