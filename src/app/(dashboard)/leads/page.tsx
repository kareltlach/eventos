import { LeadsDashboard } from "@/features/leads/components/LeadsDashboard"
import { Badge } from "@/components/ui/badge"

export default function LeadsPage() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="outline" className="px-1.5 py-0 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">
              CRM
            </Badge>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">•</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Prospects</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Leads</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Gerencie solicitações recebidas via Instagram e converta-as em orçamentos.</p>
        </div>
      </div>

      <LeadsDashboard />
    </div>
  )
}
