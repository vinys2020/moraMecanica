import {
    CalendarDays,
    Car,
    ChevronRight,
    Clock3,
    DollarSign,
    FileText,
    Gauge,
    UserRound,
    Users,
    Wrench,
    ArrowUpRight,
    MoreHorizontal,
    ClipboardList,
    CircleDollarSign,
    Cog,
    Loader2,
} from "lucide-react";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import { db } from "../config/firebase";

/* =========================================================
   TIPOS
========================================================= */

interface FirestoreItem {
    id: string;
    [key: string]: any;
}

interface DashboardAppointment {
    id: string;
    time: string;
    client: string;
    vehicle: string;
    plate: string;
    service: string;
    status: string;
}

interface DashboardActivity {
    id: string;
    icon: any;
    title: string;
    description: string;
    date: Date;
    type: "success" | "user" | "document" | "payment" | "warning";
}

interface WorkshopVehicle {
    id: string;
    vehicle: string;
    plate: string;
    service: string;
    progress: number;
    mechanic: string;
}

/* =========================================================
   HELPERS
========================================================= */

const getDateFromValue = (value: any): Date | null => {
    if (!value) return null;

    if (value?.toDate) {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "number") {
        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    if (typeof value === "string") {
        // YYYY-MM-DD
        const dateOnlyMatch =
            /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

        if (dateOnlyMatch) {
            const [, year, month, day] =
                dateOnlyMatch;

            return new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );
        }

        // YYYY-MM-DD HH:mm
        const dateTimeMatch =
            /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/.exec(
                value
            );

        if (dateTimeMatch) {
            const [
                ,
                year,
                month,
                day,
                hours,
                minutes,
            ] = dateTimeMatch;

            return new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hours),
                Number(minutes)
            );
        }

        const parsed = new Date(value);

        return Number.isNaN(parsed.getTime())
            ? null
            : parsed;
    }

    return null;
};

const getStatus = (
    item: FirestoreItem
) => {
    return (
        item.status ??
        item.estado ??
        ""
    );
};

const getAmount = (
    item: FirestoreItem
): number => {
    const value =
        item.importe ??
        item.monto ??
        item.total ??
        item.amount ??
        item.precio ??
        item.valor ??
        0;

    const number =
        typeof value === "number"
            ? value
            : Number(
                  String(value)
                      .replace(/\./g, "")
                      .replace(",", ".")
              );

    return Number.isFinite(number)
        ? number
        : 0;
};

const isSameDay = (
    dateA: Date,
    dateB: Date
) => {
    return (
        dateA.getFullYear() ===
            dateB.getFullYear() &&
        dateA.getMonth() ===
            dateB.getMonth() &&
        dateA.getDate() ===
            dateB.getDate()
    );
};

const isSameMonth = (
    date: Date,
    reference: Date
) => {
    return (
        date.getFullYear() ===
            reference.getFullYear() &&
        date.getMonth() ===
            reference.getMonth()
    );
};

const formatCurrency = (
    value: number
) => {
    return new Intl.NumberFormat(
        "es-AR",
        {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }
    ).format(value);
};

const formatActivityTime = (
    date: Date
) => {
    const now = new Date();

    const diff =
        now.getTime() -
        date.getTime();

    const minutes = Math.floor(
        diff / 60000
    );

    if (minutes < 1) {
        return "Hace unos segundos";
    }

    if (minutes < 60) {
        return `Hace ${minutes} min`;
    }

    const hours = Math.floor(
        minutes / 60
    );

    if (hours < 24) {
        return `Hace ${hours} hs`;
    }

    const days = Math.floor(
        hours / 24
    );

    if (days < 30) {
        return `Hace ${days} días`;
    }

    const months = Math.floor(
        days / 30
    );

    if (months < 12) {
        return `Hace ${months} mes${months === 1 ? "" : "es"}`;
    }

    const years = Math.floor(
        months / 12
    );

    return `Hace ${years} año${years === 1 ? "" : "s"}`;
};

/* =========================================================
   DASHBOARD
========================================================= */

