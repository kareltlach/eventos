"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Orbit, Calendar, Users, BarChart3, Settings, LogOut, Package, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  user: {
    email?: string | null
  }
  profile: {
    full_name?: string | null
    role?: string | null
  } | null
}

export function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col glass-card m-4 rounded-2xl p-6 gap-8 border-r-0 fixed h-[calc(100vh-2rem)]">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
          <Orbit className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">Evento HIGH</span>
      </Link>

      <nav className="flex flex-col gap-2">
        <NavItem 
          href="/" 
          icon={<Calendar className="w-5 h-5" />} 
          label="Events" 
          active={pathname === "/"} 
        />
        <NavItem 
          href="/catalog/products" 
          icon={<Package className="w-5 h-5" />} 
          label="Catalog" 
          active={pathname.startsWith("/catalog")} 
        />
        <NavItem 
          href="/budgets" 
          icon={<FileText className="w-5 h-5" />} 
          label="Budgets" 
          active={pathname.startsWith("/budgets")} 
        />
        <NavItem 
          href="/attendees" 
          icon={<Users className="w-5 h-5" />} 
          label="Attendees" 
          active={pathname === "/attendees"} 
        />
        <NavItem 
          href="/analytics" 
          icon={<BarChart3 className="w-5 h-5" />} 
          label="Analytics" 
          active={pathname === "/analytics"} 
        />
        <NavItem 
          href="/settings" 
          icon={<Settings className="w-5 h-5" />} 
          label="Settings" 
          active={pathname === "/settings"} 
        />
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-800 border border-white/20" />
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[140px] text-white">
              {profile?.full_name || user.email}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
              {profile?.role || "Staff"}
            </span>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5 h-10 px-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
        active 
          ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  )
}
