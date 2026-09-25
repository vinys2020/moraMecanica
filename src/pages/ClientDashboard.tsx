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
} from "lucide-react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

/* ============================================================
   TIPOS
============================================================ */

interface UserData {
    uid: string;
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    rol: string;
    activo: boolean;
    phone?: string;
}

interface Vehicle {
    id: string;
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
    matricula?: string;
    color: string;
    kilometraje: number;
    clienteId: string | null;
    clienteNombre: string;
    ultimoServicio: any;
    proximoServicio: any;
    estado: "Activo" | "En taller" | "Inactivo";
    observaciones: string;
    creadoEn: any;
    imagenUrl: string;
    imagenPath: string;
}

interface Service {
    id: string;
    clienteId: string;
    vehiculoId: string;
    tipo: string;
    categoria: string;
    descripcion: string;
    fecha: string;
    fechaEntregaEstimada: string;
    kilometraje: number;
    precio: number;
    estado:
        | "Pendiente"
        | "En proceso"
        | "Completado"
        | "Cancelado";
    observaciones: string;
    creadoEn: any;
}

interface Budget {
    id: string;
    numero: string;
    clienteId: string;
    clienteNombre: string;
    vehiculoId: string;
    vehiculoNombre: string;
    patente: string;
    fecha: string;
    validUntil: string;
    manoDeObra: number;
    repuestos: number;
    total: number;
    estado:
        | "Pendiente"
        | "Aprobado"
        | "Rechazado"
        | "Vencido";
    observaciones: string;
    finalPdfUrl?: string;
    partsPdfUrl?: string;
    creadoEn: any;
}

interface Payment {
    id: string;
    clienteId: string;
    servicioId?: string;
    vehiculoId?: string;
    importe: number;
    medioPago: string;
    fecha: string;
    observaciones: string;
    creadoEn: any;
}

interface Receipt {
    id: string;
    clienteId: string;
    servicioId?: string;
    importe: number;
    numero?: string;
    fecha: string;
    pdfUrl?: string;
    creadoEn: any;
}

interface Appointment {
    id: string;
    clienteId: string;
    clienteNombre: string;
    telefono: string;
    vehiculoId: string;
    vehiculo: string;
    patente: string;
    servicio: string;
    mechanic: string;
    date: string;
    start: string;
    end: string;
    status:
        | "Confirmado"
        | "En espera"
        | "En taller"
        | "Finalizado"
        | "Cancelado";
    notes: string;
    creadoEn: any;
}

/* ============================================================
   COMPONENTE
============================================================ */

