'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface Store {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  createdAt: string
  _count: {
    bookings: number
    barbers: number
    services: number
  }
}

interface SystemStats {
  totalStores: number
  totalBookings: number
  totalBarbers: number
  totalServices: number
  todayBookings: number
  monthlyRevenue: number
}

export default function AdminPanel() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminContent />
    </ProtectedRoute>
  )
}

function AdminContent() {
  const { user } = useRequireAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [stats, setStats] = useState<SystemStats>({
    totalStores: 0,
    totalBookings: 0,
    totalBarbers: 0,
    totalServices: 0,
    todayBookings: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [showStoreModal, setShowStoreModal] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // 模擬資料 - 實際應該調用 API
      const mockStats: SystemStats = {
        totalStores: 15,
        totalBookings: 1250,
        totalBarbers: 45,
        totalServices: 120,
        todayBookings: 28,
        monthlyRevenue: 450000
      }

      const mockStores: Store[] = [
        {
          id: '1',
          name: '時尚髮廊',
          email: 'contact@fashion-salon.com',
          phone: '02-1234-5678',
          address: '台北市信義區信義路五段7號',
          createdAt: '2024-01-15',
          _count: { bookings: 150, barbers: 3, services: 8 }
        },
        {
          id: '2',
          name: '經典理髮店',
          email: 'info@classic-barber.com',
          phone: '02-2345-6789',
          address: '台北市大安區敦化南路二段76號',
          createdAt: '2024-02-01',
          _count: { bookings: 89, barbers: 2, services: 5 }
        }
      ]

      setStats(mockStats)
      setStores(mockStores)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStoreAction = (action: 'view' | 'edit' | 'delete', store: Store) => {
    setSelectedStore(store)
    if (action === 'view' || action === 'edit') {
      setShowStoreModal(true)
    } else if (action === 'delete') {
      if (confirm(`確定要刪除店家「${store.name}」嗎？`)) {
        // 實作刪除邏輯
        console.log('Delete store:', store.id)
      }
    }
  }

  if (loading) {
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
      {/* 導航欄 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                系統後台管理
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                管理員：{user?.name}
              </span>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                返回儀表板
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 系統統計 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">店</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        總店家數
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalStores}
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
                      <span className="text-white text-sm font-medium">預</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        總預約數
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalBookings}
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
                      <span className="text-white text-sm font-medium">師</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        總理髮師
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalBarbers}
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
                      <span className="text-white text-sm font-medium">服</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        總服務項目
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalServices}
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
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
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
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">$</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        月營收
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        NT${stats.monthlyRevenue.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 店家管理 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  店家管理
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  管理系統中的所有店家
                </p>
              </div>
              <button
                onClick={() => setShowStoreModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                新增店家
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      店家資訊
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      聯絡方式
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      統計
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      註冊日期
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {store.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {store.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{store.email}</div>
                        <div className="text-sm text-gray-500">{store.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          預約: {store._count.bookings}
                        </div>
                        <div className="text-sm text-gray-500">
                          理髮師: {store._count.barbers} | 服務: {store._count.services}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(store.createdAt).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleStoreAction('view', store)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            查看
                          </button>
                          <button
                            onClick={() => handleStoreAction('edit', store)}
                            className="text-green-600 hover:text-green-900"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleStoreAction('delete', store)}
                            className="text-red-600 hover:text-red-900"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* 店家詳情/編輯模態框 */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedStore ? '店家詳情' : '新增店家'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">店家名稱</label>
                  <input
                    type="text"
                    defaultValue={selectedStore?.name || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                  <input
                    type="email"
                    defaultValue={selectedStore?.email || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">電話</label>
                  <input
                    type="tel"
                    defaultValue={selectedStore?.phone || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">地址</label>
                  <textarea
                    defaultValue={selectedStore?.address || ''}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowStoreModal(false)
                    setSelectedStore(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 實作儲存邏輯
                    setShowStoreModal(false)
                    setSelectedStore(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {selectedStore ? '更新' : '新增'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}