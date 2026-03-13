"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { Database } from "@/types/database"
import { revalidatePath } from "next/cache"

// Use a direct client with Service Role for public lead capture
// since unauthenticated users can't typically insert into budget_requests via RLS
const createBypassClient = () => createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const leadSchema = z.object({
  orgId: z.string().uuid(),
  customerName: z.string().min(2, "O nome é obrigatório"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().min(8, "Telefone inválido"),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number()
  })).min(1, "Selecione pelo menos um item"),
  totalAmount: z.number()
})

const updateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["pending", "drafting", "sent", "accepted", "rejected", "approved"])
})

const deleteLeadSchema = z.object({
  leadId: z.string().uuid()
})

export const captureLeadAction = actionClient
  .schema(leadSchema)
  .action(async ({ parsedInput }) => {
    const supabase = createBypassClient()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!")
      return { error: "Erro de configuração do servidor. Contate o suporte." }
    }

    try {
      // 1. Create Budget Request (Lead)
      const { data: budget, error: budgetError } = await supabase
        .from("budget_requests")
        .insert({
          org_id: parsedInput.orgId,
          customer_name: parsedInput.customerName,
          customer_email: parsedInput.customerEmail,
          customer_phone: parsedInput.customerPhone,
          customer_info: { 
            email: parsedInput.customerEmail, 
            phone: parsedInput.customerPhone 
          },
          event_details: { 
            date: parsedInput.eventDate, 
            location: parsedInput.eventLocation 
          },
          status: "pending",
          total_amount: parsedInput.totalAmount
        })
        .select()
        .single()

      if (budgetError) {
        console.error("Capture Lead Error (Step 1 - Insert):", {
          code: budgetError.code,
          message: budgetError.message,
          details: budgetError.details,
          hint: budgetError.hint
        })
        return { error: `Falha ao criar lead: ${budgetError.message}` }
      }

      if (!budget) {
        console.error("Capture Lead Error (Step 1 - No Data): Budget object is null despite no error.")
        return { error: "Erro ao recuperar dados do lead criado." }
      }

      // 2. Create Budget Items
      const budgetItemsPayload = parsedInput.items.map(item => ({
        budget_id: budget.id,
        product_id: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice
      }))

      const { error: itemsError } = await supabase
        .from("budget_items")
        .insert(budgetItemsPayload)

      if (itemsError) {
        console.error("Capture Lead Items Error (Step 2):", itemsError)
        return { error: "Lead criado, mas houve erro ao salvar os itens selecionados." }
      }

      // 3. Optional: Trigger internal notification
      try {
        const { error: notifyError } = await supabase.from("notifications").insert({
          org_id: parsedInput.orgId,
          title: "Novo Lead Capturado 🚀",
          message: `${parsedInput.customerName} enviou uma nova solicitação de orçamento.`,
          type: "lead_captured",
          data: { budget_id: budget.id }
        })
        if (notifyError) console.error("Notification Error (Non-blocking):", notifyError)
      } catch (notifyErr) {
        console.error("Notification Unexpected Error (Non-blocking):", notifyErr)
      }

      revalidatePath("/leads")
      return { success: true, budgetId: budget.id }
    } catch (err) {
      console.error("Capture Lead Unexpected Error:", err)
      return { error: "Ocorreu um erro inesperado no servidor." }
    }
  })

export const updateLeadStatusAction = actionClient
  .schema(updateStatusSchema)
  .action(async ({ parsedInput }) => {
    const supabase = createBypassClient()
    
    const { error } = await supabase
      .from("budget_requests")
      .update({ status: parsedInput.status })
      .eq("id", parsedInput.leadId)
    
    if (error) {
      console.error("Update Lead Status Error:", error)
      return { error: "Falha ao atualizar status." }
    }
    
    revalidatePath("/leads")
    revalidatePath("/budgets")
    return { success: true }
  })

export const deleteLeadAction = actionClient
  .schema(deleteLeadSchema)
  .action(async ({ parsedInput }) => {
    const supabase = createBypassClient()
    
    // Items will be deleted automatically due to CASCADE if configured, 
    // but let's be explicit if needed or just delete budget
    const { error } = await supabase
      .from("budget_requests")
      .delete()
      .eq("id", parsedInput.leadId)
    
    if (error) {
      console.error("Delete Lead Error:", error)
      return { error: "Falha ao excluir lead." }
    }
    
    revalidatePath("/leads")
    return { success: true }
  })
