import { NextRequest, NextResponse } from 'next/server'
import { BarberService } from '@/services/barberService'
import { ErrorCodes } from '@/types'

// GET /api/stores/[id]/barbers/search?specialty=剪髮 - 根據專長搜尋理髮師
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty')
    
    if (!specialty) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '請提供 specialty 參數',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const barbers = await BarberService.getBarbersBySpecialty(params.id, specialty)
    
    return NextResponse.json({
      storeId: params.id,
      specialty,
      barbers
    })
  } catch (error) {
    console.error('搜尋理髮師失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '搜尋理髮師失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}