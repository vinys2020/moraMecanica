
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LogOut,
  ShieldCheck,
  Loader2,
  Wrench,
} from 'lucide-react'

import {
  doc,
  onSnapshot,
} from 'firebase/firestore'

import {
  useNavigate,
  Link,
} from 'react-router-dom'

import { auth, db } from '../config/firebase'

import {
  logout as firebaseLogout,
} from '../services/auth'

export default function RegistroPendiente() {
  const navigate = useNavigate()

  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [aprobado, setAprobado] = useState(false)

  /* =========================================================
     ESCUCHAR ESTADO DEL USUARIO EN TIEMPO REAL
  ========================================================= */

useEffect(() => {
  const currentUser = auth.currentUser

  if (!currentUser) {
    navigate('/login', { replace: true })
    return
  }

  const usuarioRef = doc(
    db,
    'usuarios',
    currentUser.uid
  )

  let redireccionando = false

  const unsubscribe = onSnapshot(
    usuarioRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        return
      }

      const data = snapshot.data()

      console.log(
        '🔄 Estado del usuario actualizado:',
        data
      )

      if (
        data.activo === true &&
        data.rol === 'cliente' &&
        !redireccionando
      ) {
        redireccionando = true

        setAprobado(true)

        setTimeout(() => {
          window.location.replace('/cliente')
        }, 800)
      }
    },
    (error) => {
      console.error(
        '❌ Error escuchando estado del usuario:',
        error
      )
    }
  )

  return () => unsubscribe()
}, [navigate])

  /* =========================================================
     CERRAR SESIÓN
  ========================================================= */

  const handleLogout = async () => {
    if (cerrandoSesion) return

    try {
      setCerrandoSesion(true)

      await firebaseLogout()

      navigate('/login', {
        replace: true,
      })
    } catch (error) {
      console.error(
        '❌ Error cerrando sesión:',
        error
      )

      setCerrandoSesion(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#ff6a00]/10 blur-[140px]" />

        <div className="absolute bottom-[-200px] right-[-100px] h-[400px] w-[400px] rounded-full bg-[#ff6a00]/5 blur-[120px]" />

      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">

        <div className="w-full max-w-lg">

          {/* =================================================
              LOGO
          ================================================= */}

          <div className="mb-10 text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff6a00] shadow-[0_0_40px_rgba(255,106,0,0.25)]">

              <Wrench className="h-8 w-8 text-black" />

            </div>

            <h1 className="text-xl font-black tracking-tight">
              MORA MECÁNICA
            </h1>

            <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Sistema de gestión
            </p>

          </div>

          {/* =================================================
              CARD
          ================================================= */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl sm:p-10">

            {/* =================================================
                SPINNER / ESTADO
            ================================================= */}

            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#ff6a00]/20 bg-[#ff6a00]/10">

              {aprobado ? (
                <CheckCircle2
                  className="h-9 w-9 text-[#ff6a00]"
                />
              ) : (
                <Loader2
                  className="h-9 w-9 animate-spin text-[#ff6a00]"
                />
              )}

            </div>

            {/* =================================================
                TITLE
            ================================================= */}

            <div className="text-center">

              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                {aprobado
                  ? 'Cuenta aprobada'
                  : 'Verificando solicitud'}
              </p>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {aprobado
                  ? 'Acceso habilitado'
                  : 'Cuenta pendiente'}
              </h2>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/50">
                {aprobado
                  ? 'Tu cuenta fue aprobada correctamente. Estamos preparando tu acceso al sistema.'
                  : 'Tu cuenta fue creada correctamente y está esperando la aprobación de un administrador.'}
              </p>

            </div>

            {/* =================================================
                ESTADO EN TIEMPO REAL
            ================================================= */}

            <div className="mt-8 rounded-2xl border border-[#ff6a00]/20 bg-[#ff6a00]/5 p-5">

              <div className="flex items-start gap-4">

                <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6a00]/10">

                  {!aprobado && (
                    <span className="absolute inset-0 animate-ping rounded-xl bg-[#ff6a00]/10" />
                  )}

                  {aprobado ? (
                    <CheckCircle2 className="relative h-5 w-5 text-[#ff6a00]" />
                  ) : (
                    <Clock3 className="relative h-5 w-5 text-[#ff6a00]" />
                  )}

                </div>

                <div>

                  <p className="text-sm font-black text-white">
                    {aprobado
                      ? 'Solicitud aprobada'
                      : 'Esperando confirmación'}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    {aprobado
                      ? 'Redirigiendo al panel del cliente...'
                      : 'Estamos esperando que un administrador habilite tu cuenta.'}
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                TIEMPO REAL
            ================================================= */}

            {!aprobado && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">

                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff6a00]" />

                Estado actualizado en tiempo real

              </div>
            )}

            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">

              <div className="flex items-start gap-4">

                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">

                  <ShieldCheck className="h-5 w-5 text-white/50" />

                </div>

                <div>

                  <p className="text-sm font-black text-white">
                    Acceso protegido
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    El acceso al sistema permanecerá bloqueado
                    hasta que un administrador apruebe tu cuenta.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                CERRAR SESIÓN
            ================================================= */}

            <button
              type="button"
              onClick={handleLogout}
              disabled={cerrandoSesion}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/60 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >

              {cerrandoSesion ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cerrando sesión...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </>
              )}

            </button>

            {/* =================================================
                BACK
            ================================================= */}

            <Link
              to="/"
              className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-white/30 transition hover:text-white"
            >

              <ArrowLeft className="h-4 w-4" />

              Volver al inicio

            </Link>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
            Mora Mecánica · Acceso restringido
          </p>

        </div>

      </div>

    </main>
  )
}
