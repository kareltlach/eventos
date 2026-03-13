"use client"

import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FileText, Calendar, MapPin, Check, Download, Printer, Clock, XCircle, AlertCircle } from "lucide-react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { createCheckoutSession } from "@/app/actions/payments"

export default function PublicQuotePage() {
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  
  const [budget, setBudget] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchQuoteData()
    } else if (params && !params.id) {
      setErrorStatus("ID do orçamento inválido.")
      setLoading(false)
    }
  }, [id, params])

  async function handleAccept() {
    if (!budget) return
    
    setIsAccepting(true)
    try {
      const result = await createCheckoutSession({
        budgetId: budget.id,
        amount: budget.total_amount,
        customerName: budget.customer_name,
        customerEmail: budget.customer_email || undefined,
      })

      if (result?.data?.url) {
        window.location.href = result.data.url
      } else if (result?.serverError) {
        toast.error(result.serverError)
      } else {
        toast.error("Ocorreu um erro ao processar o pagamento.")
      }
    } catch (err) {
      console.error("Payment Error:", err)
      toast.error("Erro na comunicação com o servidor de pagamentos.")
    } finally {
      setIsAccepting(false)
    }
  }

  async function fetchQuoteData() {
    try {
      // 1. Fetch Budget
      const { data: budgetData, error: budgetError } = await supabase
        .from("budget_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      
      if (budgetError) throw budgetError
      
      if (!budgetData) {
        setErrorStatus("Orçamento não encontrado.")
        return
      }

      setBudget(budgetData)

      // 2. Fetch Items with joined products and unit types
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
      setItems(itemsData || [])

      // 3. Fetch Org Info
      if (budgetData.org_id) {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", budgetData.org_id)
          .maybeSingle()
        
        if (orgError) throw orgError
        setOrg(orgData)
      } else {
        console.warn("Budget request missing org_id")
      }

    } catch (err: any) {
      console.error("Error fetching budget:", err)
      setErrorStatus("Ocorreu um erro ao carregar o orçamento.")
      toast.error("Não foi possível carregar os dados.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (errorStatus || !budget) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 text-center p-8">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Oops! {errorStatus}</h1>
          <p className="text-zinc-500 max-w-md mx-auto">
            Verifique o link ou entre em contato com o fornecedor para solicitar uma nova versão.
          </p>
        </div>
        <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 flex justify-center selection:bg-white/10">
      <div className="max-w-4xl w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Header / Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glass-card p-6 rounded-3xl border-white/10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-zinc-400 text-black flex items-center justify-center font-black text-2xl shadow-2xl shadow-white/10">
              {org?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-white">{org?.name || 'Fornecedor Parceiro'}</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Orçamento Oficial</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none border-white/10 hover:bg-white/5 gap-2 h-12 px-6 rounded-2xl transition-all">
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex-1 md:flex-none bg-white text-black hover:bg-zinc-200 gap-2 h-12 px-8 rounded-2xl font-bold shadow-xl shadow-white/5 transition-all active:scale-95 disabled:opacity-50"
            >
              {isAccepting ? (
                <div className="w-4 h-4 border-2 border-zinc-500 border-t-black rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isAccepting ? "Processando..." : "Aceitar Proposta"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 flex flex-col gap-8">
            <div className="glass-card p-8 rounded-[2.5rem] border-white/10 flex flex-col gap-10">
              <div className="flex justify-between items-start border-b border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                    Proposta Comercial
                  </h2>
                  <p className="text-zinc-600 text-xs font-mono font-medium tracking-widest uppercase">
                    REF: {budget.id.split('-')[0]}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em]">Emissão</span>
                  <span className="text-white font-mono font-bold text-lg">
                    {budget.created_at ? format(new Date(budget.created_at), 'dd/MM/yy') : '--/--/--'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-1">Itens do Orçamento</h3>
                <div className="flex flex-col gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white tracking-tight">{item.description}</span>
                        <span className="text-xs text-zinc-500 font-medium">
                          {item.quantity} {item.products?.unit_types?.symbol || 'un'} <span className="mx-1 text-zinc-700">•</span> R$ {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} un
                        </span>
                      </div>
                      <span className="font-mono font-black text-white text-lg">
                        R$ {Number(item.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-8 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-zinc-600 font-black uppercase text-[10px] tracking-[0.4em] mb-1">Investimento Total</span>
                  <p className="text-zinc-400 text-xs">Válido por 7 dias corridos</p>
                </div>
                <span className="text-5xl font-black text-white tracking-tighter font-mono bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                  R$ {(budget.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="flex flex-col gap-8">
            <div className="glass-card p-8 rounded-[2rem] border-white/10 flex flex-col gap-8">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Detalhes</h3>
              
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-white/5 text-zinc-400 border border-white/5 transition-colors group-hover:bg-white/10 group-hover:text-white">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Data Prevista</span>
                    <span className="text-sm font-bold text-white tracking-tight">
                      {budget.event_details?.date ? format(new Date(budget.event_details.date), 'dd MMMM, yyyy') : 'A definir'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-white/5 text-zinc-400 border border-white/5 transition-colors group-hover:bg-white/10 group-hover:text-white">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Localização</span>
                    <span className="text-sm font-bold text-white tracking-tight">
                      {budget.event_details?.location || 'Não informado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-white/5 text-zinc-400 border border-white/5 transition-colors group-hover:bg-white/10 group-hover:text-white">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Validade</span>
                    <span className="text-sm font-bold text-amber-500 tracking-tight">
                      Expira em 7 dias
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[2rem] border-white/10 flex flex-col gap-5">
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Destinatário</h3>
               <div className="flex flex-col gap-1">
                 <span className="font-black text-white tracking-tight text-lg">{budget.customer_name}</span>
                 <div className="flex flex-col gap-0.5 mt-2">
                   <span className="text-xs text-zinc-500 font-medium">{budget.customer_email || 'Email não informado'}</span>
                   <span className="text-xs text-zinc-500 font-medium">{budget.customer_phone || 'Telefone não informado'}</span>
                 </div>
               </div>
            </div>

            <div className="p-1">
              <p className="text-[10px] text-center text-zinc-600 leading-relaxed font-medium uppercase tracking-widest">
                Gerado via Evento HIGH em parceria com {org?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="h-20" /> {/* Spacer */}
      </div>
    </div>
  )
}