function ClientDashboard() {
    const { logout, user } = useAuth();

    const [userData, setUserData] =
        useState<UserData | null>(null);

        const [activeInfoModal, setActiveInfoModal] = useState<
    "turnos" | "vehiculos" | "presupuestos" | "pagos" | null
>(null);

    const [vehicles, setVehicles] =
        useState<Vehicle[]>([]);

    const [services, setServices] =
        useState<Service[]>([]);

    const [budgets, setBudgets] =
        useState<Budget[]>([]);

    const [payments, setPayments] =
        useState<Payment[]>([]);

    const [receipts, setReceipts] =
        useState<Receipt[]>([]);

    const [appointments, setAppointments] =
        useState<Appointment[]>([]);

        const [showAppointmentModal, setShowAppointmentModal] =
    useState(false);

const [appointmentForm, setAppointmentForm] = useState({
    vehiculoId: "",
    servicio: "",
    date: "",
    start: "",
    notes: "",
});

const [savingAppointment, setSavingAppointment] =
    useState(false);

    const [scheduleConfig, setScheduleConfig] = useState({
        active: true,
        days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        startTime: "08:00",
        endTime: "18:00",
        slotMinutes: 60,
    });

    const [loading, setLoading] =
        useState(true);

    /* ============================================================
       CARGAR TODOS LOS DATOS DEL CLIENTE
    ============================================================ */

    const cargarDatos = async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const uid = user.uid;

            /* =====================================================
               USUARIO
            ===================================================== */

            const usuariosSnapshot =
                await getDocs(
                    collection(db, "usuarios")
                );

            const userDoc =
                usuariosSnapshot.docs.find(
                    (doc) => doc.id === uid
                );

            if (userDoc) {
                const data = userDoc.data();

                setUserData({
                    uid,
                    nombre:
                        data.nombre ??
                        user.displayName ??
                        "Cliente",

                    email:
                        data.email ??
                        user.email ??
                        "",

                    telefono:
                        data.telefono ??
                        data.phone ??
                        "",

                    direccion:
                        data.direccion ??
                        data.address ??
                        "",

                    rol:
                        data.rol ??
                        "cliente",

                    activo:
                        data.activo ??
                        false,
                });
            } else {
                setUserData({
                    uid,
                    nombre:
                        user.displayName ??
                        "Cliente",

                    email:
                        user.email ??
                        "",

                    telefono: "",
                    direccion: "",
                    rol: "cliente",
                    activo: true,
                });
            }

            /* =====================================================
               VEHÍCULOS
            ===================================================== */

            const vehiculosSnapshot =
                await getDocs(
                    collection(db, "vehiculos")
                );

            const clientVehicles =
                vehiculosSnapshot.docs
                    .filter((doc) => {
                        const data = doc.data();

                        return (
                            data.clienteId === uid ||
                            data.usuarioId === uid
                        );
                    })
                    .map((doc) => {
                        const data = doc.data();

                        return {
                            id: doc.id,

                            marca:
                                data.marca ?? "",

                            modelo:
                                data.modelo ?? "",

                            anio:
                                Number(
                                    data.anio ?? 0
                                ),

                            patente:
                                data.patente ??
                                data.matricula ??
                                "",

                            color:
                                data.color ?? "",

                            kilometraje:
                                Number(
                                    data.kilometraje ??
                                        0
                                ),

                            clienteId:
                                data.clienteId ??
                                data.usuarioId ??
                                null,

                            clienteNombre:
                                data.clienteNombre ??
                                "",

                            ultimoServicio:
                                data.ultimoServicio ??
                                null,

                            proximoServicio:
                                data.proximoServicio ??
                                null,

                            estado:
                                data.estado ??
                                "Activo",

                            observaciones:
                                data.observaciones ??
                                "",

                            creadoEn:
                                data.creadoEn ??
                                null,

                            imagenUrl:
                                data.imagenUrl ??
                                "",

                            imagenPath:
                                data.imagenPath ??
                                "",
                        } as Vehicle;
                    });

            setVehicles(clientVehicles);

            /* =====================================================
               SERVICIOS
            ===================================================== */

            const serviciosSnapshot =
                await getDocs(
                    collection(db, "servicios")
                );

            const clientServices =
                serviciosSnapshot.docs
                    .filter((doc) => {
                        const data = doc.data();

                        return (
                            data.clienteId === uid ||
                            data.usuarioId === uid
                        );
                    })
                    .map((doc) => {
                        const data = doc.data();

                        return {
                            id: doc.id,

                            clienteId:
                                data.clienteId ??
                                data.usuarioId ??
                                uid,

                            vehiculoId:
                                data.vehiculoId ??
                                "",

                            tipo:
                                data.tipo ?? "",

                            categoria:
                                data.categoria ?? "",

                            descripcion:
                                data.descripcion ??
                                "",

                            fecha:
                                data.fecha ?? "",

                            fechaEntregaEstimada:
                                data.fechaEntregaEstimada ??
                                "",

                            kilometraje:
                                Number(
                                    data.kilometraje ??
                                        0
                                ),

                            precio:
                                Number(
                                    data.precio ??
                                        0
                                ),

                            estado:
                                data.estado ??
                                "Pendiente",

                            observaciones:
                                data.observaciones ??
                                "",

                            creadoEn:
                                data.creadoEn ??
                                null,
                        } as Service;
                    })
                    .sort(
                        (a, b) =>
                            getTimestamp(b.fecha) -
                            getTimestamp(a.fecha)
                    );

            setServices(clientServices);

            /* =====================================================
               PRESUPUESTOS
            ===================================================== */

            const presupuestosSnapshot =
                await getDocs(
                    collection(db, "presupuestos")
                );

            const clientBudgets =
                presupuestosSnapshot.docs
                    .filter((doc) => {
                        const data = doc.data();

                        return (
                            data.clienteId === uid
                        );
                    })
                    .map((doc) => {
                        const data = doc.data();

                        return {
                            id: doc.id,

                            numero:
                                data.numero ??
                                doc.id,

                            clienteId:
                                data.clienteId ??
                                uid,

                            clienteNombre:
                                data.clienteNombre ??
                                "",

                            vehiculoId:
                                data.vehiculoId ??
                                "",

                            vehiculoNombre:
                                data.vehiculoNombre ??
                                "",

                            patente:
                                data.patente ??
                                "",

                            fecha:
                                data.fecha ??
                                "",

                            validUntil:
                                data.validUntil ??
                                "",

                            manoDeObra:
                                Number(
                                    data.manoDeObra ??
                                        0
                                ),

                            repuestos:
                                Number(
                                    data.repuestos ??
                                        0
                                ),

                            total:
                                Number(
                                    data.total ??
                                        0
                                ),

                            estado:
                                data.estado ??
                                "Pendiente",

                            observaciones:
                                data.observaciones ??
                                "",

                            finalPdfUrl:
                                data.finalPdfUrl,

                            partsPdfUrl:
                                data.partsPdfUrl,

                            creadoEn:
                                data.creadoEn ??
                                null,
                        } as Budget;
                    })
                    .sort(
                        (a, b) =>
                            getTimestamp(b.fecha) -
                            getTimestamp(a.fecha)
                    );

            setBudgets(clientBudgets);
/* =====================================================
   PAGOS
===================================================== */

const pagosSnapshot =
    await getDocs(
        collection(db, "pagos")
    );

const clientPayments =
    pagosSnapshot.docs
        .filter((doc) => {
            const data = doc.data();

            return (
                data.clienteId === uid ||
                data.usuarioId === uid
            );
        })
        .map((doc) => {
            const data = doc.data();

            return {
                id: doc.id,

                clienteId:
                    data.clienteId ??
                    data.usuarioId ??
                    uid,

                servicioId:
                    data.servicioId ??
                    "",

                vehiculoId:
                    data.vehiculoId ??
                    "",

                importe:
                    Number(
                        data.importe ??
                        data.monto ??
                        data.total ??
                        0
                    ),

                medioPago:
                    data.medioPago ??
                    data.metodoPago ??
                    data.formaPago ??
                    "No especificado",

                fecha:
                    data.fecha ??
                    data.fechaPago ??
                    data.creadoEn ??
                    "",

                observaciones:
                    data.observaciones ??
                    data.descripcion ??
                    "",

                creadoEn:
                    data.creadoEn ??
                    null,
            } as Payment;
        })
        .sort(
            (a, b) =>
                getTimestamp(
                    b.fecha
                ) -
                getTimestamp(
                    a.fecha
                )
        );

setPayments(clientPayments);

            /* =====================================================
               RECIBOS
            ===================================================== */

            const recibosSnapshot =
                await getDocs(
                    collection(db, "recibos")
                );

            const clientReceipts =
                recibosSnapshot.docs
                    .filter((doc) => {
                        const data = doc.data();

                        return (
                            data.clienteId === uid ||
                            data.usuarioId === uid
                        );
                    })
                    .map((doc) => {
                        const data = doc.data();

                        return {
                            id: doc.id,

                            clienteId:
                                data.clienteId ??
                                data.usuarioId ??
                                uid,

                            servicioId:
                                data.servicioId ??
                                "",

                            importe:
                                Number(
                                    data.importe ??
                                        data.monto ??
                                        0
                                ),

                            numero:
                                data.numero ??
                                doc.id,

                            fecha:
                                data.fecha ??
                                "",

                            pdfUrl:
                                data.pdfUrl ??
                                data.reciboPdfUrl,

                            creadoEn:
                                data.creadoEn ??
                                null,
                        } as Receipt;
                    })
                    .sort(
                        (a, b) =>
                            getTimestamp(b.fecha) -
                            getTimestamp(a.fecha)
                    );

            setReceipts(clientReceipts);

            /* =====================================================
               TURNOS
            ===================================================== */

            const turnosSnapshot =
                await getDocs(
                    collection(db, "turnos")
                );

            const clientAppointments =
                turnosSnapshot.docs
                    .filter((doc) => {
                        const data = doc.data();

                        return (
                            data.clienteId === uid ||
                            data.usuarioId === uid
                        );
                    })
                    .map((doc) => {
                        const data = doc.data();

                        return {
                            id: doc.id,

                            clienteId:
                                data.clienteId ??
                                data.usuarioId ??
                                uid,

                            clienteNombre:
                                data.clienteNombre ??
                                userData?.nombre ??
                                user.displayName ??
                                "Cliente",

                            telefono:
                                data.telefono ??
                                userData?.telefono ??
                                "",

                            vehiculoId:
                                data.vehiculoId ??
                                "",

                            vehiculo:
                                data.vehiculo ??
                                "",

                            patente:
                                data.patente ??
                                "",

                            servicio:
                                data.servicio ??
                                "",

                            mechanic:
                                data.mechanic ??
                                data.mecanico ??
                                "Sin asignar",

                            date:
                                data.date ??
                                data.fecha ??
                                "",

                            start:
                                data.start ??
                                data.hora ??
                                "",

                            end:
                                data.end ??
                                data.horaFin ??
                                "",

                            status:
                                data.status ??
                                data.estado ??
                                "En espera",

                            notes:
                                data.notes ??
                                data.observaciones ??
                                "",

                            creadoEn:
                                data.creadoEn ??
                                null,
                        } as Appointment;
                    })
                    .sort(
                        (a, b) =>
                            getTimestamp(
                                `${b.date} ${b.start}`
                            ) -
                            getTimestamp(
                                `${a.date} ${a.start}`
                            )
                    );

            setAppointments(
                clientAppointments
            );
        } catch (error) {
            console.error(
                "Error cargando datos del cliente:",
                error
            );
        } finally {
            setLoading(false);
        }
    };
    

    const cargarConfiguracionAgenda = async () => {
        try {
            const configDoc = await getDoc(doc(db, "configuracionAgenda", "turnos"));

            if (configDoc.exists()) {
                const data = configDoc.data();
                setScheduleConfig({
                    active: data.active ?? true,
                    days: Array.isArray(data.days) && data.days.length ? data.days : ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
                    startTime: data.startTime ?? "08:00",
                    endTime: data.endTime ?? "18:00",
                    slotMinutes: Number(data.slotMinutes ?? 60),
                });
            }
        } catch (error) {
            console.error("Error cargando disponibilidad del taller:", error);
        }
    };

    /* ============================================================
   SOLICITAR TURNO
============================================================ */

