import { GlobalErrorHandler } from './errorHandler'

/**
 * 全域未捕獲錯誤處理器
 */
export class GlobalErrorBoundary {
  private static isInitialized = false

  /**
   * 初始化全域錯誤處理
   */
  static initialize(): void {
    if (this.isInitialized) {
      return
    }

    // 處理未捕獲的 Promise 拒絕
    if (typeof window !== 'undefined') {
      // 客戶端錯誤處理
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.addEventListener('error', this.handleGlobalError)
    } else {
      // 服務端錯誤處理
      process.on('unhandledRejection', this.handleUnhandledRejection)
      process.on('uncaughtException', this.handleUncaughtException)
    }

    this.isInitialized = true
    console.info('全域錯誤處理器已初始化')
  }

  /**
   * 處理未處理的 Promise 拒絕
   */
  private static handleUnhandledRejection = (event: any): void => {
    const error = event.reason || event
    
    console.error('未處理的 Promise 拒絕:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      type: 'unhandledRejection'
    })

    // 記錄到錯誤追蹤系統
    GlobalErrorHandler.logError(error, {
      code: 'UNHANDLED_REJECTION',
      message: '未處理的 Promise 拒絕',
      timestamp: new Date().toISOString(),
      statusCode: 500
    })

    // 在開發環境中阻止默認行為
    if (process.env.NODE_ENV === 'development') {
      if (typeof window !== 'undefined') {
        event.preventDefault()
      }
    }
  }

  /**
   * 處理全域錯誤（客戶端）
   */
  private static handleGlobalError = (event: ErrorEvent): void => {
    console.error('全域錯誤:', {
      timestamp: new Date().toISOString(),
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      type: 'globalError'
    })

    GlobalErrorHandler.logError(event.error, {
      code: 'GLOBAL_ERROR',
      message: event.message || '全域錯誤',
      timestamp: new Date().toISOString(),
      statusCode: 500
    })
  }

  /**
   * 處理未捕獲的例外（服務端）
   */
  private static handleUncaughtException = (error: Error): void => {
    console.error('未捕獲的例外:', {
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: 'uncaughtException'
    })

    GlobalErrorHandler.logError(error, {
      code: 'UNCAUGHT_EXCEPTION',
      message: error.message || '未捕獲的例外',
      timestamp: new Date().toISOString(),
      statusCode: 500
    })

    // 在生產環境中優雅地關閉程序
    if (process.env.NODE_ENV === 'production') {
      console.error('程序即將退出...')
      process.exit(1)
    }
  }

  /**
   * 清理錯誤處理器
   */
  static cleanup(): void {
    if (!this.isInitialized) {
      return
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.removeEventListener('error', this.handleGlobalError)
    } else {
      process.removeListener('unhandledRejection', this.handleUnhandledRejection)
      process.removeListener('uncaughtException', this.handleUncaughtException)
    }

    this.isInitialized = false
    console.info('全域錯誤處理器已清理')
  }
}

/**
 * React 錯誤邊界組件
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

export class ReactErrorBoundary {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  static componentDidCatch(error: Error, errorInfo: any): void {
    console.error('React 錯誤邊界捕獲錯誤:', {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      type: 'reactError'
    })

    GlobalErrorHandler.logError(error, {
      code: 'REACT_ERROR',
      message: error.message || 'React 組件錯誤',
      details: errorInfo,
      timestamp: new Date().toISOString(),
      statusCode: 500
    })
  }
}