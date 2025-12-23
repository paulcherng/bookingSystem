'use client'

import { useStoreAccess } from '@/hooks/useAuth'

interface StoreAccessGuardProps {
  storeId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function StoreAccessGuard({ 
  storeId, 
  children, 
  fallback 
}: StoreAccessGuardProps) {
  const { hasAccess } = useStoreAccess(storeId)

  if (!hasAccess) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">無權限訪問</h2>
            <p className="mt-2 text-gray-600">
              您沒有權限訪問此店家的資源
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}