const DashboardAdmin = () => {
    const [loading, setLoading] =
        useState(true);

    const [usuarios, setUsuarios] =
        useState<FirestoreItem[]>([]);

    const [vehiculos, setVehiculos] =
        useState<FirestoreItem[]>([]);

    const [turnos, setTurnos] =
        useState<FirestoreItem[]>([]);

    const [servicios, setServicios] =
        useState<FirestoreItem[]>([]);

    const [presupuestos, setPresupuestos] =
        useState<FirestoreItem[]>([]);

    const [pagos, setPagos] =
        useState<FirestoreItem[]>([]);

    /* =====================================================
       CARGAR DATOS
    ===================================================== */

    const cargarDashboard =
        async () => {
            try {
                setLoading(true);

                const [
                    usuariosSnapshot,
                    vehiculosSnapshot,
                    turnosSnapshot,
                    serviciosSnapshot,
                    presupuestosSnapshot,
                    pagosSnapshot,
                ] = await Promise.all([
                    getDocs(
                        collection(
                            db,
                            "usuarios"
                        )
                    ),

                    getDocs(
                        collection(
                            db,
                            "vehiculos"
                        )
                    ),

                    getDocs(
                        collection(
                            db,
                            "turnos"
                        )
                    ),

                    getDocs(
                        collection(
                            db,
                            "servicios"
                        )
                    ),

                    getDocs(
                        collection(
                            db,
                            "presupuestos"
                        )
                    ),

                    getDocs(
                        collection(
                            db,
                            "pagos"
                        )
                    ),
                ]);

                setUsuarios(
                    usuariosSnapshot.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    )
                );

                setVehiculos(
                    vehiculosSnapshot.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    )
                );

                setTurnos(
                    turnosSnapshot.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    )
                );

                setServicios(
                    serviciosSnapshot.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    )
                );

                setPresupuestos(
                    presupuestosSnapshot.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    )
                );

                setPagos(
                    pagosSnapshot.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    )
                );
            } catch (error) {
                console.error(
                    "Error cargando dashboard:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        cargarDashboard();
    }, []);

    /* =====================================================
       FECHA ACTUAL
    ===================================================== */

    const today = useMemo(
        () => new Date(),
        []
    );

    const monthName = today
        .toLocaleDateString(
            "es-AR",
            {
                month: "long",
                year: "numeric",
            }
        )
        .replace(/^./, (letter) =>
            letter.toUpperCase()
        );

    /* =====================================================
       MAPAS
    ===================================================== */

    const vehiclesById =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    FirestoreItem
                >();

            vehiculos.forEach(
                (vehicle) => {
                    map.set(
                        vehicle.id,
                        vehicle
                    );
                }
            );

            return map;
        }, [vehiculos]);

    const usersById =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    FirestoreItem
                >();

            usuarios.forEach((user) => {
                map.set(
                    user.id,
                    user
                );

                if (user.uid) {
                    map.set(
                        user.uid,
                        user
                    );
                }
            });

            return map;
        }, [usuarios]);

    /* =====================================================
       CLIENTES
    ===================================================== */

    const clients = useMemo(() => {
        return usuarios.filter(
            (user) =>
                user.rol ===
                "cliente"
        );
    }, [usuarios]);

    const activeClients =
        useMemo(() => {
            return clients.filter(
                (client) =>
                    client.activo !==
                        false
            );
        }, [clients]);

    /* =====================================================
       TURNOS DE HOY
    ===================================================== */

    const todayAppointments =
        useMemo(() => {
            return turnos
                .filter((turno) => {
                    const date =
                        getDateFromValue(
                            turno.date ??
                                turno.fecha
                        );

                    if (!date) {
                        return false;
                    }

                    const status =
                        getStatus(
                            turno
                        );

                    if (
                        status ===
                            "Cancelado" ||
                        status ===
                            "Finalizado"
                    ) {
                        return false;
                    }

                    return isSameDay(
                        date,
                        today
                    );
                })
                .sort(
                    (a, b) => {
                        const timeA =
                            String(
                                a.start ??
                                    a.hora ??
                                    "00:00"
                            );

                        const timeB =
                            String(
                                b.start ??
                                    b.hora ??
                                    "00:00"
                            );

                        return timeA.localeCompare(
                            timeB
                        );
                    }
                );
        }, [turnos, today]);

    /* =====================================================
       INGRESOS DEL MES
    ===================================================== */

    const monthlyPayments =
        useMemo(() => {
            return pagos.filter(
                (payment) => {
                    const date =
                        getDateFromValue(
                            payment.fecha ??
                                payment.date ??
                                payment.creadoEn
                        );

                    if (!date) {
                        return false;
                    }

                    return isSameMonth(
                        date,
                        today
                    );
                }
            );
        }, [pagos, today]);

    const monthlyIncome =
        useMemo(() => {
            return monthlyPayments.reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    getAmount(
                        payment
                    ),
                0
            );
        }, [monthlyPayments]);

    /* =====================================================
       SERVICIOS EN TALLER
    ===================================================== */

    const activeWorkshopServices =
        useMemo(() => {
            return servicios.filter(
                (service) => {
                    const status =
                        getStatus(
                            service
                        );

                    return (
                        status ===
                            "En proceso" ||
                        status ===
                            "En taller"
                    );
                }
            );
        }, [servicios]);

    /* =====================================================
       PRESUPUESTOS PENDIENTES
    ===================================================== */

    const pendingBudgets =
        useMemo(() => {
            return presupuestos.filter(
                (budget) =>
                    getStatus(
                        budget
                    ) ===
                    "Pendiente"
            );
        }, [presupuestos]);

    /* =====================================================
       SERVICIOS COMPLETADOS
    ===================================================== */

    const completedServicesMonth =
        useMemo(() => {
            return servicios.filter(
                (service) => {
                    const status =
                        getStatus(
                            service
                        );

                    if (
                        status !==
                        "Completado"
                    ) {
                        return false;
                    }

                    const date =
                        getDateFromValue(
                            service.fecha ??
                                service.date ??
                                service.creadoEn
                        );

                    if (!date) {
                        return false;
                    }

                    return isSameMonth(
                        date,
                        today
                    );
                }
            );
        }, [servicios, today]);

    /* =====================================================
       EFICIENCIA
    ===================================================== */

    const efficiency =
        useMemo(() => {
            const monthServices =
                servicios.filter(
                    (service) => {
                        const date =
                            getDateFromValue(
                                service.fecha ??
                                    service.date ??
                                    service.creadoEn
                            );

                        return (
                            date &&
                            isSameMonth(
                                date,
                                today
                            )
                        );
                    }
                );

            if (
                monthServices.length ===
                0
            ) {
                return 0;
            }

            return Math.round(
                (completedServicesMonth.length /
                    monthServices.length) *
                    100
            );
        }, [
            servicios,
            completedServicesMonth,
            today,
        ]);

    /* =====================================================
       PRÓXIMOS TURNOS PARA TABLA
    ===================================================== */

    const appointments =
        useMemo<DashboardAppointment[]>(
            () => {
                return todayAppointments
                    .slice(0, 8)
                    .map(
                        (turno) => {
                            const vehicle =
                                vehiclesById.get(
                                    turno.vehiculoId
                                );

                            const client =
                                usersById.get(
                                    turno.clienteId ??
                                        turno.usuarioId
                                );

                            return {
                                id: turno.id,

                                time:
                                    turno.start ??
                                    turno.hora ??
                                    "--:--",

                                client:
                                    turno.clienteNombre ??
                                    turno.cliente ??
                                    client?.nombre ??
                                    "Cliente",

                                vehicle:
                                    turno.vehiculo ??
                                    (vehicle
                                        ? `${vehicle.marca ?? ""} ${vehicle.modelo ?? ""}`.trim()
                                        : "Vehículo"),

                                plate:
                                    turno.patente ??
                                    turno.matricula ??
                                    vehicle?.patente ??
                                    vehicle?.matricula ??
                                    "Sin patente",

                                service:
                                    turno.servicio ??
                                    "Servicio",

                                status:
                                    getStatus(
                                        turno
                                    ) ||
                                    "En espera",
                            };
                        }
                    );
            },
            [
                todayAppointments,
                vehiclesById,
                usersById,
            ]
        );

    /* =====================================================
       ACTIVIDAD RECIENTE
    ===================================================== */

    const recentActivity =
        useMemo<
            DashboardActivity[]
        >(() => {
            const activities: DashboardActivity[] =
                [];

            /* TURNOS */

            turnos.forEach(
                (turno) => {
                    const date =
                        getDateFromValue(
                            turno.creadoEn ??
                                turno.fechaCreacion ??
                                turno.date ??
                                turno.fecha
                        );

                    if (!date) {
                        return;
                    }

                    const client =
                        turno.clienteNombre ??
                        usersById.get(
                            turno.clienteId ??
                                turno.usuarioId
                        )?.nombre ??
                        "Cliente";

                    activities.push({
                        id: `turno-${turno.id}`,
                        icon: CalendarDays,
                        title: "Nuevo turno",
                        description: `${client} · ${
                            turno.servicio ??
                            "Servicio"
                        }`,
                        date,
                        type:
                            getStatus(
                                turno
                            ) ===
                            "Confirmado"
                                ? "success"
                                : "warning",
                    });
                }
            );

            /* CLIENTES */

            clients.forEach(
                (client) => {
                    const date =
                        getDateFromValue(
                            client.creadoEn ??
                                client.createdAt
                        );

                    if (!date) {
                        return;
                    }

                    activities.push({
                        id: `cliente-${client.id}`,
                        icon: UserRound,
                        title: "Nuevo cliente registrado",
                        description:
                            client.nombre ??
                            client.email ??
                            "Cliente",
                        date,
                        type: "user",
                    });
                }
            );

            /* PRESUPUESTOS */

            presupuestos.forEach(
                (budget) => {
                    const date =
                        getDateFromValue(
                            budget.creadoEn ??
                                budget.fecha ??
                                budget.date
                        );

                    if (!date) {
                        return;
                    }

                    activities.push({
                        id: `presupuesto-${budget.id}`,
                        icon: FileText,
                        title: "Presupuesto generado",
                        description: `${
                            budget.numero ??
                            budget.id
                        } · ${formatCurrency(
                            getAmount(
                                budget
                            )
                        )}`,
                        date,
                        type: "document",
                    });
                }
            );

            /* PAGOS */

            pagos.forEach(
                (payment) => {
                    const date =
                        getDateFromValue(
                            payment.fecha ??
                                payment.date ??
                                payment.creadoEn
                        );

                    if (!date) {
                        return;
                    }

                    activities.push({
                        id: `pago-${payment.id}`,
                        icon: DollarSign,
                        title: "Pago recibido",
                        description: `${
                            payment.numero ??
                            payment.reciboNumero ??
                            "Pago"
                        } · ${formatCurrency(
                            getAmount(
                                payment
                            )
                        )}`,
                        date,
                        type: "payment",
                    });
                }
            );

            return activities
                .sort(
                    (a, b) =>
                        b.date.getTime() -
                        a.date.getTime()
                )
                .slice(0, 5);
        }, [
            turnos,
            clients,
            presupuestos,
            pagos,
            usersById,
        ]);

    /* =====================================================
       VEHÍCULOS EN TALLER
    ===================================================== */

    const workshopStatus =
        useMemo<
            WorkshopVehicle[]
        >(() => {
            return activeWorkshopServices
                .slice(0, 6)
                .map((service) => {
                    const vehicle =
                        vehiclesById.get(
                            service.vehiculoId ??
                                service.vehicleId
                        );

                    const progress =
                        Number(
                            service.progreso ??
                                service.progress ??
                                50
                        );

                    return {
                        id: service.id,

                        vehicle:
                            service.vehiculo ??
                            service.vehicle ??
                            (vehicle
                                ? `${vehicle.marca ?? ""} ${vehicle.modelo ?? ""}`.trim()
                                : "Vehículo"),

                        plate:
                            service.patente ??
                            service.matricula ??
                            vehicle?.patente ??
                            vehicle?.matricula ??
                            "Sin patente",

                        service:
                            service.nombre ??
                            service.servicio ??
                            service.tipo ??
                            "Servicio",

                        progress:
                            Math.min(
                                100,
                                Math.max(
                                    0,
                                    progress
                                )
                            ),

                        mechanic:
                            service.mechanic ??
                            service.mecanico ??
                            "Sin asignar",
                    };
                }
                );
        }, [
            activeWorkshopServices,
            vehiclesById,
        ]);

    /* =====================================================
       OBJETIVO FINANCIERO
    ===================================================== */

    const monthlyGoal = 2600000;

    const monthlyProgress =
        monthlyGoal > 0
            ? Math.min(
                  100,
                  Math.round(
                      (monthlyIncome /
                          monthlyGoal) *
                          100
                  )
              )
            : 0;

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                        <Loader2
                            size={30}
                            className="animate-spin text-blue-600"
                        />

                        <p className="text-sm">
                            Cargando dashboard...
                        </p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <AdminLayout>
            <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">

                {/* ================================================= */}
                {/* PAGE HEADING */}
                {/* ================================================= */}

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

                    <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Actualizado
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                            {today.toLocaleDateString(
                                "es-AR",
                                {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                }
                            )}
                        </p>
                    </div>
                </div>

                {/* ================================================= */}
                {/* STATS */}
                {/* ================================================= */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {/* TURNOS */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Turnos de hoy
                                </p>

                                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                    {todayAppointments.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CalendarDays size={20} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link
                                to="/admin/turnos"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver turnos
                                <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* VEHÍCULOS */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Vehículos en taller
                                </p>

                                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                    {activeWorkshopServices.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Car size={20} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link
                                to="/admin/servicios"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver servicios
                                <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* INGRESOS */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Ingresos del mes
                                </p>

                                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(
                                        monthlyIncome
                                    )}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CircleDollarSign size={20} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link
                                to="/admin/facturacion"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver facturación
                                <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* CLIENTES */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Clientes activos
                                </p>

                                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                    {activeClients.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <Users size={20} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link
                                to="/admin/clientes"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver clientes
                                <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ================================================= */}
                {/* MAIN GRID */}
                {/* ================================================= */}

                <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)]">

                    {/* ================================================= */}
                    {/* TURNOS */}
                    {/* ================================================= */}

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

                            <Link
                                to="/admin/turnos"
                                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver todos
                                <ChevronRight size={16} />
                            </Link>
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
                                    {appointments.length ===
                                    0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    6
                                                }
                                                className="px-5 py-12 text-center"
                                            >
                                                <CalendarDays
                                                    size={
                                                        28
                                                    }
                                                    className="mx-auto text-slate-300"
                                                />

                                                <p className="mt-3 text-sm font-medium text-slate-500">
                                                    No hay turnos para hoy.
                                                </p>

                                                <Link
                                                    to="/admin/turnos"
                                                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                                                >
                                                    Ir a turnos
                                                    <ChevronRight size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        appointments.map(
                                            (
                                                appointment
                                            ) => (
                                                <tr
                                                    key={
                                                        appointment.id
                                                    }
                                                    className={`transition hover:bg-slate-50 ${
                                                        appointments.indexOf(
                                                            appointment
                                                        ) !==
                                                        appointments.length -
                                                            1
                                                            ? "border-b border-slate-100"
                                                            : ""
                                                    }`}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Clock3
                                                                size={
                                                                    15
                                                                }
                                                                className="text-slate-400"
                                                            />

                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {
                                                                    appointment.time
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {
                                                                appointment.client
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {
                                                                appointment.vehicle
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {
                                                                appointment.plate
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="text-sm text-slate-600">
                                                            {
                                                                appointment.service
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                appointment.status ===
                                                                "En taller"
                                                                    ? "bg-blue-50 text-blue-700"
                                                                    : appointment.status ===
                                                                      "En espera"
                                                                    ? "bg-amber-50 text-amber-700"
                                                                    : appointment.status ===
                                                                      "Cancelado"
                                                                    ? "bg-red-50 text-red-700"
                                                                    : "bg-emerald-50 text-emerald-700"
                                                            }`}
                                                        >
                                                            {
                                                                appointment.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <Link
                                                            to="/admin/turnos"
                                                            className="rounded-lg p-2 text-slate-400 inline-flex hover:bg-slate-100 hover:text-slate-700"
                                                            title="Ver turnos"
                                                        >
                                                            <MoreHorizontal
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ================================================= */}
                    {/* ACTIVIDAD */}
                    {/* ================================================= */}

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

                            <MoreHorizontal
                                size={19}
                                className="text-slate-400"
                            />
                        </div>

                        <div className="divide-y divide-slate-100">
                            {recentActivity.length ===
                            0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-slate-400">
                                        No hay actividad registrada.
                                    </p>
                                </div>
                            ) : (
                                recentActivity.map(
                                    (
                                        activity
                                    ) => {
                                        const Icon =
                                            activity.icon;

                                        return (
                                            <div
                                                key={
                                                    activity.id
                                                }
                                                className="flex gap-3 p-4 transition hover:bg-slate-50"
                                            >
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                        activity.type ===
                                                        "success"
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : activity.type ===
                                                              "warning"
                                                            ? "bg-amber-50 text-amber-600"
                                                            : activity.type ===
                                                              "payment"
                                                            ? "bg-blue-50 text-blue-600"
                                                            : activity.type ===
                                                              "document"
                                                            ? "bg-violet-50 text-violet-600"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    <Icon
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {
                                                            activity.title
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {
                                                            activity.description
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        {formatActivityTime(
                                                            activity.date
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                )
                            )}
                        </div>

                        <div className="border-t border-slate-100 p-4">
                            <Link
                                to="/admin"
                                className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver actividad
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </section>
                </div>

                {/* ================================================= */}
                {/* WORKSHOP + FINANCE */}
                {/* ================================================= */}

                <div className="mt-7 grid gap-7 lg:grid-cols-2">

                    {/* ================================================= */}
                    {/* WORKSHOP */}
                    {/* ================================================= */}

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

                            {workshopStatus.length ===
                            0 ? (
                                <div className="p-10 text-center">
                                    <Car
                                        size={
                                            30
                                        }
                                        className="mx-auto text-slate-300"
                                    />

                                    <p className="mt-3 text-sm font-medium text-slate-500">
                                        No hay vehículos en taller.
                                    </p>
                                </div>
                            ) : (
                                workshopStatus.map(
                                    (
                                        vehicle
                                    ) => (
                                        <div
                                            key={
                                                vehicle.id
                                            }
                                            className="p-5"
                                        >
                                            <div className="flex items-start gap-4">

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                                                    {String(
                                                        1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">

                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {
                                                                    vehicle.vehicle
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                {
                                                                    vehicle.plate
                                                                }
                                                            </p>
                                                        </div>

                                                        <span className="text-xs font-medium text-slate-500">
                                                            Mecánico:{" "}
                                                            {
                                                                vehicle.mechanic
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="text-xs text-slate-500">
                                                            {
                                                                vehicle.service
                                                            }
                                                        </span>

                                                        <span className="text-xs font-bold text-blue-600">
                                                            {
                                                                vehicle.progress
                                                            }
                                                            %
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
                                    )
                                )
                            )}
                        </div>

                        <div className="border-t border-slate-100 p-4">
                            <Link
                                to="/admin/servicios"
                                className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver todos los servicios
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </section>

                    {/* ================================================= */}
                    {/* FINANCE */}
                    {/* ================================================= */}

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

                            <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                                {monthName}
                            </span>
                        </div>

                        <div className="p-5">

                            <div className="rounded-2xl bg-slate-950 p-5 text-white">

                                <div className="flex items-start justify-between">

                                    <div>
                                        <p className="text-sm text-slate-400">
                                            Ingresos totales
                                        </p>

                                        <p className="mt-2 text-3xl font-bold tracking-tight">
                                            {formatCurrency(
                                                monthlyIncome
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                        <DollarSign size={20} />
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                        <ArrowUpRight size={14} />
                                        {monthlyPayments.length}{" "}
                                        pagos
                                    </span>

                                    <span className="text-xs text-slate-500">
                                        registrados este mes
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
                                        {formatCurrency(
                                            monthlyIncome
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-4">

                                    <div className="flex items-center gap-2">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                            <Clock3 size={16} />
                                        </div>

                                        <span className="text-xs font-medium text-slate-500">
                                            Presupuestos
                                        </span>
                                    </div>

                                    <p className="mt-3 text-lg font-bold text-slate-900">
                                        {pendingBudgets.length}
                                    </p>

                                    <p className="mt-1 text-[11px] text-slate-400">
                                        pendientes
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5">

                                <div className="mb-2 flex items-center justify-between">

                                    <span className="text-xs font-medium text-slate-500">
                                        Objetivo mensual
                                    </span>

                                    <span className="text-xs font-bold text-slate-700">
                                        {monthlyProgress}%
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all"
                                        style={{
                                            width: `${monthlyProgress}%`,
                                        }}
                                    />
                                </div>

                                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                                    <span>
                                        {formatCurrency(
                                            monthlyIncome
                                        )}
                                    </span>

                                    <span>
                                        Objetivo:{" "}
                                        {formatCurrency(
                                            monthlyGoal
                                        )}
                                    </span>
                                </div>
                            </div>

                            <Link
                                to="/admin/facturacion"
                                className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Ver facturación
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </section>
                </div>

                {/* ================================================= */}
                {/* BOTTOM CARDS */}
                {/* ================================================= */}

                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {/* PRESUPUESTOS */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <ClipboardList size={20} />
                            </div>

                            <Link
                                to="/admin/presupuestos"
                                className="text-slate-400 hover:text-blue-600"
                            >
                                <ChevronRight size={18} />
                            </Link>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Presupuestos pendientes
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {pendingBudgets.length}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Requieren revisión
                        </p>
                    </div>

                    {/* TURNOS */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Clock3 size={20} />
                            </div>

                            <Link
                                to="/admin/turnos"
                                className="text-slate-400 hover:text-blue-600"
                            >
                                <ChevronRight size={18} />
                            </Link>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Turnos pendientes
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {
                                turnos.filter(
                                    (turno) =>
                                        getStatus(
                                            turno
                                        ) ===
                                        "En espera"
                                ).length
                            }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Requieren confirmación
                        </p>
                    </div>

                    {/* SERVICIOS */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Gauge size={20} />
                            </div>

                            <Link
                                to="/admin/servicios"
                                className="text-slate-400 hover:text-blue-600"
                            >
                                <ChevronRight size={18} />
                            </Link>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Servicios completados
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {
                                completedServicesMonth.length
                            }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Durante {monthName}
                        </p>
                    </div>

                    {/* EFICIENCIA */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Cog size={20} />
                            </div>

                            <Link
                                to="/admin/servicios"
                                className="text-slate-400 hover:text-blue-600"
                            >
                                <ChevronRight size={18} />
                            </Link>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Servicios completados
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {efficiency}%
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Sobre servicios registrados este mes
                        </p>
                    </div>
                </div>

                {/* ================================================= */}
                {/* FOOTER */}
                {/* ================================================= */}

                <footer className="mt-10 border-t border-slate-200 py-6">

                    <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">

                        <p>
                            © 2026 Mora Mecánica. Panel administrativo.
                        </p>

                        <div className="flex gap-4">
                            <span>
                                Soporte
                            </span>

                            <span>
                                Privacidad
                            </span>

                            <span>
                                Versión 1.0.0
                            </span>
                        </div>
                    </div>
                </footer>
            </div>
        </AdminLayout>
    );
};

export default DashboardAdmin;