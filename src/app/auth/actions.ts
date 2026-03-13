"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const orgName = formData.get("orgName") as string

  if (!email || !password || !fullName || !orgName) {
    throw new Error("Missing required fields")
  }

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Failed to create user account" }
  }

  const userId = authData.user.id

  // 2. Create Organization
  const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
    })
    .select()
    .single()

  if (orgError) {
    // In a production app, we might want to rollback the auth user creation here
    return { error: `Organization creation failed: ${orgError.message}` }
  }

  // 3. Create Profile and link to Org as 'owner'
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      org_id: orgData.id,
      full_name: fullName,
      role: "owner",
    })

  if (profileError) {
    return { error: `Profile creation failed: ${profileError.message}` }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
