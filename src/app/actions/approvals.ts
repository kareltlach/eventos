"use server"

import { actionClient } from "@/lib/safe-action"
import { z } from "zod"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const approveSchema = z.object({
  budgetId: z.string().uuid(),
})

// Use a direct client with Service Role for public approvals
// since unauthenticated users can't update budget_requests status via RLS
const createBypassClient = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const approveProposalWithoutPayment = actionClient
  .schema(approveSchema)
  .action(async ({ parsedInput: { budgetId } }) => {
    const supabase = createBypassClient()
    
    // First fetch budget details to get org_id for the notification
    const { data: budgetData } = await supabase
      .from("budget_requests")
      .select("org_id, customer_name")
      .eq("id", budgetId)
      .maybeSingle()

    const { error } = await supabase
      .from("budget_requests")
      .update({ status: "approved" })
      .eq("id", budgetId)

    if (error) {
      console.error("Approval Error:", error)
      throw new Error(`Falha ao aprovar proposta: ${error.message}`)
    }

    // Create platform notification
    if (budgetData?.org_id) {
      await supabase.from("notifications").insert({
        org_id: budgetData.org_id,
        title: "Proposta Aprovada! 🎉",
        message: `O cliente ${budgetData.customer_name || 'Anônimo'} aprovou a proposta REQ-${budgetId.split('-')[0]}.`,
        type: "proposal_approved",
        data: { budgetId }
      })
    }

    revalidatePath(`/q/${budgetId}`)

    return { success: true }
  })

