"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import { createCheckoutSession } from "@/app/actions/payments"
import { approveProposalWithoutPayment } from "@/app/actions/approvals"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  CreditCard,
  Check,
  Zap,
  MapPin,
  Download,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  FileText,
  User,
  ArrowRight,
  Loader2,
  ChevronDown
} from "lucide-react"


interface Budget {
  id: string
  org_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  total_amount: number | null
  created_at: string | null
  event_details?: { date?: string; location?: string } | null
  status: string | null
}


interface BudgetItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number | null
  products?: {
    name: string
    unit_types: { symbol: string } | null
  } | null
}

interface Organization {
  id: string
  name: string
}

export default function PublicQuotePage() {
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  
  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isApprovingOnly, setIsApprovingOnly] = useState(false)
  const [wasApprovedOnly, setWasApprovedOnly] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  const fetchQuoteData = useCallback(async () => {
    try {
      const { data: budgetData, error: budgetError } = await supabase
        .from("budget_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      
      if (budgetError) throw budgetError
      
      if (!budgetData) {
        setErrorStatus("Proposal not found or expired.")
        return
      }

      setBudget(budgetData as Budget)

      const { data: itemsData, error: itemsError } = await supabase
        .from("budget_items")
        .select(`
          *,
          products (
            name,
            unit_types (symbol)
          )
        `)
        .eq("budget_id", id)
      
      if (itemsError) throw itemsError
      setItems((itemsData || []) as unknown[] as BudgetItem[])

      if (budgetData.org_id) {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", budgetData.org_id)
          .maybeSingle()
        
        if (orgError) throw orgError
        setOrg(orgData as Organization)
      }
    } catch (err: unknown) {
      console.error("Error fetching budget:", err)
      setErrorStatus("Failed to retrieve proposal data.")
      toast.error("Connectivity issue. Please refresh.")
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    if (!id) {
      setErrorStatus("Reference missing.")
      setLoading(false)
      return
    }

    fetchQuoteData()

    // Subscribe to realtime changes for this budget
    const channel = supabase
      .channel(`public_budget_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'budget_requests',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log("Realtime Update Received:", payload.new)
          setBudget(payload.new as Budget)
          
          if (payload.new.status === 'approved') {
            toast.success("Proposta aprovada com sucesso!")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchQuoteData, supabase])



  async function handleAccept() {
    if (!budget) return
    
    setIsAccepting(true)
    try {
      const result = await createCheckoutSession({
        budgetId: budget.id,
        amount: budget.total_amount || 0,
        customerName: budget.customer_name || 'Client',
        customerEmail: budget.customer_email || undefined,
      })

      if (result?.data?.url) {
        window.location.href = result.data.url
      } else if (result?.serverError) {
        toast.error(result.serverError)
      } else {
        toast.error("Failed to initialize payment gateway.")
      }
    } catch (err) {
      console.error("Payment Error:", err)
      toast.error("Payment synchronization error.")
    } finally {
      setIsAccepting(false)
    }
  }

  async function handleApproveOnly() {
    if (!budget) return
    
    setIsApprovingOnly(true)
    try {
      const result = await approveProposalWithoutPayment({
        budgetId: budget.id,
      })

      if (result?.data?.success) {
        setWasApprovedOnly(true)
        toast.success("Proposta aprovada com sucesso! Entraremos em contato.")
      } else if (result?.serverError) {
        toast.error(result.serverError)
      } else {
        toast.error("Falha ao processar aprovação.")
      }
    } catch (err) {
      console.error("Approval Error:", err)
      toast.error("Erro ao sincronizar aprovação.")
    } finally {
      setIsApprovingOnly(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 border border-border/50 rounded-3xl bg-card/30 backdrop-blur-xl">
             <div className="flex items-center gap-4">
               <Skeleton className="w-14 h-14 rounded-2xl" />
               <div className="space-y-2">
                 <Skeleton className="h-5 w-32" />
                 <Skeleton className="h-3 w-48" />
               </div>
             </div>
             <div className="flex gap-2">
               <Skeleton className="h-10 w-24 rounded-xl" />
               <Skeleton className="h-10 w-32 rounded-xl" />
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 space-y-6">
                <div className="p-8 border border-border/50 rounded-[2.5rem] space-y-8 bg-card/20">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                </div>
             </div>
             <div className="space-y-6">
               <Skeleton className="h-64 w-full rounded-[2rem]" />
               <Skeleton className="h-40 w-full rounded-[2rem]" />
             </div>
          </div>
        </div>
      </div>
    )
  }

  if (errorStatus || !budget) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 text-center p-8">
        <div className="p-5 rounded-full bg-rose-500/10 border border-rose-500/20 animate-pulse">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-rose-500 border-rose-500/20 uppercase tracking-widest text-[10px]">Transmission Error</Badge>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{errorStatus}</h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
            The link might be invalid, expired, or the proposal has been rescinded. Please contact your account manager.
          </p>
        </div>
        <Button variant="outline" className="border-border/50 hover:bg-card px-8 rounded-full h-11 text-xs font-bold uppercase tracking-widest" onClick={() => window.location.reload()}>
          Retransmit Request
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex justify-center selection:bg-primary/20 relative overflow-hidden">
      <AnimatePresence>
        {wasApprovedOnly && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="max-w-md w-full bg-card/50 border border-emerald-500/20 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl animate-pulse" />
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
                </div>
              </div>

              <div className="space-y-3">
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 uppercase tracking-[0.2em] text-[10px]">Aprovação Confirmada</Badge>
                <h2 className="text-3xl font-black tracking-tight">Proposta Aceita!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sua aprovação foi registrada com sucesso. Nossa equipe comercial entrará em contato em breve para os próximos passos.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => setWasApprovedOnly(false)}
                  variant="outline" 
                  className="rounded-xl px-8 h-12 text-xs font-bold uppercase tracking-widest border-border/50 hover:bg-card"
                >
                  Continuar Lendo Proposta
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl w-full flex flex-col gap-8">

        
        {/* Floating Actions Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-2xl shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-7 h-7 text-primary-foreground fill-primary-foreground/20" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-lg font-bold tracking-tight text-foreground">{org?.name || 'Verified Partner'}</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Official Proposal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
            <Button variant="outline" className="flex-1 md:flex-none border-border/50 hover:bg-card gap-2 h-11 px-5 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
            
            {(wasApprovedOnly || budget.status === 'approved') ? (
              <Button disabled className="flex-1 md:flex-none bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 gap-2 h-11 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                <Check className="w-3.5 h-3.5" /> Aprovada
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger render={(props) => (
                  <Button 
                    {...props}
                    disabled={isAccepting || isApprovingOnly}
                    className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/10 transition-all active:scale-95 disabled:opacity-50 group/btn"
                  >
                    {isAccepting || isApprovingOnly ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {isAccepting || isApprovingOnly ? "Processando..." : (
                      <>
                        Aprovar Proposta <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                      </>
                    )}
                  </Button>
                )} />
                <DropdownMenuContent align="end" className="w-[280px] p-2 bg-card/80 backdrop-blur-2xl border-border/50 rounded-2xl shadow-2xl">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">Select Approval Method</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/20" />

                    <DropdownMenuItem 
                      onClick={handleAccept}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-xl hover:bg-primary/10 focus:bg-primary/10 transition-colors group"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs">Pagar e Aprovar</span>
                        <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-8">Secure your dates immediately via online payment.</p>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={handleApproveOnly}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-xl hover:bg-primary/10 focus:bg-primary/10 transition-colors group mt-1"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-emerald-500">Aprovar e Entrar em Contato</span>
                        <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-8">Confirm interest and request a connection from us.</p>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 flex flex-col gap-8"
          >
            <Card className="border-border/50 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8 space-y-10">
                <div className="flex justify-between items-start border-b border-border/20 pb-8">
                  <div className="space-y-1.5">
                    <Badge variant="outline" className="px-1.5 py-0 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">Commercial Pro-Forma</Badge>
                    <h2 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
                      Service Quotation
                    </h2>
                    <p className="text-muted-foreground/60 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                      ID: {budget.id.split('-')[0]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] block mb-1">Issue Date</span>
                    <span className="text-foreground font-mono font-bold text-lg">
                      {budget.created_at ? format(new Date(budget.created_at), 'dd.MM.yy') : '--/--/--'}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between ml-1">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Allocated Resources</h3>
                    <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0">{items.length} Line Items</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((item, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.id} 
                        className="flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/20 transition-all group"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">{item.description}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                            {item.quantity} {item.products?.unit_types?.symbol || 'unit'} × R$ {formatCurrency(item.unit_price)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-foreground tracking-tighter">
                          R$ {formatCurrency(item.total_price)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-8 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col sm:flex-row justify-between items-center gap-6 relative shadow-inner">
                  <div className="absolute top-4 right-4 text-primary opacity-10">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                  <div className="text-center sm:text-left space-y-1 relative z-10">
                    <span className="text-primary font-bold uppercase text-[10px] tracking-[0.4em]">Total Investment</span>
                    <p className="text-muted-foreground/60 text-[10px] font-medium tracking-widest uppercase">Valid for 7 business days</p>
                  </div>
                  <div className="relative z-10">
                    <span className="text-4xl font-black text-foreground tracking-tighter font-mono italic">
                      R$ {formatCurrency(budget.total_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar Info Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <Card className="border-border/50 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden">
               <CardContent className="p-8 space-y-8">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-1">Event Protocol</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 group">
                      <div className="p-2.5 rounded-xl bg-primary/5 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5 opacity-50">Activation Date</span>
                        <span className="text-xs font-bold text-foreground tracking-tight">
                          {budget.event_details?.date ? format(new Date(budget.event_details.date), 'MMMM dd, yyyy') : 'TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="p-2.5 rounded-xl bg-primary/5 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5 opacity-50">Deployment Site</span>
                        <span className="text-xs font-bold text-foreground tracking-tight line-clamp-2">
                          {budget.event_details?.location || 'Digital Delivery / TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className={cn(
                        "p-2.5 rounded-xl border transition-all duration-300",
                        budget.status === 'approved' 
                          ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white"
                          : "bg-amber-500/5 text-amber-500 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white"
                      )}>
                        {budget.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5 opacity-50">Quote Status</span>
                        <span className={cn(
                          "text-xs font-bold tracking-tight",
                          budget.status === 'approved' ? "text-emerald-500" : "text-amber-500"
                        )}>
                          {budget.status === 'approved' ? 'Aprovada • Confirmada' : 'Ativa • Expira em breve'}
                        </span>
                      </div>
                    </div>

                  </div>
               </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/10 backdrop-blur-xl rounded-[2rem] shadow-lg overflow-hidden">
               <CardContent className="p-8 space-y-6">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-1">Recipient</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center border border-border/50">
                         <User className="w-4 h-4 text-muted-foreground" />
                       </div>
                       <span className="font-bold text-foreground text-sm tracking-tight">{budget.customer_name}</span>
                    </div>
                    <Separator className="bg-border/20" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground/60">
                        <FileText className="w-3 h-3" />
                        <span className="text-[10px] font-medium tracking-tight truncate">{budget.customer_email || 'Secured Channel'}</span>
                      </div>
                    </div>
                  </div>
               </CardContent>
            </Card>

            <div className="px-1 text-center space-y-1">
              <p className="text-[9px] text-muted-foreground/40 leading-relaxed font-bold uppercase tracking-[0.2em]">
                Secure Transmission via Evento HIGH
              </p>
              <div className="flex justify-center items-center gap-1.5 opacity-20">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[8px] font-mono">ENCRYPTED.END_TO_END</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="h-10" /> 
      </div>
    </div>
  )
}
