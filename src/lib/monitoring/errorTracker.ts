import { logger } from '@/lib/logging/logger'
import { AppError } from '@/lib/errors/errorHandler'

/**
 * 錯誤追蹤項目
 */
export interface ErrorTrackingItem {
  id: string
  timestamp: Date
  error: {
    name: string
    message: string
    stack?: string
    code?: string
    category?: string
  }
  context: {
    requestId?: string
    userId?: string
    storeId?: string
    url?: string
    userAgent?: string
    ip?: string
    details?: any
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  occurrences: number
  firstOccurrence: Date
  lastOccurrence: Date
}

/**
 * 錯誤統計
 */
export interface ErrorStats {
  totalErrors: number
  unresolvedErrors: number
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<string, number>
  topErrors: Array<{
    message: string
    count: number
    lastOccurrence: Date
  }>
  errorTrends: Array<{
    date: string
    count: number
  }>
}

/**
 * 錯誤追蹤器
 */
export class ErrorTracker {
  private static errors: Map<string, ErrorTrackingItem> = new Map()
  private static maxErrors = 1000 // 最多保存 1000 個錯誤

  /**
   * 追蹤錯誤
   */
  static trackError(
    error: Error | AppError | any,
    context: Partial<ErrorTrackingItem['context']> = {},
    severity: ErrorTrackingItem['severity'] = 'medium'
  ): string {
    const errorKey = this.generateErrorKey(error)
    const now = new Date()
    
    const existingError = this.errors.get(errorKey)
    
    if (existingError) {
      // 更新現有錯誤
      existingError.occurrences++
      existingError.lastOccurrence = now
      existingError.context = { ...existingError.context, ...context }
      
      logger.warn('重複錯誤發生', {
        errorKey,
        occurrences: existingError.occurrences,
        message: existingError.error.message
      }, { category: 'ERROR_TRACKING' })
      
      return existingError.id
    }

    // 創建新的錯誤追蹤項目
    const trackingItem: ErrorTrackingItem = {
      id: this.generateErrorId(),
      timestamp: now,
      error: {
        name: error.name || 'Unknown',
        message: error.message || 'Unknown error',
        stack: error.stack,
        code: error instanceof AppError ? error.code : undefined,
        category: error instanceof AppError ? error.category : 'UNKNOWN'
      },
      context,
      severity,
      resolved: false,
      occurrences: 1,
      firstOccurrence: now,
      lastOccurrence: now
    }

    this.errors.set(errorKey, trackingItem)

    // 清理舊錯誤
    this.cleanupOldErrors()

    logger.error('新錯誤被追蹤', {
      errorId: trackingItem.id,
      errorKey,
      message: trackingItem.error.message,
      severity,
      context
    }, { category: 'ERROR_TRACKING' })

    // 對於嚴重錯誤，立即通知
    if (severity === 'critical' || severity === 'high') {
      this.notifyHighSeverityError(trackingItem)
    }

    return trackingItem.id
  }

  /**
   * 生成錯誤鍵值
   */
  private static generateErrorKey(error: any): string {
    const message = error.message || 'Unknown'
    const stack = error.stack || ''
    const firstStackLine = stack.split('\n')[1] || ''
    
    return `${error.name || 'Unknown'}_${message}_${firstStackLine}`.replace(/\s+/g, '_')
  }

  /**
   * 生成錯誤 ID
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 標記錯誤為已解決
   */
  static resolveError(errorId: string): boolean {
    for (const [key, error] of this.errors.entries()) {
      if (error.id === errorId) {
        error.resolved = true
        logger.info('錯誤已標記為解決', {
          errorId,
          message: error.error.message
        }, { category: 'ERROR_TRACKING' })
        return true
      }
    }
    return false
  }

  /**
   * 獲取錯誤詳情
   */
  static getError(errorId: string): ErrorTrackingItem | null {
    for (const error of this.errors.values()) {
      if (error.id === errorId) {
        return error
      }
    }
    return null
  }

  /**
   * 獲取所有錯誤
   */
  static getAllErrors(filters?: {
    resolved?: boolean
    severity?: ErrorTrackingItem['severity']
    category?: string
    limit?: number
  }): ErrorTrackingItem[] {
    let errors = Array.from(this.errors.values())

    if (filters) {
      if (filters.resolved !== undefined) {
        errors = errors.filter(e => e.resolved === filters.resolved)
      }
      if (filters.severity) {
        errors = errors.filter(e => e.severity === filters.severity)
      }
      if (filters.category) {
        errors = errors.filter(e => e.error.category === filters.category)
      }
      if (filters.limit) {
        errors = errors.slice(0, filters.limit)
      }
    }

    return errors.sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime())
  }

