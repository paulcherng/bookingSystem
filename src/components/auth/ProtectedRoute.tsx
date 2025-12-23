'use client'

import { useRequireAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/signin',
  fallback,
  requireAdmin = false
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user } = useRequireAuth(redirectTo)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && requireAdmin) {
      // 檢查是否為管理員 - 這裡可以根據實際的權限系統調整
      // 目前假設 email 包含 'admin' 的用戶為管理員
      const isAdmin = user?.email?.includes('admin') || user?.role === 'admin'
      if (!isAdmin) {
        router.push('/dashboard')
        return
      }
    }
  }, [isLoading, isAuthenticated, requireAdmin, user, router])

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">請先登入</h2>
            <p className="mt-2 text-gray-600">正在跳轉到登入頁面...</p>
          </div>
        </div>
      )
    )
  }

  if (requireAdmin) {
    const isAdmin = user?.email?.includes('admin') || user?.role === 'admin'
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">權限不足</h1>
            <p className="text-gray-600 mb-6">您沒有權限訪問此頁面</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              返回儀表板
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}