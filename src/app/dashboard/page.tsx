'use client'

import { useRequireAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface DashboardStats {
  todayBookings: number
  weekBookings: number
  monthBookings: number
  totalRevenue: number
}

interface TodayBooking {
  id: string
  customerName: string
  serviceName: string
  barberName: string
  startTime: string
  endTime: string
  status: string
  contactType: string
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useRequireAuth()
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    totalRevenue: 0
  })
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    // 設定每30秒自動更新
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 這裡會調用實際的 API，目前使用模擬資料
      // const response = await fetch('/api/dashboard/stats')
      // const data = await response.json()
      
      // 模擬資料
      const mockStats: DashboardStats = {
        todayBookings: 8,
        weekBookings: 45,
        monthBookings: 180,
        totalRevenue: 25000
      }
      
      const mockBookings: TodayBooking[] = [
        {
          id: '1',
          customerName: '王小明',
          serviceName: '剪髮',
          barberName: '張師傅',
          startTime: '09:00',
          endTime: '09:30',
          status: 'completed',
          contactType: 'line'
        },
        {
          id: '2',
          customerName: '李小華',
          serviceName: '洗剪吹',
          barberName: '陳師傅',
          startTime: '10:00',
          endTime: '11:00',
          status: 'confirmed',
          contactType: 'email'
        },
        {
          id: '3',
          customerName: '林小美',
          serviceName: '染髮',
          barberName: '王師傅',
          startTime: '14:00',
          endTime: '16:00',
          status: 'confirmed',
          contactType: 'line'
        }
      ]
      
      setStats(mockStats)
      setTodayBookings(mockBookings)
      setError(null)
    } catch (err) {
      setError('載入資料失敗')
      console.error('Dashboard data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { text: '已確認', color: 'bg-green-100 text-green-800' },
      completed: { text: '已完成', color: 'bg-blue-100 text-blue-800' },
      cancelled: { text: '已取消', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { text: status, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getContactTypeBadge = (contactType: string) => {
    const typeConfig = {
      line: { text: 'LINE', color: 'bg-green-100 text-green-800' },
      email: { text: 'Email', color: 'bg-blue-100 text-blue-800' }
    }
    
    const config = typeConfig[contactType as keyof typeof typeConfig] || 
                  { text: contactType, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  if (loading && todayBookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                店家儀表板
              </h1>
              {loading && (
                <div className="ml-4 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">更新中...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                歡迎，{user?.name}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    載入錯誤
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={fetchDashboardData}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                    >
                      重新載入
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">今</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        今日預約
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.todayBookings}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">週</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        本週預約
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.weekBookings}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">月</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        本月預約
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.monthBookings}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">$</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        本月營收
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        NT${stats.totalRevenue.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 今日預約列表 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                今日預約
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {format(new Date(), 'yyyy年MM月dd日', { locale: zhTW })} 的預約列表
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {todayBookings.length === 0 ? (
                <li className="px-4 py-6 text-center text-gray-500">
                  今日暫無預約
                </li>
              ) : (
                todayBookings.map((booking) => (
                  <li key={booking.id} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {booking.customerName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {booking.customerName}
                            </p>
                            <div className="ml-2">
                              {getContactTypeBadge(booking.contactType)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {booking.serviceName} • {booking.barberName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.startTime} - {booking.endTime}
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          查看詳情
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* 快速操作 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                理髮師管理
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                新增和管理您的理髮師團隊
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                前往管理 →
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                服務項目
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                設定您提供的服務和價格
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                前往設定 →
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                通訊設定
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                設定 LINE Bot 和電子郵件整合
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                前往設定 →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}