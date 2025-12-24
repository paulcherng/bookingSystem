/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    // LINE Bot 設定 - 如果沒有設定則使用預設值
    LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID || '',
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET || '',
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    // SendGrid 設定 - 如果沒有設定則使用預設值
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    // NextAuth 設定
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
    // Webhook 設定
    WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL || '',
  },
}

module.exports = nextConfig