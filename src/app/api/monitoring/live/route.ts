import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'

/**
 * GET /api/monitoring/live - 檢查系統是否存活
 * 這個端點主要用於 Kubernetes 或其他容器編排系統的 liveness probe
 * 只檢查最基本的系統狀態，不檢查外部依賴
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const response = {
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    pid: process.pid || null,
    version: process.env.npm_package_version || '1.0.0'
  }

  return NextResponse.json(response, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
})

/**
 * HEAD /api/monitoring/live - 簡單的存活檢查（僅返回狀態碼）
 */
export const HEAD = withErrorHandling(async (request: NextRequest) => {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
})