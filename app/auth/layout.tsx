import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-octagon-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blood-500 opacity-5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      <nav className="relative z-10 flex items-center px-8 py-6 border-b border-octagon-800">
        <Link href="/" className="font-display text-2xl tracking-widest">
          <span className="text-white">OCTAGON</span>
          <span className="text-blood-500">PICKS</span>
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