const solicitarTurno = async () => {
    if (!user?.uid) {
        alert(
            "No se pudo identificar tu cuenta."
        );
        return;
    }

    if (!userData) {
        alert(
            "Todavía no se cargaron tus datos."
        );
        return;
    }

    if (!appointmentForm.vehiculoId) {
        alert(
            "Seleccioná un vehículo."
        );
        return;
    }

    if (!appointmentForm.servicio) {
        alert(
            "Seleccioná el servicio que necesitás."
        );
        return;
    }

    if (!appointmentForm.date) {
        alert(
            "Seleccioná una fecha."
        );
        return;
    }

    if (!appointmentForm.start) {
        alert(
            "Seleccioná un horario."
        );
        return;
    }

    if (!scheduleConfig.active) {
        alert(
            "Actualmente no hay turnos disponibles."
        );
        return;
    }

    const today =
        getTodayLocal();

    if (
        appointmentForm.date <
        today
    ) {
        alert(
            "No podés solicitar un turno para una fecha pasada."
        );
        return;
    }

    if (
        !isDateAvailable(
            appointmentForm.date
        )
    ) {
        alert(
            "El taller no atiende ese día. Elegí otra fecha."
        );
        return;
    }

    if (
        !isTimeAvailable(
            appointmentForm.start
        )
    ) {
        alert(
            `El horario debe respetar la agenda del taller: ${scheduleConfig.startTime} a ${scheduleConfig.endTime}, en turnos de ${scheduleConfig.slotMinutes} minutos.`
        );
        return;
    }

    const end =
        getAppointmentEnd(
            appointmentForm.start
        );

    if (
        hasAppointmentConflict(
            appointmentForm.date,
            appointmentForm.start,
            end
        )
    ) {
        alert(
            "Ese horario ya está ocupado. Elegí otro horario."
        );
        return;
    }

    const selectedVehicle =
        vehicles.find(
            (vehicle) =>
                vehicle.id ===
                appointmentForm.vehiculoId
        );

    if (!selectedVehicle) {
        alert(
            "No se encontró el vehículo seleccionado."
        );
        return;
    }

    try {
        setSavingAppointment(true);

        const clienteNombre =
            userData.nombre ||
            user.displayName ||
            "Cliente";

        const telefono =
            userData.telefono ||
            user.phoneNumber ||
            "";

        await addDoc(
            collection(
                db,
                "turnos"
            ),
            {
                numero: `T-${Date.now()}`,

                clienteId:
                    user.uid,

                clienteNombre,

                clienteEmail:
                    user.email ||
                    userData.email ||
                    "",

                telefono,

                vehiculoId:
                    selectedVehicle.id,

                vehiculo:
                    `${selectedVehicle.marca} ${selectedVehicle.modelo}`.trim(),

                patente:
                    selectedVehicle.patente ||
                    selectedVehicle.matricula ||
                    "",

                marca:
                    selectedVehicle.marca ||
                    "",

                modelo:
                    selectedVehicle.modelo ||
                    "",

                anio:
                    selectedVehicle.anio ||
                    0,

                servicio:
                    appointmentForm.servicio,

                mechanic:
                    "Sin asignar",

                date:
                    appointmentForm.date,

                start:
                    appointmentForm.start,

                end,

                status:
                    "En espera",

                notes:
                    appointmentForm.notes.trim(),

                creadoEn:
                    serverTimestamp(),
            }
        );

        alert(
            "Turno solicitado correctamente. Mora Mecánica deberá confirmarlo."
        );

        setAppointmentForm({
            vehiculoId:
                vehicles[0]?.id ?? "",
            servicio: "",
            date: "",
            start: "",
            notes: "",
        });

        setShowAppointmentModal(
            false
        );

        await cargarDatos();

    } catch (error) {
        console.error(
            "Error solicitando turno:",
            error
        );

        alert(
            "No se pudo solicitar el turno. Intentá nuevamente."
        );
    } finally {
        setSavingAppointment(
            false
        );
    }
};

useEffect(() => {
    if (!user?.uid) return;

    cargarDatos();
    cargarConfiguracionAgenda();
}, [user]);

/* ============================================================
   HELPERS DE TURNOS
============================================================ */

const timeToMinutes = (time: string): number => {
    if (!time) return 0;

    const [hours, minutes] = time
        .split(":")
        .map(Number);

    return (hours || 0) * 60 + (minutes || 0);
};

