import { supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function apiFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }
  
  return res.json()
}
