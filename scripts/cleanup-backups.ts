#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'

interface CleanupOptions {
  keepDays: number
  dryRun?: boolean
}

async function cleanupBackups(options: CleanupOptions = { keepDays: 30 }) {
  const backupDir = path.join(process.cwd(), 'backups')
  
  if (!fs.existsSync(backupDir)) {
    console.log('備份目錄不存在，無需清理')
    return
  }
  
  try {
    const files = fs.readdirSync(backupDir)
    const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    
    if (backupFiles.length === 0) {
      console.log('沒有找到備份檔案')
      return
    }
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - options.keepDays)
    
    let deletedCount = 0
    let totalSize = 0
    
    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.mtime < cutoffDate) {
        if (options.dryRun) {
          console.log(`[DRY RUN] 將刪除: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
        } else {
          fs.unlinkSync(filePath)
          console.log(`已刪除: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
        }
        deletedCount++
        totalSize += stats.size
      }
    }
    
    if (deletedCount > 0) {
      const action = options.dryRun ? '將刪除' : '已刪除'
      console.log(`${action} ${deletedCount} 個備份檔案，釋放 ${(totalSize / 1024 / 1024).toFixed(2)} MB 空間`)
    } else {
      console.log(`沒有超過 ${options.keepDays} 天的備份檔案需要清理`)
    }
    
  } catch (error) {
    console.error('清理備份檔案時發生錯誤:', error)
    throw error
  }
}

// CLI 介面
if (require.main === module) {
  const args = process.argv.slice(2)
  const keepDays = parseInt(args[0]) || 30
  const dryRun = args.includes('--dry-run')
  
  cleanupBackups({ keepDays, dryRun })
    .then(() => {
      console.log('備份清理完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('備份清理失敗:', error)
      process.exit(1)
    })
}

export { cleanupBackups }