import {
    CalendarDays,
    Car,
    ChevronRight,
    Clock3,
    DollarSign,
    FileText,
    Gauge,
    Plus,
    UserRound,
    Users,
    Wrench,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    ClipboardList,
    CircleDollarSign,
    Cog,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";

const DashboardAdmin = () => {
    const stats = [
        {
            title: "Turnos de hoy",
            value: "12",
            change: "+8.2%",
            positive: true,
            icon: CalendarDays,
            description: "vs. ayer",
        },
        {
            title: "Vehículos en taller",
            value: "8",
            change: "+2",
            positive: true,
            icon: Car,
            description: "esta semana",
        },
        {
            title: "Ingresos del mes",
            value: "$2.485.000",
            change: "+14.5%",
            positive: true,
            icon: CircleDollarSign,
            description: "vs. mes anterior",
        },
        {
            title: "Clientes activos",
            value: "184",
            change: "+6.4%",
            positive: true,
            icon: Users,
            description: "últimos 30 días",
        },
    ];

    const appointments = [
        {
            time: "08:30",
            client: "Carlos Rodríguez",
            vehicle: "Toyota Corolla",
            plate: "AE 452 KM",
            service: "Service completo",
            status: "En espera",
        },
        {
            time: "09:15",
            client: "María González",
            vehicle: "Volkswagen Polo",
            plate: "AF 781 RT",
            service: "Cambio de aceite",
            status: "En taller",
        },
        {
            time: "10:30",
            client: "Lucas Fernández",
            vehicle: "Ford Ranger",
            plate: "AC 234 LP",
            service: "Diagnóstico",
            status: "Confirmado",
        },
        {
            time: "11:45",
            client: "Sofía Martínez",
            vehicle: "Chevrolet Cruze",
            plate: "AD 918 QW",
            service: "Frenos",
            status: "Confirmado",
        },
        {
            time: "13:00",
            client: "Diego Sánchez",
            vehicle: "Renault Sandero",
            plate: "AE 663 JK",
            service: "Alineación",
            status: "Confirmado",
        },
    ];

    const recentActivity = [
        {
            icon: CheckCircle2,
            title: "Servicio finalizado",
            description: "Toyota Corolla · Service completo",
            time: "Hace 15 min",
            type: "success",
        },
        {
            icon: UserRound,
            title: "Nuevo cliente registrado",
            description: "Martín Pérez",
            time: "Hace 32 min",
            type: "user",
        },
        {
            icon: FileText,
            title: "Presupuesto generado",
            description: "Presupuesto #00482 · $185.000",
            time: "Hace 1 hora",
            type: "document",
        },
        {
            icon: DollarSign,
            title: "Pago recibido",
            description: "Factura #00391 · $96.500",
            time: "Hace 2 horas",
            type: "payment",
        },
        {
            icon: AlertCircle,
            title: "Revisión pendiente",
            description: "Ford Ranger · Diagnóstico",
            time: "Hace 3 horas",
            type: "warning",
        },
    ];

    const workshopStatus = [
        {
            number: "01",
            vehicle: "Volkswagen Polo",
            plate: "AF 781 RT",
            service: "Cambio de aceite",
            progress: 75,
            mechanic: "J. Gómez",
        },
        {
            number: "02",
            vehicle: "Toyota Corolla",
            plate: "AE 452 KM",
            service: "Service completo",
            progress: 45,
            mechanic: "M. López",
        },
        {
            number: "03",
            vehicle: "Ford Ranger",
            plate: "AC 234 LP",
            service: "Diagnóstico",
            progress: 25,
            mechanic: "R. Díaz",
        },
        {
            number: "04",
            vehicle: "Chevrolet Cruze",
            plate: "AD 918 QW",
            service: "Frenos",
            progress: 60,
            mechanic: "A. Torres",
        },
    ];

    const quickActions = [
        {
            title: "Nuevo turno",
            description: "Agendar una cita",
            icon: CalendarDays,
        },
        {
            title: "Nuevo cliente",
            description: "Registrar cliente",
            icon: UserRound,
        },
        {
            title: "Nuevo vehículo",
            description: "Agregar vehículo",
            icon: Car,
        },
        {
            title: "Crear presupuesto",
            description: "Generar presupuesto",
            icon: FileText,
        },
    ];

    return (
        <AdminLayout>
            <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">

                {/* PAGE HEADING */}
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-1 text-sm font-medium text-blue-600">
                            Resumen general
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Vista general del funcionamiento del taller.
                        </p>
                    </div>

                    <button className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                        <Plus size={18} />
                        Nuevo turno
                    </button>
                </div>

                {/* STATS */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.title}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {stat.title}
                                        </p>

                                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                            {stat.value}
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Icon size={20} />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                            stat.positive
                                                ? "text-emerald-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {stat.positive ? (
                                            <ArrowUpRight size={14} />
                                        ) : (
                                            <ArrowDownRight size={14} />
                                        )}

                                        {stat.change}
                                    </span>

                                    <span className="text-xs text-slate-400">
                                        {stat.description}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* QUICK ACTIONS */}
                <section className="mt-7">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900">
                            Acciones rápidas
                        </h3>

                        <p className="text-sm text-slate-500">
                            Accedé rápidamente a las funciones principales.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={action.title}
                                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white">
                                        <Icon size={20} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {action.title}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>

                                    <ChevronRight
                                        size={17}
                                        className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                                    />
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* MAIN GRID */}
                <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)]">

                    {/* APPOINTMENTS */}
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Próximos turnos
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Turnos programados para hoy.
                                </p>
                            </div>

                            <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                                Ver todos
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px]">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Hora
                                        </th>

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Cliente
                                        </th>

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Vehículo
                                        </th>

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Servicio
                                        </th>

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Estado
                                        </th>

                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>

                                <tbody>
                                    {appointments.map((appointment, index) => (
                                        <tr
                                            key={`${appointment.time}-${appointment.client}`}
                                            className={`transition hover:bg-slate-50 ${
                                                index !== appointments.length - 1
                                                    ? "border-b border-slate-100"
                                                    : ""
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock3
                                                        size={15}
                                                        className="text-slate-400"
                                                    />

                                                    <span className="text-sm font-semibold text-slate-900">
                                                        {appointment.time}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {appointment.client}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {appointment.vehicle}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {appointment.plate}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="text-sm text-slate-600">
                                                    {appointment.service}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                        appointment.status === "En taller"
                                                            ? "bg-blue-50 text-blue-700"
                                                            : appointment.status === "En espera"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-emerald-50 text-emerald-700"
                                                    }`}
                                                >
                                                    {appointment.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ACTIVITY */}
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Actividad reciente
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Últimos movimientos.
                                </p>
                            </div>

                            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <MoreHorizontal size={19} />
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {recentActivity.map((activity) => {
                                const Icon = activity.icon;

                                return (
                                    <div
                                        key={`${activity.title}-${activity.time}`}
                                        className="flex gap-3 p-4 transition hover:bg-slate-50"
                                    >
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                activity.type === "success"
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : activity.type === "warning"
                                                        ? "bg-amber-50 text-amber-600"
                                                        : activity.type === "payment"
                                                            ? "bg-blue-50 text-blue-600"
                                                            : activity.type === "document"
                                                                ? "bg-violet-50 text-violet-600"
                                                                : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            <Icon size={17} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {activity.title}
                                            </p>

                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                {activity.description}
                                            </p>

                                            <p className="mt-1 text-[11px] text-slate-400">
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-slate-100 p-4">
                            <button className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                                Ver toda la actividad
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </section>
                </div>

                {/* WORKSHOP + FINANCE */}
                <div className="mt-7 grid gap-7 lg:grid-cols-2">

                    {/* WORKSHOP */}
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Vehículos en taller
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Estado actual de los trabajos.
                                </p>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Wrench size={18} />
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {workshopStatus.map((vehicle) => (
                                <div key={vehicle.number} className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                                            {vehicle.number}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {vehicle.vehicle}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {vehicle.plate}
                                                    </p>
                                                </div>

                                                <span className="text-xs font-medium text-slate-500">
                                                    Mecánico: {vehicle.mechanic}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-xs text-slate-500">
                                                    {vehicle.service}
                                                </span>

                                                <span className="text-xs font-bold text-blue-600">
                                                    {vehicle.progress}%
                                                </span>
                                            </div>

                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-blue-600 transition-all"
                                                    style={{
                                                        width: `${vehicle.progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-slate-100 p-4">
                            <button className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                                Ver todos los vehículos
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </section>

                    {/* FINANCE */}
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Resumen financiero
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Rendimiento del mes actual.
                                </p>
                            </div>

                            <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                                Septiembre 2026
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="rounded-2xl bg-slate-950 p-5 text-white">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">
                                            Ingresos totales
                                        </p>

                                        <p className="mt-2 text-3xl font-bold tracking-tight">
                                            $2.485.000
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                        <DollarSign size={20} />
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                        <ArrowUpRight size={14} />
                                        14.5%
                                    </span>

                                    <span className="text-xs text-slate-500">
                                        respecto al mes anterior
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                            <ArrowUpRight size={16} />
                                        </div>

                                        <span className="text-xs font-medium text-slate-500">
                                            Cobrado
                                        </span>
                                    </div>

                                    <p className="mt-3 text-lg font-bold text-slate-900">
                                        $2.120.000
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                            <Clock3 size={16} />
                                        </div>

                                        <span className="text-xs font-medium text-slate-500">
                                            Pendiente
                                        </span>
                                    </div>

                                    <p className="mt-3 text-lg font-bold text-slate-900">
                                        $365.000
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500">
                                        Objetivo mensual
                                    </span>

                                    <span className="text-xs font-bold text-slate-700">
                                        82%
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{ width: "82%" }}
                                    />
                                </div>

                                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                                    <span>$2.120.000</span>
                                    <span>Objetivo: $2.600.000</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* BOTTOM CARDS */}
                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <ClipboardList size={20} />
                            </div>

                            <ArrowUpRight
                                size={18}
                                className="text-emerald-500"
                            />
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Presupuestos pendientes
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            17
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            5 creados esta semana
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Clock3 size={20} />
                            </div>

                            <span className="text-xs font-bold text-amber-600">
                                Atención
                            </span>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Turnos pendientes
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            6
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Requieren confirmación
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Gauge size={20} />
                            </div>

                            <span className="text-xs font-bold text-emerald-600">
                                Excelente
                            </span>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Servicios completados
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            94
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Durante septiembre
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Cog size={20} />
                            </div>

                            <span className="text-xs font-bold text-blue-600">
                                92%
                            </span>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Eficiencia del taller
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            92%
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Rendimiento general
                        </p>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="mt-10 border-t border-slate-200 py-6">
                    <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
                        <p>
                            © 2026 Mora Mecánica. Panel administrativo.
                        </p>

                        <div className="flex gap-4">
                            <span>Soporte</span>
                            <span>Privacidad</span>
                            <span>Versión 1.0.0</span>
                        </div>
                    </div>
                </footer>
            </div>
        </AdminLayout>
    );
};

export default DashboardAdmin;