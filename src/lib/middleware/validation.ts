import { NextRequest, NextResponse } from 'next/server'
import { ErrorCodes } from '@/types'

export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'phone' | 'array'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class ValidationMiddleware {
  static validateRequest(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = []

    for (const rule of rules) {
      const value = data[rule.field]

      // 檢查必填欄位
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} 為必填欄位`)
        continue
      }

      // 如果欄位為空且非必填，跳過其他驗證
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue
      }

      // 類型驗證
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} 必須為字串`)
            }
            break
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`${rule.field} 必須為數字`)
            }
            break
          case 'email':
            if (typeof value !== 'string' || !this.isValidEmail(value)) {
              errors.push(`${rule.field} 必須為有效的電子郵件格式`)
            }
            break
          case 'phone':
            if (typeof value !== 'string' || !this.isValidPhone(value)) {
              errors.push(`${rule.field} 必須為有效的電話號碼格式`)
            }
            break
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`${rule.field} 必須為陣列`)
            }
            break
        }
      }

      // 長度驗證
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} 長度不能少於 ${rule.minLength} 個字元`)
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} 長度不能超過 ${rule.maxLength} 個字元`)
        }
      }

      // 正則表達式驗證
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} 格式不正確`)
      }

      // 自定義驗證
      if (rule.custom) {
        const customError = rule.custom(value)
        if (customError) {
          errors.push(customError)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static createValidationResponse(errors: string[]): NextResponse {
    return NextResponse.json(
      {
        code: ErrorCodes.VALIDATION_ERROR,
        message: '資料驗證失敗',
        details: errors,
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidPhone(phone: string): boolean {
    // 支援台灣手機號碼格式
    const phoneRegex = /^(\+886|0)?9\d{8}$/
    return phoneRegex.test(phone.replace(/[-\s]/g, ''))
  }
}

// 常用驗證規則
export const StoreValidationRules: ValidationRule[] = [
  { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'email', required: true, type: 'email' },
  { field: 'phone', required: true, type: 'phone' },
  { field: 'address', required: true, type: 'string', minLength: 1, maxLength: 200 },
  { field: 'description', required: false, type: 'string', maxLength: 500 }
]

export const BarberValidationRules: ValidationRule[] = [
  { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 50 },
  { field: 'email', required: false, type: 'email' },
  { field: 'phone', required: false, type: 'phone' },
  { field: 'specialties', required: false, type: 'array' },
  { field: 'isActive', required: false, type: 'string' }
]

export const ServiceValidationRules: ValidationRule[] = [
  { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'description', required: false, type: 'string', maxLength: 500 },
  { field: 'duration', required: true, type: 'number', custom: (value) => {
    if (value <= 0 || value > 480) {
      return '服務時間必須在 1-480 分鐘之間'
    }
    return null
  }},
  { field: 'price', required: true, type: 'number', custom: (value) => {
    if (value < 0) {
      return '價格不能為負數'
    }
    return null
  }},
  { field: 'isActive', required: false, type: 'string' }
]

export const BusinessHoursValidationRules: ValidationRule[] = [
  { field: 'dayOfWeek', required: true, type: 'number', custom: (value) => {
    if (value < 0 || value > 6) {
      return '星期必須在 0-6 之間'
    }
    return null
  }},
  { field: 'openTime', required: true, type: 'string', pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  { field: 'closeTime', required: true, type: 'string', pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  { field: 'isOpen', required: false, type: 'string' }
]