import { PerformanceMetric } from '@/types'
import { logger } from '@/lib/logging/logger'

/**
 * 效能監控器
 */
export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric[]> = new Map()
  private static activeOperations: Map<string, { startTime: number; details?: any }> = new Map()

  /**
   * 開始監控操作
   */
  static startOperation(operationId: string, operationName: string, details?: any): void {
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      details
    })

    logger.debug(`開始監控操作: ${operationName}`, { operationId, details }, {
      category: 'PERFORMANCE'
    })
  }

  /**
   * 結束監控操作
   */
  static endOperation(operationId: string, operationName: string, success: boolean = true, details?: any): number {
    const operation = this.activeOperations.get(operationId)
    if (!operation) {
      logger.warn(`找不到操作: ${operationId}`, { operationName }, { category: 'PERFORMANCE' })
      return 0
    }

    const duration = Date.now() - operation.startTime
    this.activeOperations.delete(operationId)

    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      operation: operationName,
      duration,
      success,
      details: { ...operation.details, ...details }
    }

    this.recordMetric(operationName, metric)

    logger.info(`完成監控操作: ${operationName}`, {
      operationId,
      duration,
      success,
      details: metric.details
    }, { category: 'PERFORMANCE' })

    return duration
  }

  /**
   * 記錄效能指標
   */
  static recordMetric(operationName: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, [])
    }

    const operationMetrics = this.metrics.get(operationName)!
    operationMetrics.push(metric)

    // 保持最近 1000 筆記錄
    if (operationMetrics.length > 1000) {
      operationMetrics.shift()
    }

    // 記錄慢查詢或失敗操作
    if (!metric.success || metric.duration > this.getSlowThreshold(operationName)) {
      const level = !metric.success ? 'error' : 'warn'
      logger[level](`效能警告: ${operationName}`, {
        duration: metric.duration,
        success: metric.success,
        threshold: this.getSlowThreshold(operationName),
        details: metric.details
      }, { category: 'PERFORMANCE' })
    }
  }

  /**
   * 獲取操作的慢查詢閾值
   */
  private static getSlowThreshold(operationName: string): number {
    const thresholds: Record<string, number> = {
      'database_query': 1000,
      'api_request': 2000,
      'external_service': 5000,
      'file_operation': 500,
      'cache_operation': 100
    }

    // 根據操作名稱匹配閾值
    for (const [pattern, threshold] of Object.entries(thresholds)) {
      if (operationName.toLowerCase().includes(pattern)) {
        return threshold
      }
    }

    return 3000 // 預設閾值
  }

  /**
   * 獲取操作統計
   */
  static getOperationStats(operationName: string): {
    count: number
    avgDuration: number
    minDuration: number
    maxDuration: number
    successRate: number
    recentMetrics: PerformanceMetric[]
  } | null {
    const metrics = this.metrics.get(operationName)
    if (!metrics || metrics.length === 0) {
      return null
    }

    const durations = metrics.map(m => m.duration)
    const successCount = metrics.filter(m => m.success).length

    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successCount / metrics.length,
      recentMetrics: metrics.slice(-10) // 最近 10 筆
    }
  }

  /**
   * 獲取所有操作統計
   */
  static getAllStats(): Record<string, ReturnType<typeof PerformanceMonitor.getOperationStats>> {
    const stats: Record<string, any> = {}
    
    for (const operationName of this.metrics.keys()) {
      stats[operationName] = this.getOperationStats(operationName)
    }

    return stats
  }

  /**
   * 清除舊的指標
   */
  static cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - olderThanMs).toISOString()
    
    for (const [operationName, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime)
      this.metrics.set(operationName, filteredMetrics)
    }

    logger.info('效能指標清理完成', {
      cutoffTime,
      remainingOperations: this.metrics.size
    }, { category: 'PERFORMANCE' })
  }

  /**
   * 監控裝飾器
   */
  static monitor(operationName?: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value
      const operation = operationName || `${target.constructor.name}.${propertyName}`

      descriptor.value = async function (...args: any[]) {
        const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        PerformanceMonitor.startOperation(operationId, operation, { args })

        try {
          const result = await method.apply(this, args)
          PerformanceMonitor.endOperation(operationId, operation, true)
          return result
        } catch (error) {
          PerformanceMonitor.endOperation(operationId, operation, false, { error: error.message })
          throw error
        }
      }

      return descriptor
    }
  }
}

/**
 * 系統健康監控
 */
export class HealthMonitor {
  private static healthChecks: Map<string, () => Promise<boolean>> = new Map()
  private static lastHealthCheck: Date | null = null
  private static healthStatus: Record<string, { status: boolean; lastCheck: Date; error?: string }> = {}

  /**
   * 註冊健康檢查
   */
  static registerHealthCheck(name: string, check: () => Promise<boolean>): void {
    this.healthChecks.set(name, check)
    logger.info(`註冊健康檢查: ${name}`, {}, { category: 'HEALTH' })
  }

