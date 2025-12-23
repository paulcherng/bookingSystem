import { NextRequest, NextResponse } from 'next/server'
import { ServiceService } from '@/services/serviceService'
import { ErrorCodes } from '@/types'

// GET /api/stores/[id]/services - 獲取店家的所有服務項目
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const minDuration = searchParams.get('minDuration')
    const maxDuration = searchParams.get('maxDuration')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    let services
    
    // 根據查詢參數決定使用哪個方法
    if (minDuration || maxDuration) {
      services = await ServiceService.getServicesByDuration(
        params.id,
        minDuration ? parseInt(minDuration) : undefined,
        maxDuration ? parseInt(maxDuration) : undefined
      )
    } else if (minPrice || maxPrice) {
      services = await ServiceService.getServicesByPriceRange(
        params.id,
        minPrice ? parseFloat(minPrice) : undefined,
        maxPrice ? parseFloat(maxPrice) : undefined
      )
    } else {
      services = await ServiceService.getServicesByStore(params.id, includeInactive)
    }
    
    return NextResponse.json(services)
  } catch (error) {
    console.error('獲取服務項目列表失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取服務項目列表失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST /api/stores/[id]/services - 創建新服務項目
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // 驗證資料
    const validation = ServiceService.validateServiceData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '服務項目資料驗證失敗',
          details: validation.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const service = await ServiceService.createService(params.id, body)
    
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('創建服務項目失敗:', error)
    
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
      
      if (error.message.includes('已存在')) {
        return NextResponse.json(
          {
            code: ErrorCodes.BUSINESS_LOGIC_ERROR,
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
        message: '創建服務項目失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}