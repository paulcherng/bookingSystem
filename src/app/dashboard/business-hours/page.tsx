'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StoreAccessGuard from '@/components/auth/StoreAccessGuard'

interface BusinessHour {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  isOpen: boolean
}

interface SpecialDate {
  id: string
  date: string
  openTime?: string
  closeTime?: string
  isOpen: boolean
  reason?: string
}

const DAYS_OF_WEEK = [
  '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'
]

export default function BusinessHoursPage() {
  return (
    <ProtectedRoute>
      <StoreAccessGuard>
        <BusinessHoursContent />
      </StoreAccessGuard>
    </ProtectedRoute>
  )
}

function BusinessHoursContent() {
  const { user } = useRequireAuth()
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [loading, setLoading] = useState(true)
  const [showSpecialDateModal, setShowSpecialDateModal] = useState(false)
  const [selectedSpecialDate, setSelectedSpecialDate] = useState<SpecialDate | null>(null)
  const [specialDateForm, setSpecialDateForm] = useState({
    date: '',
    openTime: '',
    closeTime: '',
    isOpen: true,
    reason: ''
  })

  useEffect(() => {
    fetchBusinessHours()
    fetchSpecialDates()
  }, [])

  const fetchBusinessHours = async () => {
    try {
      const storeId = user?.storeId
      if (!storeId) return

      const response = await fetch(`/api/stores/${storeId}/business-hours`)
      if (response.ok) {
        const data = await response.json()
        setBusinessHours(data)
      } else {
        console.error('Failed to fetch business hours')
      }
    } catch (error) {
      console.error('Error fetching business hours:', error)
    }
  }

  const fetchSpecialDates = async () => {
    try {
      setLoading(true)
      // 這裡應該有一個 API 來獲取特殊日期
      // 目前使用模擬資料
      const mockSpecialDates: SpecialDate[] = [
        {
          id: '1',
          date: '2024-12-25',
          isOpen: false,
          reason: '聖誕節休息'
        },
        {
          id: '2',
          date: '2024-01-01',
          isOpen: false,
          reason: '元旦休息'
        }
      ]
      setSpecialDates(mockSpecialDates)
    } catch (error) {
      console.error('Error fetching special dates:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBusinessHour = async (dayOfWeek: number, field: string, value: any) => {
    try {
      const storeId = user?.storeId
      if (!storeId) return

      const response = await fetch(`/api/stores/${storeId}/business-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dayOfWeek,
          [field]: value
        })
      })

      if (response.ok) {
        await fetchBusinessHours()
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Error updating business hour:', error)
      alert('更新時發生錯誤')
    }
  }

  const handleSpecialDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = selectedSpecialDate 
        ? `/api/special-dates/${selectedSpecialDate.id}`
        : `/api/stores/${user?.storeId}/special-dates`
      const method = selectedSpecialDate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(specialDateForm)
      })

      if (response.ok) {
        setShowSpecialDateModal(false)
        setSelectedSpecialDate(null)
        setSpecialDateForm({
          date: '',
          openTime: '',
          closeTime: '',
          isOpen: true,
          reason: ''
        })
        await fetchSpecialDates()
      } else {
        const error = await response.json()
        alert(error.message || '操作失敗')
      }
    } catch (error) {
      console.error('Error submitting special date:', error)
      alert('操作時發生錯誤')
    }
  }

  const handleDeleteSpecialDate = async (specialDate: SpecialDate) => {
    if (!confirm(`確定要刪除「${specialDate.reason || specialDate.date}」的特殊設定嗎？`)) {
      return
    }

    try {
      const response = await fetch(`/api/special-dates/${specialDate.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSpecialDates()
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('Error deleting special date:', error)
      alert('刪除時發生錯誤')
    }
  }

  const openSpecialDateModal = (specialDate?: SpecialDate) => {
    if (specialDate) {
      setSelectedSpecialDate(specialDate)
      setSpecialDateForm({
        date: specialDate.date,
        openTime: specialDate.openTime || '',
        closeTime: specialDate.closeTime || '',
        isOpen: specialDate.isOpen,
        reason: specialDate.reason || ''
      })
    } else {
      setSelectedSpecialDate(null)
      setSpecialDateForm({
        date: '',
        openTime: '',
        closeTime: '',
        isOpen: true,
        reason: ''
      })
    }
    setShowSpecialDateModal(true)
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
                營業時段設定
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
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* 一般營業時間 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                一般營業時間
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                設定每週的固定營業時間
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {DAYS_OF_WEEK.map((dayName, dayOfWeek) => {
                const businessHour = businessHours.find(bh => bh.dayOfWeek === dayOfWeek)
                
                return (
                  <div key={dayOfWeek} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16">
                          <span className="text-sm font-medium text-gray-900">
                            {dayName}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={businessHour?.isOpen || false}
                            onChange={(e) => updateBusinessHour(dayOfWeek, 'isOpen', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-900">
                            營業
                          </label>
                        </div>
                      </div>
                      
                      {businessHour?.isOpen && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={businessHour.openTime}
                            onChange={(e) => updateBusinessHour(dayOfWeek, 'openTime', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          <span className="text-gray-500">至</span>
                          <input
                            type="time"
                            value={businessHour.closeTime}
                            onChange={(e) => updateBusinessHour(dayOfWeek, 'closeTime', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 特殊日期設定 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  特殊日期設定
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  設定節假日或特殊營業時間
                </p>
              </div>
              <button
                onClick={() => openSpecialDateModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                新增特殊日期
              </button>
            </div>
            
            {specialDates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg">尚未設定任何特殊日期</p>
                  <p className="mt-2">點擊上方按鈕開始新增特殊日期設定</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {specialDates.map((specialDate) => (
                  <div key={specialDate.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(specialDate.date).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              specialDate.isOpen
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {specialDate.isOpen ? '營業' : '休息'}
                          </span>
                          
                          {specialDate.isOpen && specialDate.openTime && specialDate.closeTime && (
                            <span className="text-sm text-gray-600">
                              {specialDate.openTime} - {specialDate.closeTime}
                            </span>
                          )}
                          
                          {specialDate.reason && (
                            <span className="text-sm text-gray-500">
                              ({specialDate.reason})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openSpecialDateModal(specialDate)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteSpecialDate(specialDate)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 營業時間預覽 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                營業時間預覽
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                客戶看到的營業時間資訊
              </p>
            </div>
            
            <div className="px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">一般營業時間</h4>
                  <div className="space-y-1">
                    {DAYS_OF_WEEK.map((dayName, dayOfWeek) => {
                      const businessHour = businessHours.find(bh => bh.dayOfWeek === dayOfWeek)
                      
                      return (
                        <div key={dayOfWeek} className="flex justify-between text-sm">
                          <span className="text-gray-600">{dayName}</span>
                          <span className="text-gray-900">
                            {businessHour?.isOpen 
                              ? `${businessHour.openTime} - ${businessHour.closeTime}`
                              : '休息'
                            }
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">近期特殊日期</h4>
                  <div className="space-y-1">
                    {specialDates.slice(0, 5).map((specialDate) => (
                      <div key={specialDate.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {new Date(specialDate.date).toLocaleDateString('zh-TW')}
                        </span>
                        <span className="text-gray-900">
                          {specialDate.isOpen 
                            ? (specialDate.openTime && specialDate.closeTime 
                                ? `${specialDate.openTime} - ${specialDate.closeTime}`
                                : '營業'
                              )
                            : '休息'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 特殊日期新增/編輯模態框 */}
      {showSpecialDateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedSpecialDate ? '編輯特殊日期' : '新增特殊日期'}
              </h3>
              
              <form onSubmit={handleSpecialDateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">日期 *</label>
                  <input
                    type="date"
                    required
                    value={specialDateForm.date}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, date: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="specialIsOpen"
                    checked={specialDateForm.isOpen}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, isOpen: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="specialIsOpen" className="ml-2 block text-sm text-gray-900">
                    當日營業
                  </label>
                </div>
                
                {specialDateForm.isOpen && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">開始時間</label>
                      <input
                        type="time"
                        value={specialDateForm.openTime}
                        onChange={(e) => setSpecialDateForm({ ...specialDateForm, openTime: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">結束時間</label>
                      <input
                        type="time"
                        value={specialDateForm.closeTime}
                        onChange={(e) => setSpecialDateForm({ ...specialDateForm, closeTime: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">備註</label>
                  <input
                    type="text"
                    value={specialDateForm.reason}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, reason: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例：國定假日、店休日"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSpecialDateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {selectedSpecialDate ? '更新' : '新增'}
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