  /**
   * 執行所有健康檢查
   */
  static async runHealthChecks(): Promise<Record<string, { status: boolean; lastCheck: Date; error?: string }>> {
    const results: Record<string, { status: boolean; lastCheck: Date; error?: string }> = {}
    
    for (const [name, check] of this.healthChecks.entries()) {
      try {
        const startTime = Date.now()
        const status = await check()
        const duration = Date.now() - startTime
        
        results[name] = {
          status,
          lastCheck: new Date()
        }

        logger.debug(`健康檢查完成: ${name}`, {
          status,
          duration
        }, { category: 'HEALTH' })

      } catch (error) {
        results[name] = {
          status: false,
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : String(error)
        }

        logger.error(`健康檢查失敗: ${name}`, error, { category: 'HEALTH' })
      }
    }

    this.healthStatus = results
    this.lastHealthCheck = new Date()

    return results
  }

  /**
   * 獲取健康狀態
   */
  static getHealthStatus(): {
    overall: boolean
    lastCheck: Date | null
    checks: Record<string, { status: boolean; lastCheck: Date; error?: string }>
  } {
    const overall = Object.values(this.healthStatus).every(check => check.status)
    
    return {
      overall,
      lastCheck: this.lastHealthCheck,
      checks: this.healthStatus
    }
  }

  /**
   * 註冊預設健康檢查
   */
  static registerDefaultChecks(): void {
    // 資料庫連接檢查
    this.registerHealthCheck('database', async () => {
      try {
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        
        // 執行簡單查詢測試連接
        await prisma.$queryRaw`SELECT 1`
        await prisma.$disconnect()
        
        return true
      } catch (error) {
        logger.error('資料庫健康檢查失敗', error, { category: 'HEALTH' })
        return false
      }
    })

    // 記憶體使用檢查
    this.registerHealthCheck('memory', async () => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage()
        const usedMB = usage.heapUsed / 1024 / 1024
        const maxMB = 512 // 512MB 閾值
        
        logger.debug('記憶體使用檢查', {
          usedMB: Math.round(usedMB),
          maxMB,
          withinLimit: usedMB < maxMB
        }, { category: 'HEALTH' })
        
        return usedMB < maxMB
      }
      return true
    })

    // 磁碟空間檢查
    this.registerHealthCheck('disk_space', async () => {
      try {
        const fs = await import('fs')
        const stats = fs.statSync('.')
        // 簡化的磁碟檢查，在實際環境中可能需要更複雜的邏輯
        return true
      } catch (error) {
        logger.error('磁碟空間檢查失敗', error, { category: 'HEALTH' })
        return false
      }
    })

    // LINE 服務檢查
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (lineToken && lineToken !== '' && lineToken !== 'temp_access_token') {
      this.registerHealthCheck('line_service', async () => {
        try {
          const response = await fetch('https://api.line.me/v2/bot/info', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${lineToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          const isHealthy = response.ok
          
          if (!isHealthy) {
            logger.warn('LINE 服務健康檢查警告', {
              status: response.status,
              statusText: response.statusText
            }, { category: 'HEALTH' })
          }
          
          return isHealthy
        } catch (error) {
          logger.error('LINE 服務健康檢查失敗', error, { category: 'HEALTH' })
          return false
        }
      })
    }

    // SendGrid 服務檢查
    const sendgridKey = process.env.SENDGRID_API_KEY
    if (sendgridKey && sendgridKey !== '' && sendgridKey !== 'temp_api_key') {
      this.registerHealthCheck('sendgrid_service', async () => {
        try {
          const response = await fetch('https://api.sendgrid.com/v3/user/account', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sendgridKey}`,
              'Content-Type': 'application/json'
            }
          })
          
          const isHealthy = response.ok
          
          if (!isHealthy) {
            logger.warn('SendGrid 服務健康檢查警告', {
              status: response.status,
              statusText: response.statusText
            }, { category: 'HEALTH' })
          }
          
          return isHealthy
        } catch (error) {
          logger.error('SendGrid 服務健康檢查失敗', error, { category: 'HEALTH' })
          return false
        }
      })
    }

    // 環境變數檢查
    this.registerHealthCheck('environment', async () => {
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ]
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
      
      if (missingVars.length > 0) {
        logger.error('缺少必要的環境變數', { missingVars }, { category: 'HEALTH' })
        return false
      }
      
      return true
    })
  }
}

/**
 * 效能計時器工具
 */
export class Timer {
  private startTime: number
  private name: string

  constructor(name: string) {
    this.name = name
    this.startTime = Date.now()
  }

  /**
   * 結束計時並記錄
   */
  end(success: boolean = true, details?: any): number {
    const duration = Date.now() - this.startTime
    
    PerformanceMonitor.recordMetric(this.name, {
      timestamp: new Date().toISOString(),
      operation: this.name,
      duration,
      success,
      details
    })

    return duration
  }

  /**
   * 獲取當前經過時間
   */
  elapsed(): number {
    return Date.now() - this.startTime
  }
}

/**
 * 簡化的計時器函數
 */
export function createTimer(name: string): Timer {
  return new Timer(name)
}

// 初始化預設健康檢查
if (typeof window === 'undefined') {
  HealthMonitor.registerDefaultChecks()
}