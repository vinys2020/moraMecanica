import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  Wrench,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { registerWithEmail } from '../services/auth'

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const handleSubmit = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault()

  setError('')

  if (!name.trim()) {
    setError('Ingresá tu nombre y apellido.')
    return
  }

  if (!email.trim()) {
    setError('Ingresá tu correo electrónico.')
    return
  }

  if (password.length < 6) {
    setError(
      'La contraseña debe tener al menos 6 caracteres.'
    )
    return
  }

  if (password !== confirmPassword) {
    setError('Las contraseñas no coinciden.')
    return
  }

  try {
    setLoading(true)

    await registerWithEmail(
      name.trim(),
      email.trim(),
      password
    )

    // Usuario creado con activo: false.
    // registerWithEmail ya cerró la sesión.
    // Lo enviamos a la pantalla de espera.
    navigate('/registro-pendiente', {
      replace: true,
    })

  } catch (error: any) {
    console.error(
      'ERROR AL REGISTRAR USUARIO:',
      error
    )

    switch (error?.code) {
      case 'auth/email-already-in-use':
        setError(
          'Ya existe una cuenta registrada con ese correo.'
        )
        break

      case 'auth/invalid-email':
        setError(
          'El correo electrónico no es válido.'
        )
        break

      case 'auth/weak-password':
        setError(
          'La contraseña es demasiado débil.'
        )
        break

      default:
        setError(
          'No pudimos crear tu cuenta. Intentá nuevamente.'
        )
    }

  } finally {
    setLoading(false)
  }
}

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

      {/* LEFT PANEL */}

      <div className="relative hidden w-1/2 flex-col justify-between border-r border-white/10 p-10 lg:flex">

        <Link
          to="/"
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

        </Link>

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

            Creá tu

            <br />

            <span className="text-[#ff6a00]">
              cuenta.
            </span>

          </h1>

          <p className="mt-7 max-w-md text-sm leading-7 text-white/40">
            Registrate para poder consultar el
            estado de tu vehículo, tus servicios
            y todo el historial de mantenimiento.
          </p>

        </div>

        <div>

          <div className="h-px w-16 bg-[#ff6a00]" />

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">
            Tu vehículo en las mejores manos
          </p>

        </div>

      </div>

      {/* REGISTER */}

      <div className="relative flex min-h-screen w-full items-center justify-center px-5 py-12 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}

          <div className="mb-10 lg:hidden">

            <Link
              to="/"
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

            </Link>

          </div>

          {/* HEADER */}

          <div>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ff6a00]">
              Portal de clientes
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Crear cuenta
            </h2>

            <p className="mt-3 text-sm text-white/40">
              Completá tus datos para solicitar acceso.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-7 flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <p>
                {error}
              </p>

            </div>
          )}

          {/* FORM */}

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit}
          >

            {/* NAME */}

            <div>

              <label
                htmlFor="name"
                className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40"
              >
                Nombre y apellido
              </label>

              <div className="relative">

                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  disabled={loading}
                  className="h-14 w-full border border-white/10 bg-[#111] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40"
              >
                Correo electrónico
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="tu@email.com"
                  autoComplete="email"
                  disabled={loading}
                  className="h-14 w-full border border-white/10 bg-[#111] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40"
              >
                Contraseña
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-14 w-full border border-white/10 bg-[#111] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
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

            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40"
              >
                Repetir contraseña
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-14 w-full border border-white/10 bg-[#111] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-[#ff6a00]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-3 bg-[#ff6a00] text-sm font-black uppercase tracking-wide text-black transition hover:bg-[#ff7b1a] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}

            </button>

          </form>

          {/* LOGIN */}

          <p className="mt-8 text-center text-sm text-white/35">

            ¿Ya tenés una cuenta?

            <Link
              to="/login"
              className="ml-1 font-bold text-[#ff6a00] transition hover:text-[#ff7b1a]"
            >
              Iniciá sesión
            </Link>

          </p>

          {/* BACK */}

          <Link
            to="/"
            className="mx-auto mt-8 flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/25 transition hover:text-[#ff6a00]"
          >

            <ArrowLeft size={14} />

            Volver al inicio

          </Link>

        </div>

      </div>

    </main>
  )
}

export default Register