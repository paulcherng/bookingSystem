import { NextRequest, NextResponse } from 'next/server'
import { ServiceService } from '@/services/serviceService'
import { ErrorCodes } from '@/types'

// GET /api/services/[id]/stats - 獲取服務項目統計
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stats = await ServiceService.getServiceStats(params.id)
    
    return NextResponse.json({
      serviceId: params.id,
      stats
    })
  } catch (error) {
    console.error('獲取服務項目統計失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取服務項目統計失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}