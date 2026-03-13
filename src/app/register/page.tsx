"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Zap, UserPlus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/app/auth/actions"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await signUp(formData)
      if (result?.error) {
        toast.error(result.error)
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center mb-2 border border-white/20 shadow-lg shadow-white/5">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="text-zinc-400 text-sm">Join the Evento HIGH community</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName" className="text-zinc-300 ml-1">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 transition-all rounded-lg h-11"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="orgName" className="text-zinc-300 ml-1">Organization Name</Label>
                <Input
                  id="orgName"
                  name="orgName"
                  placeholder="My Events Co."
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 transition-all rounded-lg h-11"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-zinc-300 ml-1">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 transition-all rounded-lg h-11"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" title="password" className="text-zinc-300 ml-1">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 transition-all rounded-lg h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-11 bg-white text-black hover:bg-zinc-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? "Creating account..." : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Get Started
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-white hover:underline underline-offset-4 inline-flex items-center gap-1">
              Sign In <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
