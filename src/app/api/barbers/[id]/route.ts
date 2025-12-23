import { NextRequest, NextResponse } from 'next/server'
import { BarberService } from '@/services/barberService'
import { ErrorCodes } from '@/types'

// GET /api/barbers/[id] - 獲取特定理髮師
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const barber = await BarberService.getBarberById(params.id)
    
    if (!barber) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: '理髮師不存在',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(barber)
  } catch (error) {
    console.error('獲取理髮師資訊失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取理髮師資訊失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT /api/barbers/[id] - 更新理髮師資訊
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const updatedBarber = await BarberService.updateBarber(params.id, body)
    
    return NextResponse.json(updatedBarber)
  } catch (error) {
    console.error('更新理髮師資訊失敗:', error)
    
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
      
      if (error.message.includes('已被使用')) {
        return NextResponse.json(
          {
            code: ErrorCodes.DUPLICATE_EMAIL,
            message: error.message,
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '更新理髮師資訊失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE /api/barbers/[id] - 刪除理髮師
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await BarberService.deleteBarber(params.id)
    
    return NextResponse.json({ message: '理髮師已刪除或停用' })
  } catch (error) {
    console.error('刪除理髮師失敗:', error)
    
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
        message: '刪除理髮師失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}