"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2,
  Package,
  Zap,
  Sparkles
} from "lucide-react"
import { CatalogItem } from "./CatalogItem"
import { formatCurrency } from "@/lib/utils"
import { captureLeadAction } from "@/app/actions/leads"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  base_price: number | null
  unit_types: { symbol: string } | null
}

interface LeadCaptureFormProps {
  products: Product[]
  orgId: string
  orgName: string
}

export function LeadCaptureForm({ products, orgId, orgName }: LeadCaptureFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Form State
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    location: ""
  })

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedItems(prev => {
      const next = { ...prev }
      if (quantity <= 0) {
        delete next[productId]
      } else {
        next[productId] = quantity
      }
      return next
    })
  }

  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [id, qty]) => {
      const product = products.find(p => p.id === id)
      return total + ((product?.base_price || 0) * qty)
    }, 0)
  }

  const handleNext = () => {
    if (!details.name || !details.email || !details.phone) {
      toast.error("Por favor, preencha os campos obrigatórios.")
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    const itemIds = Object.keys(selectedItems)
    if (itemIds.length === 0) {
      toast.error("Por favor, selecione pelo menos um serviço.")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Enviando sua proposta...")

    try {
      const itemsPayload = itemIds.map(id => {
        const product = products.find(p => p.id === id)!
        return {
          productId: id,
          description: product.name,
          quantity: selectedItems[id],
          unitPrice: product.base_price || 0
        }
      })

      const result = await captureLeadAction({
        orgId,
        customerName: details.name,
        customerEmail: details.email,
        customerPhone: details.phone,
        eventDate: details.date,
        eventLocation: details.location,
        items: itemsPayload,
        totalAmount: calculateTotal()
      })

      if (result?.data?.success) {
        setIsSuccess(true)
        toast.success("Lead enviado com sucesso!", { id: toastId })
      } else {
        toast.error(result?.data?.error || "Erro ao processar envio.", { id: toastId })
      }
    } catch (error) {
      console.error("Submission Error:", error)
      toast.error("Erro inesperado. Tente novamente.", { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center gap-6 p-8 py-20"
      >
        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse" />
          <Check className="w-10 h-10 text-emerald-500 relative z-10" />
        </div>
        <div className="space-y-3">
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 uppercase tracking-[0.2em] text-[10px]">Solicitação Recebida</Badge>
          <h2 className="text-3xl font-black tracking-tight uppercase">Obrigado!</h2>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
            Sua solicitação de orçamento para <strong>{orgName}</strong> foi enviada com sucesso. Entraremos em contato em breve através do seu WhatsApp ou E-mail.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-2xl px-8 h-12 text-xs font-bold uppercase tracking-widest border-border/50 hover:bg-secondary/50"
          onClick={() => window.location.reload()}
        >
          Novo Orçamento
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
            Instagram Direct Lead
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">
          {step === 1 ? "Inicie seu" : "Escolha seu"} <br />
          <span className="text-primary italic">Orçamento de Luxo</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-md">
          {step === 1 
            ? "Preencha seus dados básicos para receber uma proposta oficial personalizada do seu evento." 
            : "Selecione abaixo os serviços desejados para compor seu pacote de experiência."}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 px-1">
        {[1, 2].map(i => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step === i ? "flex-1 bg-primary" : i < step ? "w-4 bg-emerald-500/50" : "flex-1 bg-border/30"
            }`} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input 
                    placeholder="Seu nome"
                    value={details.name}
                    onChange={e => setDetails({...details, name: e.target.value})}
                    className="h-14 pl-11 rounded-3xl bg-secondary/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">E-mail de Contato</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      placeholder="seu@email.com"
                      value={details.email}
                      onChange={e => setDetails({...details, email: e.target.value})}
                      className="h-14 pl-11 rounded-3xl bg-secondary/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      placeholder="(11) 99999-9999"
                      value={details.phone}
                      onChange={e => setDetails({...details, phone: e.target.value})}
                      className="h-14 pl-11 rounded-3xl bg-secondary/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Data do Evento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      type="date"
                      value={details.date}
                      onChange={e => setDetails({...details, date: e.target.value})}
                      className="h-14 pl-11 rounded-3xl bg-secondary/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Cidade / Local</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      placeholder="Ex: São Paulo, SP"
                      value={details.location}
                      onChange={e => setDetails({...details, location: e.target.value})}
                      className="h-14 pl-11 rounded-3xl bg-secondary/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              size="lg"
              onClick={handleNext}
              className="mt-4 h-16 rounded-[2rem] bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-tight text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 group"
            >
              Escolher Serviços
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Experiências Disponíveis</h3>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                <Package className="w-3 h-3" />
                Catálogo Oficial
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(product => (
                <CatalogItem 
                  key={product.id}
                  product={product}
                  quantity={selectedItems[product.id] || 0}
                  onUpdate={updateQuantity}
                />
              ))}
            </div>

            {/* Sticky Total Bar */}
            <div className="mt-4 p-6 rounded-[2.5rem] bg-secondary/40 border border-border/50 backdrop-blur-xl flex justify-between items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Projetado</span>
                <span className="text-2xl font-black font-mono italic">
                  R$ {formatCurrency(calculateTotal())}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="w-14 h-14 rounded-2xl border border-border/50 hover:bg-background"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button 
                  disabled={isSubmitting || calculateTotal() === 0}
                  onClick={handleSubmit}
                  className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-xl shadow-primary/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 fill-primary-foreground/20" />
                      Finalizar Proposta
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-2 opacity-30 mt-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] font-mono">Verified Connection • Security Protocols Active</p>
        <div className="flex items-center gap-4 h-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-[1px] h-full bg-border" />
          <span className="text-[8px] font-mono tracking-tighter">EST. SESSION: {mounted ? new Date().toLocaleTimeString() : "--:--:--"}</span>
        </div>
      </div>
    </div>
  )
}
