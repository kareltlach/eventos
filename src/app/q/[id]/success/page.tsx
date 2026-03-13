"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, PartyPopper } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function QuoteSuccessPage() {
  const params = useParams()
  const id = params?.id

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 rounded-[3rem] border-white/10 flex flex-col items-center gap-8 max-w-xl"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
          <div className="p-6 rounded-full bg-green-500/10 border border-green-500/20 relative">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black text-white tracking-tighter">Proposta Aceita!</h1>
          <p className="text-zinc-500 text-lg">
            O pagamento foi processado com sucesso. O fornecedor já foi notificado e entrará em contato em breve.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-left">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Protocolo</span>
              <span className="font-mono text-zinc-400 text-xs">{(id as string)?.split('-')[0] || 'CONFIRMADO'}</span>
            </div>
            <PartyPopper className="w-6 h-6 text-zinc-700" />
          </div>

          <Link 
            href={`/q/${id}`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold text-lg"
            )}
          >
            Visualizar Resumo
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
