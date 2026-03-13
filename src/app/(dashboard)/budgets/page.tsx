"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send, 
  ExternalLink, 
  Mail, 
  MessageCircle, 
  Copy,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Download
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { sendQuoteEmail } from "@/app/actions/notifications"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface BudgetRequest {
  id: string
  customer_name: string | null
  customer_email: string | null
  status: string
  created_at: string
  total_amount: number
  organizations?: { name: string } | null
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = createClient()

  const fetchBudgets = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const { data, error } = await supabase
        .from("budget_requests")
        .select(`
          *,
          organizations (name)
        `)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setBudgets((data as BudgetRequest[]) || [])
    } catch {
      toast.error("Failed to load budgets")
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchBudgets()

    // Realtime subscription
    const channel = supabase
      .channel('budget_requests_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_requests'
        },
        () => {
          fetchBudgets(true) // Background refresh
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchBudgets])


  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/q/${id}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  const handleWhatsApp = (budget: BudgetRequest) => {
    const url = `${window.location.origin}/q/${budget.id}`
    const message = `Hello ${budget.customer_name}! Here is the proposal from ${budget.organizations?.name || 'Evento HIGH'} for your event: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSendEmail = async (budget: BudgetRequest) => {
    if (!budget.customer_email) {
      toast.error("Customer has no email registered.")
      return
    }

    const promise = sendQuoteEmail({
      to: budget.customer_email!,
      customerName: budget.customer_name || 'Customer',
      quoteUrl: `${window.location.origin}/q/${budget.id}`,
      orgName: budget.organizations?.name || 'Evento HIGH'
    })

    toast.promise(promise, {
      loading: 'Sending email...',
      success: 'Email sent successfully!',
      error: (err) => err.message || 'Error sending email'
    })
  }

  const filteredBudgets = budgets.filter(b => 
    b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'sent': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-2.5 h-2.5" />
      case 'sent': return <Send className="w-2.5 h-2.5" />
      case 'approved': return <CheckCircle2 className="w-2.5 h-2.5" />
      case 'rejected': return <XCircle className="w-2.5 h-2.5" />
      default: return <FileText className="w-2.5 h-2.5" />
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="outline" className="px-1.5 py-0 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">
              Financial
            </Badge>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">•</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{budgets.length} Quotes</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Budget Requests</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Manage and track your quotes and customer inquiries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-border/50 gap-2">
            <Download className="w-3 h-3" /> Export CSV
          </Button>
          <Link href="/budgets/new">
            <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/10">
              <Plus className="w-3 h-3" /> New Budget
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 h-10 px-1 border-b border-border/20">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-[300px]">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer or ID..." 
              className="pl-6 bg-transparent border-none text-[11px] placeholder:text-muted-foreground/40 focus:ring-0 w-full outline-none text-foreground font-medium"
            />
          </div>
          <div className="h-4 w-[1px] bg-border/30" />
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground gap-1.5">
            <Filter className="w-3 h-3" /> Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tighter text-right">Most Recent</span>
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
           <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Loading Ledger</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Customer / Quote ID</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Status</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Created At</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6 text-right">Total Amount</TableHead>
                <TableHead className="h-10 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgets.map((budget) => (
                <TableRow key={budget.id} className="group border-border/30 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground tracking-tight">
                        {budget.customer_name || 'Anonymous Customer'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-tighter">
                        REQ-{budget.id.split('-')[0]}
                      </span>
                    </div>
                  </TableCell>
                   <TableCell className="px-6 py-3">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide",
                      getStatusStyles(budget.status)
                    )}>
                       {getStatusIcon(budget.status)}
                       {budget.status === 'approved' ? 'Aprovada' : budget.status}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <span className="text-xs font-medium text-muted-foreground/80">
                      {budget.created_at ? format(new Date(budget.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      R$ {formatCurrency(budget.total_amount)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        } />
                         <DropdownMenuContent align="end" className="w-48 border-border/50 bg-card/95 backdrop-blur-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCopyLink(budget.id)} className="text-xs font-semibold gap-2 py-2">
                              <Copy className="w-3 h-3" /> Copy Quote Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWhatsApp(budget)} className="text-xs font-semibold gap-2 py-2">
                              <MessageCircle className="w-3 h-3" /> Share to WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(budget)} className="text-xs font-semibold gap-2 py-2">
                              <Mail className="w-3 h-3" /> Send via Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <Link href={`/q/${budget.id}`} target="_blank">
                              <DropdownMenuItem className="text-xs font-semibold gap-2 py-2">
                                <ExternalLink className="w-3 h-3" /> Open Public Form
                              </DropdownMenuItem>
                            </Link>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredBudgets.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground/30" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground">No budget requests</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-70">
                  Your budget request list is currently empty. Start by creating a new one.
                </p>
              </div>
              <Link href="/budgets/new">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2 border-border/50 text-xs font-bold uppercase tracking-widest h-9 px-6 rounded-md"
                >
                  Create New Budget
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
