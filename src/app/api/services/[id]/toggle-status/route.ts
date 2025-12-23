import { NextRequest, NextResponse } from 'next/server'
import { ServiceService } from '@/services/serviceService'
import { ErrorCodes } from '@/types'

// POST /api/services/[id]/toggle-status - 切換服務項目狀態
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedService = await ServiceService.toggleServiceStatus(params.id)
    
    return NextResponse.json({
      message: `服務項目已${updatedService.isActive ? '啟用' : '停用'}`,
      service: updatedService
    })
  } catch (error) {
    console.error('更新服務項目狀態失敗:', error)
    
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
        message: '更新服務項目狀態失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}