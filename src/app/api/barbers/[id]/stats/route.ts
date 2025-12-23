import { NextRequest, NextResponse } from 'next/server'
import { BarberService } from '@/services/barberService'
import { ErrorCodes } from '@/types'

// GET /api/barbers/[id]/stats - 獲取理髮師統計
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stats = await BarberService.getBarberStats(params.id)
    
    return NextResponse.json({
      barberId: params.id,
      stats
    })
  } catch (error) {
    console.error('獲取理髮師統計失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取理髮師統計失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}