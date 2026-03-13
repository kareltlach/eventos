import { createSafeActionClient } from "next-safe-action"

export const actionClient = createSafeActionClient({
  // You can add global error handling here
  handleServerError(e) {
    console.error("Action error:", e.message)
    return "Ocorreu um erro inesperado. Tente novamente mais tarde."
  },
})
