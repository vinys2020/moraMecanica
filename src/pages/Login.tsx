import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'

function Login() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#080808] text-white">

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-[-15%] top-[20%] h-[500px] w-[500px] rounded-full bg-[#ff6a00]/10 blur-[130px]" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#ff6a00]/5 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

      </div>


      {/* LEFT BRAND PANEL */}

      <div className="relative hidden w-1/2 flex-col justify-between border-r border-white/10 p-10 lg:flex">

        <a
          href="/"
          className="flex items-center gap-2"
        >

          <div className="h-8 w-1 bg-[#ff6a00]" />

          <div className="leading-none">

            <div className="text-xl font-black italic">
              MECÁNICA
            </div>

            <div className="text-2xl font-black italic text-[#ff6a00]">
              MORA
            </div>

          </div>

        </a>


        <div className="max-w-lg">

          <div className="mb-8 flex h-16 w-16 items-center justify-center border border-[#ff6a00]/30 bg-[#ff6a00]/5">

            <Wrench
              size={30}
              strokeWidth={1.5}
              className="text-[#ff6a00]"
            />

          </div>

          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#ff6a00]">
            Portal de clientes
          </p>

          <h1 className="mt-5 text-6xl font-black uppercase leading-[0.9] tracking-tight">
            Tu vehículo.
            <br />
            <span className="text-[#ff6a00]">
              Bajo control.
            </span>
          </h1>

          <p className="mt-7 max-w-md text-sm leading-7 text-white/40">
            Consultá el estado de tu vehículo, revisá los servicios
            realizados y mantené todo su historial al alcance de tu mano.
          </p>

        </div>


        <div>

          <div className="h-px w-16 bg-[#ff6a00]" />

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">
            Tu vehículo en las mejores manos
          </p>

        </div>

      </div>


      {/* LOGIN */}

      <div className="relative flex min-h-screen w-full items-center justify-center px-5 py-12 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}

          <div className="mb-12 lg:hidden">

            <a
              href="/"
              className="inline-flex items-center gap-3"
            >

              <div className="h-8 w-1 bg-[#ff6a00]" />

              <div className="leading-none">

                <div className="text-lg font-black italic">
                  MECÁNICA
                </div>

                <div className="text-xl font-black italic text-[#ff6a00]">
                  MORA
                </div>

              </div>

            </a>

          </div>


          {/* HEADER */}

          <div>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ff6a00]">
              Portal de clientes
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Iniciar sesión
            </h2>

            <p className="mt-3 text-sm text-white/40">
              Ingresá para consultar la información de tu vehículo.
            </p>

          </div>


          {/* FORM */}

          <form
            className="mt-10 space-y-5"
            onSubmit={(e) => e.preventDefault()}
          >

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
                Correo electrónico
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="h-14 w-full border border-white/10 bg-[#111] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6a00]"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
                Contraseña
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-14 w-full border border-white/10 bg-[#111] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6a00]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-[#ff6a00]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* FORGOT */}

            <div className="flex justify-end">

              <button
                type="button"
                className="text-xs font-semibold text-white/40 transition hover:text-[#ff6a00]"
              >
                ¿Olvidaste tu contraseña?
              </button>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-3 bg-[#ff6a00] text-sm font-black uppercase tracking-wide text-black transition hover:bg-[#ff7b1a]"
            >
              Ingresar
            </button>

          </form>


          {/* DIVIDER */}

          <div className="my-7 flex items-center gap-4">

            <div className="h-px flex-1 bg-white/10" />

            <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
              O continuar con
            </span>

            <div className="h-px flex-1 bg-white/10" />

          </div>


          {/* GOOGLE */}

          <button
            type="button"
            className="flex h-14 w-full items-center justify-center gap-3 border border-white/10 bg-[#111] text-sm font-bold transition hover:border-white/20 hover:bg-[#151515]"
          >

            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-black">
              G
            </span>

            Continuar con Google

          </button>


          {/* REGISTER */}

          <p className="mt-8 text-center text-sm text-white/35">

            ¿Todavía no tenés una cuenta?

            <a
              href="#"
              className="ml-1 font-bold text-[#ff6a00] transition hover:text-[#ff7b1a]"
            >
              Registrate
            </a>

          </p>


          {/* BACK */}

          <a
            href="/"
            className="mx-auto mt-8 flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/25 transition hover:text-[#ff6a00]"
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </a>

        </div>

      </div>

    </main>
  )
}

export default Login