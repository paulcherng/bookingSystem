import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ErrorCodes } from '@/types'

// GET /api/public/stores - 取得所有可預約的店家
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        // 不返回敏感資訊如 email, lineAccessToken 等
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(stores)

  } catch (error) {
    console.error('Failed to fetch public stores:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '無法取得店家列表',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}