import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ErrorCodes } from '@/types'

// GET /api/public/stores/[id]/services - 取得店家的服務項目
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const services = await prisma.service.findMany({
      where: {
        storeId: params.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(services)

  } catch (error) {
    console.error('Failed to fetch store services:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '無法取得服務項目',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}