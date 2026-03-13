import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { PageTransition } from "@/components/page-transition"
import { NotificationListener } from "@/components/notification-listener"

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
      <NotificationListener orgId={profile?.org_id} />
      <main className="flex-1 md:ml-64 p-4 md:p-6 overflow-y-auto bg-black">

        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
