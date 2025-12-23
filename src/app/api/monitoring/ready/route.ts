import { NextRequest, NextResponse } from 'next/server'
import { HealthMonitor } from '@/lib/monitoring/performanceMonitor'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'

/**
 * GET /api/monitoring/ready - 檢查系統是否準備好服務請求
 * 這個端點主要用於 Kubernetes 或其他容器編排系統的 readiness probe
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 執行關鍵健康檢查
  await HealthMonitor.runHealthChecks()
  
  const healthStatus = HealthMonitor.getHealthStatus()
  
  // 檢查關鍵服務是否就緒
  const criticalChecks = ['database', 'environment']
  const criticalStatus = criticalChecks.every(checkName => 
    healthStatus.checks[checkName]?.status === true
  )
  
  const response = {
    ready: criticalStatus,
    timestamp: new Date().toISOString(),
    criticalChecks: criticalChecks.reduce((acc, checkName) => {
      acc[checkName] = healthStatus.checks[checkName] || { status: false, lastCheck: new Date(), error: 'Check not found' }
      return acc
    }, {} as Record<string, any>)
  }

  const statusCode = criticalStatus ? 200 : 503

  return NextResponse.json(response, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
})

/**
 * HEAD /api/monitoring/ready - 簡單的就緒檢查（僅返回狀態碼）
 */
export const HEAD = withErrorHandling(async (request: NextRequest) => {
  await HealthMonitor.runHealthChecks()
  const healthStatus = HealthMonitor.getHealthStatus()
  
  const criticalChecks = ['database', 'environment']
  const criticalStatus = criticalChecks.every(checkName => 
    healthStatus.checks[checkName]?.status === true
  )
  
  const statusCode = criticalStatus ? 200 : 503
  
  return new NextResponse(null, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
})