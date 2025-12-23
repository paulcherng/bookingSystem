#!/usr/bin/env tsx

/**
 * 健康檢查端點測試腳本
 */

interface HealthEndpoint {
  name: string
  path: string
  expectedStatus: number
  description: string
}

const endpoints: HealthEndpoint[] = [
  {
    name: 'Liveness',
    path: '/api/monitoring/live',
    expectedStatus: 200,
    description: '基本存活檢查'
  },
  {
    name: 'Readiness',
    path: '/api/monitoring/ready',
    expectedStatus: 200,
    description: '服務就緒檢查'
  },
  {
    name: 'Startup',
    path: '/api/monitoring/startup',
    expectedStatus: 200,
    description: '啟動完成檢查'
  },
  {
    name: 'Health',
    path: '/api/monitoring/health',
    expectedStatus: 200,
    description: '完整健康檢查'
  },
  {
    name: 'Health (Detailed)',
    path: '/api/monitoring/health?detailed=true',
    expectedStatus: 200,
    description: '詳細健康檢查'
  },
  {
    name: 'Status',
    path: '/api/monitoring/status',
    expectedStatus: 200,
    description: '系統狀態檢查'
  },
  {
    name: 'Status (With Metrics)',
    path: '/api/monitoring/status?metrics=true',
    expectedStatus: 200,
    description: '包含效能指標的狀態檢查'
  }
]

async function testEndpoint(baseUrl: string, endpoint: HealthEndpoint): Promise<{
  success: boolean
  status: number
  responseTime: number
  error?: string
  data?: any
}> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    const responseTime = Date.now() - startTime
    const data = response.headers.get('content-type')?.includes('application/json') 
      ? await response.json() 
      : await response.text()
    
    return {
      success: response.status === endpoint.expectedStatus,
      status: response.status,
      responseTime,
      data
    }
  } catch (error) {
    return {
      success: false,
      status: 0,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function testAllEndpoints(baseUrl: string = 'http://localhost:3000') {
  console.log(`🏥 測試健康檢查端點 - ${baseUrl}`)
  console.log('=' .repeat(60))
  
  const results = []
  
  for (const endpoint of endpoints) {
    console.log(`\n📋 測試: ${endpoint.name}`)
    console.log(`   路徑: ${endpoint.path}`)
    console.log(`   描述: ${endpoint.description}`)
    
    const result = await testEndpoint(baseUrl, endpoint)
    results.push({ endpoint, result })
    
    if (result.success) {
      console.log(`   ✅ 成功 (${result.status}) - ${result.responseTime}ms`)
    } else {
      console.log(`   ❌ 失敗 (${result.status}) - ${result.responseTime}ms`)
      if (result.error) {
        console.log(`   錯誤: ${result.error}`)
      }
    }
    
    // 顯示回應資料摘要
    if (result.data && typeof result.data === 'object') {
      if (result.data.status) {
        console.log(`   狀態: ${result.data.status}`)
      }
      if (result.data.checks) {
        const checkCount = Object.keys(result.data.checks).length
        const passedChecks = Object.values(result.data.checks).filter((check: any) => check.status).length
        console.log(`   檢查: ${passedChecks}/${checkCount} 通過`)
      }
    }
  }
  
  // 摘要
  console.log('\n' + '=' .repeat(60))
  console.log('📊 測試摘要')
  
  const successCount = results.filter(r => r.result.success).length
  const totalCount = results.length
  const averageResponseTime = results.reduce((sum, r) => sum + r.result.responseTime, 0) / totalCount
  
  console.log(`✅ 成功: ${successCount}/${totalCount}`)
  console.log(`⏱️  平均回應時間: ${Math.round(averageResponseTime)}ms`)
  
  if (successCount === totalCount) {
    console.log('🎉 所有健康檢查端點都正常運作！')
  } else {
    console.log('⚠️  部分健康檢查端點有問題，請檢查上述錯誤訊息')
  }
  
  return {
    success: successCount === totalCount,
    results,
    summary: {
      successCount,
      totalCount,
      averageResponseTime
    }
  }
}

// CLI 介面
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  
  testAllEndpoints(baseUrl)
    .then((result) => {
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error('測試執行失敗:', error)
      process.exit(1)
    })
}

export { testAllEndpoints }