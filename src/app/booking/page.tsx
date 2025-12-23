'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Store {
  id: string
  name: string
  address: string
  phone: string
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description: string
}

interface Barber {
  id: string
  name: string
  specialties: string[]
}

interface TimeSlot {
  startTime: string
  endTime: string
  barberId: string
  barberName: string
  isAvailable: boolean
}

interface BookingForm {
  storeId: string
  serviceId: string
  barberId: string
  date: string
  timeSlot: string
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
}

export default function BookingPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    storeId: '',
    serviceId: '',
    barberId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    timeSlot: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  })

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    if (bookingForm.storeId) {
      fetchStoreData(bookingForm.storeId)
    }
  }, [bookingForm.storeId])

  useEffect(() => {
    if (bookingForm.storeId && bookingForm.serviceId && bookingForm.date) {
      fetchAvailableTimeSlots()
    }
  }, [bookingForm.storeId, bookingForm.serviceId, bookingForm.date, bookingForm.barberId])

  const fetchStores = async () => {
    try {
      // 模擬資料 - 實際應該調用 API
      const mockStores: Store[] = [
        {
          id: '1',
          name: '時尚髮廊',
          address: '台北市信義區信義路五段7號',
          phone: '02-1234-5678'
        },
        {
          id: '2',
          name: '經典理髮店',
          address: '台北市大安區敦化南路二段76號',
          phone: '02-2345-6789'
        }
      ]
      setStores(mockStores)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    }
  }

  const fetchStoreData = async (storeId: string) => {
    try {
      setLoading(true)
      
      // 模擬資料
      const mockServices: Service[] = [
        {
          id: '1',
          name: '剪髮',
          duration: 30,
          price: 300,
          description: '基本剪髮服務'
        },
        {
          id: '2',
          name: '洗剪吹',
          duration: 60,
          price: 500,
          description: '洗髮 + 剪髮 + 吹整'
        },
        {
          id: '3',
          name: '染髮',
          duration: 120,
          price: 1500,
          description: '專業染髮服務'
        }
      ]

      const mockBarbers: Barber[] = [
        {
          id: '1',
          name: '張師傅',
          specialties: ['剪髮', '造型']
        },
        {
          id: '2',
          name: '陳師傅',
          specialties: ['染髮', '燙髮']
        },
        {
          id: '3',
          name: '王師傅',
          specialties: ['剪髮', '洗剪吹']
        }
      ]

      setServices(mockServices)
      setBarbers(mockBarbers)
    } catch (error) {
      console.error('Failed to fetch store data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTimeSlots = async () => {
    try {
      setLoading(true)
      
      // 模擬可用時段
      const mockTimeSlots: TimeSlot[] = [
        { startTime: '09:00', endTime: '09:30', barberId: '1', barberName: '張師傅', isAvailable: true },
        { startTime: '09:30', endTime: '10:00', barberId: '1', barberName: '張師傅', isAvailable: false },
        { startTime: '10:00', endTime: '10:30', barberId: '1', barberName: '張師傅', isAvailable: true },
        { startTime: '10:30', endTime: '11:00', barberId: '2', barberName: '陳師傅', isAvailable: true },
        { startTime: '11:00', endTime: '11:30', barberId: '2', barberName: '陳師傅', isAvailable: true },
        { startTime: '14:00', endTime: '14:30', barberId: '3', barberName: '王師傅', isAvailable: true },
        { startTime: '14:30', endTime: '15:00', barberId: '3', barberName: '王師傅', isAvailable: true },
        { startTime: '15:00', endTime: '15:30', barberId: '1', barberName: '張師傅', isAvailable: true }
      ]

      // 如果指定了理髮師，只顯示該理髮師的時段
      const filteredSlots = bookingForm.barberId 
        ? mockTimeSlots.filter(slot => slot.barberId === bookingForm.barberId)
        : mockTimeSlots

      setTimeSlots(filteredSlots)
    } catch (error) {
      console.error('Failed to fetch time slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: keyof BookingForm, value: string) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitBooking = async () => {
    try {
      setLoading(true)
      
      // 驗證表單
      if (!bookingForm.customerName || !bookingForm.customerPhone) {
        alert('請填寫必要資訊')
        return
      }

      // 模擬提交預約
      console.log('Submitting booking:', bookingForm)
      
      // 實際應該調用 API
      // const response = await fetch('/api/bookings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(bookingForm)
      // })

      alert('預約成功！我們會盡快與您聯繫確認。')
      
      // 重置表單
      setStep(1)
      setBookingForm({
        storeId: '',
        serviceId: '',
        barberId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        timeSlot: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        notes: ''
      })
      
    } catch (error) {
      console.error('Failed to submit booking:', error)
      alert('預約失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const getNextDays = (count: number) => {
    const days = []
    for (let i = 0; i < count; i++) {
      const date = addDays(new Date(), i)
      days.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MM月dd日 (E)', { locale: zhTW })
      })
    }
    return days
  }

  const selectedStore = stores.find(s => s.id === bookingForm.storeId)
  const selectedService = services.find(s => s.id === bookingForm.serviceId)
  const selectedBarber = barbers.find(b => b.id === bookingForm.barberId)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">線上預約</h1>
          <p className="mt-2 text-gray-600">選擇您喜歡的店家和服務，輕鬆完成預約</p>
        </div>

        {/* 進度指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="text-sm text-gray-600">
              {step === 1 && '選擇店家'}
              {step === 2 && '選擇服務'}
              {step === 3 && '選擇時間'}
              {step === 4 && '填寫資料'}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* 步驟 1: 選擇店家 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">選擇店家</h2>
              <div className="space-y-4">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      bookingForm.storeId === store.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleFormChange('storeId', store.id)}
                  >
                    <h3 className="font-medium text-gray-900">{store.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                    <p className="text-sm text-gray-600">{store.phone}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={nextStep}
                  disabled={!bookingForm.storeId}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步驟 2: 選擇服務 */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">選擇服務</h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      bookingForm.serviceId === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleFormChange('serviceId', service.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <p className="text-sm text-gray-500 mt-1">約 {service.duration} 分鐘</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">NT${service.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
                >
                  上一步
                </button>
                <button
                  onClick={nextStep}
                  disabled={!bookingForm.serviceId}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步驟 3: 選擇時間 */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">選擇時間</h2>
              
              {/* 日期選擇 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇日期</label>
                <div className="grid grid-cols-3 gap-2">
                  {getNextDays(7).map((day) => (
                    <button
                      key={day.value}
                      onClick={() => handleFormChange('date', day.value)}
                      className={`p-2 text-sm rounded-md border ${
                        bookingForm.date === day.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 理髮師選擇 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指定理髮師 (可選)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleFormChange('barberId', '')}
                    className={`p-2 text-sm rounded-md border ${
                      bookingForm.barberId === ''
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    不指定
                  </button>
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      onClick={() => handleFormChange('barberId', barber.id)}
                      className={`p-2 text-sm rounded-md border ${
                        bookingForm.barberId === barber.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {barber.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 時段選擇 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇時段</label>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleFormChange('timeSlot', `${slot.startTime}-${slot.endTime}-${slot.barberId}`)}
                        disabled={!slot.isAvailable}
                        className={`p-2 text-sm rounded-md border ${
                          !slot.isAvailable
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : bookingForm.timeSlot === `${slot.startTime}-${slot.endTime}-${slot.barberId}`
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div>{slot.startTime}</div>
                        <div className="text-xs text-gray-500">{slot.barberName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
                >
                  上一步
                </button>
                <button
                  onClick={nextStep}
                  disabled={!bookingForm.timeSlot}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步驟 4: 填寫資料 */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">填寫聯絡資料</h2>
              
              {/* 預約摘要 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">預約摘要</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>店家: {selectedStore?.name}</p>
                  <p>服務: {selectedService?.name} (NT${selectedService?.price})</p>
                  <p>日期: {format(new Date(bookingForm.date), 'yyyy年MM月dd日', { locale: zhTW })}</p>
                  <p>時間: {bookingForm.timeSlot.split('-')[0]} - {bookingForm.timeSlot.split('-')[1]}</p>
                  {selectedBarber && <p>理髮師: {selectedBarber.name}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.customerName}
                    onChange={(e) => handleFormChange('customerName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="請輸入您的姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.customerPhone}
                    onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="請輸入您的電話號碼"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="請輸入您的電子郵件 (可選)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備註
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="有任何特殊需求或備註嗎？"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={loading || !bookingForm.customerName || !bookingForm.customerPhone}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium"
                >
                  {loading ? '提交中...' : '確認預約'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}