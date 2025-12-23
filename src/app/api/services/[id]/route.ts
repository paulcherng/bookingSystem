import { NextRequest, NextResponse } from 'next/server'
import { ServiceService } from '@/services/serviceService'
import { ErrorCodes } from '@/types'

// GET /api/services/[id] - 獲取特定服務項目
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await ServiceService.getServiceById(params.id)
    
    if (!service) {
      return NextResponse.json(
        {
          code: ErrorCodes.BUSINESS_LOGIC_ERROR,
          message: '服務項目不存在',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(service)
  } catch (error) {
    console.error('獲取服務項目失敗:', error)
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '獲取服務項目失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT /api/services/[id] - 更新服務項目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const updatedService = await ServiceService.updateService(params.id, body)
    
    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('更新服務項目失敗:', error)
    
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
        message: '更新服務項目失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[id] - 刪除服務項目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ServiceService.deleteService(params.id)
    
    return NextResponse.json({ message: '服務項目已刪除或停用' })
  } catch (error) {
    console.error('刪除服務項目失敗:', error)
    
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
        message: '刪除服務項目失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}