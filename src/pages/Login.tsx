
import {
    ArrowLeft,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Wrench,
    Loader2,
    AlertCircle,
} from 'lucide-react'

import { useState } from 'react'
import type { FormEvent } from 'react'

import {
    useNavigate,
    Link,
} from 'react-router-dom'

import { loginWithGoogle } from '../services/auth'
import { useAuth } from '../context/AuthContext'

function Login() {
    const navigate = useNavigate()

    const { login } = useAuth()

    const [showPassword, setShowPassword] =
        useState(false)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRoleRedirect = (
        rol: string | null
    ) => {
        console.log('================================')
        console.log('🚀 REDIRECCIÓN POR ROL')
        console.log('ROL RECIBIDO:', rol)
        console.log('================================')

        switch (rol) {
            case 'admin':
                navigate('/admin', {
                    replace: true,
                })
                break

            case 'empleado':
                navigate('/empleado', {
                    replace: true,
                })
                break

            case 'cliente':
                navigate('/cliente', {
                    replace: true,
                })
                break

            default:
                console.error(
                    '❌ ROL INVÁLIDO:',
                    rol
                )

                setError(
                    'Tu usuario inició sesión correctamente, pero no tiene un rol válido asignado.'
                )
        }
    }

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        setError('')

        if (!email.trim() || !password.trim()) {
            setError(
                'Ingresá tu correo electrónico y contraseña.'
            )

            return
        }

        try {
            setLoading(true)

            console.log('================================')
            console.log('🔐 INICIANDO LOGIN')
            console.log('EMAIL:', email.trim())
            console.log('================================')

            const result = await login(
                email.trim(),
                password
            )

            console.log('================================')
            console.log('✅ LOGIN EXITOSO')
            console.log('RESULTADO COMPLETO:', result)
            console.log('UID:', result.user?.uid)
            console.log('ROL:', result.rol)
            console.log('ACTIVO:', result.activo)
            console.log(
                'TIPO ACTIVO:',
                typeof result.activo
            )
            console.log('================================')

            /*
             * CUENTA INACTIVA
             *
             * Solamente entra acá si:
             *
             * result.activo !== true
             */

            if (result.activo !== true) {
                console.warn(
                    '⚠️ USUARIO INACTIVO'
                )

                navigate(
                    '/registro-pendiente',
                    {
                        replace: true,
                    }
                )

                return
            }

            /*
             * CUENTA ACTIVA
             *
             * Redirigimos según el rol.
             */

            console.log(
                '🟢 USUARIO ACTIVO. REDIRIGIENDO...'
            )

            handleRoleRedirect(
                result.rol
            )

        } catch (error: any) {
            console.error(
                '================================'
            )

            console.error(
                '❌ ERROR AL INICIAR SESIÓN:',
                error
            )

            console.error(
                'CÓDIGO:',
                error?.code
            )

            console.error(
                'MENSAJE:',
                error?.message
            )

            console.error(
                '================================'
            )

            const errorCode =
                error?.code ||
                error?.message

            switch (errorCode) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    setError(
                        'El correo o la contraseña son incorrectos.'
                    )
                    break

                case 'auth/invalid-email':
                    setError(
                        'El correo electrónico no es válido.'
                    )
                    break

                case 'auth/user-disabled':
                    setError(
                        'Esta cuenta se encuentra deshabilitada.'
                    )
                    break

                case 'auth/too-many-requests':
                    setError(
                        'Demasiados intentos. Esperá unos minutos e intentá nuevamente.'
                    )
                    break

                case 'USER_DATA_NOT_FOUND':
                    setError(
                        'No encontramos la información de tu usuario. Contactá al administrador.'
                    )
                    break

                case 'USER_ROLE_INVALID':
                    setError(
                        'Tu usuario no tiene un rol válido asignado. Contactá al administrador.'
                    )
                    break

                default:
                    setError(
                        'No pudimos iniciar sesión. Intentá nuevamente.'
                    )
            }

        } finally {
            setLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setError('')

        try {
            setLoading(true)

            console.log('================================')
            console.log('🔐 LOGIN CON GOOGLE')
            console.log('================================')

            const result =
                await loginWithGoogle()

            console.log('================================')
            console.log(
                '✅ LOGIN GOOGLE EXITOSO'
            )
            console.log(
                'RESULTADO:',
                result
            )
            console.log(
                'ROL GOOGLE:',
                result.rol
            )
            console.log(
                'ACTIVO GOOGLE:',
                result.activo
            )
            console.log('================================')

            /*
             * Por seguridad también verificamos
             * que la cuenta esté activa.
             */

            if (result.activo !== true) {
                console.warn(
                    '⚠️ USUARIO GOOGLE INACTIVO'
                )

                navigate(
                    '/registro-pendiente',
                    {
                        replace: true,
                    }
                )

                return
            }

            handleRoleRedirect(
                result.rol
            )

        } catch (error: any) {
            console.error(
                'ERROR GOOGLE LOGIN:',
                error
            )

            if (
                error?.code !==
                'auth/popup-closed-by-user'
            ) {
                setError(
                    'No pudimos autenticarte con Google. Intentá nuevamente.'
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

            {/* LEFT BRAND PANEL */}

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
                        Tu vehículo.
                        <br />
                        <span className="text-[#ff6a00]">
                            Bajo control.
                        </span>
                    </h1>

                    <p className="mt-7 max-w-md text-sm leading-7 text-white/40">
                        Consultá el estado de tu vehículo,
                        revisá los servicios realizados y
                        mantené todo su historial al alcance
                        de tu mano.
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
                            Iniciar sesión
                        </h2>

                        <p className="mt-3 text-sm text-white/40">
                            Ingresá para consultar la información de tu vehículo.
                        </p>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="mt-7 flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">

                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />

                            <p>{error}</p>

                        </div>
                    )}

                    {/* FORM */}

                    <form
                        className="mt-10 space-y-5"
                        onSubmit={handleSubmit}
                    >

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
                                    id="password"
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
                                    autoComplete="current-password"
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-50"
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
                                disabled={loading}
                                className="text-xs font-semibold text-white/40 transition hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>

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

                                    Ingresando...
                                </>
                            ) : (
                                'Ingresar'
                            )}

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
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="flex h-14 w-full items-center justify-center gap-3 border border-white/10 bg-[#111] text-sm font-bold transition hover:border-white/20 hover:bg-[#151515] disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-black">
                            G
                        </span>

                        Continuar con Google

                    </button>

                    {/* REGISTER */}

                    <p className="mt-8 text-center text-sm text-white/35">

                        ¿Todavía no tenés una cuenta?

                        <Link
                            to="/register"
                            className="ml-1 font-bold text-[#ff6a00] transition hover:text-[#ff7b1a]"
                        >
                            Registrate
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

export default Login
