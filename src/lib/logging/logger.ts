import { LogEntry, PerformanceMetric } from '@/types'

/**
 * 日誌等級
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 日誌配置
 */
export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  maxLogSize?: number
  rotateInterval?: number
}

/**
 * 結構化日誌器
 */
export class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private requestId?: string

  constructor(config: LoggerConfig) {
    this.config = config
  }

  /**
   * 獲取日誌器實例
   */
  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config || {
        level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
        enableConsole: true,
        enableFile: false,
        enableRemote: false
      })
    }
    return Logger.instance
  }

  /**
   * 設定請求 ID
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId
  }

  /**
   * 清除請求 ID
   */
  clearRequestId(): void {
    this.requestId = undefined
  }

  /**
   * 記錄 DEBUG 等級日誌
   */
  debug(message: string, details?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, details, context)
  }

  /**
   * 記錄 INFO 等級日誌
   */
  info(message: string, details?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, 'INFO', message, details, context)
  }

  /**
   * 記錄 WARN 等級日誌
   */
  warn(message: string, details?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, 'WARN', message, details, context)
  }

  /**
   * 記錄 ERROR 等級日誌
   */
  error(message: string, error?: Error | any, context?: Partial<LogEntry>): void {
    const details = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error

    this.log(LogLevel.ERROR, 'ERROR', message, details, {
      ...context,
      stack: error instanceof Error ? error.stack : undefined
    })
  }

  /**
   * 核心日誌方法
   */
  private log(
    level: LogLevel,
    levelName: LogEntry['level'],
    message: string,
    details?: any,
    context?: Partial<LogEntry>
  ): void {
    if (level < this.config.level) {
      return
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      category: context?.category || 'APPLICATION',
      message,
      details,
      stack: context?.stack,
      requestId: this.requestId || context?.requestId,
      userId: context?.userId,
      storeId: context?.storeId
    }

    // 輸出到控制台
    if (this.config.enableConsole) {
      this.logToConsole(logEntry)
    }

    // 輸出到檔案（在實際應用中可能需要檔案系統操作）
    if (this.config.enableFile) {
      this.logToFile(logEntry)
    }

    // 發送到遠端日誌服務
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.logToRemote(logEntry)
    }
  }

  /**
   * 輸出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, category, message, details, requestId } = entry
    const prefix = `[${timestamp}] [${level}] [${category}]${requestId ? ` [${requestId}]` : ''}`
    
    switch (level) {
      case 'DEBUG':
        console.debug(`${prefix} ${message}`, details || '')
        break
      case 'INFO':
        console.info(`${prefix} ${message}`, details || '')
        break
      case 'WARN':
        console.warn(`${prefix} ${message}`, details || '')
        break
      case 'ERROR':
        console.error(`${prefix} ${message}`, details || '')
        if (entry.stack) {
          console.error('Stack trace:', entry.stack)
        }
        break
    }
  }

  /**
   * 輸出到檔案
   */
  private logToFile(entry: LogEntry): void {
    // 在 Vercel 等 serverless 環境中，檔案系統是只讀的
    // 這裡可以實作將日誌發送到外部儲存服務
    if (process.env.NODE_ENV === 'development') {
      console.log('File logging:', JSON.stringify(entry, null, 2))
    }
  }

  /**
   * 發送到遠端日誌服務
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    try {
      if (!this.config.remoteEndpoint) return

      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      // 避免日誌記錄本身造成無限循環
      console.error('Failed to send log to remote service:', error)
    }
  }
}

/**
 * 預設日誌器實例
 */
export const logger = Logger.getInstance()

/**
 * 日誌裝飾器
 */
export function withLogging(category: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      const methodName = `${target.constructor.name}.${propertyName}`
      
      logger.debug(`開始執行 ${methodName}`, { args }, { category })

      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime
        
        logger.info(`完成執行 ${methodName}`, { duration, success: true }, { category })
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        
        logger.error(`執行失敗 ${methodName}`, error, { 
          category,
          details: { duration, success: false }
        })
        
        throw error
      }
    }

    return descriptor
  }
}

/**
 * 請求日誌中介軟體
 */
export class RequestLogger {
  /**
   * 生成請求 ID
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 記錄請求開始
   */
  static logRequestStart(
    method: string,
    url: string,
    requestId: string,
    headers?: Record<string, string>
  ): void {
    logger.setRequestId(requestId)
    logger.info('請求開始', {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      requestId
    }, { category: 'REQUEST' })
  }

  /**
   * 記錄請求結束
   */
  static logRequestEnd(
    requestId: string,
    statusCode: number,
    duration: number,
    responseSize?: number
  ): void {
    logger.info('請求結束', {
      requestId,
      statusCode,
      duration,
      responseSize,
      success: statusCode < 400
    }, { category: 'REQUEST' })
    
    logger.clearRequestId()
  }

  /**
   * 清理敏感的標頭資訊
   */
  private static sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {}

    const sanitized = { ...headers }
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    }

    return sanitized
  }
}

/**
 * 業務日誌器
 */
export class BusinessLogger {
  /**
   * 記錄店家操作
   */
  static logStoreOperation(
    operation: string,
    storeId: string,
    details?: any,
    userId?: string
  ): void {
    logger.info(`店家操作: ${operation}`, details, {
      category: 'BUSINESS',
      storeId,
      userId
    })
  }

  /**
   * 記錄預約操作
   */
  static logBookingOperation(
    operation: string,
    bookingId: string,
    storeId: string,
    details?: any
  ): void {
    logger.info(`預約操作: ${operation}`, { bookingId, ...details }, {
      category: 'BOOKING',
      storeId
    })
  }

  /**
   * 記錄通訊操作
   */
  static logCommunicationOperation(
    operation: string,
    contactType: 'line' | 'email',
    storeId: string,
    details?: any
  ): void {
    logger.info(`通訊操作: ${operation}`, { contactType, ...details }, {
      category: 'COMMUNICATION',
      storeId
    })
  }

  /**
   * 記錄外部服務調用
   */
  static logExternalServiceCall(
    service: string,
    operation: string,
    success: boolean,
    duration: number,
    details?: any
  ): void {
    const level = success ? 'info' : 'error'
    logger[level](`外部服務調用: ${service}.${operation}`, {
      success,
      duration,
      ...details
    }, { category: 'EXTERNAL_SERVICE' })
  }
}