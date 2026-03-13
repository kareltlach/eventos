"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import React from "react"

export function NotificationListener({ orgId }: { orgId: string | null | undefined }) {

  const supabase = createClient()

  useEffect(() => {
    if (!orgId) return

    const channel = supabase
      .channel(`notifications_${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          const newNotification = payload.new as any
          
          toast(newNotification.title, {
            description: newNotification.message,
            icon: (
              <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ),
            duration: 8000,
            className: "bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl",
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, orgId])

  return null
}
