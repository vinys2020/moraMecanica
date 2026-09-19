import {
  ArrowLeft,
  Clock3,
  ShieldCheck,
  Wrench,
} from 'lucide-react'

import { Link } from 'react-router-dom'

export default function RegistroPendiente() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#ff6a00]/10 blur-[140px]" />

        <div className="absolute bottom-[-200px] right-[-100px] h-[400px] w-[400px] rounded-full bg-[#ff6a00]/5 blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Logo */}
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

          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl sm:p-10">

            {/* Icon */}
            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#ff6a00]/20 bg-[#ff6a00]/10">
              <Clock3 className="h-9 w-9 text-[#ff6a00]" />
            </div>

            {/* Title */}
            <div className="text-center">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                Registro recibido
              </p>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Cuenta pendiente
              </h2>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/50">
                Tu cuenta fue creada correctamente, pero todavía
                necesita la aprobación de un administrador para
                poder ingresar al sistema.
              </p>
            </div>

            {/* Status */}
            <div className="mt-8 rounded-2xl border border-[#ff6a00]/20 bg-[#ff6a00]/5 p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6a00]/10">
                  <Clock3 className="h-5 w-5 text-[#ff6a00]" />
                </div>

                <div>
                  <p className="text-sm font-black text-white">
                    Esperando confirmación
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Un administrador revisará tu solicitud y
                    habilitará tu cuenta cuando corresponda.
                  </p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <ShieldCheck className="h-5 w-5 text-white/50" />
                </div>

                <div>
                  <p className="text-sm font-black text-white">
                    Acceso protegido
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Hasta que tu cuenta sea aprobada no podrás
                    acceder al sistema de Mora Mecánica.
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <Link
              to="/login"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-[#ff6a00] text-sm font-black text-black transition hover:bg-[#ff7b1a] active:scale-[0.98]"
            >
              Ir al inicio de sesión
            </Link>

            {/* Back */}
            <Link
              to="/"
              className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-white/30 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
            Mora Mecánica · Acceso restringido
          </p>
        </div>
      </div>
    </main>
  )
}