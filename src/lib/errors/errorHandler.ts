import { NextResponse } from 'next/server'
import { ErrorCodes, ErrorResponse } from '@/types'

// Re-export ErrorCodes for convenience
export { ErrorCodes } from '@/types'

/**
 * 錯誤分類系統
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  SYSTEM = 'SYSTEM',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT'
}

/**
 * 應用程式錯誤基礎類別
 */
export class AppError extends Error {
  public readonly category: ErrorCategory
  public readonly code: ErrorCodes
  public readonly statusCode: number
  public readonly details?: any
  public readonly isOperational: boolean

  constructor(
    message: string,
    category: ErrorCategory,
    code: ErrorCodes,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    this.category = category
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorCodes.VALIDATION_ERROR,
      400,
      details
    )
  }
}

/**
 * 業務邏輯錯誤
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, code: ErrorCodes, details?: any) {
    super(
      message,
      ErrorCategory.BUSINESS_LOGIC,
      code,
      400,
      details
    )
  }
}

/**
 * 外部服務錯誤
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, code: ErrorCodes, details?: any) {
    super(
      message,
      ErrorCategory.EXTERNAL_SERVICE,
      code,
      502,
      details
    )
  }
}

/**
 * 系統錯誤
 */
export class SystemError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorCategory.SYSTEM,
      ErrorCodes.SYSTEM_ERROR,
      500,
      details,
      false // 系統錯誤通常不是可操作的
    )
  }
}

/**
 * 認證錯誤
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '認證失敗') {
    super(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorCodes.VALIDATION_ERROR,
      401
    )
  }
}

/**
 * 授權錯誤
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '權限不足') {
    super(
      message,
      ErrorCategory.AUTHORIZATION,
      ErrorCodes.VALIDATION_ERROR,
      403
    )
  }
}

/**
 * 資源不存在錯誤
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(
      `${resource}不存在`,
      ErrorCategory.NOT_FOUND,
      ErrorCodes.VALIDATION_ERROR,
      404
    )
  }
}

/**
 * 速率限制錯誤
 */
export class RateLimitError extends AppError {
  constructor(message: string = '請求過於頻繁，請稍後再試') {
    super(
      message,
      ErrorCategory.RATE_LIMIT,
      ErrorCodes.VALIDATION_ERROR,
      429
    )
  }
}

/**
 * 全域錯誤處理器
 */
export class GlobalErrorHandler {
  /**
   * 處理錯誤並返回適當的 NextResponse
   */
  static handleError(error: unknown): NextResponse {
    const errorResponse = this.createErrorResponse(error)
    
    // 記錄錯誤
    this.logError(error, errorResponse)
    
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode || 500 
    })
  }

  /**
   * 創建標準化的錯誤回應
   */
  static createErrorResponse(error: unknown): ErrorResponse & { statusCode: number } {
    if (error instanceof AppError) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode
      }
    }

    if (error instanceof Error) {
      // 處理已知的錯誤類型
      if (error.message.includes('已被使用') || error.message.includes('already exists')) {
        return {
          code: ErrorCodes.DUPLICATE_EMAIL,
          message: error.message,
          timestamp: new Date().toISOString(),
          statusCode: 409
        }
      }

      if (error.message.includes('不存在') || error.message.includes('not found')) {
        return {
          code: ErrorCodes.BARBER_NOT_FOUND,
          message: error.message,
          timestamp: new Date().toISOString(),
          statusCode: 404
        }
      }

      if (error.message.includes('時段') || error.message.includes('time slot')) {
        return {
          code: ErrorCodes.INVALID_TIME_SLOT,
          message: error.message,
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      }

      if (error.message.includes('營業時間') || error.message.includes('business hours')) {
        return {
          code: ErrorCodes.OUTSIDE_BUSINESS_HOURS,
          message: error.message,
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      }
    }

    // 未知錯誤
    return {
      code: ErrorCodes.SYSTEM_ERROR,
      message: '系統發生未知錯誤',
      timestamp: new Date().toISOString(),
      statusCode: 500
    }
  }

  /**
   * 記錄錯誤
   */
  static logError(error: unknown, errorResponse: ErrorResponse & { statusCode: number }): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level: this.getLogLevel(errorResponse.statusCode),
      category: error instanceof AppError ? error.category : 'UNKNOWN',
      code: errorResponse.code,
      message: errorResponse.message,
      details: errorResponse.details,
      stack: error instanceof Error ? error.stack : undefined,
      isOperational: error instanceof AppError ? error.isOperational : false
    }

    if (errorResponse.statusCode >= 500) {
      console.error('系統錯誤:', logData)
    } else if (errorResponse.statusCode >= 400) {
      console.warn('客戶端錯誤:', logData)
    } else {
      console.info('錯誤資訊:', logData)
    }
  }

  /**
   * 根據狀態碼決定日誌等級
   */
  private static getLogLevel(statusCode: number): string {
    if (statusCode >= 500) return 'ERROR'
    if (statusCode >= 400) return 'WARN'
    return 'INFO'
  }

  /**
   * 檢查錯誤是否為可操作的
   */
  static isOperationalError(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.isOperational
    }
    return false
  }
}

/**
 * API 路由錯誤處理包裝器
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return GlobalErrorHandler.handleError(error)
    }
  }
}

/**
 * 異步操作錯誤處理包裝器
 */
export async function handleAsync<T>(
  promise: Promise<T>
): Promise<[T | null, AppError | null]> {
  try {
    const result = await promise
    return [result, null]
  } catch (error) {
    if (error instanceof AppError) {
      return [null, error]
    }
    return [null, new SystemError('未知錯誤', error)]
  }
}

/**
 * 重試機制配置
 */
export interface RetryConfig {
  maxAttempts: number
  backoffMs: number
  exponentialBackoff: boolean
  retryCondition?: (error: unknown) => boolean
}

/**
 * 預設重試配置
 */
export const DEFAULT_RETRY_CONFIGS = {
  lineMessage: { 
    maxAttempts: 3, 
    backoffMs: 1000, 
    exponentialBackoff: true,
    retryCondition: (error: unknown) => error instanceof ExternalServiceError
  },
  emailSend: { 
    maxAttempts: 3, 
    backoffMs: 2000, 
    exponentialBackoff: true,
    retryCondition: (error: unknown) => error instanceof ExternalServiceError
  },
  databaseOperation: { 
    maxAttempts: 2, 
    backoffMs: 500, 
    exponentialBackoff: false,
    retryCondition: (error: unknown) => error instanceof SystemError
  }
}

/**
 * 重試執行器
 */
export class RetryExecutor {
  static async execute<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: unknown
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // 檢查是否應該重試
        if (attempt === config.maxAttempts || 
            (config.retryCondition && !config.retryCondition(error))) {
          break
        }
        
        // 計算延遲時間
        const delay = config.exponentialBackoff 
          ? config.backoffMs * Math.pow(2, attempt - 1)
          : config.backoffMs
        
        console.warn(`操作失敗，${delay}ms 後重試 (${attempt}/${config.maxAttempts}):`, error)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
}