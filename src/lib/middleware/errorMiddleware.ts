import { NextRequest, NextResponse } from 'next/server'
import { GlobalErrorHandler, AppError } from '@/lib/errors/errorHandler'

/**
 * API 路由錯誤處理中介軟體
 */
export function createErrorMiddleware() {
  return {
    /**
     * 包裝 API 處理器以提供錯誤處理
     */
    wrap<T extends any[]>(
      handler: (...args: T) => Promise<NextResponse>
    ) {
      return async (...args: T): Promise<NextResponse> => {
        try {
          return await handler(...args)
        } catch (error) {
          return GlobalErrorHandler.handleError(error)
        }
      }
    },

    /**
     * 驗證請求並處理錯誤
     */
    async validateRequest(
      request: NextRequest,
      validator: (req: NextRequest) => Promise<void> | void
    ): Promise<NextResponse | null> {
      try {
        await validator(request)
        return null // 驗證通過
      } catch (error) {
        return GlobalErrorHandler.handleError(error)
      }
    },

    /**
     * 處理認證錯誤
     */
    handleAuthError(message: string = '認證失敗'): NextResponse {
      return NextResponse.json(
        {
          code: 'AUTHENTICATION_ERROR',
          message,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    },

    /**
     * 處理授權錯誤
     */
    handleAuthorizationError(message: string = '權限不足'): NextResponse {
      return NextResponse.json(
        {
          code: 'AUTHORIZATION_ERROR',
          message,
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      )
    },

    /**
     * 處理速率限制錯誤
     */
    handleRateLimitError(message: string = '請求過於頻繁'): NextResponse {
      return NextResponse.json(
        {
          code: 'RATE_LIMIT_ERROR',
          message,
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }
  }
}

/**
 * 預設錯誤中介軟體實例
 */
export const errorMiddleware = createErrorMiddleware()

/**
 * API 路由裝飾器
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return errorMiddleware.wrap(handler)
}

/**
 * 批次錯誤處理
 */
export class BatchErrorHandler {
  private errors: AppError[] = []

  /**
   * 添加錯誤
   */
  addError(error: AppError): void {
    this.errors.push(error)
  }

  /**
   * 檢查是否有錯誤
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * 獲取所有錯誤
   */
  getErrors(): AppError[] {
    return [...this.errors]
  }

  /**
   * 清除所有錯誤
   */
  clearErrors(): void {
    this.errors = []
  }

  /**
   * 創建批次錯誤回應
   */
  createResponse(): NextResponse {
    if (this.errors.length === 0) {
      throw new Error('沒有錯誤需要處理')
    }

    const firstError = this.errors[0]
    const allErrors = this.errors.map(error => ({
      code: error.code,
      message: error.message,
      details: error.details
    }))

    return NextResponse.json(
      {
        code: 'BATCH_ERROR',
        message: `發生 ${this.errors.length} 個錯誤`,
        details: allErrors,
        timestamp: new Date().toISOString()
      },
      { status: firstError.statusCode }
    )
  }
}

/**
 * 錯誤恢復策略
 */
export class ErrorRecoveryStrategy {
  /**
   * 嘗試從錯誤中恢復
   */
  static async attemptRecovery<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    condition: (error: unknown) => boolean = () => true
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (condition(error)) {
        console.warn('主要操作失敗，嘗試備用方案:', error)
        return await fallback()
      }
      throw error
    }
  }

  /**
   * 部分失敗處理
   */
  static async handlePartialFailure<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      continueOnError?: boolean
      maxFailures?: number
    } = {}
  ): Promise<{
    successes: R[]
    failures: { item: T; error: unknown }[]
  }> {
    const { continueOnError = true, maxFailures = Infinity } = options
    const successes: R[] = []
    const failures: { item: T; error: unknown }[] = []

    for (const item of items) {
      try {
        const result = await processor(item)
        successes.push(result)
      } catch (error) {
        failures.push({ item, error })
        
        if (!continueOnError || failures.length >= maxFailures) {
          break
        }
      }
    }

    return { successes, failures }
  }
}