import { NextRequest, NextResponse } from 'next/server'
import { BarberService } from '@/services/barberService'
import { ErrorCodes } from '@/types'

// GET /api/stores/[id]/barbers - 獲取店家的所有理髮師
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const barbers = await BarberService.getBarbersByStore(params.id, includeInactive)
    
    return NextResponse.json(barbers)
  } catch (error) {
    console.error('獲取理髮師列表失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取理髮師列表失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST /api/stores/[id]/barbers - 創建新理髮師
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // 驗證資料
    const validation = BarberService.validateBarberData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '理髮師資料驗證失敗',
          details: validation.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const barber = await BarberService.createBarber(params.id, body)
    
    return NextResponse.json(barber, { status: 201 })
  } catch (error) {
    console.error('創建理髮師失敗:', error)
    
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
        message: '創建理髮師失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}