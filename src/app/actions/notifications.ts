"use server"

import { actionClient } from "@/lib/safe-action"
import { z } from "zod"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_123")

const emailSchema = z.object({
  to: z.string().email(),
  customerName: z.string(),
  quoteUrl: z.string().url(),
  orgName: z.string(),
})

export const sendQuoteEmail = actionClient
  .schema(emailSchema)
  .action(async ({ parsedInput: { to, customerName, quoteUrl, orgName } }) => {
    try {
      const { error } = await resend.emails.send({
        from: `${orgName} <onboarding@resend.dev>`, // In production, use your verified domain
        to: [to],
        subject: `Proposta Comercial de ${orgName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
            <h1 style="color: #000; font-size: 24px;">Olá, ${customerName}!</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              A <strong>${orgName}</strong> acabou de gerar uma nova proposta comercial para o seu evento.
            </p>
            <div style="margin: 30px 0;">
              <a href="${quoteUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Visualizar Orçamento
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="color: #999; font-size: 12px;">
              Este é um email automático gerado via Evento HIGH.
            </p>
          </div>
        `,
      })

      if (error) {
        console.error("Resend Error:", error)
        throw new Error("Não foi possível enviar o email.")
      }

      return { success: true }
    } catch (err) {
      console.error("Email Action Error:", err)
      throw new Error("Erro inesperado ao enviar notificação.")
    }
  })
