import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ErrorCodes } from '@/types'

// GET /api/public/stores/[id]/barbers - 取得店家的理髮師
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const barbers = await prisma.barber.findMany({
      where: {
        storeId: params.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        specialties: true
        // 不返回敏感資訊如 email
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(barbers)

  } catch (error) {
    console.error('Failed to fetch store barbers:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '無法取得理髮師列表',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}