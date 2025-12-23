import { NextRequest, NextResponse } from 'next/server'
import { BarberService } from '@/services/barberService'
import { ErrorCodes } from '@/types'

// POST /api/barbers/[id]/toggle-status - 切換理髮師狀態
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedBarber = await BarberService.toggleBarberStatus(params.id)
    
    return NextResponse.json({
      message: `理髮師已${updatedBarber.isActive ? '啟用' : '停用'}`,
      barber: updatedBarber
    })
  } catch (error) {
    console.error('更新理髮師狀態失敗:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('不存在')) {
        return NextResponse.json(
          {
            code: ErrorCodes.BUSINESS_LOGIC_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '更新理髮師狀態失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}