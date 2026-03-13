"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Orbit, LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Welcome back to Evento HIGH!")
        window.location.href = "/"
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 rounded-2xl flex flex-col gap-6 relative z-10">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2 border border-white/20">
              <Orbit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Evento HIGH</h1>
            <p className="text-zinc-400 text-sm">Elevate your event experience</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-zinc-300 ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 transition-all rounded-lg h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="password" className="text-zinc-300">Password</Label>
                <a href="#" className="text-xs text-white/40 hover:text-white transition-colors">Forgot password?</a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 transition-all rounded-lg h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-11 bg-white text-black hover:bg-zinc-200 font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              {isLoading ? "Signing in..." : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 rounded-lg">
              Google
            </Button>
            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 rounded-lg">
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-2">
            Don&apos;t have an account?{" "}
            <a href="/register" className="font-medium text-white hover:underline underline-offset-4">
              Create an account
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
