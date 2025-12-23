'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StoreService } from '@/services/storeService'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 驗證資料
      const validation = StoreService.validateStoreData(formData)
      if (!validation.isValid) {
        setError(validation.errors.join(', '))
        return
      }

      // 創建店家
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '註冊失敗')
      }
    } catch (error) {
      setError('註冊過程中發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-green-800">註冊成功！</h3>
            <p className="mt-2 text-sm text-green-600">
              您的帳戶已成功創建，正在跳轉到登入頁面...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            註冊店家帳戶
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            加入多店家預約系統
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                店家名稱 *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="請輸入店家名稱"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件地址 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="請輸入電子郵件地址"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                電話號碼
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="請輸入電話號碼"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                店家地址
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="請輸入店家地址"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '註冊中...' : '註冊'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              已有帳戶？{' '}
              <a href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
                立即登入
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}