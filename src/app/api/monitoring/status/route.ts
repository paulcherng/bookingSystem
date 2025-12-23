import { NextRequest, NextResponse } from 'next/server'
import { HealthMonitor, PerformanceMonitor } from '@/lib/monitoring/performanceMonitor'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'

/**
 * GET /api/monitoring/status - 獲取完整的系統狀態資訊
 * 包含健康檢查、效能指標、系統資訊等
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const includeMetrics = searchParams.get('metrics') === 'true'
  
  // 執行健康檢查
  await HealthMonitor.runHealthChecks()
  
  // 獲取健康狀態
  const healthStatus = HealthMonitor.getHealthStatus()
  
  // 基本系統資訊
  const systemInfo = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version || null,
    platform: process.platform || null,
    pid: process.pid || null,
    environment: process.env.NODE_ENV || 'unknown'
  }
  
  // 記憶體和 CPU 資訊
  const resourceInfo = {
    memory: process.memoryUsage ? {
      ...process.memoryUsage(),
      usedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      externalMB: Math.round(process.memoryUsage().external / 1024 / 1024)
    } : null,
    cpu: process.cpuUsage ? process.cpuUsage() : null
  }
  
  // 環境配置資訊
  const configInfo = {
    hasDatabase: !!process.env.DATABASE_URL,
    hasLineIntegration: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    hasSendGridIntegration: !!process.env.SENDGRID_API_KEY,
    hasNextAuth: !!process.env.NEXTAUTH_SECRET,
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || null
  }
  
  const response: any = {
    status: healthStatus.overall ? 'healthy' : 'unhealthy',
    system: systemInfo,
    resources: resourceInfo,
    configuration: configInfo,
    health: {
      overall: healthStatus.overall,
      lastCheck: healthStatus.lastCheck,
      checks: healthStatus.checks
    }
  }
  
  // 包含效能指標（如果請求）
  if (includeMetrics) {
    response.performance = {
      stats: PerformanceMonitor.getAllStats(),
      summary: generatePerformanceSummary()
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
 * 生成效能摘要
 */
function generatePerformanceSummary() {
  const allStats = PerformanceMonitor.getAllStats()
  const operations = Object.keys(allStats)
  
  if (operations.length === 0) {
    return {
      totalOperations: 0,
      averageSuccessRate: 0,
      slowestOperation: null,
      fastestOperation: null
    }
  }
  
  let totalCount = 0
  let totalSuccessCount = 0
  let slowestOp = { name: '', avgDuration: 0 }
  let fastestOp = { name: '', avgDuration: Infinity }
  
  for (const [opName, stats] of Object.entries(allStats)) {
    if (stats) {
      totalCount += stats.count
      totalSuccessCount += Math.round(stats.count * stats.successRate)
      
      if (stats.avgDuration > slowestOp.avgDuration) {
        slowestOp = { name: opName, avgDuration: stats.avgDuration }
      }
      
      if (stats.avgDuration < fastestOp.avgDuration) {
        fastestOp = { name: opName, avgDuration: stats.avgDuration }
      }
    }
  }
  
  return {
    totalOperations: totalCount,
    averageSuccessRate: totalCount > 0 ? totalSuccessCount / totalCount : 0,
    slowestOperation: slowestOp.avgDuration > 0 ? slowestOp : null,
    fastestOperation: fastestOp.avgDuration < Infinity ? fastestOp : null,
    operationCount: operations.length
  }
}