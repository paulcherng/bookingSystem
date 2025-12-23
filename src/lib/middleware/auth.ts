import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ErrorCodes } from '@/types'

/**
 * 驗證用戶是否已登入
 */
export async function requireAuth(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  if (!token) {
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '未授權訪問',
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    )
  }

  return token
}

/**
 * 驗證用戶是否有權限訪問特定店家的資源
 */
export async function requireStoreAccess(request: NextRequest, storeId: string) {
  const token = await requireAuth(request)
  
  if (token instanceof NextResponse) {
    return token // 返回錯誤回應
  }

  // 檢查用戶是否有權限訪問此店家
  // 目前簡化處理：用戶只能訪問自己的店家資源
  if (token.id !== storeId) {
    return NextResponse.json(
      {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '無權限訪問此資源',
        timestamp: new Date().toISOString()
      },
      { status: 403 }
    )
  }

  return token
}

/**
 * API 路由的認證包裝器
 */
export function withAuth(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 將用戶資訊添加到請求中
    ;(request as any).user = {
      id: authResult.id,
      email: authResult.email,
      name: authResult.name
    }

    return handler(request, context)
  }
}

/**
 * 需要店家權限的 API 路由包裝器
 */
export function withStoreAuth(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const storeId = context.params?.id
    
    if (!storeId) {
      return NextResponse.json(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: '缺少店家 ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const authResult = await requireStoreAccess(request, storeId)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 將用戶資訊添加到請求中
    ;(request as any).user = {
      id: authResult.id,
      email: authResult.email,
      name: authResult.name
    }

    return handler(request, context)
  }
}