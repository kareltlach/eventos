import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Users,
  CheckCircle2,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-3 px-2 py-0 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">
            Platform Overview
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Here's what's happening with your events today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-semibold border-border/50">
            View Analytics
          </Button>
          <Button size="sm" className="h-9 px-4 text-xs font-bold gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-3.5 h-3.5" />
            New Event
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Events" 
          value="12" 
          change="+2" 
          trend="up"
          description="from last month"
          icon={<Calendar className="w-4 h-4 text-primary" />}
        />
        <StatCard 
          label="Active Leads" 
          value="48" 
          change="+12%" 
          trend="up"
          description="from last week"
          icon={<Users className="w-4 h-4 text-primary" />}
        />
        <StatCard 
          label="Confirmed Guests" 
          value="1,280" 
          change="+340" 
          trend="up"
          description="registered today"
          icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
        />
        <StatCard 
          label="Revenue" 
          value="$42,500" 
          change="-2%" 
          trend="down"
          description="vs target projection"
          icon={<ArrowUpRight className="w-4 h-4 text-primary" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <Card className="lg:col-span-2 border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Upcoming Events</CardTitle>
              <CardDescription className="text-xs">Your next high-end experiences scheduled.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <Separator className="mb-6 opacity-40" />
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 transition-colors group-hover:bg-muted/30">
                <Calendar className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">No events this week</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                You're all caught up. Start planning your next project now.
              </p>
              <Button variant="link" size="sm" className="mt-4 text-primary text-xs font-bold gap-1 group/btn">
                Create Event <ArrowUpRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Activity Sidebar */}
        <Card className="border-border/50 bg-card/30 backdrop-blur-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Streaming updates from your team.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <Separator className="mx-6 mb-4 opacity-40" />
            <div className="space-y-0 relative before:absolute before:left-[2.5rem] before:top-4 before:bottom-4 before:w-[1px] before:bg-border/30">
              <ActivityItem 
                title="Budget Accepted" 
                time="2h ago" 
                desc="Apple Inc&apos; accepted the 2024 Keynote budget."
                type="success"
              />
              <ActivityItem 
                title="New Lead Created" 
                time="5h ago" 
                desc="TechConf 2025 requested a quote for 500 guests."
                type="info"
              />
              <ActivityItem 
                title="Check-in Complete" 
                time="Yesterday" 
                desc="Staff marked 'Gala Night' as completed."
                type="default"
              />
            </div>
            <div className="px-6 mt-6">
              <Button variant="outline" className="w-full h-9 text-[11px] font-bold border-border/50 bg-background/50 text-muted-foreground hover:text-foreground transition-all">
                See Full Audit Log
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, change, trend, description, icon }: { 
  label: string, 
  value: string, 
  change: string, 
  trend: 'up' | 'down',
  description: string,
  icon: React.ReactNode 
}) {
  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors">
          {label}
        </CardTitle>
        <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 group-hover:scale-110 transition-all">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={cn(
            "text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-full",
            trend === 'up' ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
            {change}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight opacity-70">
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ title, time, desc, type }: { title: string, time: string, desc: string, type: 'success' | 'info' | 'default' }) {
  const Icon = type === 'success' ? CheckCircle2 : type === 'info' ? Plus : Clock
  
  return (
    <div className="relative pl-12 pr-6 py-4 group hover:bg-white/[0.02] transition-colors cursor-default">
      <div className={cn(
        "absolute left-[2.05rem] top-4 w-4 h-4 rounded-full border-[1.5px] bg-background flex items-center justify-center z-10 transition-transform group-hover:scale-110",
        type === 'success' ? "border-emerald-500/50" : type === 'info' ? "border-primary/50" : "border-muted-foreground/30"
      )}>
        <Icon className={cn(
          "w-2 h-2",
          type === 'success' ? "text-emerald-500" : type === 'info' ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-[11px] font-bold text-foreground leading-tight">{title}</h5>
          <span className="text-[9px] font-medium text-muted-foreground tracking-tight opacity-60 uppercase">{time}</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 pr-2 opacity-80 font-medium">
          {desc}
        </p>
      </div>
    </div>
  )
}
