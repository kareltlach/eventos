"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Key, Mail, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success("Welcome back!")
      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to sign in")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,oklch(0.2_0.1_260/0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[400px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 group hover:scale-105 transition-transform">
             <Key className="w-6 h-6 text-primary-foreground" />
           </div>
           <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-[0.2em] text-[10px] px-3">
             Secure Access
           </Badge>
           <h1 className="text-2xl font-bold tracking-tight text-foreground">Evento HIGH</h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-2xl shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
          
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold">Sign in</CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium">
              Enter your credentials to manage your experiences.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="name@company.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border/50 h-11 pl-10 text-sm focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secret Key</Label>
                  <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                    Forgot Key?
                  </Link>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input 
                    id="password"
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border/50 h-11 pl-10 text-sm focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 mt-2 mb-2">
              <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 group/btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    Authorize <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </>
                )}
              </Button>
              <div className="text-center">
                <span className="text-xs text-muted-foreground font-medium">Don&apos;t have an account? </span>
                <Link href="/register" className="text-xs font-bold text-primary hover:underline underline-offset-4">
                  Register platform
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground/40 mt-8 font-medium uppercase tracking-[0.1em]">
          &copy; 2024 Evento HIGH Control • Private Infrastructure
        </p>
      </div>
    </div>
  )
}
