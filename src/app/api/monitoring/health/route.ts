import { NextRequest, NextResponse } from 'next/server'
import { HealthMonitor } from '@/lib/monitoring/performanceMonitor'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'

/**
 * GET /api/monitoring/health - 獲取系統健康狀態
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed') === 'true'
  
  // 執行健康檢查
  await HealthMonitor.runHealthChecks()
  
  // 獲取健康狀態
  const healthStatus = HealthMonitor.getHealthStatus()
  
  // 基本回應
  const response: any = {
    status: healthStatus.overall ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    lastCheck: healthStatus.lastCheck,
    checks: healthStatus.checks,
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    version: process.env.npm_package_version || '1.0.0'
  }

  // 詳細資訊（僅在請求時提供）
  if (detailed) {
    response.system = {
      memory: process.memoryUsage ? {
        ...process.memoryUsage(),
        usedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      } : null,
      cpu: process.cpuUsage ? process.cpuUsage() : null,
      platform: process.platform || null,
      nodeVersion: process.version || null,
      pid: process.pid || null
    }
    
    response.environment = {
      nodeEnv: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasLineIntegration: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      hasSendGridIntegration: !!process.env.SENDGRID_API_KEY,
      hasNextAuth: !!process.env.NEXTAUTH_SECRET
    }
  }

  const statusCode = healthStatus.overall ? 200 : 503

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
 * HEAD /api/monitoring/health - 簡單的健康檢查（僅返回狀態碼）
 */
export const HEAD = withErrorHandling(async (request: NextRequest) => {
  await HealthMonitor.runHealthChecks()
  const healthStatus = HealthMonitor.getHealthStatus()
  
  const statusCode = healthStatus.overall ? 200 : 503
  
  return new NextResponse(null, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
})