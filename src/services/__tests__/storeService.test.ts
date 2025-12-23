import { StoreService } from '../storeService'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma')
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('StoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createStore', () => {
    it('should create a new store successfully', async () => {
      const storeData = {
        name: '測試理髮店',
        email: 'test@example.com',
        phone: '02-1234-5678',
        address: '台北市信義區測試路123號'
      }

      const mockStore = {
        id: 'store-1',
        ...storeData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.store.findUnique.mockResolvedValue(null)
      mockPrisma.store.create.mockResolvedValue(mockStore)

      const result = await StoreService.createStore(storeData)

      expect(result).toEqual(mockStore)
      expect(mockPrisma.store.findUnique).toHaveBeenCalledWith({
        where: { email: storeData.email }
      })
      expect(mockPrisma.store.create).toHaveBeenCalledWith({
        data: storeData
      })
    })

    it('should throw error if email already exists', async () => {
      const storeData = {
        name: '測試理髮店',
        email: 'test@example.com'
      }

      const existingStore = {
        id: 'existing-store',
        name: '現有店家',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.store.findUnique.mockResolvedValue(existingStore)

      await expect(StoreService.createStore(storeData)).rejects.toThrow('此電子郵件已被使用')
    })

    it('should validate required fields', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email'
      }

      const validation = StoreService.validateStoreData(invalidData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('店家名稱不能為空')
      expect(validation.errors).toContain('請輸入有效的電子郵件地址')
    })
  })

  describe('getStoreById', () => {
    it('should return store if found', async () => {
      const mockStore = {
        id: 'store-1',
        name: '測試理髮店',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      const result = await StoreService.getStoreById('store-1')

      expect(result).toEqual(mockStore)
      expect(mockPrisma.store.findUnique).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        include: {
          businessHours: true,
          barbers: { where: { isActive: true } },
          services: { where: { isActive: true } }
        }
      })
    })

    it('should return null if store not found', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null)

      const result = await StoreService.getStoreById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateStore', () => {
    it('should update store successfully', async () => {
      const existingStore = {
        id: 'store-1',
        name: '舊店名',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updateData = {
        name: '新店名',
        phone: '02-9876-5432'
      }

      const updatedStore = {
        ...existingStore,
        ...updateData,
        updatedAt: new Date()
      }

      mockPrisma.store.findUnique.mockResolvedValue(existingStore)
      mockPrisma.store.update.mockResolvedValue(updatedStore)

      const result = await StoreService.updateStore('store-1', updateData)

      expect(result).toEqual(updatedStore)
      expect(mockPrisma.store.update).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        data: updateData
      })
    })

    it('should throw error if store not found', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null)

      await expect(StoreService.updateStore('non-existent', { name: '新店名' }))
        .rejects.toThrow('店家不存在')
    })
  })
})