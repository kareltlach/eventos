"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { UserPlus, Mail, Key, Building2, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [orgName, setOrgName] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("No user returned")

      // Create Organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({ 
          name: orgName,
          slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Update Profile with org_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ org_id: orgData.id, full_name: fullName })
        .eq("id", authData.user.id)

      if (profileError) throw profileError

      toast.success("Account created successfully!")
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to register")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden text-foreground">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_-20%,oklch(0.2_0.1_260/0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[450px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 group hover:scale-105 transition-transform">
             <UserPlus className="w-6 h-6 text-primary-foreground" />
           </div>
           <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-[0.2em] text-[10px] px-3">
             Platform Induction
           </Badge>
           <h1 className="text-2xl font-bold tracking-tight">Create Agency account</h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-2xl shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
          
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold">Registration</CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium">
              Join the elite circle of event managers. 5-minute setup.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Personal Key</Label>
                  <Input 
                    id="fullName"
                    placeholder="John Doe" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background/50 border-border/50 h-10 text-sm focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Agency Brand</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                    <Input 
                      id="orgName"
                      placeholder="Acme Events" 
                      required 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="bg-background/50 border-border/50 h-10 pl-10 text-sm focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Communications Hub</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="name@company.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border/50 h-11 pl-10 text-sm focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Security Vault Code</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input 
                    id="password"
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border/50 h-11 pl-10 text-sm focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-bold uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 group/btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    Initialize Account <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </>
                )}
              </Button>
              <div className="text-center pb-2">
                <span className="text-xs text-muted-foreground font-medium">Already have access? </span>
                <Link href="/login" className="text-xs font-bold text-primary hover:underline underline-offset-4">
                  Log in secure
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground/40 mt-8 font-medium uppercase tracking-[0.1em]">
          By registering, you agree to our Protocol and Terms of Deployment.
        </p>
      </div>
    </div>
  )
}