  /**
   * 獲取錯誤統計
   */
  static getErrorStats(): ErrorStats {
    const errors = Array.from(this.errors.values())
    const totalErrors = errors.length
    const unresolvedErrors = errors.filter(e => !e.resolved).length

    // 按類別統計
    const errorsByCategory: Record<string, number> = {}
    errors.forEach(error => {
      const category = error.error.category || 'UNKNOWN'
      errorsByCategory[category] = (errorsByCategory[category] || 0) + error.occurrences
    })

    // 按嚴重程度統計
    const errorsBySeverity: Record<string, number> = {}
    errors.forEach(error => {
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + error.occurrences
    })

    // 最常見錯誤
    const topErrors = errors
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10)
      .map(error => ({
        message: error.error.message,
        count: error.occurrences,
        lastOccurrence: error.lastOccurrence
      }))

    // 錯誤趨勢（最近 7 天）
    const errorTrends = this.calculateErrorTrends(errors)

    return {
      totalErrors,
      unresolvedErrors,
      errorsByCategory,
      errorsBySeverity,
      topErrors,
      errorTrends
    }
  }

  /**
   * 計算錯誤趨勢
   */
  private static calculateErrorTrends(errors: ErrorTrackingItem[]): Array<{ date: string; count: number }> {
    const trends: Record<string, number> = {}
    const now = new Date()
    
    // 初始化最近 7 天
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      trends[dateStr] = 0
    }

    // 統計每天的錯誤數量
    errors.forEach(error => {
      const dateStr = error.lastOccurrence.toISOString().split('T')[0]
      if (trends.hasOwnProperty(dateStr)) {
        trends[dateStr] += error.occurrences
      }
    })

    return Object.entries(trends).map(([date, count]) => ({ date, count }))
  }

  /**
   * 通知高嚴重程度錯誤
   */
  private static notifyHighSeverityError(error: ErrorTrackingItem): void {
    logger.error('高嚴重程度錯誤', {
      errorId: error.id,
      severity: error.severity,
      message: error.error.message,
      context: error.context
    }, { category: 'CRITICAL_ERROR' })

    // 這裡可以整合外部通知服務，如 Slack、Discord 等
    if (process.env.CRITICAL_ERROR_WEBHOOK) {
      this.sendCriticalErrorNotification(error)
    }
  }

  /**
   * 發送嚴重錯誤通知
   */
  private static async sendCriticalErrorNotification(error: ErrorTrackingItem): Promise<void> {
    try {
      const webhook = process.env.CRITICAL_ERROR_WEBHOOK
      if (!webhook) return

      const payload = {
        text: `🚨 嚴重錯誤警報`,
        attachments: [
          {
            color: 'danger',
            fields: [
              {
                title: '錯誤訊息',
                value: error.error.message,
                short: false
              },
              {
                title: '嚴重程度',
                value: error.severity,
                short: true
              },
              {
                title: '發生時間',
                value: error.timestamp.toISOString(),
                short: true
              },
              {
                title: '錯誤 ID',
                value: error.id,
                short: true
              }
            ]
          }
        ]
      }

      await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

    } catch (notificationError) {
      logger.error('發送錯誤通知失敗', notificationError, { category: 'ERROR_TRACKING' })
    }
  }

  /**
   * 清理舊錯誤
   */
  private static cleanupOldErrors(): void {
    if (this.errors.size <= this.maxErrors) return

    const errors = Array.from(this.errors.entries())
    errors.sort(([, a], [, b]) => a.lastOccurrence.getTime() - b.lastOccurrence.getTime())

    // 刪除最舊的錯誤
    const toDelete = errors.slice(0, errors.length - this.maxErrors)
    toDelete.forEach(([key]) => {
      this.errors.delete(key)
    })

    logger.info('清理舊錯誤', {
      deleted: toDelete.length,
      remaining: this.errors.size
    }, { category: 'ERROR_TRACKING' })
  }

  /**
   * 清除所有錯誤
   */
  static clearAllErrors(): void {
    this.errors.clear()
    logger.info('清除所有錯誤追蹤記錄', {}, { category: 'ERROR_TRACKING' })
  }

  /**
   * 匯出錯誤資料
   */
  static exportErrors(): ErrorTrackingItem[] {
    return Array.from(this.errors.values())
  }

  /**
   * 匯入錯誤資料
   */
  static importErrors(errors: ErrorTrackingItem[]): void {
    this.errors.clear()
    
    errors.forEach(error => {
      const key = this.generateErrorKey(error.error)
      this.errors.set(key, error)
    })

    logger.info('匯入錯誤追蹤記錄', {
      count: errors.length
    }, { category: 'ERROR_TRACKING' })
  }
}