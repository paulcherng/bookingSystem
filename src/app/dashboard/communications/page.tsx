'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StoreAccessGuard from '@/components/auth/StoreAccessGuard'

interface LineConfig {
  channelId?: string
  channelSecret?: string
  accessToken?: string
  isConnected: boolean
}

interface EmailConfig {
  email: string
  isConnected: boolean
}

interface ConnectionStatus {
  line: {
    status: 'connected' | 'disconnected' | 'error'
    lastChecked?: string
    error?: string
  }
  email: {
    status: 'connected' | 'disconnected' | 'error'
    lastChecked?: string
    error?: string
  }
}

export default function CommunicationsPage() {
  return (
    <ProtectedRoute>
      <StoreAccessGuard>
        <CommunicationsContent />
      </StoreAccessGuard>
    </ProtectedRoute>
  )
}

function CommunicationsContent() {
  const { user } = useRequireAuth()
  const [lineConfig, setLineConfig] = useState<LineConfig>({
    channelId: '',
    channelSecret: '',
    accessToken: '',
    isConnected: false
  })
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    email: '',
    isConnected: false
  })
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    line: { status: 'disconnected' },
    email: { status: 'disconnected' }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState({ line: false, email: false })

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const storeId = user?.storeId
      if (!storeId) return

      // 獲取 LINE 設定
      const lineResponse = await fetch(`/api/stores/${storeId}/line-integration`)
      if (lineResponse.ok) {
        const lineData = await lineResponse.json()
        setLineConfig({
          channelId: lineData.channelId || '',
          channelSecret: lineData.channelSecret || '',
          accessToken: lineData.accessToken || '',
          isConnected: lineData.isConnected || false
        })
      }

      // 獲取郵件設定
      const emailResponse = await fetch(`/api/stores/${storeId}`)
      if (emailResponse.ok) {
        const storeData = await emailResponse.json()
        setEmailConfig({
          email: storeData.email || '',
          isConnected: !!storeData.email
        })
      }

      // 檢查連接狀態
      await checkConnectionStatus()

    } catch (error) {
      console.error('Error fetching configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkConnectionStatus = async () => {
    try {
      const storeId = user?.storeId
      if (!storeId) return

      // 檢查 LINE 連接狀態
      try {
        const lineStatusResponse = await fetch(`/api/stores/${storeId}/line-integration/status`)
        if (lineStatusResponse.ok) {
          const lineStatus = await lineStatusResponse.json()
          setConnectionStatus(prev => ({
            ...prev,
            line: {
              status: lineStatus.connected ? 'connected' : 'disconnected',
              lastChecked: new Date().toISOString(),
              error: lineStatus.error
            }
          }))
        }
      } catch (error) {
        setConnectionStatus(prev => ({
          ...prev,
          line: {
            status: 'error',
            lastChecked: new Date().toISOString(),
            error: '無法檢查 LINE 連接狀態'
          }
        }))
      }

      // 檢查郵件連接狀態
      try {
        const emailStatusResponse = await fetch(`/api/stores/${storeId}/email-integration/status`)
        if (emailStatusResponse.ok) {
          const emailStatus = await emailStatusResponse.json()
          setConnectionStatus(prev => ({
            ...prev,
            email: {
              status: emailStatus.connected ? 'connected' : 'disconnected',
              lastChecked: new Date().toISOString(),
              error: emailStatus.error
            }
          }))
        }
      } catch (error) {
        setConnectionStatus(prev => ({
          ...prev,
          email: {
            status: 'error',
            lastChecked: new Date().toISOString(),
            error: '無法檢查郵件連接狀態'
          }
        }))
      }

    } catch (error) {
      console.error('Error checking connection status:', error)
    }
  }

  const saveLineConfig = async () => {
    try {
      setSaving(true)
      const storeId = user?.storeId
      if (!storeId) return

      const response = await fetch(`/api/stores/${storeId}/line-integration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: lineConfig.channelId,
          channelSecret: lineConfig.channelSecret,
          accessToken: lineConfig.accessToken
        })
      })

      if (response.ok) {
        alert('LINE 設定已儲存')
        await checkConnectionStatus()
      } else {
        const error = await response.json()
        alert(error.message || 'LINE 設定儲存失敗')
      }
    } catch (error) {
      console.error('Error saving LINE config:', error)
      alert('儲存時發生錯誤')
    } finally {
      setSaving(false)
    }
  }

  const saveEmailConfig = async () => {
    try {
      setSaving(true)
      const storeId = user?.storeId
      if (!storeId) return

      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailConfig.email
        })
      })

      if (response.ok) {
        alert('郵件設定已儲存')
        await checkConnectionStatus()
      } else {
        const error = await response.json()
        alert(error.message || '郵件設定儲存失敗')
      }
    } catch (error) {
      console.error('Error saving email config:', error)
      alert('儲存時發生錯誤')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (type: 'line' | 'email') => {
    try {
      setTesting(prev => ({ ...prev, [type]: true }))
      const storeId = user?.storeId
      if (!storeId) return

      const endpoint = type === 'line' 
        ? `/api/stores/${storeId}/line-integration/test`
        : `/api/stores/${storeId}/email-integration/test`

      const response = await fetch(endpoint, { method: 'POST' })
      const result = await response.json()

      if (response.ok) {
        alert(`${type === 'line' ? 'LINE' : '郵件'} 連接測試成功！`)
      } else {
        alert(`${type === 'line' ? 'LINE' : '郵件'} 連接測試失敗：${result.message}`)
      }

      await checkConnectionStatus()
    } catch (error) {
      console.error(`Error testing ${type} connection:`, error)
      alert('連接測試時發生錯誤')
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return '已連接'
      case 'disconnected':
        return '未連接'
      case 'error':
        return '連接錯誤'
      default:
        return '未知'
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
                通訊設定
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
          {/* 連接狀態概覽 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                連接狀態
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                查看各通訊管道的連接狀態
              </p>
            </div>
            
            <div className="px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium">L</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">LINE Bot</h4>
                      <p className="text-sm text-gray-500">
                        {connectionStatus.line.lastChecked 
                          ? `最後檢查: ${new Date(connectionStatus.line.lastChecked).toLocaleString('zh-TW')}`
                          : '尚未檢查'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connectionStatus.line.status)}`}>
                      {getStatusText(connectionStatus.line.status)}
                    </span>
                    {connectionStatus.line.error && (
                      <p className="text-xs text-red-600 mt-1">{connectionStatus.line.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium">@</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">電子郵件</h4>
                      <p className="text-sm text-gray-500">
                        {connectionStatus.email.lastChecked 
                          ? `最後檢查: ${new Date(connectionStatus.email.lastChecked).toLocaleString('zh-TW')}`
                          : '尚未檢查'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connectionStatus.email.status)}`}>
                      {getStatusText(connectionStatus.email.status)}
                    </span>
                    {connectionStatus.email.error && (
                      <p className="text-xs text-red-600 mt-1">{connectionStatus.email.error}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <button
                  onClick={checkConnectionStatus}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  重新檢查連接狀態
                </button>
              </div>
            </div>
          </div>

          {/* LINE Bot 設定 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                LINE Bot 設定
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                設定 LINE Bot 以接收客戶預約訊息
              </p>
            </div>
            
            <div className="px-4 py-4 sm:px-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Channel ID</label>
                  <input
                    type="text"
                    value={lineConfig.channelId}
                    onChange={(e) => setLineConfig({ ...lineConfig, channelId: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="輸入 LINE Channel ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Channel Secret</label>
                  <input
                    type="password"
                    value={lineConfig.channelSecret}
                    onChange={(e) => setLineConfig({ ...lineConfig, channelSecret: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="輸入 LINE Channel Secret"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Token</label>
                  <input
                    type="password"
                    value={lineConfig.accessToken}
                    onChange={(e) => setLineConfig({ ...lineConfig, accessToken: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="輸入 LINE Access Token"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Webhook URL</h4>
                  <p className="text-sm text-blue-800 font-mono bg-blue-100 p-2 rounded">
                    {`${window.location.origin}/api/webhooks/line?storeId=${user?.storeId}`}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    請將此 URL 設定到您的 LINE Developer Console 中的 Webhook URL
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={saveLineConfig}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {saving ? '儲存中...' : '儲存設定'}
                  </button>
                  <button
                    onClick={() => testConnection('line')}
                    disabled={testing.line || !lineConfig.accessToken}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {testing.line ? '測試中...' : '測試連接'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 電子郵件設定 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                電子郵件設定
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                設定店家電子郵件以接收客戶預約訊息
              </p>
            </div>
            
            <div className="px-4 py-4 sm:px-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">店家電子郵件</label>
                  <input
                    type="email"
                    value={emailConfig.email}
                    onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="輸入店家電子郵件地址"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    客戶可以發送預約郵件到此地址
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">注意事項</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• 請確保此郵件地址能正常接收郵件</li>
                    <li>• 系統會自動解析客戶的預約郵件內容</li>
                    <li>• 建議使用專門的預約郵件地址</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={saveEmailConfig}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {saving ? '儲存中...' : '儲存設定'}
                  </button>
                  <button
                    onClick={() => testConnection('email')}
                    disabled={testing.email || !emailConfig.email}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {testing.email ? '測試中...' : '測試連接'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 使用說明 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                使用說明
              </h3>
            </div>
            
            <div className="px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">LINE Bot 設定步驟</h4>
                  <ol className="text-sm text-gray-600 space-y-2">
                    <li>1. 前往 LINE Developers Console</li>
                    <li>2. 建立新的 Messaging API Channel</li>
                    <li>3. 取得 Channel ID、Channel Secret 和 Access Token</li>
                    <li>4. 將上述資訊填入左側表單</li>
                    <li>5. 將 Webhook URL 設定到 LINE Console</li>
                    <li>6. 啟用 Webhook 功能</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">電子郵件設定步驟</h4>
                  <ol className="text-sm text-gray-600 space-y-2">
                    <li>1. 準備一個專用的電子郵件地址</li>
                    <li>2. 將郵件地址填入左側表單</li>
                    <li>3. 確保郵件地址能正常接收郵件</li>
                    <li>4. 客戶可發送預約郵件到此地址</li>
                    <li>5. 系統會自動解析並處理預約請求</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}