const minutesToTime = (minutes: number): string => {
    const safeMinutes = Math.max(0, minutes);

    const hours = Math.floor(
        safeMinutes / 60
    );

    const mins = safeMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(
        mins
    ).padStart(2, "0")}`;
};

const getTodayLocal = (): string => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getAppointmentTimestamp = (
    date: string,
    time: string
): number => {
    if (!date) return 0;

    const [year, month, day] = date
        .split("-")
        .map(Number);

    const [hours = 0, minutes = 0] = (
        time || "00:00"
    )
        .split(":")
        .map(Number);

    if (
        !year ||
        !month ||
        !day
    ) {
        return 0;
    }

    return new Date(
        year,
        month - 1,
        day,
        hours,
        minutes
    ).getTime();
};

const getWeekdayName = (
    dateString: string
): string => {
    if (!dateString) return "";

    const date = new Date(
        `${dateString}T12:00:00`
    );

    return date.toLocaleDateString(
        "es-AR",
        {
            weekday: "long",
        }
    );
};

const normalizeWeekday = (
    value: string
): string => {
    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
};

const isDateAvailable = (
    dateString: string
): boolean => {
    if (!dateString) return false;

    if (!scheduleConfig.active)
        return false;

    const weekday =
        normalizeWeekday(
            getWeekdayName(dateString)
        );

    return scheduleConfig.days.includes(
        weekday
    );
};

const getAppointmentEnd = (
    start: string
): string => {
    const startMinutes =
        timeToMinutes(start);

    const slot =
        Number(
            scheduleConfig.slotMinutes
        ) || 60;

    return minutesToTime(
        startMinutes + slot
    );
};

const isTimeAvailable = (
    start: string
): boolean => {
    if (!start) return false;

    const startMinutes =
        timeToMinutes(start);

    const scheduleStart =
        timeToMinutes(
            scheduleConfig.startTime
        );

    const scheduleEnd =
        timeToMinutes(
            scheduleConfig.endTime
        );

    const slot =
        Number(
            scheduleConfig.slotMinutes
        ) || 60;

    if (
        startMinutes <
        scheduleStart
    ) {
        return false;
    }

    if (
        startMinutes + slot >
        scheduleEnd
    ) {
        return false;
    }

    return (
        (startMinutes -
            scheduleStart) %
            slot ===
        0
    );
};

const hasAppointmentConflict = (
    date: string,
    start: string,
    end: string
): boolean => {
    const newStart =
        timeToMinutes(start);

    const newEnd =
        timeToMinutes(end);

    return appointments.some(
        (appointment) => {
            if (
                appointment.date !==
                date
            ) {
                return false;
            }

            if (
                appointment.status ===
                "Cancelado"
            ) {
                return false;
            }

            const existingStart =
                timeToMinutes(
                    appointment.start
                );

            const existingEnd =
                timeToMinutes(
                    appointment.end ||
                        getAppointmentEnd(
                            appointment.start
                        )
                );

            return (
                newStart <
                    existingEnd &&
                newEnd >
                    existingStart
            );
        }
    );
};


const availableAppointmentSlots =
    useMemo(() => {
        if (
            !scheduleConfig.active ||
            !appointmentForm.date
        ) {
            return [];
        }

        if (
            !isDateAvailable(
                appointmentForm.date
            )
        ) {
            return [];
        }

        const slots: string[] = [];

        const scheduleStart =
            timeToMinutes(
                scheduleConfig.startTime
            );

        const scheduleEnd =
            timeToMinutes(
                scheduleConfig.endTime
            );

        const slot =
            Number(
                scheduleConfig.slotMinutes
            ) || 60;

        for (
            let minutes = scheduleStart;
            minutes + slot <=
            scheduleEnd;
            minutes += slot
        ) {
            const start =
                minutesToTime(minutes);

            const end =
                minutesToTime(
                    minutes + slot
                );

            if (
                hasAppointmentConflict(
                    appointmentForm.date,
                    start,
                    end
                )
            ) {
                continue;
            }

            const timestamp =
                getAppointmentTimestamp(
                    appointmentForm.date,
                    start
                );

            if (
                appointmentForm.date ===
                    getTodayLocal() &&
                timestamp <= Date.now()
            ) {
                continue;
            }

            slots.push(start);
        }

        return slots;
    }, [
        appointmentForm.date,
        appointments,
        scheduleConfig,
    ]);

    /* ============================================================
       DATOS DERIVADOS
    ============================================================ */

    const nombre =
        userData?.nombre ||
        user?.displayName ||
        "Cliente";

    const iniciales = useMemo(() => {
        return nombre
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) =>
                parte
                    .charAt(0)
                    .toUpperCase()
            )
            .join("");
    }, [nombre]);

    const vehicle =
        vehicles[0] ?? null;

    const nombreVehiculo = vehicle
        ? `${vehicle.marca} ${vehicle.modelo}`.trim()
        : "Sin vehículo registrado";

    const kilometraje =
        vehicle &&
        vehicle.kilometraje > 0
            ? `${vehicle.kilometraje.toLocaleString(
                  "es-AR"
              )} km`
            : "Sin registrar";

    const patente =
        vehicle?.patente ||
        "Sin registrar";

    const anio =
        vehicle?.anio
            ? `${vehicle.anio}`
            : "Año no registrado";

    const estadoTexto = (() => {
        if (!vehicle)
            return "Sin vehículo";

        switch (vehicle.estado) {
            case "En taller":
                return "En taller";

            case "Inactivo":
                return "Inactivo";

            default:
                return "Activo";
        }
    })();

    const estadoColor = (() => {
        if (!vehicle)
            return "bg-white/30";

        switch (vehicle.estado) {
            case "En taller":
                return "bg-orange-400";

            case "Inactivo":
                return "bg-red-400";

            default:
                return "bg-emerald-400";
        }
    })();

    /* ============================================================
       PRÓXIMO TURNO
    ============================================================ */

    const upcomingAppointments =
        appointments
            .filter(
                (appointment) =>
                    appointment.status !==
                        "Cancelado" &&
                    appointment.status !==
                        "Finalizado" &&
                    getTimestamp(
                        `${appointment.date} ${appointment.start}`
                    ) >= Date.now()
            )
            .sort(
                (a, b) =>
                    getTimestamp(
                        `${a.date} ${a.start}`
                    ) -
                    getTimestamp(
                        `${b.date} ${b.start}`
                    )
            );

    const nextAppointment =
        upcomingAppointments[0] ??
        null;

    /* ============================================================
       ÚLTIMOS SERVICIOS
    ============================================================ */

    const latestServices =
        services.slice(0, 5);

    /* ============================================================
       PRESUPUESTOS PENDIENTES
    ============================================================ */

    const pendingBudgets =
        budgets.filter(
            (budget) =>
                budget.estado ===
                    "Pendiente" ||
                budget.estado ===
                    "Vencido"
        );

    /* ============================================================
       TOTAL PAGOS
    ============================================================ */

    const totalPayments =
        payments.reduce(
            (total, payment) =>
                total +
                Number(payment.importe || 0),
            0
        );

    const totalBudgetPending =
        pendingBudgets.reduce(
            (total, budget) =>
                total +
                Number(budget.total || 0),
            0
        );

    /* ============================================================
       FECHAS
    ============================================================ */

    const ultimoServicioTexto =
        vehicle
            ? formatDate(
                  vehicle.ultimoServicio
              )
            : latestServices[0]
            ? formatDate(
                  latestServices[0].fecha
              )
            : "Sin registrar";

    const proximoServicioTexto =
        formatDate(
            vehicle?.proximoServicio
        );

    /* ============================================================
       LOGOUT
    ============================================================ */

    const handleLogout =
        async () => {
            try {
                await logout();
            } catch (error) {
                console.error(
                    "Error al cerrar sesión:",
                    error
                );
            }
        };

    /* ============================================================
       LOADING
    ============================================================ */

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
        );
    }

    /* ============================================================
       DASHBOARD
    ============================================================ */

    return (
        <main className="min-h-screen bg-[#08090a] text-white">

            {/* HEADER */}

            <header className="border-b border-white/[0.06] bg-[#0b0c0e]">
                <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-10">

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-500">
                            Mora Mecánica
                        </p>

                        <h1 className="mt-1 text-xl font-semibold tracking-tight">
                            Mi cuenta
                        </h1>
                    </div>

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

            <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">

                {/* BIENVENIDA */}

                <section className="mb-8">
                    <p className="text-sm text-white/40">
                        Bienvenido nuevamente
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Hola,{" "}
                        {nombre.split(" ")[0]} 👋
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                        Desde acá podés consultar
                        el estado de tu vehículo,
                        turnos, servicios,
                        presupuestos y pagos.
                    </p>
                </section>

                {/* VEHÍCULO */}

                {vehicle ? (
                    <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#101214]">

                        <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/[0.07] blur-[100px]" />

                        <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-orange-500/[0.04] blur-[100px]" />

                        <div className="relative grid min-h-[480px] lg:grid-cols-[0.8fr_1.4fr_0.8fr]">

                            {/* DATOS */}

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
                                    {vehicle.color &&
                                        ` · ${vehicle.color}`}
                                </p>

                                <div className="mt-7 space-y-4">

                                    <InfoRow
                                        icon={
                                            <Gauge
                                                size={16}
                                            />
                                        }
                                        label="Kilometraje"
                                        value={
                                            kilometraje
                                        }
                                    />

                                    <InfoRow
                                        icon={
                                            <Settings2
                                                size={16}
                                            />
                                        }
                                        label="Patente"
                                        value={
                                            patente
                                        }
                                    />

                                    <InfoRow
                                        icon={
                                            <ShieldCheck
                                                size={16}
                                            />
                                        }
                                        label="Último servicio"
                                        value={
                                            ultimoServicioTexto
                                        }
                                    />

                                </div>
                            </div>

                            {/* IMAGEN */}

                            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden">

                                <div className="absolute bottom-16 left-1/2 h-16 w-[75%] -translate-x-1/2 rounded-[50%] bg-black/90 blur-2xl" />

                                {vehicle.imagenUrl ? (
                                    <img
                                        src={
                                            vehicle.imagenUrl
                                        }
                                        alt={
                                            nombreVehiculo
                                        }
                                        className="relative z-10 max-h-[420px] w-[95%] max-w-[650px] object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,0.75)]"
                                    />
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center justify-center text-white/20">
                                        <Car
                                            size={100}
                                            strokeWidth={
                                                1
                                            }
                                        />

                                        <p className="mt-4 text-sm">
                                            Sin imagen
                                            del vehículo
                                        </p>
                                    </div>
                                )}

                                <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 backdrop-blur-md">
                                    Vehículo registrado
                                </div>
                            </div>

                            {/* ESTADO */}

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
                                        "No hay observaciones registradas para tu vehículo."}
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
                            Cuando Mora Mecánica
                            registre un vehículo
                            asociado a tu cuenta,
                            vas a poder verlo desde
                            acá.
                        </p>

                    </section>
                )}

                {/* RESUMEN REAL */}

                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <SummaryCard
                        icon={
                            <CalendarDays size={19} />
                        }
                        label="Próximo turno"
                        value={
                            nextAppointment
                                ? formatShortDate(
                                      nextAppointment.date
                                  )
                                : "Sin turnos"
                        }
                        description={
                            nextAppointment
                                ? `${nextAppointment.start} · ${nextAppointment.servicio}`
                                : "No tenés turnos próximos"
                        }
                        accent
                    />

                    <SummaryCard
                        icon={
                            <Wrench size={19} />
                        }
                        label="Servicios realizados"
                        value={String(
                            services.length
                        )}
                        description={
                            services.length === 1
                                ? "1 servicio registrado"
                                : "Historial de servicios"
                        }
                    />

                    <SummaryCard
                        icon={
                            <FileText size={19} />
                        }
                        label="Presupuestos"
                        value={String(
                            pendingBudgets.length
                        )}
                        description={
                            pendingBudgets.length
                                ? "Pendientes de revisión"
                                : "No hay pendientes"
                        }
                    />

                    <SummaryCard
                        icon={
                            <Receipt size={19} />
                        }
                        label="Pagos registrados"
                        value={formatCurrency(
                            totalPayments
                        )}
                        description={`${receipts.length} comprobante${
                            receipts.length === 1
                                ? ""
                                : "s"
                        }`}
                    />

                </section>

                {/* GRID */}

                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">

                    <div className="space-y-6">

                        {/* PRÓXIMO TURNO */}

                        <section className="rounded-3xl border border-white/[0.07] bg-[#101214] p-6 sm:p-7">

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                Próximo turno
            </p>

            <h3 className="mt-1 text-xl font-semibold">
                {nextAppointment
                    ? nextAppointment.servicio ||
                      "Servicio"
                    : "Sin turnos registrados"}
            </h3>
        </div>

        <button
            type="button"
            onClick={() => {
                setAppointmentForm({
                    vehiculoId:
                        vehicles[0]?.id ?? "",
                    servicio: "",
                    date: "",
                    start: "",
                    notes: "",
                });

                setShowAppointmentModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
            <CalendarDays size={17} />
            Sacar turno
        </button>

    </div>

    {nextAppointment ? (
        <div className="mt-6">

            {/* ================================================= */}
            {/* ESTADO DEL TURNO */}
            {/* ================================================= */}

            <div
                className={`mb-4 flex items-center justify-between rounded-2xl border px-4 py-3 ${
                    nextAppointment.status === "Confirmado"
                        ? "border-emerald-500/20 bg-emerald-500/10"
                        : nextAppointment.status === "En espera"
                        ? "border-orange-500/20 bg-orange-500/10"
                        : nextAppointment.status === "En taller"
                        ? "border-blue-500/20 bg-blue-500/10"
                        : nextAppointment.status === "Finalizado"
                        ? "border-white/10 bg-white/[0.04]"
                        : nextAppointment.status === "Cancelado"
                        ? "border-red-500/20 bg-red-500/10"
                        : "border-white/10 bg-white/[0.03]"
                }`}
            >

                <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                        Estado del turno
                    </p>

                    <p
                        className={`mt-1 text-sm font-semibold ${
                            nextAppointment.status === "Confirmado"
                                ? "text-emerald-400"
                                : nextAppointment.status === "En espera"
                                ? "text-orange-400"
                                : nextAppointment.status === "En taller"
                                ? "text-blue-400"
                                : nextAppointment.status === "Cancelado"
                                ? "text-red-400"
                                : "text-white/70"
                        }`}
                    >
                        {nextAppointment.status || "En espera"}
                    </p>

                </div>

                <span
                    className={`h-2.5 w-2.5 rounded-full ${
                        nextAppointment.status === "Confirmado"
                            ? "bg-emerald-400"
                            : nextAppointment.status === "En espera"
                            ? "bg-orange-400"
                            : nextAppointment.status === "En taller"
                            ? "bg-blue-400"
                            : nextAppointment.status === "Cancelado"
                            ? "bg-red-400"
                            : "bg-white/40"
                    }`}
                />

            </div>

            {/* ================================================= */}
            {/* DATOS DEL TURNO */}
            {/* ================================================= */}

            <div className="grid gap-3 sm:grid-cols-3">

                <DetailBox
                    label="Fecha"
                    value={formatShortDate(
                        nextAppointment.date
                    )}
                />

                <DetailBox
                    label="Horario"
                    value={`${nextAppointment.start} ${
                        nextAppointment.end
                            ? `— ${nextAppointment.end}`
                            : ""
                    }`}
                />

                <DetailBox
                    label="Vehículo"
                    value={
                        nextAppointment.vehiculo ||
                        nombreVehiculo
                    }
                />

            </div>

        </div>
    ) : (

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6 text-center">

            <CalendarDays
                size={30}
                className="mx-auto text-white/20"
            />

            <p className="mt-3 text-sm text-white/40">
                No hay un próximo
                turno registrado.
            </p>

        </div>

    )}

</section>
                        {/* HISTORIAL */}

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

                                <span className="text-xs text-white/30">
                                    {services.length} total
                                </span>
                            </div>

                            {latestServices.length > 0 ? (
                                <div className="mt-6 space-y-2">

                                    {latestServices.map(
                                        (service) => (
                                            <div
                                                key={
                                                    service.id
                                                }
                                                className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
                                            >
                                                <div className="flex items-start justify-between gap-4">

                                                    <div>
                                                        <p className="text-sm font-semibold">
                                                            {service.tipo ||
                                                                service.descripcion ||
                                                                "Servicio"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-white/35">
                                                            {formatDate(
                                                                service.fecha
                                                            )}
                                                            {service.categoria &&
                                                                ` · ${service.categoria}`}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                            service.estado ===
                                                            "Completado"
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : service.estado ===
                                                                  "Cancelado"
                                                                ? "bg-red-500/10 text-red-400"
                                                                : "bg-orange-500/10 text-orange-400"
                                                        }`}
                                                    >
                                                        {
                                                            service.estado
                                                        }
                                                    </span>
                                                </div>

                                                {service.descripcion && (
                                                    <p className="mt-3 text-xs leading-5 text-white/40">
                                                        {
                                                            service.descripcion
                                                        }
                                                    </p>
                                                )}

                                                {service.precio >
                                                    0 && (
                                                    <p className="mt-3 text-sm font-semibold text-white/70">
                                                        {formatCurrency(
                                                            service.precio
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={
                                        <Wrench size={28} />
                                    }
                                    text="Todavía no hay servicios registrados."
                                />
                            )}
                        </section>
                    </div>

                    {/* COLUMNA DERECHA */}

                    <div className="space-y-6">

                        {/* PRESUPUESTOS */}

                        <section className="rounded-3xl border border-orange-500/20 bg-orange-500/[0.04] p-6">

                            <div className="flex items-center justify-between">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                                    <FileText size={18} />
                                </div>

                                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                                    {pendingBudgets.length
                                        ? `${pendingBudgets.length} pendiente${
                                              pendingBudgets.length ===
                                              1
                                                  ? ""
                                                  : "s"
                                          }`
                                        : "Sin pendientes"}
                                </span>
                            </div>

                            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-white/30">
                                Presupuestos
                            </p>

                            <h3 className="mt-2 text-2xl font-semibold">
                                {pendingBudgets.length
                                    ? formatCurrency(
                                          totalBudgetPending
                                      )
                                    : "Sin presupuestos"}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-white/40">
                                {pendingBudgets.length
                                    ? "Tenés presupuestos pendientes de revisión."
                                    : "No tenés presupuestos pendientes de aprobación."}
                            </p>

                            {pendingBudgets.length >
                                0 && (
                                <div className="mt-5 space-y-2">
                                    {pendingBudgets
                                        .slice(
                                            0,
                                            3
                                        )
                                        .map(
                                            (
                                                budget
                                            ) => (
                                                <div
                                                    key={
                                                        budget.id
                                                    }
                                                    className="rounded-xl border border-white/[0.06] bg-black/10 p-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold">
                                                            {
                                                                budget.numero
                                                            }
                                                        </span>

                                                        <span className="text-xs font-semibold text-orange-400">
                                                            {formatCurrency(
                                                                budget.total
                                                            )}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-[11px] text-white/35">
                                                        {budget.vehiculoNombre ||
                                                            nombreVehiculo}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                </div>
                            )}

                        </section>

                        {/* PAGOS */}

                        <section className="rounded-3xl border border-white/[0.07] bg-[#101214] p-6">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                    <Receipt size={18} />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold">
                                        Pagos y comprobantes
                                    </p>

                                    <p className="text-xs text-white/35">
                                        {payments.length} pagos ·{" "}
                                        {receipts.length} recibos
                                    </p>
                                </div>

                            </div>

                            <div className="mt-5 rounded-xl bg-white/[0.025] p-4">

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-white/35">
                                        Total registrado
                                    </span>

                                    <span className="font-semibold text-white/70">
                                        {formatCurrency(
                                            totalPayments
                                        )}
                                    </span>
                                </div>

                            </div>

                        </section>

{/* ACCIONES */}

<section className="rounded-3xl border border-white/[0.07] bg-[#101214] p-6">

    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/30">
        Información
    </p>

    <div className="mt-4 space-y-2">

        <button
            type="button"
            onClick={() =>
                setActiveInfoModal("turnos")
            }
            className="w-full"
        >
            <QuickAction
                icon={
                    <CalendarDays size={17} />
                }
                title="Mis turnos"
                description={`${appointments.length} registrados`}
            />
        </button>

        <button
            type="button"
            onClick={() =>
                setActiveInfoModal("vehiculos")
            }
            className="w-full"
        >
            <QuickAction
                icon={
                    <Car size={17} />
                }
                title="Mis vehículos"
                description={`${vehicles.length} registrado${
                    vehicles.length === 1
                        ? ""
                        : "s"
                }`}
            />
        </button>

        <button
            type="button"
            onClick={() =>
                setActiveInfoModal("presupuestos")
            }
            className="w-full"
        >
            <QuickAction
                icon={
                    <FileText size={17} />
                }
                title="Mis presupuestos"
                description={`${budgets.length} registrados`}
            />
        </button>

        <button
            type="button"
            onClick={() =>
                setActiveInfoModal("pagos")
            }
            className="w-full"
        >
            <QuickAction
                icon={
                    <Receipt size={17} />
                }
                title="Pagos y comprobantes"
                description={`${receipts.length} recibos`}
            />
        </button>

    </div>

</section>

                        {/* ESTADO TALLER */}

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

            {/* ============================================================
    MODAL SOLICITAR TURNO
============================================================ */}

{showAppointmentModal && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101214] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">

                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                        Mora Mecánica
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-white">
                        Solicitar turno
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                        Elegí el vehículo, servicio y horario.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setShowAppointmentModal(false)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white"
                >
                    ✕
                </button>

            </div>

            {/* FORM */}

            <div className="space-y-5 p-6">

                {/* VEHÍCULO */}

                <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                        Vehículo
                    </label>

                    <select
                        value={
                            appointmentForm.vehiculoId
                        }
                        onChange={(e) =>
                            setAppointmentForm(
                                (prev) => ({
                                    ...prev,
                                    vehiculoId:
                                        e.target.value,
                                })
                            )
                        }
                        className="w-full rounded-xl border border-white/[0.08] bg-[#0b0c0e] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    >
                        <option value="">
                            Seleccioná un vehículo
                        </option>

                        {vehicles.map(
                            (vehicle) => (
                                <option
                                    key={
                                        vehicle.id
                                    }
                                    value={
                                        vehicle.id
                                    }
                                >
                                    {vehicle.marca}{" "}
                                    {vehicle.modelo}{" "}
                                    —{" "}
                                    {vehicle.patente}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* SERVICIO */}

                <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                        Servicio
                    </label>

                    <select
                        value={
                            appointmentForm.servicio
                        }
                        onChange={(e) =>
                            setAppointmentForm(
                                (prev) => ({
                                    ...prev,
                                    servicio:
                                        e.target.value,
                                })
                            )
                        }
                        className="w-full rounded-xl border border-white/[0.08] bg-[#0b0c0e] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    >
                        <option value="">
                            Seleccioná un servicio
                        </option>

                        <option value="Mantenimiento">
                            Mantenimiento
                        </option>

                        <option value="Cambio de aceite">
                            Cambio de aceite
                        </option>

                        <option value="Frenos">
                            Frenos
                        </option>

                        <option value="Diagnóstico">
                            Diagnóstico
                        </option>

                        <option value="Service">
                            Service
                        </option>

                        <option value="Electricidad">
                            Electricidad
                        </option>

                        <option value="Neumáticos">
                            Neumáticos
                        </option>

                        <option value="Otro">
                            Otro
                        </option>
                    </select>
                </div>

                {/* FECHA */}

                <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                        Fecha
                    </label>

                    <input
                        type="date"
                        value={appointmentForm.date}
                        min={
                            new Date()
                                .toISOString()
                                .split("T")[0]
                        }
                        onChange={(e) =>
                            setAppointmentForm(
                                (prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                })
                            )
                        }
                        className="w-full rounded-xl border border-white/[0.10] bg-[#0b0c0e] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        style={{
                            colorScheme: "dark",
                        }}
                    />
                </div>

                {/* HORA */}

                {/* HORA */}

                <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                        Horario
                    </label>

                    {availableAppointmentSlots.length > 0 ? (
                        <select
                            value={appointmentForm.start}
                            onChange={(e) =>
                                setAppointmentForm(
                                    (prev) => ({
                                        ...prev,
                                        start: e.target.value,
                                    })
                                )
                            }
                            className="w-full rounded-xl border border-white/[0.10] bg-[#0b0c0e] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        >
                            <option value="">
                                Seleccioná un horario
                            </option>

                            {availableAppointmentSlots.map(
                                (slot) => (
                                    <option
                                        key={slot}
                                        value={slot}
                                    >
                                        {slot}
                                    </option>
                                )
                            )}
                        </select>
                    ) : (
                        <input
                            type="time"
                            value={appointmentForm.start}
                            onChange={(e) =>
                                setAppointmentForm(
                                    (prev) => ({
                                        ...prev,
                                        start: e.target.value,
                                    })
                                )
                            }
                            min={scheduleConfig.startTime}
                            max={scheduleConfig.endTime}
                            step={Number(scheduleConfig.slotMinutes) * 60}
                            className="w-full rounded-xl border border-white/[0.10] bg-[#0b0c0e] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                            style={{
                                colorScheme: "dark",
                            }}
                        />
                    )}
                </div>

                {/* OBSERVACIONES */}

                <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                        Observaciones
                    </label>

                    <textarea
                        value={
                            appointmentForm.notes
                        }
                        onChange={(e) =>
                            setAppointmentForm(
                                (prev) => ({
                                    ...prev,
                                    notes:
                                        e.target.value,
                                })
                            )
                        }
                        rows={3}
                        placeholder="Contanos brevemente qué necesitás..."
                        className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0b0c0e] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-500"
                    />
                </div>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-white/[0.06] bg-white/[0.015] px-6 py-4">

                <button
                    type="button"
                    onClick={() =>
                        setShowAppointmentModal(false)
                    }
                    className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    onClick={solicitarTurno}
                    disabled={
                        savingAppointment ||
                        vehicles.length === 0
                    }
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <CheckCircle2 size={17} />

                    {savingAppointment
                        ? "Solicitando..."
                        : "Solicitar turno"}
                </button>

            </div>

        </div>
    </div>
)}

