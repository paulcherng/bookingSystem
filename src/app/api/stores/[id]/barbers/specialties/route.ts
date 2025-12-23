import { NextRequest, NextResponse } from 'next/server'
import { BarberService } from '@/services/barberService'
import { ErrorCodes } from '@/types'

// GET /api/stores/[id]/barbers/specialties - 獲取店家理髮師的所有專長
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const specialties = await BarberService.getBarberSpecialties(params.id)
    
    return NextResponse.json({
      storeId: params.id,
      specialties
    })
  } catch (error) {
    console.error('獲取專長列表失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取專長列表失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}