import React from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, rol, loading } = useAuth()

  // Pantalla de carga mientras se verifica la sesión en Firebase
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#ff6a00]" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
            Verificando permisos...
          </p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, redirige al Login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si el usuario existe pero su rol no es 'admin', lo envía al inicio
  if (rol !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Si está autenticado y es admin, renderiza la ruta protegida
  return <>{children}</>
}