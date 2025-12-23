import { Decimal } from '@prisma/client/runtime/library'

// 基本型別定義
export interface Store {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  lineChannelId?: string | null;
  lineChannelSecret?: string | null;
  lineAccessToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessHours {
  id: string;
  storeId: string;
  dayOfWeek: number; // 0-6 (0=Sunday)
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isClosed: boolean;
}

export interface Barber {
  id: string;
  storeId: string;
  name: string;
  email?: string | null;
  specialties: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Service {
  id: string;
  storeId: string;
  name: string;
  duration: number; // 分鐘
  price?: Decimal | null;
  description?: string | null;
  isActive: boolean;
}

export interface Booking {
  id: string;
  storeId: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  customerContact: string;
  contactType: 'line' | 'email';
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
}

export interface MessageLog {
  id: string;
  storeId: string;
  customerContact: string;
  contactType: 'line' | 'email';
  messageType: 'incoming' | 'outgoing';
  content: string;
  processedAt: Date;
}

// API 請求/回應型別
export interface CreateStoreRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface CreateBookingRequest {
  storeId: string;
  barberId?: string;
  serviceId: string;
  dateTime: string; // ISO 8601
  customerInfo: {
    name: string;
    contact: string;
    contactType: 'line' | 'email';
  };
}

export interface AvailabilityRequest {
  date: string;
  serviceId: string;
  barberId?: string;
}

// Webhook 型別
export interface LineWebhookPayload {
  events: LineEvent[];
}

export interface LineEvent {
  type: string;
  message?: {
    type: string;
    text: string;
  };
  source: {
    type: string;
    userId: string;
  };
  replyToken: string;
}

export interface EmailWebhookPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// 錯誤處理型別
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  INVALID_TIME_SLOT = 'INVALID_TIME_SLOT',
  BARBER_NOT_FOUND = 'BARBER_NOT_FOUND',
  OUTSIDE_BUSINESS_HOURS = 'OUTSIDE_BUSINESS_HOURS',
  LINE_API_ERROR = 'LINE_API_ERROR',
  EMAIL_SEND_ERROR = 'EMAIL_SEND_ERROR',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  CONFLICT_ERROR = 'CONFLICT_ERROR'
}

// 日誌相關型別
export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
  details?: any;
  stack?: string;
  requestId?: string;
  userId?: string;
  storeId?: string;
}

export interface PerformanceMetric {
  timestamp: string;
  operation: string;
  duration: number;
  success: boolean;
  details?: any;
}