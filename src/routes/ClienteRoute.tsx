import React from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface ClienteRouteProps {
  children: React.ReactNode
}

export default function ClienteRoute({ children }: ClienteRouteProps) {
  const { user, rol, activo, loading } = useAuth()

  // Verificando sesión y permisos
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#ff6a00]" />

          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
            Verificando acceso...
          </p>
        </div>
      </div>
    )
  }

  // No autenticado
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // No es cliente
  if (rol !== 'cliente') {
    return <Navigate to="/" replace />
  }

  // Cliente registrado pero todavía no aprobado
  if (!activo) {
    return <Navigate to="/registro-pendiente" replace />
  }

  // Cliente activo
  return <>{children}</>
}