'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(redirectTo?: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // 還在載入中

    if (!session && redirectTo) {
      router.push(redirectTo)
    }
  }, [session, status, router, redirectTo])

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    user: session?.user
  }
}

export function useRequireAuth(redirectTo: string = '/auth/signin') {
  const auth = useAuth(redirectTo)
  
  return auth
}

/**
 * 檢查用戶是否有權限訪問特定店家
 */
export function useStoreAccess(storeId: string) {
  const { session, isAuthenticated } = useAuth()
  
  const hasAccess = isAuthenticated && session?.user?.id === storeId
  
  return {
    hasAccess,
    isOwner: hasAccess,
    user: session?.user
  }
}