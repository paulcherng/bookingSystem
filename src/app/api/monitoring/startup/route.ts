import { NextRequest, NextResponse } from 'next/server'
import { HealthMonitor } from '@/lib/monitoring/performanceMonitor'
import { withErrorHandling } from '@/lib/middleware/errorMiddleware'

/**
 * GET /api/monitoring/startup - 檢查系統是否已完成啟動
 * 這個端點主要用於 Kubernetes 或其他容器編排系統的 startup probe
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    // 檢查系統啟動所需的基本條件
    const startupChecks = {
      environment: await checkEnvironmentVariables(),
      database: await checkDatabaseConnection(),
      prisma: await checkPrismaClient()
    }
    
    const allStartupChecksPass = Object.values(startupChecks).every(check => check.status)
    
    const response = {
      started: allStartupChecksPass,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      checks: startupChecks,
      version: process.env.npm_package_version || '1.0.0'
    }

    const statusCode = allStartupChecksPass ? 200 : 503

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    return NextResponse.json({
      started: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown startup error'
    }, { status: 503 })
  }
})

/**
 * HEAD /api/monitoring/startup - 簡單的啟動檢查（僅返回狀態碼）
 */
export const HEAD = withErrorHandling(async (request: NextRequest) => {
  try {
    const environmentOk = await checkEnvironmentVariables()
    const databaseOk = await checkDatabaseConnection()
    const prismaOk = await checkPrismaClient()
    
    const allOk = environmentOk.status && databaseOk.status && prismaOk.status
    const statusCode = allOk ? 200 : 503
    
    return new NextResponse(null, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
})

// 輔助函數
async function checkEnvironmentVariables(): Promise<{ status: boolean; error?: string }> {
  try {
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
    const missingVars = requiredVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      return {
        status: false,
        error: `Missing required environment variables: ${missingVars.join(', ')}`
      }
    }
    
    return { status: true }
  } catch (error) {
    return {
      status: false,
      error: error instanceof Error ? error.message : 'Environment check failed'
    }
  }
}

async function checkDatabaseConnection(): Promise<{ status: boolean; error?: string }> {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    
    return { status: true }
  } catch (error) {
    return {
      status: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

async function checkPrismaClient(): Promise<{ status: boolean; error?: string }> {
  try {
    const { PrismaClient } = await import('@prisma/client')
    // 檢查 Prisma Client 是否已生成
    const prisma = new PrismaClient()
    await prisma.$disconnect()
    
    return { status: true }
  } catch (error) {
    return {
      status: false,
      error: error instanceof Error ? error.message : 'Prisma client check failed'
    }
  }
}