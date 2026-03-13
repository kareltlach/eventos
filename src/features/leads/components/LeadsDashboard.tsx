"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Trash2,
  FileEdit,
  Eye,
  MousePointerClick
} from "lucide-react"
import { format } from "date-fns"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { updateLeadStatusAction, deleteLeadAction } from "@/app/actions/leads"
import { useAction } from "next-safe-action/hooks"

interface Lead {
  id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  status: string
  created_at: string
  total_amount: number
  event_details: any
  budget_items: {
    id: string
    description: string
    quantity: number
    unit_price: number
    products: {
      name: string
    } | null
  }[]
}

export function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const supabase = createClient()

  const fetchLeads = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const { data, error } = await supabase
        .from("budget_requests")
        .select(`
          *,
          budget_items (
            id,
            description,
            quantity,
            unit_price,
            products (name)
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setLeads((data as Lead[]) || [])
    } catch {
      toast.error("Erro ao carregar leads")
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchLeads()

    const channel = supabase
      .channel('leads_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_requests',
          filter: 'status=eq.pending'
        },
        () => {
          fetchLeads(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchLeads])

  const { execute: executeUpdateStatus } = useAction(updateLeadStatusAction, {
    onSuccess: () => {
      toast.success("Lead convertido em orçamento com sucesso!")
      fetchLeads(true)
    },
    onError: () => toast.error("Falha ao converter lead.")
  })

  const { execute: executeDelete } = useAction(deleteLeadAction, {
    onSuccess: () => {
      toast.success("Lead removido com sucesso.")
      fetchLeads(true)
    },
    onError: () => toast.error("Falha ao remover lead.")
  })

  const filteredLeads = leads.filter(l => 
    l.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConvert = (id: string) => {
    executeUpdateStatus({ leadId: id, status: "drafting" })
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este lead?")) {
      executeDelete({ leadId: id })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4 h-10 px-1 border-b border-border/20">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-[300px]">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente..." 
              className="pl-6 bg-transparent border-none text-[11px] placeholder:text-muted-foreground/40 focus:ring-0 w-full outline-none text-foreground font-medium"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
           <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Carregando Leads</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/10 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Cliente</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Data de Criação</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6">Evento</TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-6 text-right">Valor Est.</TableHead>
                <TableHead className="h-10 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="group border-border/30 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground tracking-tight">
                        {lead.customer_name || 'Sem nome'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-tighter">
                        {lead.customer_email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <span className="text-xs font-medium text-muted-foreground/80">
                      {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <span className="text-xs font-medium text-muted-foreground/80">
                      {lead.event_details?.date ? format(new Date(lead.event_details.date), 'dd/MM/yyyy') : 'Não informada'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      R$ {formatCurrency(lead.total_amount)}
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
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ações Rápidas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedLead(lead)
                                setIsViewOpen(true)
                              }} 
                              className="text-xs font-semibold gap-2 py-2"
                            >
                              <Eye className="w-3 h-3" /> Visualizar Itens
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleConvert(lead.id)} 
                              className="text-xs font-semibold gap-2 py-2 text-primary"
                            >
                              <FileEdit className="w-3 h-3" /> Converter em Orçamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(lead.id)} 
                              className="text-xs font-semibold gap-2 py-2 text-destructive"
                            >
                              <Trash2 className="w-3 h-3" /> Excluir Lead
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLeads.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-muted-foreground/30" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground">Nenhum lead pendente</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-70">
                  Novos leads capturados via Instagram aparecerão aqui.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Items Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Solicitação de {selectedLead?.customer_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 my-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Contato</p>
              <p className="text-sm font-medium">{selectedLead?.customer_email}</p>
              <p className="text-sm font-medium">{selectedLead?.customer_phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Evento</p>
              <p className="text-sm font-medium">Data: {selectedLead?.event_details?.date ? format(new Date(selectedLead.event_details.date), 'dd/MM/yyyy') : 'N/A'}</p>
              <p className="text-sm font-medium">Local: {selectedLead?.event_details?.location || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Produtos Selecionados</h4>
            <div className="rounded-md border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40">
                    <TableHead className="h-8 text-[9px] font-bold uppercase tracking-widest">Produto</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold uppercase tracking-widest text-center">Quant.</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold uppercase tracking-widest text-right">Unitário</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold uppercase tracking-widest text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLead?.budget_items.map((item) => (
                    <TableRow key={item.id} className="border-border/30">
                      <TableCell className="py-2 text-xs font-medium">
                        {item.products?.name || item.description}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-center font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right tabular-nums">
                        R$ {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-bold tabular-nums">
                        R$ {formatCurrency(item.unit_price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-white/5 font-bold">
                    <TableCell colSpan={3} className="py-2 text-xs text-right uppercase tracking-widest text-muted-foreground">Total Estimado</TableCell>
                    <TableCell className="py-2 text-sm text-right text-primary tabular-nums">
                      R$ {formatCurrency(selectedLead?.total_amount || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
            <Button size="sm" onClick={() => {
              if (selectedLead) handleConvert(selectedLead.id)
              setIsViewOpen(false)
            }}>
              Converter em Orçamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
