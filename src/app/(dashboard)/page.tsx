import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

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
    <>
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
    </>
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
