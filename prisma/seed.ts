import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('開始種子資料建立...')

  // 建立測試店家
  const testStore = await prisma.store.create({
    data: {
      name: '測試理髮店',
      email: 'test@barbershop.com',
      phone: '02-1234-5678',
      address: '台北市信義區測試路123號',
    },
  })

  console.log('已建立測試店家:', testStore.name)

  // 建立營業時段 (週一到週六 9:00-18:00)
  const businessHours = []
  for (let day = 1; day <= 6; day++) {
    businessHours.push({
      storeId: testStore.id,
      dayOfWeek: day,
      openTime: '09:00',
      closeTime: '18:00',
      isClosed: false,
    })
  }

  // 週日休息
  businessHours.push({
    storeId: testStore.id,
    dayOfWeek: 0,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: true,
  })

  await prisma.businessHours.createMany({
    data: businessHours,
  })

  console.log('已建立營業時段')

  // 建立理髮師
  const barber1 = await prisma.barber.create({
    data: {
      storeId: testStore.id,
      name: '王師傅',
      email: 'wang@barbershop.com',
      specialties: ['剪髮', '染髮', '燙髮'],
      isActive: true,
    },
  })

  const barber2 = await prisma.barber.create({
    data: {
      storeId: testStore.id,
      name: '李師傅',
      email: 'lee@barbershop.com',
      specialties: ['剪髮', '造型'],
      isActive: true,
    },
  })

  console.log('已建立理髮師:', barber1.name, barber2.name)

  // 建立服務項目
  const services = await prisma.service.createMany({
    data: [
      {
        storeId: testStore.id,
        name: '基本剪髮',
        duration: 30,
        price: 300,
        description: '基本的剪髮服務',
        isActive: true,
      },
      {
        storeId: testStore.id,
        name: '洗剪吹',
        duration: 45,
        price: 450,
        description: '包含洗髮、剪髮、吹整',
        isActive: true,
      },
      {
        storeId: testStore.id,
        name: '染髮',
        duration: 120,
        price: 1500,
        description: '專業染髮服務',
        isActive: true,
      },
      {
        storeId: testStore.id,
        name: '燙髮',
        duration: 180,
        price: 2000,
        description: '專業燙髮服務',
        isActive: true,
      },
    ],
  })

  console.log('已建立服務項目')

  console.log('種子資料建立完成！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })