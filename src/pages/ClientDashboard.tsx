import {
    CalendarDays,
    Car,
    CheckCircle2,
    ChevronRight,
    FileText,
    Gauge,
    LogOut,
    Receipt,
    Settings2,
    ShieldCheck,
    Wrench,
} from 'lucide-react'

import {
    collection,
    getDocs,
    query,
    where,
} from 'firebase/firestore'

import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'

interface UserData {
    uid: string
    nombre: string
    email: string
    rol: string
    activo: boolean
}

interface Vehicle {
    id: string
    marca: string
    modelo: string
    anio: number
    patente: string
    color: string
    kilometraje: number
    clienteId: string | null
    clienteNombre: string
    ultimoServicio: any
    proximoServicio: any
    estado: 'Activo' | 'En taller' | 'Inactivo'
    observaciones: string
    creadoEn: any
    imagenUrl: string
    imagenPath: string
}

function ClientDashboard() {
    const { logout, user } = useAuth()

    const [userData, setUserData] = useState<UserData | null>(null)
    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [loading, setLoading] = useState(true)

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Error al cerrar sesión:', error)
        }
    }

    useEffect(() => {
        const cargarDatos = async () => {
            if (!user?.uid) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)

                /* =========================
                   USUARIO
                ========================= */

                const usuariosSnapshot = await getDocs(
                    query(
                        collection(db, 'usuarios'),
                        where('__name__', '==', user.uid)
                    )
                )

                if (!usuariosSnapshot.empty) {
                    const userDoc = usuariosSnapshot.docs[0]
                    const data = userDoc.data()

                    setUserData({
                        uid: userDoc.id,
                        nombre: data.nombre ?? user.displayName ?? 'Cliente',
                        email: data.email ?? user.email ?? '',
                        rol: data.rol ?? 'cliente',
                        activo: data.activo ?? false,
                    })
                } else {
                    setUserData({
                        uid: user.uid,
                        nombre: user.displayName ?? 'Cliente',
                        email: user.email ?? '',
                        rol: 'cliente',
                        activo: true,
                    })
                }

                /* =========================
                   VEHÍCULO
                ========================= */

                const vehiculosSnapshot = await getDocs(
                    query(
                        collection(db, 'vehiculos'),
                        where('clienteId', '==', user.uid)
                    )
                )

                if (!vehiculosSnapshot.empty) {
                    const vehicleDoc = vehiculosSnapshot.docs[0]
                    const data = vehicleDoc.data()

                    setVehicle({
                        id: vehicleDoc.id,
                        marca: data.marca ?? '',
                        modelo: data.modelo ?? '',
                        anio: Number(data.anio ?? 0),
                        patente: data.patente ?? '',
                        color: data.color ?? '',
                        kilometraje: Number(data.kilometraje ?? 0),
                        clienteId: data.clienteId ?? null,
                        clienteNombre: data.clienteNombre ?? '',
                        ultimoServicio: data.ultimoServicio ?? null,
                        proximoServicio: data.proximoServicio ?? null,
                        estado: data.estado ?? 'Activo',
                        observaciones: data.observaciones ?? '',
                        creadoEn: data.creadoEn ?? null,
                        imagenUrl: data.imagenUrl ?? '',
                        imagenPath: data.imagenPath ?? '',
                    })
                } else {
                    setVehicle(null)
                }
            } catch (error) {
                console.error('Error cargando datos del cliente:', error)
            } finally {
                setLoading(false)
            }
        }

        cargarDatos()
    }, [user])

    /* =========================
       DATOS DERIVADOS
    ========================= */

    const nombre = userData?.nombre || user?.displayName || 'Cliente'

    const iniciales = useMemo(() => {
        return nombre
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte.charAt(0).toUpperCase())
            .join('')
    }, [nombre])

    const nombreVehiculo = vehicle
        ? `${vehicle.marca} ${vehicle.modelo}`.trim()
        : 'Sin vehículo registrado'

    const kilometraje = vehicle?.kilometraje
        ? `${vehicle.kilometraje.toLocaleString('es-AR')} km`
        : 'Sin registrar'

    const patente = vehicle?.patente || 'Sin registrar'

    const anio = vehicle?.anio
        ? `${vehicle.anio}`
        : 'Año no registrado'

    const estadoTexto = (() => {
        if (!vehicle) return 'Sin vehículo'

        switch (vehicle.estado) {
            case 'En taller':
                return 'En taller'

            case 'Inactivo':
                return 'Inactivo'

            default:
                return 'Activo'
        }
    })()

    const estadoColor = (() => {
        if (!vehicle) return 'bg-white/30'

        switch (vehicle.estado) {
            case 'En taller':
                return 'bg-orange-400'

            case 'Inactivo':
                return 'bg-red-400'

            default:
                return 'bg-emerald-400'
        }
    })()

    const ultimoServicioTexto = formatDate(vehicle?.ultimoServicio)

    const proximoServicioTexto = formatDate(vehicle?.proximoServicio)

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#08090a] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />

                    <p className="text-sm text-white/40">
                        Cargando tu información...
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#08090a] text-white">

            {/* HEADER */}

            <header className="border-b border-white/[0.06] bg-[#0b0c0e]">
                <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-10">

                    {/* LOGO */}

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-500">
                            Mora Mecánica
                        </p>

                        <h1 className="mt-1 text-xl font-semibold tracking-tight">
                            Mi vehículo
                        </h1>
                    </div>

                    {/* USER */}

                    <div className="flex items-center gap-3">

                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-white">
                                {nombre}
                            </p>

                            <p className="text-xs text-white/40">
                                Cliente
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-sm font-bold text-orange-400">
                            {iniciales}
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Cerrar sesión"
                            className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] text-white/40 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut size={17} />
                        </button>

                    </div>
                </div>
            </header>

            {/* CONTENT */}

            <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">

                {/* WELCOME */}

                <section className="mb-8">

                    <p className="text-sm text-white/40">
                        Bienvenido nuevamente
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Hola, {nombre.split(' ')[0]} 👋
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                        Desde aquí podés consultar el estado de tu vehículo,
                        próximos turnos, servicios y presupuestos.
                    </p>

                </section>

                {/* VEHICLE */}

                {vehicle ? (
                    <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#101214]">

                        <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/[0.07] blur-[100px]" />

                        <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-orange-500/[0.04] blur-[100px]" />

                        <div className="relative grid min-h-[480px] lg:grid-cols-[0.8fr_1.4fr_0.8fr]">

                            {/* LEFT */}

                            <div className="flex flex-col justify-center p-7 sm:p-10">

                                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                                    <Car size={21} />
                                </div>

                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                                    Mi vehículo
                                </p>

                                <h3 className="mt-2 text-3xl font-semibold tracking-tight">
                                    {nombreVehiculo}
                                </h3>

                                <p className="mt-1 text-sm text-white/40">
                                    {anio}
                                    {vehicle.color && ` · ${vehicle.color}`}
                                </p>

                                <div className="mt-7 space-y-4">

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                                            <Gauge size={16} className="text-white/50" />
                                        </div>

                                        <div>
                                            <p className="text-[11px] text-white/30">
                                                Kilometraje
                                            </p>

                                            <p className="text-sm font-medium">
                                                {kilometraje}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                                            <Settings2 size={16} className="text-white/50" />
                                        </div>

                                        <div>
                                            <p className="text-[11px] text-white/30">
                                                Patente
                                            </p>

                                            <p className="text-sm font-medium">
                                                {patente}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                                            <ShieldCheck size={16} className="text-white/50" />
                                        </div>

                                        <div>
                                            <p className="text-[11px] text-white/30">
                                                Último servicio
                                            </p>

                                            <p className="text-sm font-medium">
                                                {ultimoServicioTexto}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* IMAGE */}

                            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden">

                                <div className="absolute bottom-16 left-1/2 h-16 w-[75%] -translate-x-1/2 rounded-[50%] bg-black/90 blur-2xl" />

                                {vehicle.imagenUrl ? (
                                    <img
                                        src={vehicle.imagenUrl}
                                        alt={nombreVehiculo}
                                        className="relative z-10 max-h-[420px] w-[95%] max-w-[650px] object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,0.75)]"
                                    />
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center justify-center text-white/20">
                                        <Car size={100} strokeWidth={1} />

                                        <p className="mt-4 text-sm">
                                            Sin imagen del vehículo
                                        </p>
                                    </div>
                                )}

                                <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 backdrop-blur-md">
                                    Vehículo registrado
                                </div>

                            </div>

                            {/* STATUS */}

                            <div className="flex flex-col justify-center border-t border-white/[0.06] p-7 sm:p-10 lg:border-l lg:border-t-0">

                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                                    Estado actual
                                </p>

                                <div className="mt-4 flex items-center gap-3">

                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${estadoColor}`}
                                    />

                                    <span className="text-lg font-semibold">
                                        {estadoTexto}
                                    </span>

                                </div>

                                <p className="mt-3 text-sm leading-6 text-white/40">
                                    {vehicle.observaciones ||
                                        'No hay observaciones registradas para tu vehículo.'}
                                </p>

                                <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">

                                    <div className="flex items-center justify-between">

                                        <span className="text-xs text-white/40">
                                            Próximo mantenimiento
                                        </span>

                                        <Wrench
                                            size={15}
                                            className="text-orange-500"
                                        />

                                    </div>

                                    <p className="mt-2 text-sm font-semibold">
                                        {proximoServicioTexto}
                                    </p>

                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                        <div className="h-full w-[78%] rounded-full bg-orange-500" />
                                    </div>

                                    <div className="mt-2 flex justify-between text-[10px] text-white/30">
                                        <span>{kilometraje}</span>
                                        <span>Próximo servicio</span>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </section>
                ) : (
                    <section className="mb-8 rounded-3xl border border-white/[0.07] bg-[#101214] p-10 text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                            <Car size={28} />
                        </div>

                        <h3 className="mt-5 text-xl font-semibold">
                            No tenés vehículos registrados
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                            Cuando Mora Mecánica registre un vehículo asociado
                            a tu cuenta, vas a poder verlo desde acá.
                        </p>

                    </section>
                )}

                {/* SUMMARY */}

                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <SummaryCard
                        icon={<CalendarDays size={19} />}
                        label="Próximo turno"
                        value="Sin turnos"
                        description="Todavía no tenés turnos"
                        accent
                    />

                    <SummaryCard
                        icon={<Wrench size={19} />}
                        label="Servicios realizados"
                        value="0"
                        description="Historial"
                    />

                    <SummaryCard
                        icon={<FileText size={19} />}
                        label="Presupuestos"
                        value="0"
                        description="Sin presupuestos pendientes"
                    />

                    <SummaryCard
                        icon={<Receipt size={19} />}
                        label="Pagos pendientes"
                        value="$0"
                        description="Sin pagos pendientes"
                    />

                </section>

                {/* LOWER GRID */}

                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">

                    {/* LEFT */}

                    <div className="space-y-6">

                        {/* NEXT APPOINTMENT */}

                        <section className="rounded-3xl border border-white/[0.07] bg-[#101214] p-6 sm:p-7">

                            <div className="flex items-center justify-between">

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                                        Próximo turno
                                    </p>

                                    <h3 className="mt-1 text-xl font-semibold">
                                        Sin turnos registrados
                                    </h3>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                                    <CalendarDays size={18} />
                                </div>

                            </div>

                            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6 text-center">

                                <CalendarDays
                                    size={30}
                                    className="mx-auto text-white/20"
                                />

                                <p className="mt-3 text-sm text-white/40">
                                    No hay un próximo turno registrado.
                                </p>

                            </div>

                            <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row">

                                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400">
                                    Solicitar turno
                                    <ChevronRight size={16} />
                                </button>

                            </div>

                        </section>

                        {/* SERVICE HISTORY */}

                        <section className="rounded-3xl border border-white/[0.07] bg-[#101214] p-6 sm:p-7">

                            <div className="flex items-center justify-between">

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/30">
                                        Historial
                                    </p>

                                    <h3 className="mt-1 text-xl font-semibold">
                                        Últimos servicios
                                    </h3>
                                </div>

                                <button className="text-xs font-medium text-orange-500 transition hover:text-orange-400">
                                    Ver todo
                                </button>

                            </div>

                            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6 text-center">

                                <Wrench
                                    size={28}
                                    className="mx-auto text-white/20"
                                />

                                <p className="mt-3 text-sm text-white/40">
                                    Todavía no hay servicios registrados.
                                </p>

                            </div>

                        </section>

                    </div>

                    {/* RIGHT */}

                    <div className="space-y-6">

                        {/* BUDGET */}

                        <section className="rounded-3xl border border-orange-500/20 bg-orange-500/[0.04] p-6">

                            <div className="flex items-center justify-between">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                                    <FileText size={18} />
                                </div>

                                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                                    Sin pendientes
                                </span>

                            </div>

                            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-white/30">
                                Presupuestos
                            </p>

                            <h3 className="mt-2 text-2xl font-semibold">
                                Sin presupuestos
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-white/40">
                                No tenés presupuestos pendientes de aprobación.
                            </p>

                        </section>

                        {/* QUICK ACTIONS */}

                        <section className="rounded-3xl border border-white/[0.07] bg-[#101214] p-6">

                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/30">
                                Acciones rápidas
                            </p>

                            <div className="mt-4 space-y-2">

                                <QuickAction
                                    icon={<CalendarDays size={17} />}
                                    title="Solicitar turno"
                                />

                                <QuickAction
                                    icon={<Car size={17} />}
                                    title="Mis vehículos"
                                />

                                <QuickAction
                                    icon={<FileText size={17} />}
                                    title="Mis presupuestos"
                                />

                                <QuickAction
                                    icon={<Receipt size={17} />}
                                    title="Pagos y comprobantes"
                                />

                            </div>
                        </section>

                        {/* WORKSHOP STATUS */}

                        <section className="rounded-3xl border border-white/[0.07] bg-[#101214] p-6">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                    <CheckCircle2 size={18} />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold">
                                        Taller operativo
                                    </p>

                                    <p className="text-xs text-white/35">
                                        Estamos atendiendo normalmente
                                    </p>
                                </div>

                            </div>

                            <div className="mt-5 rounded-xl bg-white/[0.025] p-4">

                                <div className="flex items-center justify-between text-xs">

                                    <span className="text-white/35">
                                        Horario de atención
                                    </span>

                                    <span className="font-medium text-white/70">
                                        08:00 — 18:00
                                    </span>

                                </div>

                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    )
}

/* ============================================================
   HELPERS
============================================================ */

function formatDate(value: any): string {
    if (!value) return 'Sin registrar'

    try {
        let date: Date

        if (value?.toDate) {
            date = value.toDate()
        } else if (value instanceof Date) {
            date = value
        } else if (typeof value === 'string') {
            date = new Date(value)
        } else if (typeof value === 'number') {
            date = new Date(value)
        } else if (value?.seconds) {
            date = new Date(value.seconds * 1000)
        } else {
            return 'Sin registrar'
        }

        if (Number.isNaN(date.getTime())) {
            return 'Sin registrar'
        }

        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
    } catch {
        return 'Sin registrar'
    }
}

/* ============================================================
   COMPONENTS
============================================================ */

interface SummaryCardProps {
    icon: React.ReactNode
    label: string
    value: string
    description: string
    accent?: boolean
}

function SummaryCard({
    icon,
    label,
    value,
    description,
    accent = false,
}: SummaryCardProps) {
    return (
        <div className="rounded-2xl border border-white/[0.07] bg-[#101214] p-5 transition hover:border-white/[0.12]">

            <div className="flex items-center justify-between">

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        accent
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-white/[0.04] text-white/50'
                    }`}
                >
                    {icon}
                </div>

                {accent && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                )}

            </div>

            <p className="mt-5 text-xs text-white/35">
                {label}
            </p>

            <p className="mt-1 text-xl font-semibold tracking-tight">
                {value}
            </p>

            <p className="mt-1 text-xs text-white/30">
                {description}
            </p>

        </div>
    )
}

interface QuickActionProps {
    icon: React.ReactNode
    title: string
}

function QuickAction({
    icon,
    title,
}: QuickActionProps) {
    return (
        <button className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-white/[0.06] hover:bg-white/[0.025]">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/45 transition group-hover:bg-orange-500/10 group-hover:text-orange-500">
                {icon}
            </div>

            <span className="flex-1 text-sm text-white/65 transition group-hover:text-white">
                {title}
            </span>

            <ChevronRight
                size={15}
                className="text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50"
            />

        </button>
    )
}

export default ClientDashboard