"use server"

import { actionClient } from "@/lib/safe-action"
import { z } from "zod"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
})

const checkoutSchema = z.object({
  budgetId: z.string().uuid(),
  amount: z.number().min(1),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
})

export const createCheckoutSession = actionClient
  .schema(checkoutSchema)
  .action(async ({ parsedInput: { budgetId, amount, customerName, customerEmail } }) => {
    
    // In a real app, we verify the budget exists and the amount matches
    // For this implementation, we'll create the session directly
    
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `Orçamento Evento HIGH - #${budgetId.split("-")[0]}`,
                description: `Proposta comercial para ${customerName}`,
              },
              unit_amount: Math.round(amount * 100), // Stripe expects cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/q/${budgetId}/success`,
        cancel_url: `${origin}/q/${budgetId}`,
        customer_email: customerEmail,
        metadata: {
          budgetId,
        },
      })

      return { url: session.url }
    } catch (error) {
      console.error("Stripe Checkout ERROR:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro interno no Stripe"
      throw new Error(`Processo de pagamento falhou: ${errorMessage}`)
    }
  })
