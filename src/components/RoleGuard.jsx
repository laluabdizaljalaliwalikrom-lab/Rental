import { useAuth } from '@/hooks/useAuth'

export default function RoleGuard({ roles, children, fallback = null }) {
  const { hasRole } = useAuth()

  if (!hasRole(roles)) {
    return fallback
  }

  return children
}
