import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { PageTransition } from "@/components/page-transition"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name)")
    .single()

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar user={user} profile={profile} />
      <main className="flex-1 md:ml-72 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
