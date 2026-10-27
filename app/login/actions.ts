'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type LoginState = {
  error?: string
  success?: boolean
}

export type LoginPayload = {
  email: string
  password: string
  next?: string | null
}

export async function login(
  payload: LoginPayload | FormData
): Promise<LoginState> {
  const email =
    payload instanceof FormData
      ? (payload.get('email') as string)
      : payload.email
  const password =
    payload instanceof FormData
      ? (payload.get('password') as string)
      : payload.password
  const nextParam =
    payload instanceof FormData
      ? (payload.get('next') as string | null)
      : payload.next

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Validate and sanitize destination to prevent open redirect vulnerabilities
  const destination =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/dashboard'

  revalidatePath('/', 'layout')
  redirect(destination)
}

export async function logout(): Promise<void> {
  const supabase = await createClient()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