{/* ============================================================
    MODAL INFORMACIÓN
============================================================ */}

{activeInfoModal && (
    <div
        className="fixed inset-0 z-[190] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={() =>
            setActiveInfoModal(null)
        }
    >

        <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101214] shadow-2xl"
            onClick={(e) =>
                e.stopPropagation()
            }
        >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">

                <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                        Mora Mecánica
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-white">

                        {activeInfoModal === "turnos" &&
                            "Mis turnos"}

                        {activeInfoModal === "vehiculos" &&
                            "Mis vehículos"}

                        {activeInfoModal === "presupuestos" &&
                            "Mis presupuestos"}

                        {activeInfoModal === "pagos" &&
                            "Pagos y comprobantes"}

                    </h2>

                    <p className="mt-1 text-sm text-white/40">

                        {activeInfoModal === "turnos" &&
                            "Consultá tus turnos registrados."}

                        {activeInfoModal === "vehiculos" &&
                            "Vehículos asociados a tu cuenta."}

                        {activeInfoModal === "presupuestos" &&
                            "Consultá los presupuestos realizados."}

                        {activeInfoModal === "pagos" &&
                            "Consultá tus pagos y comprobantes."}

                    </p>

                </div>

                <button
                    type="button"
                    onClick={() =>
                        setActiveInfoModal(null)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white"
                >
                    ✕
                </button>

            </div>

            {/* CONTENIDO */}

            <div className="max-h-[70vh] overflow-y-auto p-6">

                {/* ================================================= */}
                {/* TURNOS */}
                {/* ================================================= */}

                {activeInfoModal === "turnos" && (

                    <div className="space-y-3">

                        {appointments.length === 0 ? (

                            <EmptyState
                                icon={
                                    <CalendarDays
                                        size={30}
                                    />
                                }
                                text="No tenés turnos registrados."
                            />

                        ) : (

                            appointments.map(
                                (appointment) => (

                                    <div
                                        key={
                                            appointment.id
                                        }
                                        className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                                    >

                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                            <div>

                                                <p className="text-sm font-semibold text-white">
                                                    {appointment.servicio ||
                                                        "Servicio"}
                                                </p>

                                                <p className="mt-1 text-xs text-white/35">
                                                    {appointment.vehiculo ||
                                                        "Vehículo"}
                                                    {appointment.patente
                                                        ? ` · ${appointment.patente}`
                                                        : ""}
                                                </p>

                                            </div>

                                            <span
                                                className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                    appointment.status ===
                                                    "Confirmado"
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : appointment.status ===
                                                          "En espera"
                                                        ? "bg-orange-500/10 text-orange-400"
                                                        : appointment.status ===
                                                          "En taller"
                                                        ? "bg-blue-500/10 text-blue-400"
                                                        : appointment.status ===
                                                          "Cancelado"
                                                        ? "bg-red-500/10 text-red-400"
                                                        : "bg-white/[0.05] text-white/50"
                                                }`}
                                            >
                                                {appointment.status ||
                                                    "En espera"}
                                            </span>

                                        </div>

                                        <div className="mt-4 grid gap-2 sm:grid-cols-3">

                                            <DetailBox
                                                label="Fecha"
                                                value={formatShortDate(
                                                    appointment.date
                                                )}
                                            />

                                            <DetailBox
                                                label="Horario"
                                                value={`${appointment.start} ${
                                                    appointment.end
                                                        ? `— ${appointment.end}`
                                                        : ""
                                                }`}
                                            />

                                            <DetailBox
                                                label="Mecánico"
                                                value={
                                                    appointment.mechanic ||
                                                    "Sin asignar"
                                                }
                                            />

                                        </div>

                                        {appointment.notes && (
                                            <div className="mt-3 rounded-xl bg-white/[0.025] p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                                                    Observaciones
                                                </p>

                                                <p className="mt-1 text-xs text-white/50">
                                                    {
                                                        appointment.notes
                                                    }
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>

                )}

                {/* ================================================= */}
                {/* VEHÍCULOS */}
                {/* ================================================= */}

                {activeInfoModal === "vehiculos" && (

                    <div className="space-y-3">

                        {vehicles.length === 0 ? (

                            <EmptyState
                                icon={
                                    <Car size={30} />
                                }
                                text="No tenés vehículos registrados."
                            />

                        ) : (

                            vehicles.map(
                                (vehicle) => (

                                    <div
                                        key={
                                            vehicle.id
                                        }
                                        className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                                    >

                                        <div className="flex items-center gap-4">

                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                                                <Car
                                                    size={21}
                                                />
                                            </div>

                                            <div className="min-w-0">

                                                <p className="font-semibold text-white">
                                                    {vehicle.marca}{" "}
                                                    {vehicle.modelo}
                                                </p>

                                                <p className="mt-1 text-xs text-white/35">
                                                    {vehicle.patente ||
                                                        vehicle.matricula ||
                                                        "Sin patente"}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="mt-5 grid gap-2 sm:grid-cols-3">

                                            <DetailBox
                                                label="Año"
                                                value={
                                                    vehicle.anio
                                                        ? String(
                                                              vehicle.anio
                                                          )
                                                        : "Sin registrar"
                                                }
                                            />

                                            <DetailBox
                                                label="Kilometraje"
                                                value={
                                                    vehicle.kilometraje
                                                        ? `${Number(
                                                              vehicle.kilometraje
                                                          ).toLocaleString(
                                                              "es-AR"
                                                          )} km`
                                                        : "Sin registrar"
                                                }
                                            />

                                            <DetailBox
                                                label="Color"
                                                value={
                                                    vehicle.color ||
                                                    "Sin registrar"
                                                }
                                            />

                                        </div>

                                        {vehicle.estado && (
                                            <div className="mt-3 rounded-xl bg-white/[0.025] p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                                                    Estado
                                                </p>

                                                <p className="mt-1 text-xs font-medium text-white/60">
                                                    {
                                                        vehicle.estado
                                                    }
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>

                )}

                {/* ================================================= */}
                {/* PRESUPUESTOS */}
                {/* ================================================= */}

                {activeInfoModal === "presupuestos" && (

                    <div className="space-y-3">

                        {budgets.length === 0 ? (

                            <EmptyState
                                icon={
                                    <FileText
                                        size={30}
                                    />
                                }
                                text="No tenés presupuestos registrados."
                            />

                        ) : (

                            budgets.map(
                                (budget: any) => (

                                    <div
                                        key={
                                            budget.id
                                        }
                                        className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                                    >

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                            <div>

                                                <p className="text-sm font-semibold text-white">
                                                    Presupuesto{" "}
                                                    {budget.numero ||
                                                        budget.id}
                                                </p>

                                                <p className="mt-1 text-xs text-white/35">
                                                    {budget.vehiculoNombre ||
                                                        "Vehículo"}
                                                    {budget.patente
                                                        ? ` · ${budget.patente}`
                                                        : ""}
                                                </p>

                                            </div>

                                            <span className="w-fit rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                                                {budget.estado ||
                                                    "Pendiente"}
                                            </span>

                                        </div>

                                        <div className="mt-4 grid gap-2 sm:grid-cols-2">

                                            <DetailBox
                                                label="Fecha"
                                                value={
                                                    budget.fecha
                                                        ? formatShortDate(
                                                              budget.fecha
                                                          )
                                                        : "Sin registrar"
                                                }
                                            />

                                            <DetailBox
                                                label="Total"
                                                value={formatCurrency(
                                                    Number(
                                                        budget.total ||
                                                            0
                                                    )
                                                )}
                                            />

                                        </div>

                                        {budget.observaciones && (
                                            <div className="mt-3 rounded-xl bg-white/[0.025] p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                                                    Observaciones
                                                </p>

                                                <p className="mt-1 text-xs text-white/50">
                                                    {
                                                        budget.observaciones
                                                    }
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>

                )}

{/* ================================================= */}
{/* PAGOS */}
{/* ================================================= */}

{activeInfoModal === "pagos" && (

    <div className="space-y-3">

        {payments.length === 0 ? (

            <EmptyState
                icon={
                    <Receipt
                        size={30}
                    />
                }
                text="No tenés pagos registrados."
            />

        ) : (

            payments.map(
                (payment) => {

                    /*
                     * Buscamos el servicio relacionado
                     * usando servicioId, igual que el
                     * historial de servicios.
                     */

                    const relatedService =
                        services.find(
                            (service) =>
                                service.id ===
                                payment.servicioId
                        );

                    /*
                     * Buscamos también el comprobante
                     * relacionado, si existe.
                     */

                    const relatedReceipt =
                        receipts.find(
                            (receipt) =>
                                receipt.servicioId ===
                                    payment.servicioId
                        );

                    return (

                        <div
                            key={
                                payment.id
                            }
                            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                        >

                            {/* ================================================= */}
                            {/* ENCABEZADO */}
                            {/* ================================================= */}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                <div>

                                    <p className="text-sm font-semibold text-white">

                                        {relatedService?.tipo ||
                                            relatedService?.descripcion ||
                                            "Pago registrado"}

                                    </p>

                                    <p className="mt-1 text-xs text-white/35">

                                        {relatedService?.categoria
                                            ? relatedService.categoria
                                            : payment.servicioId
                                            ? `Servicio #${payment.servicioId}`
                                            : "Pago registrado"}

                                    </p>

                                </div>

                                <p className="text-lg font-semibold text-emerald-400">

                                    {formatCurrency(
                                        Number(
                                            payment.importe ||
                                                0
                                        )
                                    )}

                                </p>

                            </div>

                            {/* ================================================= */}
                            {/* INFORMACIÓN */}
                            {/* ================================================= */}

                            <div className="mt-4 grid gap-2 sm:grid-cols-3">

                                <DetailBox
                                    label="Fecha"
                                    value={
                                        payment.fecha
                                            ? formatShortDate(
                                                  payment.fecha
                                              )
                                            : payment.creadoEn
                                            ? formatShortDate(
                                                  payment.creadoEn
                                              )
                                            : "Sin registrar"
                                    }
                                />

                                <DetailBox
                                    label="Medio de pago"
                                    value={
                                        payment.medioPago ||
                                        "No especificado"
                                    }
                                />

                                <DetailBox
                                    label="Servicio"
                                    value={
                                        relatedService?.tipo ||
                                        relatedService?.descripcion ||
                                        "Servicio"
                                    }
                                />

                            </div>

                            {/* ================================================= */}
                            {/* OBSERVACIONES */}
                            {/* ================================================= */}

                            {payment.observaciones && (

                                <div className="mt-3 rounded-xl bg-white/[0.025] p-3">

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                                        Observaciones
                                    </p>

                                    <p className="mt-1 text-xs text-white/50">
                                        {
                                            payment.observaciones
                                        }
                                    </p>

                                </div>

                            )}

                            {/* ================================================= */}
                            {/* COMPROBANTE */}
                            {/* ================================================= */}

                            {relatedReceipt?.pdfUrl && (

                                <a
                                    href={
                                        relatedReceipt.pdfUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/60 transition hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-400"
                                >

                                    <FileText
                                        size={16}
                                    />

                                    Ver comprobante

                                </a>

                            )}

                        </div>

                    );
                }
            )

        )}

    </div>

)}

            </div>

            {/* FOOTER */}

            <div className="flex justify-end border-t border-white/[0.06] bg-white/[0.015] px-6 py-4">

                <button
                    type="button"
                    onClick={() =>
                        setActiveInfoModal(null)
                    }
                    className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                >
                    Cerrar
                </button>

            </div>

        </div>

    </div>
)}

            
        </main>
    );
}

