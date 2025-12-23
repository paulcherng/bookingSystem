export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">
          多店家預約系統
        </h1>
        <div className="flex space-x-4">
          <a
            href="/auth/signin"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            登入
          </a>
          <a
            href="/auth/register"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            註冊
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            整合 LINE 和電子郵件的智慧預約管理平台
          </h2>
          <p className="text-lg text-gray-600">
            為理髮店等服務業提供自動化預約管理功能
          </p>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            多店家管理
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            支援多家店舖同時使用，每家店舖獨立管理
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            智慧預約
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            自動檢查時段衝突，智慧分配理髮師
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            通訊整合
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            整合 LINE Bot 和電子郵件，自動回覆客戶
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            雲端部署
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            部署在 Vercel 平台，穩定可靠
          </p>
        </div>
      </div>
    </main>
  )
}