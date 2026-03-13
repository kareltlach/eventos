import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function SuccessPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_-20%,oklch(0.2_0.1_150/0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[450px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <Card className="border-border/50 bg-card/50 backdrop-blur-2xl shadow-2xl overflow-hidden relative text-center">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />
          
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-pulse">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <Badge variant="outline" className="mx-auto mb-2 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 font-bold uppercase tracking-[0.2em] text-[10px] px-3">
              Transmission Confirmed
            </Badge>
            <CardTitle className="text-2xl font-bold tracking-tight">Requirement Received</CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium max-w-[300px] mx-auto">
              Your data has been securely transmitted. Our team will analyze your request and provide a technical response shortly.
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-left space-y-3">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Protocol ID</span>
                 <span className="text-[10px] font-mono text-foreground font-bold">ACK-{Math.random().toString(36).substring(7).toUpperCase()}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Encryption</span>
                 <span className="text-[10px] font-bold text-emerald-500 uppercase">AES-256 Verified</span>
               </div>
            </div>
          </CardContent>

          <div className="px-6 pb-8">
             <Link href="/">
                <Button variant="outline" className="w-full h-11 text-xs font-bold uppercase tracking-widest gap-2 bg-background/50 hover:bg-background border-border/50 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Return to Terminal
                </Button>
             </Link>
          </div>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground/40 mt-8 font-medium uppercase tracking-[0.1em]">
          Encrypted Transmission Channel #472 • Secure Pipeline
        </p>
      </div>
    </div>
  )
}
