import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { LeadCaptureForm } from "@/features/lead-capture/components/LeadCaptureForm"
import { ShieldCheck } from "lucide-react"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function LeadCapturePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch Organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (orgError || !org) {
    return notFound()
  }

  // 2. Fetch Products for this organization
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`
      id,
      name,
      base_price,
      unit_types (symbol)
    `)
    .eq("org_id", org.id)
    .order("name")

  if (productsError) {
    console.error("Error fetching products:", productsError)
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-hidden selection:bg-primary/20">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation / Brand */}
      <nav className="p-6 md:p-10 flex justify-between items-center relative z-20">
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-black tracking-tighter uppercase italic">{org.name}</span>
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">High Performance Event Tech</span>
          </div>
        </div>
        <div className="p-2.5 rounded-2xl bg-white/5 border border-zinc-800 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary opacity-80" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex justify-center items-start pt-6 pb-20 px-6 relative z-10">
        <div className="w-full max-w-xl">
          <LeadCaptureForm 
            products={products || []} 
            orgId={org.id}
            orgName={org.name}
          />
        </div>
      </main>

      {/* Decorative Footer */}
      <footer className="p-10 flex justify-center relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <p className="text-[8px] font-mono text-zinc-600 tracking-[0.4em] uppercase">
            Powered by Evento Platform • Multi-Cloud Deployment
          </p>
        </div>
      </footer>
    </div>
  )
}
