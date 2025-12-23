#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { migrate, checkDatabaseHealth } from './migrate'

interface DeployOptions {
  skipMigration?: boolean
  skipBackup?: boolean
  environment: 'production' | 'staging'
}

async function deploy(options: DeployOptions) {
  try {
    console.log(`開始部署到 ${options.environment} 環境...`)
    
    // 1. 檢查資料庫健康狀態
    console.log('檢查資料庫健康狀態...')
    const isHealthy = await checkDatabaseHealth()
    if (!isHealthy) {
      throw new Error('資料庫健康檢查失敗，停止部署')
    }
    
    // 2. 執行資料庫遷移（如果需要）
    if (!options.skipMigration) {
      console.log('執行資料庫遷移...')
      await migrate({
        environment: options.environment,
        backup: !options.skipBackup
      })
    }
    
    // 3. 建置應用程式
    console.log('建置應用程式...')
    execSync('npm run build', { stdio: 'inherit' })
    
    // 4. 執行測試
    console.log('執行測試...')
    execSync('npm test -- --passWithNoTests', { stdio: 'inherit' })
    
    console.log(`${options.environment} 環境部署完成！`)
    
  } catch (error) {
    console.error('部署失敗:', error)
    throw error
  }
}

// CLI 介面
if (require.main === module) {
  const args = process.argv.slice(2)
  const environment = (args[0] as 'production' | 'staging') || 'production'
  const skipMigration = args.includes('--skip-migration')
  const skipBackup = args.includes('--skip-backup')
  
  deploy({
    environment,
    skipMigration,
    skipBackup
  })
    .then(() => {
      console.log('部署腳本執行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('部署腳本執行失敗:', error)
      process.exit(1)
    })
}

export { deploy }