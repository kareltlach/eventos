"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Zap, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Package, 
  FileText,
  Search,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/auth/actions"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface SidebarProps {
  user: {
    email?: string | null
  }
  profile: {
    full_name?: string | null
    role?: string | null
    organizations?: {
      name: string
    } | null
  } | null
}

export function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col bg-background border-r border-border fixed h-screen z-40 overflow-hidden">
      {/* Brand & Workspace */}
      <div className="p-4 flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-1 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Zap className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-foreground leading-none">Evento HIGH</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              {profile?.organizations?.name || "Workspace"}
            </span>
          </div>
        </Link>

        {/* Quick Search Trigger */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 h-9 px-3 bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground transition-all group"
        >
          <Search className="w-3.5 h-3.5 transition-colors group-hover:text-primary" />
          <span className="text-xs font-medium">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="mb-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
          General
        </div>
        <NavItem 
          href="/" 
          icon={<Calendar className="w-4 h-4" />} 
          label="Events" 
          active={pathname === "/"} 
        />
        <NavItem 
          href="/attendees" 
          icon={<Users className="w-4 h-4" />} 
          label="Attendees" 
          active={pathname === "/attendees"} 
        />
        <NavItem 
          href="/budgets" 
          icon={<FileText className="w-4 h-4" />} 
          label="Budgets" 
          active={pathname.startsWith("/budgets")} 
        />
        
        <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
          Assets
        </div>
        <NavItem 
          href="/catalog/products" 
          icon={<Package className="w-4 h-4" />} 
          label="Catalog" 
          active={pathname.startsWith("/catalog")} 
        />
        <NavItem 
          href="/analytics" 
          icon={<BarChart3 className="w-4 h-4" />} 
          label="Analytics" 
          active={pathname === "/analytics"} 
        />

        <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
          System
        </div>
        <NavItem 
          href="/settings" 
          icon={<Settings className="w-4 h-4" />} 
          label="Settings" 
          active={pathname === "/settings"} 
        />
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 bg-muted/10 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {profile?.full_name?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-foreground truncate leading-tight">
              {profile?.full_name || "User"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate uppercase tracking-[0.05em] font-medium">
              {profile?.role || "Owner"}
            </span>
          </div>
          
          <form action={signOut}>
            <Tooltip>
              <TooltipTrigger render={
                <Button 
                  variant="ghost" 
                  size="icon" 
                  type="submit"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              } />
              <TooltipContent side="right">
                <p className="text-[10px]">Sign Out</p>
              </TooltipContent>
            </Tooltip>
          </form>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 h-8 text-[11px] gap-2 border-border/50 bg-background/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
        >
          <Plus className="w-3 h-3 transition-transform group-hover:rotate-90" />
          Create New Event
        </Button>
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={cn(
        "group flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 relative",
        active 
          ? "text-foreground bg-accent/50 shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
      )}
    >
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-1 w-0.75 h-4 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className={cn(
        "flex shrink-0 items-center justify-center transition-colors",
        active ? "text-primary" : "group-hover:text-primary"
      )}>
        {icon}
      </div>
      <span className="text-xs font-medium tracking-tight">{label}</span>
      {active && (
        <span className="ml-auto w-1 h-1 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  )
}
