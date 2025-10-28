import { MarketingHeader } from '@/components/marketing/marketing-header'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className='relative min-h-screen overflow-hidden bg-[#05070f] text-white'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(88,86,255,0.25),_rgba(5,7,15,0))]' />
        <div className='absolute bottom-0 left-1/3 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_rgba(5,7,15,0))]' />
        <div className='absolute top-1/3 right-0 h-[420px] w-[420px] translate-x-1/3 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_rgba(5,7,15,0))]' />
      </div>
      <div className='relative z-10'>
        <MarketingHeader />
        {children}
      </div>
    </main>
  )
}
