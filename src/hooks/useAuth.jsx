/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_BASE || ''

async function fetchUserProfile(token) {
  const res = await fetch(`${API_BASE}/api/profiles/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) return null
  return res.json()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Initial session check — this is the single source of truth for loading
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        const profileData = await fetchUserProfile(session.access_token)
        if (mounted) setProfile(profileData)
      }
      if (mounted) setLoading(false)
    })

    // Listen for subsequent auth changes (login/logout) — does NOT control loading
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        const profileData = await fetchUserProfile(session.access_token)
        if (mounted) setProfile(profileData)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const hasRole = (roles) => {
    if (!profile?.role) return false
    if (typeof roles === 'string') return profile.role === roles
    return roles.includes(profile.role)
  }

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
  }

  const apiFetch = async (url, options = {}) => {
    const token = await getAccessToken()
    const headers = {
      'Content-Type': 'application/json',
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, hasRole, apiFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
