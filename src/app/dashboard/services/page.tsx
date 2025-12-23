'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StoreAccessGuard from '@/components/auth/StoreAccessGuard'

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  isActive: boolean
  createdAt: string
  _count: {
    bookings: number
  }
}

interface ServiceFormData {
  name: string
  description: string
  duration: number
  price: number
  isActive: boolean
}

export default function ServicesPage() {
  return (
    <ProtectedRoute>
      <StoreAccessGuard>
        <ServicesContent />
      </StoreAccessGuard>
    </ProtectedRoute>
  )
}

function ServicesContent() {
  const { user } = useRequireAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    isActive: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const storeId = user?.storeId
      if (!storeId) return

      const response = await fetch(`/api/stores/${storeId}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      } else {
        console.error('Failed to fetch services')
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = () => {
    setSelectedService(null)
    setIsEditing(false)
    setFormData({
      name: '',
      description: '',
      duration: 30,
      price: 0,
      isActive: true
    })
    setShowServiceModal(true)
  }

  const handleEditService = (service: Service) => {
    setSelectedService(service)
    setIsEditing(true)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      isActive: service.isActive
    })
    setShowServiceModal(true)
  }

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`確定要刪除服務「${service.name}」嗎？`)) {
      return
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchServices()
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('刪除時發生錯誤')
    }
  }

  const handleToggleStatus = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}/toggle-status`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchServices()
      } else {
        alert('狀態更新失敗')
      }
    } catch (error) {
      console.error('Error toggling service status:', error)
      alert('狀態更新時發生錯誤')
    }
  }

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = isEditing ? `/api/services/${selectedService?.id}` : `/api/stores/${user?.storeId}/services`
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowServiceModal(false)
        await fetchServices()
      } else {
        const error = await response.json()
        alert(error.message || '操作失敗')
      }
    } catch (error) {
      console.error('Error submitting service:', error)
      alert('操作時發生錯誤')
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}小時${mins}分鐘` : `${hours}小時`
    }
    return `${mins}分鐘`
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
                服務管理
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-gray-600 hover:text-gray-900"
              >
                返回儀表板
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 服務列表 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  服務項目列表
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  管理您店內提供的服務項目
                </p>
              </div>
              <button
                onClick={handleCreateService}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                新增服務
              </button>
            </div>
            
            {services.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg">尚未新增任何服務項目</p>
                  <p className="mt-2">點擊上方按鈕開始新增服務</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        服務名稱
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        描述
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        價格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        預約數
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {service.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              建立時間: {new Date(service.createdAt).toLocaleDateString('zh-TW')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {service.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDuration(service.duration)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            NT$ {service.price.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              service.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {service.isActive ? '啟用' : '停用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {service._count.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditService(service)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleToggleStatus(service)}
                              className={`${
                                service.isActive
                                  ? 'text-yellow-600 hover:text-yellow-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {service.isActive ? '停用' : '啟用'}
                            </button>
                            <button
                              onClick={() => handleDeleteService(service)}
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
            )}
          </div>
        </div>
      </main>

      {/* 服務新增/編輯模態框 */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? '編輯服務' : '新增服務'}
              </h3>
              
              <form onSubmit={handleSubmitService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">服務名稱 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例：洗剪吹"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">服務描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="詳細描述服務內容..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">服務時間 (分鐘) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    預計服務時間：{formatDuration(formData.duration)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">價格 (NT$) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    啟用此服務
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowServiceModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {isEditing ? '更新' : '新增'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}