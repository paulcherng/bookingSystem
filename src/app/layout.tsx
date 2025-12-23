import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import { GlobalErrorBoundary } from '@/lib/errors/globalErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '多店家預約系統',
  description: '整合 LINE 和電子郵件的智慧預約管理平台',
}

// 初始化全域錯誤處理
if (typeof window === 'undefined') {
  GlobalErrorBoundary.initialize()
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}