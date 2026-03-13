import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("stripe-signature") as string

  let event: Stripe.Event

  try {
    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET")
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const budgetId = session.metadata?.budgetId

    if (budgetId) {
      // Use service role to bypass RLS
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Fetch budget details for notification
      const { data: budgetData } = await supabase
        .from("budget_requests")
        .select("org_id, customer_name")
        .eq("id", budgetId)
        .maybeSingle()

      // Update status to approved
      const { error: updateError } = await supabase
        .from("budget_requests")
        .update({ status: "approved" })
        .eq("id", budgetId)

      if (updateError) {
        console.error(`Webhook update error for budget ${budgetId}:`, updateError)
        return NextResponse.json({ error: "Failed to update budget status" }, { status: 500 })
      }

      // Create platform notification
      if (budgetData?.org_id) {
        await supabase.from("notifications").insert({
          org_id: budgetData.org_id,
          title: "Proposta Aprovada e Paga! 💳🎉",
          message: `O cliente ${budgetData.customer_name || 'Anônimo'} aprovou e pagou a proposta REQ-${budgetId.split('-')[0]}.`,
          type: "proposal_approved",
          data: { budgetId, paymentIntent: session.payment_intent }
        })
      }

      console.log(`✅ Budget ${budgetId} status updated to approved via webhook.`)
    }
  }

  return NextResponse.json({ received: true })
}
