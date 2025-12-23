import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface MigrationOptions {
  environment: 'development' | 'production'
  backup?: boolean
  force?: boolean
}

async function migrate(options: MigrationOptions = { environment: 'development' }) {
  try {
    console.log(`開始 ${options.environment} 環境資料庫遷移...`)
    
    // 檢查資料庫連接
    await prisma.$connect()
    console.log('資料庫連接成功')
    
    // 生產環境前先備份
    if (options.environment === 'production' && options.backup !== false) {
      console.log('執行資料庫備份...')
      await createBackup()
    }
    
    // 執行遷移
    console.log('執行 Prisma 遷移...')
    
    if (options.environment === 'production') {
      // 生產環境使用 migrate deploy
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    } else {
      // 開發環境使用 migrate dev
      execSync('npx prisma migrate dev', { stdio: 'inherit' })
    }
    
    // 生成 Prisma Client
    console.log('生成 Prisma Client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    console.log('資料庫遷移完成')
  } catch (error) {
    console.error('資料庫遷移失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups')
  
  // 確保備份目錄存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`)
  
  try {
    // 從環境變數獲取資料庫連接資訊
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 環境變數未設定')
    }
    
    // 解析資料庫 URL
    const url = new URL(databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password
    
    // 設定 PGPASSWORD 環境變數
    process.env.PGPASSWORD = password
    
    // 執行 pg_dump
    const dumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupFile}`
    execSync(dumpCommand, { stdio: 'inherit' })
    
    console.log(`資料庫備份完成: ${backupFile}`)
    return backupFile
  } catch (error) {
    console.error('資料庫備份失敗:', error)
    throw error
  }
}

async function restoreBackup(backupFile: string): Promise<void> {
  try {
    console.log(`開始還原資料庫備份: ${backupFile}`)
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`備份檔案不存在: ${backupFile}`)
    }
    
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 環境變數未設定')
    }
    
    // 解析資料庫 URL
    const url = new URL(databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password
    
    // 設定 PGPASSWORD 環境變數
    process.env.PGPASSWORD = password
    
    // 執行 psql 還原
    const restoreCommand = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupFile}`
    execSync(restoreCommand, { stdio: 'inherit' })
    
    console.log('資料庫還原完成')
  } catch (error) {
    console.error('資料庫還原失敗:', error)
    throw error
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('資料庫健康檢查通過')
    return true
  } catch (error) {
    console.error('資料庫健康檢查失敗:', error)
    return false
  }
}

// CLI 介面
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'migrate':
      const environment = (args[1] as 'development' | 'production') || 'development'
      const backup = args.includes('--no-backup') ? false : true
      migrate({ environment, backup })
        .then(() => {
          console.log('遷移腳本執行完成')
          process.exit(0)
        })
        .catch((error) => {
          console.error('遷移腳本執行失敗:', error)
          process.exit(1)
        })
      break
      
    case 'backup':
      createBackup()
        .then((backupFile) => {
          console.log(`備份完成: ${backupFile}`)
          process.exit(0)
        })
        .catch((error) => {
          console.error('備份失敗:', error)
          process.exit(1)
        })
      break
      
    case 'restore':
      const backupFile = args[1]
      if (!backupFile) {
        console.error('請提供備份檔案路徑')
        process.exit(1)
      }
      restoreBackup(backupFile)
        .then(() => {
          console.log('還原完成')
          process.exit(0)
        })
        .catch((error) => {
          console.error('還原失敗:', error)
          process.exit(1)
        })
      break
      
    case 'health':
      checkDatabaseHealth()
        .then((healthy) => {
          process.exit(healthy ? 0 : 1)
        })
        .catch(() => {
          process.exit(1)
        })
      break
      
    default:
      console.log('使用方式:')
      console.log('  npm run migrate:prod     - 執行生產環境遷移')
      console.log('  npm run migrate:dev      - 執行開發環境遷移')
      console.log('  tsx scripts/migrate.ts backup - 建立資料庫備份')
      console.log('  tsx scripts/migrate.ts restore <backup-file> - 還原資料庫備份')
      console.log('  tsx scripts/migrate.ts health - 檢查資料庫健康狀態')
      process.exit(1)
  }
}

export { migrate, createBackup, restoreBackup, checkDatabaseHealth }