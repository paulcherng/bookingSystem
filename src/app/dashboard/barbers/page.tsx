'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StoreAccessGuard from '@/components/auth/StoreAccessGuard'

interface Barber {
  id: string
  name: string
  email?: string
  phone?: string
  specialties: string[]
  isActive: boolean
  createdAt: string
  _count: {
    bookings: number
  }
}

interface BarberFormData {
  name: string
  email: string
  phone: string
  specialties: string[]
  isActive: boolean
}

export default function BarbersPage() {
  return (
    <ProtectedRoute>
      <StoreAccessGuard>
        <BarbersContent />
      </StoreAccessGuard>
    </ProtectedRoute>
  )
}

function BarbersContent() {
  const { user } = useRequireAuth()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [showBarberModal, setShowBarberModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<BarberFormData>({
    name: '',
    email: '',
    phone: '',
    specialties: [],
    isActive: true
  })
  const [newSpecialty, setNewSpecialty] = useState('')

  useEffect(() => {
    fetchBarbers()
  }, [])

  const fetchBarbers = async () => {
    try {
      setLoading(true)
      const storeId = user?.storeId
      if (!storeId) return

      const response = await fetch(`/api/stores/${storeId}/barbers`)
      if (response.ok) {
        const data = await response.json()
        setBarbers(data)
      } else {
        console.error('Failed to fetch barbers')
      }
    } catch (error) {
      console.error('Error fetching barbers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBarber = () => {
    setSelectedBarber(null)
    setIsEditing(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialties: [],
      isActive: true
    })
    setShowBarberModal(true)
  }

  const handleEditBarber = (barber: Barber) => {
    setSelectedBarber(barber)
    setIsEditing(true)
    setFormData({
      name: barber.name,
      email: barber.email || '',
      phone: barber.phone || '',
      specialties: barber.specialties,
      isActive: barber.isActive
    })
    setShowBarberModal(true)
  }

  const handleDeleteBarber = async (barber: Barber) => {
    if (!confirm(`確定要刪除理髮師「${barber.name}」嗎？`)) {
      return
    }

    try {
      const response = await fetch(`/api/barbers/${barber.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchBarbers()
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('Error deleting barber:', error)
      alert('刪除時發生錯誤')
    }
  }

  const handleToggleStatus = async (barber: Barber) => {
    try {
      const response = await fetch(`/api/barbers/${barber.id}/toggle-status`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchBarbers()
      } else {
        alert('狀態更新失敗')
      }
    } catch (error) {
      console.error('Error toggling barber status:', error)
      alert('狀態更新時發生錯誤')
    }
  }

  const handleSubmitBarber = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = isEditing ? `/api/barbers/${selectedBarber?.id}` : `/api/stores/${user?.storeId}/barbers`
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowBarberModal(false)
        await fetchBarbers()
      } else {
        const error = await response.json()
        alert(error.message || '操作失敗')
      }
    } catch (error) {
      console.error('Error submitting barber:', error)
      alert('操作時發生錯誤')
    }
  }

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()]
      })
      setNewSpecialty('')
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    })
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
                理髮師管理
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
          {/* 理髮師列表 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  理髮師列表
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  管理您店內的理髮師資訊
                </p>
              </div>
              <button
                onClick={handleCreateBarber}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                新增理髮師
              </button>
            </div>
            
            {barbers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg">尚未新增任何理髮師</p>
                  <p className="mt-2">點擊上方按鈕開始新增理髮師</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        理髮師資訊
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        聯絡方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        專長
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
                    {barbers.map((barber) => (
                      <tr key={barber.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {barber.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              加入時間: {new Date(barber.createdAt).toLocaleDateString('zh-TW')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{barber.email || '-'}</div>
                          <div className="text-sm text-gray-500">{barber.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {barber.specialties.length > 0 ? (
                              barber.specialties.map((specialty, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {specialty}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">無</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              barber.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {barber.isActive ? '啟用' : '停用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {barber._count.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditBarber(barber)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleToggleStatus(barber)}
                              className={`${
                                barber.isActive
                                  ? 'text-yellow-600 hover:text-yellow-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {barber.isActive ? '停用' : '啟用'}
                            </button>
                            <button
                              onClick={() => handleDeleteBarber(barber)}
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

      {/* 理髮師新增/編輯模態框 */}
      {showBarberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? '編輯理髮師' : '新增理髮師'}
              </h3>
              
              <form onSubmit={handleSubmitBarber} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">姓名 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">電話</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">專長</label>
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      placeholder="輸入專長項目"
                      className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addSpecialty}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                    >
                      新增
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
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
                    啟用狀態
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowBarberModal(false)}
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