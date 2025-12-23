import { NextRequest, NextResponse } from 'next/server'
import { ErrorTracker } from '@/lib/monitoring/errorTracker'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'

/**
 * GET /api/monitoring/errors - 獲取錯誤追蹤資訊
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const resolved = searchParams.get('resolved')
  const severity = searchParams.get('severity') as any
  const category = searchParams.get('category')
  const limit = searchParams.get('limit')
  const stats = searchParams.get('stats') === 'true'

  if (stats) {
    const errorStats = ErrorTracker.getErrorStats()
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats: errorStats
    })
  }

  const filters: any = {}
  if (resolved !== null) filters.resolved = resolved === 'true'
  if (severity) filters.severity = severity
  if (category) filters.category = category
  if (limit) filters.limit = parseInt(limit)

  const errors = ErrorTracker.getAllErrors(filters)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    count: errors.length,
    errors
  })
})

/**
 * PATCH /api/monitoring/errors/:id - 標記錯誤為已解決
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const errorId = searchParams.get('id')
  
  if (!errorId) {
    return NextResponse.json(
      { error: '錯誤 ID 為必填參數' },
      { status: 400 }
    )
  }

  const success = ErrorTracker.resolveError(errorId)
  
  if (!success) {
    return NextResponse.json(
      { error: '找不到指定的錯誤' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    message: '錯誤已標記為解決',
    errorId,
    timestamp: new Date().toISOString()
  })
})

/**
 * DELETE /api/monitoring/errors - 清除所有錯誤追蹤記錄
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  ErrorTracker.clearAllErrors()

  return NextResponse.json({
    message: '所有錯誤追蹤記錄已清除',
    timestamp: new Date().toISOString()
  })
})