export default ClientDashboard;

/* ============================================================
   HELPERS
============================================================ */

function getTimestamp(
    value: any
): number {
    if (!value) return 0;

    try {
        if (
            typeof value === "string"
        ) {
            const parsed =
                new Date(value).getTime();

            return Number.isNaN(parsed)
                ? 0
                : parsed;
        }

        if (
            value?.toDate
        ) {
            return value
                .toDate()
                .getTime();
        }

        if (
            value?.seconds
        ) {
            return (
                Number(value.seconds) *
                1000
            );
        }

        if (
            value instanceof Date
        ) {
            return value.getTime();
        }

        if (
            typeof value === "number"
        ) {
            return value;
        }
    } catch {
        return 0;
    }

    return 0;
}

function formatDate(
    value: any
): string {
    const timestamp =
        getTimestamp(value);

    if (!timestamp)
        return "Sin registrar";

    return new Date(
        timestamp
    ).toLocaleDateString(
        "es-AR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    );
}

function formatShortDate(
    value: any
): string {
    const timestamp =
        getTimestamp(value);

    if (!timestamp)
        return "Sin fecha";

    return new Date(
        timestamp
    ).toLocaleDateString(
        "es-AR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    );
}

function formatCurrency(
    value: number
): string {
    return new Intl.NumberFormat(
        "es-AR",
        {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }
    ).format(value || 0);
}

/* ============================================================
   COMPONENTES AUXILIARES
============================================================ */

interface SummaryCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    description: string;
    accent?: boolean;
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
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-white/[0.04] text-white/50"
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
    );
}

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function InfoRow({
    icon,
    label,
    value,
}: InfoRowProps) {
    return (
        <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                {icon}
            </div>

            <div>
                <p className="text-[11px] text-white/30">
                    {label}
                </p>

                <p className="text-sm font-medium">
                    {value}
                </p>
            </div>

        </div>
    );
}

interface DetailBoxProps {
    label: string;
    value: string;
}

function DetailBox({
    label,
    value,
}: DetailBoxProps) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">

            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                {label}
            </p>

            <p className="mt-2 text-sm font-semibold">
                {value}
            </p>

        </div>
    );
}

interface EmptyStateProps {
    icon: React.ReactNode;
    text: string;
}

function EmptyState({
    icon,
    text,
}: EmptyStateProps) {
    return (
        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6 text-center">

            <div className="mx-auto flex justify-center text-white/20">
                {icon}
            </div>

            <p className="mt-3 text-sm text-white/40">
                {text}
            </p>

        </div>
    );
}

interface QuickActionProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function QuickAction({
    icon,
    title,
    description,
}: QuickActionProps) {
    return (
        <button
            type="button"
            className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-white/[0.06] hover:bg-white/[0.025]"
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/45 transition group-hover:bg-orange-500/10 group-hover:text-orange-500">
                {icon}
            </div>

            <div className="flex-1">
                <span className="block text-sm text-white/65 transition group-hover:text-white">
                    {title}
                </span>

                <span className="block text-[10px] text-white/25">
                    {description}
                </span>
            </div>

            <ChevronRight
                size={15}
                className="text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50"
            />
        </button>
    );
}