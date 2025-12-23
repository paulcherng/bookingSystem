import { NextRequest, NextResponse } from 'next/server'
import { PerformanceMonitor } from '@/lib/monitoring/performanceMonitor'
import { ErrorTracker } from '@/lib/monitoring/errorTracker'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'

/**
 * GET /api/monitoring/metrics - 獲取系統效能指標
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const operation = searchParams.get('operation')
  const includeErrors = searchParams.get('includeErrors') === 'true'

  let performanceStats
  if (operation) {
    performanceStats = PerformanceMonitor.getOperationStats(operation)
  } else {
    performanceStats = PerformanceMonitor.getAllStats()
  }

  const response: any = {
    timestamp: new Date().toISOString(),
    performance: performanceStats
  }

  if (includeErrors) {
    response.errors = ErrorTracker.getErrorStats()
  }

  return NextResponse.json(response)
})

/**
 * DELETE /api/monitoring/metrics - 清理舊的效能指標
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const olderThanHours = parseInt(searchParams.get('olderThanHours') || '24')
  
  const olderThanMs = olderThanHours * 60 * 60 * 1000
  PerformanceMonitor.cleanup(olderThanMs)

  return NextResponse.json({
    message: `清理了 ${olderThanHours} 小時前的效能指標`,
    timestamp: new Date().toISOString()
  })
})