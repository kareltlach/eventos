import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { Orbit, Calendar, Users, BarChart3, Settings, LogOut } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name)")
    .single()

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col glass-card m-4 rounded-2xl p-6 gap-8 border-r-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Orbit className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Antigravity</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Events" active />
          <NavItem icon={<Users className="w-5 h-5" />} label="Attendees" />
          <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" />
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

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h2 className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">Dashboard</h2>
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
              </h1>
              <Button className="bg-white text-black hover:bg-zinc-200">New Event</Button>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Events" value="12" change="+2 this month" />
            <StatCard label="Active Leads" value="48" change="+12% vs last week" />
            <StatCard label="Confirmed Guests" value="1.2k" change="+340 today" />
            <StatCard label="Revenue" value="$42.5k" change="+8% growth" />
          </div>

          {/* Featured Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card rounded-2xl p-8 min-h-[400px]">
              <h3 className="text-xl font-bold mb-6">Upcoming Events</h3>
              <div className="flex items-center justify-center h-full text-zinc-600">
                <p>No upcoming events scheduled for this week.</p>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
              <div className="flex flex-col gap-6">
                <ActivityItem title="Budget Accepted" time="2 hours ago" desc="Client 'Apple Inc' accepted the 2024 Keynote budget." />
                <ActivityItem title="New Lead" time="5 hours ago" desc="TechConf 2025 requested a quote for 500 guests." />
                <ActivityItem title="Check-in Complete" time="Yesterday" desc="Staff marked 'Gala Night' as completed." />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
      active ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
    }`}>
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

function StatCard({ label, value, change }: { label: string, value: string, change: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <h4 className="text-3xl font-bold mb-1">{value}</h4>
      <p className="text-[10px] text-zinc-400">{change}</p>
    </div>
  )
}

function ActivityItem({ title, time, desc }: { title: string, time: string, desc: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <h5 className="font-semibold text-sm">{title}</h5>
        <span className="text-[10px] text-zinc-600">{time}</span>
      </div>
      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{desc}</p>
    </div>
  )
}
