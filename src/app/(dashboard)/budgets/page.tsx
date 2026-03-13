"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Search, FileText, Clock, CheckCircle2, XCircle, Send, ExternalLink, Mail, MessageCircle, Copy } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { sendQuoteEmail } from "@/app/actions/notifications"
import { formatCurrency } from "@/lib/utils"

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

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/q/${id}`
    navigator.clipboard.writeText(url)
    toast.success("Link copiado para a área de transferência!")
  }

  const handleWhatsApp = (budget: BudgetRequest) => {
    const url = `${window.location.origin}/q/${budget.id}`
    const message = `Olá ${budget.customer_name}! Segue a proposta da ${budget.organizations?.name || 'Evento HIGH'} para o seu evento: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSendEmail = async (budget: BudgetRequest) => {
    if (!budget.customer_email) {
      toast.error("Cliente não possui email cadastrado.")
      return
    }

    const promise = sendQuoteEmail({
      to: budget.customer_email!,
      customerName: budget.customer_name || 'Cliente',
      quoteUrl: `${window.location.origin}/q/${budget.id}`,
      orgName: budget.organizations?.name || 'Evento HIGH'
    })

    toast.promise(promise, {
      loading: 'Enviando email...',
      success: 'Email enviado com sucesso!',
      error: (err) => err.message || 'Erro ao enviar email'
    })
  }

  const filteredBudgets = budgets.filter(b => 
    b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'sent': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'accepted': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />
      case 'sent': return <Send className="w-3.5 h-3.5" />
      case 'accepted': return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'rejected': return <XCircle className="w-3.5 h-3.5" />
      default: return <FileText className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="p-8 flex flex-col gap-8 flex-1">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Budget Requests</h1>
        <p className="text-zinc-500">Manage and track your quotes and customer inquiries.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer or ID..." 
            className="pl-10 bg-white/5 border-white/10 focus:bg-white/10 text-white w-full"
          />
        </div>
        <Link href="/budgets/new">
          <Button className="bg-white text-black hover:bg-zinc-200 gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> New Budget
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-card rounded-2xl overflow-hidden border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <th className="p-4">Customer / ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white tracking-tight">
                          {budget.customer_name || 'Anonymous Customer'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          {budget.id.split('-')[0]}...
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(budget.status)}`}>
                        {getStatusIcon(budget.status)}
                        {budget.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-zinc-400">
                        {budget.created_at ? format(new Date(budget.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-white text-lg font-bold">
                        R$ {formatCurrency(budget.total_amount)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCopyLink(budget.id)}
                          className="h-8 w-8 text-zinc-500 hover:text-white"
                          title="Copy Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleWhatsApp(budget)}
                          className="h-8 w-8 text-zinc-500 hover:text-green-500"
                          title="Share via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleSendEmail(budget)}
                          className="h-8 w-8 text-zinc-500 hover:text-blue-500"
                          title="Send via Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                        <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
                        <Link href={`/q/${budget.id}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBudgets.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <FileText className="w-10 h-10 text-zinc-800" />
                <p className="text-zinc-500 font-medium">No budget requests found.</p>
                <Link href="/budgets/new">
                  <Button variant="outline" className="mt-2 border-white/10 hover:bg-white/5">
                    Create Your First Quote
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
