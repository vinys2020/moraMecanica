import {
  AlertCircle,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Loader2,
  Plus,
  Search,
  Settings,
  Trash2,
  UserRound,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminLayout from "../components/AdminLayout";
import { db } from "../config/firebase";

/* ============================================================
   TIPOS
============================================================ */

type AppointmentStatus =
  | "Confirmado"
  | "En espera"
  | "En taller"
  | "Finalizado"
  | "Cancelado";

interface Appointment {
  id: string;
  numero?: string;

  clienteId: string;
  clienteNombre: string;
  clienteEmail?: string;
  telefono: string;

  vehiculoId: string;
  vehiculo: string;
  patente: string;

  marca?: string;
  modelo?: string;
  anio?: string;

  servicio: string;
  mechanic: string;

  date: string;
  start: string;
  end: string;

  status: AppointmentStatus;

  notes?: string;

  creadoEn?: any;
}

interface Client {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  telefono: string;
  activo: boolean;
  rol?: string;
}

interface Vehicle {
  id: string;
  clienteId: string | null;
  usuarioId?: string | null;
  marca: string;
  modelo: string;
  anio: string;
  patente: string;
  color: string;
  kilometraje: number;
}

interface Mechanic {
  name: string;
  short: string;
  color: string;
}

interface TurnoScheduleConfig {
  active: boolean;
  days: string[];

  morningStart: string;
  morningEnd: string;

  afternoonStart: string;
  afternoonEnd: string;

  slotMinutes: number;
}
/* ============================================================
   MECÁNICOS
============================================================ */

const mechanics: Mechanic[] = [
  {
    name: "J. Gómez",
    short: "JG",
    color: "blue",
  },
  {
    name: "M. López",
    short: "ML",
    color: "emerald",
  },
  {
    name: "R. Díaz",
    short: "RD",
    color: "violet",
  },
  {
    name: "A. Torres",
    short: "AT",
    color: "amber",
  },
];

/* ============================================================
   SERVICIOS
============================================================ */

const serviceOptions = [
  "Service completo",
  "Cambio de aceite",
  "Diagnóstico",
  "Diagnóstico electrónico",
  "Frenos",
  "Alineación",
  "Balanceo",
  "Cambio de distribución",
  "Cambio de pastillas",
  "Mantenimiento",
  "Electricidad",
  "Neumáticos",
  "Otro",
];

/* ============================================================
   ESTADOS
============================================================ */

const appointmentStatuses: AppointmentStatus[] = [
  "Confirmado",
  "En espera",
  "En taller",
  "Finalizado",
  "Cancelado",
];

interface TimestampLike {
  toDate: () => Date;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  );
}

function normalizeAppointmentDate(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    const dateValue = value.trim();
    const isoDate = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);

    if (isoDate) return isoDate[1];

    const localDate = dateValue.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

    if (localDate) {
      return `${localDate[3]}-${localDate[2].padStart(2, "0")}-${localDate[1].padStart(2, "0")}`;
    }
  }

  const date =
    isTimestampLike(value)
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(String(value));

  if (Number.isNaN(date.getTime())) return "";

  return dateToInput(date);
}

function normalizeAppointmentTime(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    const time = value.trim().match(/(?:T|\s)?(\d{1,2}):(\d{2})/);

    if (time) {
      return `${time[1].padStart(2, "0")}:${time[2]}`;
    }
  }

  const date =
    isTimestampLike(value)
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(String(value));

  if (Number.isNaN(date.getTime())) return String(value);

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function mapAppointment(id: string, value: DocumentData): Appointment {
  const rawStatus = String(
    value.status ?? value.estado ?? "En espera"
  ).trim();

  const status =
    appointmentStatuses.find(
      (appointmentStatus) =>
        appointmentStatus.toLowerCase() === rawStatus.toLowerCase()
    ) ?? "En espera";

  return {
    id,
    numero: String(value.numero ?? id),
    clienteId: value.clienteId ?? value.usuarioId ?? "",
    clienteNombre: value.clienteNombre ?? value.cliente ?? "",
    clienteEmail: value.clienteEmail ?? value.email ?? "",
    telefono: value.telefono ?? "",
    vehiculoId: value.vehiculoId ?? "",
    vehiculo: value.vehiculo ?? "",
    patente: value.patente ?? value.matricula ?? "",
    marca: value.marca ?? "",
    modelo: value.modelo ?? "",
    anio: String(value.anio ?? ""),
    servicio: value.servicio ?? "",
    mechanic: value.mechanic ?? value.mecanico ?? "Sin asignar",
    date: normalizeAppointmentDate(value.date ?? value.fecha),
    start: normalizeAppointmentTime(
      value.start ?? value.hora ?? value.horaInicio
    ),
    end: normalizeAppointmentTime(
      value.end ?? value.horaFin ?? value.horaFinalizacion
    ),
    status,
    notes: value.notes ?? value.observaciones ?? "",
    creadoEn: value.creadoEn ?? null,
  };
}

/* ============================================================
   ESTILOS
============================================================ */

const statusStyles: Record<
  AppointmentStatus,
  {
    container: string;
    dot: string;
  }
> = {
  Confirmado: {
    container:
      "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100",
    dot: "bg-blue-500",
  },

  "En espera": {
    container:
      "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
    dot: "bg-amber-500",
  },

  "En taller": {
    container:
      "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
    dot: "bg-emerald-500",
  },

  Finalizado: {
    container:
      "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
    dot: "bg-slate-500",
  },

  Cancelado: {
    container:
      "border-red-200 bg-red-50 text-red-900 hover:bg-red-100",
    dot: "bg-red-500",
  },
};

const mechanicColors: Record<
  string,
  {
    badge: string;
    border: string;
  }
> = {
  "J. Gómez": {
    badge: "bg-blue-100 text-blue-700",
    border: "border-l-blue-500",
  },

  "M. López": {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-l-emerald-500",
  },

  "R. Díaz": {
    badge: "bg-violet-100 text-violet-700",
    border: "border-l-violet-500",
  },

  "A. Torres": {
    badge: "bg-amber-100 text-amber-700",
    border: "border-l-amber-500",
  },
};

/* ============================================================
   CONFIGURACIÓN POR DEFECTO
============================================================ */

const defaultScheduleConfig: TurnoScheduleConfig = {
  active: true,

  days: [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],

  morningStart: "06:00",
  morningEnd: "13:00",

  afternoonStart: "18:00",
  afternoonEnd: "22:00",

  slotMinutes: 90,
};

const scheduleDays = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/* ============================================================
   HELPERS FECHA
============================================================ */

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateToInput(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(
  dateString: string,
  days: number
) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  date.setDate(
    date.getDate() + days
  );

  return dateToInput(date);
}

function getMonday(
  dateString: string
) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  const day = date.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  date.setDate(
    date.getDate() + difference
  );

  return dateToInput(date);
}

function getWeekDays(
  selectedDate: string
) {
  const monday =
    getMonday(selectedDate);

  return Array.from(
    { length: 7 },
    (_, index) => {
      const date =
        addDays(monday, index);

      const parsed =
        new Date(
          `${date}T12:00:00`
        );

      const day =
        new Intl.DateTimeFormat(
          "es-AR",
          {
            weekday: "short",
          }
        )
          .format(parsed)
          .replace(".", "");

      return {
        date,

        day:
          day.charAt(0).toUpperCase() +
          day.slice(1),

        number:
          String(
            parsed.getDate()
          ),
      };
    }
  );
}

function formatDateLabel(
  date: string
) {
  if (!date) return "";

  const [
    year,
    month,
    day,
  ] = date
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
  );
}

function formatDateShort(
  date: string
) {
  if (!date) return "";

  const [
    year,
    month,
    day,
  ] = date
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
  );
}

/* ============================================================
   HELPERS HORARIO
============================================================ */

function timeToMinutes(
  time: string
) {
  if (!time) return 0;

  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

function getDefaultEndTime(
  start: string,
  duration = 90
) {
  if (!start) return "";

  const [
    hours,
    minutes,
  ] = start
    .split(":")
    .map(Number);

  const total =
    hours * 60 +
    minutes +
    duration;

  const finalHours =
    Math.floor(total / 60);

  const finalMinutes =
    total % 60;

  return `${String(
    finalHours
  ).padStart(2, "0")}:${String(
    finalMinutes
  ).padStart(2, "0")}`;
}

function toMinutes(
  time: string
) {
  if (!time) return 0;

  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

/* ============================================================
   CONFIGURACIÓN AGENDA
============================================================ */

const weekdayMap: Record<
  string,
  string
> = {
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

function getDateWeekday(
  dateString: string
) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  const dayName =
    date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      }
    );

  return (
    weekdayMap[dayName] ??
    "Lunes"
  );
}

function dateIsEnabledInSchedule(
  dateString: string,
  config: TurnoScheduleConfig
) {
  if (!config.active) {
    return false;
  }

  return config.days.includes(
    getDateWeekday(dateString)
  );
}

function timeRangeIsAllowed(
  start: string,
  end: string,
  config: TurnoScheduleConfig
) {
  if (!config.active) {
    return false;
  }

  if (!start || !end) {
    return false;
  }

  const startMinutes =
    toMinutes(start);

  const endMinutes =
    toMinutes(end);

  if (endMinutes <= startMinutes) {
    return false;
  }

  const duration =
    endMinutes - startMinutes;

  const validDuration =
    duration %
    Number(config.slotMinutes) ===
    0;

  if (!validDuration) {
    return false;
  }

  const morningStart =
    toMinutes(
      config.morningStart
    );

  const morningEnd =
    toMinutes(
      config.morningEnd
    );

  const afternoonStart =
    toMinutes(
      config.afternoonStart
    );

  const afternoonEnd =
    toMinutes(
      config.afternoonEnd
    );

  const insideMorning =
    startMinutes >=
    morningStart &&
    endMinutes <=
    morningEnd;

  const insideAfternoon =
    startMinutes >=
    afternoonStart &&
    endMinutes <=
    afternoonEnd;

  return (
    insideMorning ||
    insideAfternoon
  );
}

/* ============================================================
   COMPONENTE
============================================================ */

function Turnos() {
  /* ============================================================
     ESTADOS
  ============================================================ */

  const [
    appointments,
    setAppointments,
  ] = useState<Appointment[]>([]);

  const [
    clients,
    setClients,
  ] = useState<Client[]>([]);

  const [calendarView, setCalendarView] = useState<
    "week" | "month"
  >("week");

  const [
    vehicles,
    setVehicles,
  ] = useState<Vehicle[]>([]);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(getToday());

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] =
    useState<Appointment | null>(
      null
    );

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    showScheduleConfig,
    setShowScheduleConfig,
  ] = useState(false);

  const [
    showAppointmentManager,
    setShowAppointmentManager,
  ] = useState(false);

  const [
    appointmentToDelete,
    setAppointmentToDelete,
  ] = useState<Appointment | null>(null);

  const [deleteConfirmationStep, setDeleteConfirmationStep] =
    useState<0 | 1 | 2>(0);

  const [deletingAppointmentId, setDeletingAppointmentId] =
    useState<string | null>(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "Todos" | AppointmentStatus
  >("Todos");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [appointmentsLoaded, setAppointmentsLoaded] =
    useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    savingSchedule,
    setSavingSchedule,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    scheduleConfig,
    setScheduleConfig,
  ] =
    useState<TurnoScheduleConfig>(
      defaultScheduleConfig
    );

  /* ============================================================
     FORMULARIO NUEVO TURNO
  ============================================================ */

  const [
    form,
    setForm,
  ] = useState({
    clienteId: "",
    vehiculoId: "",
    date: getToday(),
    start: "08:00",
    end: "09:00",
    servicio: "",
    mechanic: "",
    notes: "",
  });

  /* ============================================================
     SEMANA
  ============================================================ */

  const weekDays =
    useMemo(
      () =>
        getWeekDays(
          selectedDate
        ),
      [selectedDate]
    );

  const monthDays =
    useMemo(() => {
      const calendarStart = getMonday(
        `${selectedDate.slice(0, 7)}-01`
      );

      return Array.from(
        { length: 42 },
        (_, index) => addDays(calendarStart, index)
      );
    }, [selectedDate]);

  const hours = Array.from(
    {
      length: 17,
    },
    (_, index) =>
      index + 6
  );

  /* ============================================================
     VEHÍCULOS DEL CLIENTE
  ============================================================ */

  const clientVehicles =
    useMemo(() => {
      if (!form.clienteId) {
        return [];
      }

      return vehicles.filter(
        (vehicle) => {
          const clientId =
            vehicle.clienteId ??
            vehicle.usuarioId ??
            "";

          return (
            clientId ===
            form.clienteId
          );
        }
      );
    }, [
      vehicles,
      form.clienteId,
    ]);

  /* ============================================================
     CARGAR CLIENTES
  ============================================================ */

  const cargarClientes =
    async () => {
      const snapshot =
        await getDocs(
          collection(
            db,
            "usuarios"
          )
        );

      const data =
        snapshot.docs
          .map((item) => {
            const value =
              item.data();

            const rol =
              String(
                value.rol ??
                ""
              ).toLowerCase();

            return {
              id: item.id,

              uid:
                value.uid ??
                item.id,

              nombre:
                value.nombre ??
                value.name ??
                "",

              email:
                value.email ??
                "",

              telefono:
                value.telefono ??
                value.phone ??
                "",

              activo:
                value.activo ??
                true,

              rol,
            };
          })
          .filter(
            (client) =>
              client.nombre
          )
          .filter(
            (client) => {
              if (
                !client.rol
              ) {
                return true;
              }

              return (
                client.rol ===
                "cliente"
              );
            }
          )
          .sort(
            (a, b) =>
              a.nombre.localeCompare(
                b.nombre,
                "es"
              )
          );

      setClients(
        data
      );
    };

  /* ============================================================
     CARGAR VEHÍCULOS
  ============================================================ */

  const cargarVehiculos =
    async () => {
      const snapshot =
        await getDocs(
          collection(
            db,
            "vehiculos"
          )
        );

      const data =
        snapshot.docs.map(
          (item) => {
            const value =
              item.data();

            return {
              id: item.id,

              clienteId:
                value.clienteId ??
                value.usuarioId ??
                null,

              usuarioId:
                value.usuarioId ??
                null,

              marca:
                value.marca ??
                "",

              modelo:
                value.modelo ??
                "",

              anio:
                String(
                  value.anio ??
                  ""
                ),

              patente:
                value.patente ??
                value.matricula ??
                "",

              color:
                value.color ??
                "",

              kilometraje:
                Number(
                  value.kilometraje ??
                  0
                ),
            };
          }
        );

      setVehicles(
        data
      );
    };

  /* ============================================================
     CARGAR CONFIGURACIÓN
  ============================================================ */

  const cargarConfiguracionAgenda =
    async () => {
      try {
        const configDoc =
          await getDoc(
            doc(
              db,
              "configuracionAgenda",
              "turnos"
            )
          );

        if (
          configDoc.exists()
        ) {
          const data =
            configDoc.data() as Partial<TurnoScheduleConfig>;

          setScheduleConfig({
            active:
              data.active ??
              defaultScheduleConfig.active,

            days:
              Array.isArray(
                data.days
              ) &&
                data.days.length
                ? data.days
                : defaultScheduleConfig.days,

            morningStart:
              data.morningStart ??
              defaultScheduleConfig.morningStart,

            morningEnd:
              data.morningEnd ??
              defaultScheduleConfig.morningEnd,

            afternoonStart:
              data.afternoonStart ??
              defaultScheduleConfig.afternoonStart,

            afternoonEnd:
              data.afternoonEnd ??
              defaultScheduleConfig.afternoonEnd,

            slotMinutes:
              Number(
                data.slotMinutes ??
                defaultScheduleConfig.slotMinutes
              ),
          });
        }
      } catch (err) {
        console.error(
          "Error cargando configuración:",
          err
        );
      }
    };

  /* ============================================================
     CARGA INICIAL
  ============================================================ */

  const cargarDatos =
    async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          cargarClientes(),
          cargarVehiculos(),
          cargarConfiguracionAgenda(),
        ]);
      } catch (err) {
        console.error(
          "Error cargando agenda:",
          err
        );

        setError(
          "No se pudieron cargar los datos de la agenda."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "turnos"),
      (snapshot) => {
        const liveAppointments = snapshot.docs
          .map((item) => mapAppointment(item.id, item.data()))
          .sort((a, b) =>
            `${a.date} ${a.start}`.localeCompare(
              `${b.date} ${b.start}`
            )
          );

        setAppointments(liveAppointments);
        setAppointmentsLoaded(true);
      },
      (snapshotError) => {
        console.error("Error escuchando turnos en tiempo real:", snapshotError);
        setError("No se pudieron actualizar los turnos en tiempo real.");
        setAppointmentsLoaded(true);
      }
    );

    return unsubscribe;
  }, []);

  /* ============================================================
     GUARDAR CONFIGURACIÓN
  ============================================================ */

  const guardarConfiguracionAgenda =
    async () => {
      try {
        setSavingSchedule(
          true
        );

        setError("");

        if (
          scheduleConfig.active &&
          scheduleConfig.days
            .length === 0
        ) {
          setError(
            "Seleccioná al menos un día habilitado."
          );

          return;
        }

        if (
          toMinutes(scheduleConfig.morningStart) >=
          toMinutes(scheduleConfig.morningEnd)
        ) {
          setError(
            "El horario de la mañana no es válido."
          );
          return;
        }

        if (
          toMinutes(scheduleConfig.afternoonStart) >=
          toMinutes(scheduleConfig.afternoonEnd)
        ) {
          setError(
            "El horario de la tarde no es válido."
          );
          return;
        }

        const nextConfig = {
          ...scheduleConfig,

          slotMinutes:
            Number(
              scheduleConfig.slotMinutes
            ) || 60,
        };

        await setDoc(
          doc(
            db,
            "configuracionAgenda",
            "turnos"
          ),
          nextConfig,
          {
            merge: true,
          }
        );

        setScheduleConfig(
          nextConfig
        );

        setShowScheduleConfig(
          false
        );
      } catch (err) {
        console.error(
          "Error guardando configuración:",
          err
        );

        setError(
          "No se pudo guardar la disponibilidad del taller."
        );
      } finally {
        setSavingSchedule(
          false
        );
      }
    };

  /* ============================================================
     CAMBIAR DÍA CONFIGURACIÓN
  ============================================================ */

  const toggleDay = (
    day: string
  ) => {
    setScheduleConfig(
      (prev) => ({
        ...prev,

        days: prev.days.includes(
          day
        )
          ? prev.days.filter(
            (item) =>
              item !== day
          )
          : [
            ...prev.days,
            day,
          ],
      })
    );
  };

  /* ============================================================
     FILTRO
  ============================================================ */

  const filteredAppointments =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return appointments.filter(
        (appointment) => {
          const matchesSearch =
            !term ||
            appointment.clienteNombre
              .toLowerCase()
              .includes(term) ||
            appointment.vehiculo
              .toLowerCase()
              .includes(term) ||
            appointment.patente
              .toLowerCase()
              .includes(term) ||
            appointment.servicio
              .toLowerCase()
              .includes(term);

          const matchesStatus =
            statusFilter ===
            "Todos" ||
            appointment.status ===
            statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      appointments,
      search,
      statusFilter,
    ]);

  /* ============================================================
     ESTADÍSTICAS
  ============================================================ */

  const stats =
    useMemo(() => {
      return {
        total: appointments.length,

        confirmed: appointments.filter(
            (item) =>
              item.status ===
              "Confirmado"
          ).length,

        active: appointments.filter(
            (item) =>
              item.status ===
              "En taller"
          ).length,

        pending: appointments.filter(
            (item) =>
              item.status ===
              "En espera"
          ).length,
      };
    }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const today = getToday();

    return appointments
      .filter(
        (appointment) =>
          appointment.date >= today &&
          appointment.status !== "Cancelado" &&
          appointment.status !== "Finalizado"
      )
      .sort((a, b) =>
        `${a.date} ${a.start}`.localeCompare(
          `${b.date} ${b.start}`
        )
      )
      .slice(0, 5);
  }, [appointments]);

  /* ============================================================
     POSICIÓN DEL TURNO
  ============================================================ */

  const getAppointmentStyle =
    (
      appointment: Appointment
    ) => {
      const startMinutes =
        timeToMinutes(
          appointment.start
        );

      const endMinutes =
        timeToMinutes(
          appointment.end
        );

      const calendarStart = 6 * 60;

      const top =
        ((startMinutes -
          calendarStart) /
          60) *
        80;

      const height =
        ((endMinutes -
          startMinutes) /
          60) *
        80;

      return {
        top: `${Math.max(
          top,
          0
        )}px`,

        height: `${Math.max(
          height,
          50
        )}px`,
      };
    };

  /* ============================================================
     ABRIR NUEVO TURNO
  ============================================================ */

  const openNewAppointment =
    () => {
      setError("");

      setForm({
        clienteId: "",
        vehiculoId: "",
        date:
          selectedDate,
        start:
          scheduleConfig.morningStart ||
          "06:00",

        end:
          getDefaultEndTime(
            scheduleConfig.morningStart ||
            "06:00",
            90
          ),
        servicio: "",
        mechanic: "",
        notes: "",
      });

      setShowModal(
        true
      );
    };

  /* ============================================================
     CAMBIO CLIENTE
  ============================================================ */

  const handleClientChange =
    (
      clienteId: string
    ) => {
      setForm(
        (prev) => ({
          ...prev,
          clienteId,
          vehiculoId: "",
        })
      );
    };

  /* ============================================================
     CREAR TURNO
  ============================================================ */

  const handleCreateAppointment =
    async () => {
      try {
        setError("");

        if (
          !form.clienteId
        ) {
          setError(
            "Seleccioná un cliente."
          );
          return;
        }

        if (
          !form.vehiculoId
        ) {
          setError(
            "Seleccioná un vehículo."
          );
          return;
        }

        if (
          !form.date
        ) {
          setError(
            "Seleccioná una fecha."
          );
          return;
        }

        if (
          !form.start ||
          !form.end
        ) {
          setError(
            "Seleccioná el horario."
          );
          return;
        }

        if (
          timeToMinutes(
            form.end
          ) <=
          timeToMinutes(
            form.start
          )
        ) {
          setError(
            "La hora de finalización debe ser posterior a la hora de inicio."
          );
          return;
        }

        if (
          !form.servicio
        ) {
          setError(
            "Seleccioná el servicio."
          );
          return;
        }

        if (
          !form.mechanic
        ) {
          setError(
            "Asigná un mecánico."
          );
          return;
        }

        /* =====================================================
           VALIDAR DISPONIBILIDAD
        ===================================================== */

        if (
          !scheduleConfig.active
        ) {
          setError(
            "La agenda de turnos está desactivada."
          );
          return;
        }

        if (
          !dateIsEnabledInSchedule(
            form.date,
            scheduleConfig
          )
        ) {
          setError(
            "La fecha seleccionada no está habilitada para recibir turnos."
          );
          return;
        }

        if (
          !timeRangeIsAllowed(
            form.start,
            form.end,
            scheduleConfig
          )
        ) {
          setError(
            `El horario debe estar entre ${scheduleConfig.morningStart} y ${scheduleConfig.morningEnd} y respetar bloques de ${scheduleConfig.slotMinutes} minutos.`
          );
          return;
        }

        /* =====================================================
           BUSCAR CLIENTE
        ===================================================== */

        const client =
          clients.find(
            (item) =>
              item.uid ===
              form.clienteId ||
              item.id ===
              form.clienteId
          );

        /* =====================================================
           BUSCAR VEHÍCULO
        ===================================================== */

        const vehicle =
          vehicles.find(
            (item) =>
              item.id ===
              form.vehiculoId
          );

        if (!client) {
          setError(
            "No se encontró el cliente seleccionado."
          );
          return;
        }

        if (!vehicle) {
          setError(
            "No se encontró el vehículo seleccionado."
          );
          return;
        }

        /* =====================================================
           VERIFICAR QUE EL VEHÍCULO PERTENEZCA AL CLIENTE
        ===================================================== */

        const vehicleOwner =
          vehicle.clienteId ??
          vehicle.usuarioId ??
          "";

        if (
          vehicleOwner &&
          vehicleOwner !==
          client.uid &&
          vehicleOwner !==
          client.id
        ) {
          setError(
            "El vehículo seleccionado no pertenece al cliente."
          );
          return;
        }

        /* =====================================================
           EVITAR SUPERPOSICIÓN
        ===================================================== */

        const newStart =
          timeToMinutes(
            form.start
          );

        const newEnd =
          timeToMinutes(
            form.end
          );

        const conflict =
          appointments.some(
            (appointment) => {
              if (
                appointment.date !==
                form.date
              ) {
                return false;
              }

              if (
                appointment.status ===
                "Cancelado"
              ) {
                return false;
              }

              if (
                appointment.mechanic !==
                form.mechanic
              ) {
                return false;
              }

              const existingStart =
                timeToMinutes(
                  appointment.start
                );

              const existingEnd =
                timeToMinutes(
                  appointment.end
                );

              return (
                newStart <
                existingEnd &&
                newEnd >
                existingStart
              );
            }
          );

        if (conflict) {
          setError(
            "El mecánico seleccionado ya tiene un turno en ese horario."
          );
          return;
        }

        /* =====================================================
           GUARDAR
        ===================================================== */

        setSaving(
          true
        );

        const numero =
          `T-${Date.now()}`;

        const vehicleName =
          `${vehicle.marca} ${vehicle.modelo}`.trim();

        await addDoc(
          collection(
            db,
            "turnos"
          ),
          {
            numero,

            clienteId:
              client.uid,

            clienteNombre:
              client.nombre,

            clienteEmail:
              client.email,

            telefono:
              client.telefono,

            vehiculoId:
              vehicle.id,

            vehiculo:
              vehicleName,

            patente:
              vehicle.patente,

            marca:
              vehicle.marca,

            modelo:
              vehicle.modelo,

            anio:
              vehicle.anio,

            servicio:
              form.servicio,

            mechanic:
              form.mechanic,

            date:
              form.date,

            start:
              form.start,

            end:
              form.end,

            status:
              "Confirmado",

            notes:
              form.notes.trim(),

            creadoEn:
              serverTimestamp(),
          }
        );

        setSelectedDate(
          form.date
        );

        setShowModal(
          false
        );

        setForm({
          clienteId: "",
          vehiculoId: "",
          date:
            form.date,
          start:
            scheduleConfig.morningStart ||
            "06:00",

          end:
            getDefaultEndTime(
              scheduleConfig.morningStart ||
              "06:00",
              90
            ),
          servicio: "",
          mechanic: "",
          notes: "",
        });
      } catch (err) {
        console.error(
          "Error creando turno:",
          err
        );

        setError(
          "No se pudo crear el turno."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* ============================================================
     ACTUALIZAR ESTADO
  ============================================================ */

  const updateAppointmentStatus =
    async (
      status: AppointmentStatus
    ) => {
      if (
        !selectedAppointment
      ) {
        return;
      }

      try {
        setSaving(
          true
        );

        await updateDoc(
          doc(
            db,
            "turnos",
            selectedAppointment.id
          ),
          {
            status,

            actualizadoEn:
              serverTimestamp(),
          }
        );

        setSelectedAppointment(
          (prev) =>
            prev
              ? {
                ...prev,
                status,
              }
              : null
        );

        setAppointments(
          (prev) =>
            prev.map(
              (appointment) =>
                appointment.id ===
                  selectedAppointment.id
                  ? {
                    ...appointment,
                    status,
                  }
                  : appointment
            )
        );
      } catch (err) {
        console.error(
          "Error actualizando turno:",
          err
        );

        setError(
          "No se pudo actualizar el estado del turno."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const requestAppointmentDeletion = (
    appointment: Appointment
  ) => {
    setAppointmentToDelete(appointment);
    setDeleteConfirmationStep(1);
    setError("");
  };

  const cancelAppointmentDeletion = () => {
    setAppointmentToDelete(null);
    setDeleteConfirmationStep(0);
  };

  const handleDeleteAppointment = async () => {
    if (
      !appointmentToDelete ||
      deleteConfirmationStep !== 2
    ) {
      return;
    }

    const appointmentId = appointmentToDelete.id;

    try {
      setDeletingAppointmentId(appointmentId);
      await deleteDoc(
        doc(db, "turnos", appointmentId)
      );

      setAppointments((current) =>
        current.filter((item) => item.id !== appointmentId)
      );
      setSelectedAppointment((current) =>
        current?.id === appointmentId ? null : current
      );
      cancelAppointmentDeletion();
    } catch (err) {
      console.error("Error eliminando turno:", err);
      setError("No se pudo eliminar el turno. Intentá nuevamente.");
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  /* ============================================================
     NAVEGACIÓN SEMANA
  ============================================================ */

/* ============================================================
   NAVEGACIÓN CALENDARIO
============================================================ */
const changeWeek = (direction: number) => {
  if (calendarView === "month") {
    const currentDate =
      new Date(`${selectedDate}T12:00:00`);

    currentDate.setDate(1);
    currentDate.setMonth(
      currentDate.getMonth() + direction
    );

    const year = currentDate.getFullYear();

    const month = String(
      currentDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      Math.min(
        Number(selectedDate.slice(-2)),
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ).getDate()
      )
    ).padStart(2, "0");

    setSelectedDate(
      `${year}-${month}-${day}`
    );

    return;
  }

  setSelectedDate(
    addDays(
      selectedDate,
      direction * 7
    )
  );
};

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading || !appointmentsLoaded) {
    return (
      <AdminLayout>
        <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="animate-spin text-blue-600"
              size={30}
            />

            <p className="text-sm font-medium text-slate-500">
              Cargando agenda...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1800px] px-5 py-5 sm:px-8">

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              <div>

                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <CalendarDays className="h-4 w-4" />

                  Agenda del taller
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Turnos
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Organizá los trabajos del taller por día, horario y mecánico.
                </p>

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                {/* CONFIGURACIÓN */}

                <button
                  onClick={() => {
                    setError("");
                    setShowScheduleConfig(
                      true
                    );
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <Settings
                    size={16}
                  />

                  Disponibilidad
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowAppointmentManager(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <ClipboardList size={16} />
                  Administrar turnos
                </button>

                {/* NUEVO TURNO */}

                <button
                  onClick={
                    openNewAppointment
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <Plus size={16} />

                  Nuevo turno
                </button>

              </div>

            </div>

          </div>
        </div>

        <main className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8">

          {/* ===================================================
              ERROR GLOBAL
          =================================================== */}

          {error &&
            !showModal &&
            !showScheduleConfig && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

                <AlertCircle
                  size={17}
                />

                <span className="flex-1">
                  {error}
                </span>

                <button
                  onClick={() =>
                    setError("")
                  }
                >
                  <X size={16} />
                </button>

              </div>
            )}

          {/* ===================================================
              STATS
          =================================================== */}

          <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">

            <StatCard
              label="Turnos registrados"
              value={
                stats.total
              }
              icon={
                <CalendarDays
                  className="h-4 w-4 text-blue-500"
                />
              }
            />

            <StatCard
              label="Confirmados"
              value={
                stats.confirmed
              }
              icon={
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500"
                />
              }
            />

            <StatCard
              label="En taller"
              value={
                stats.active
              }
              icon={
                <Wrench
                  className="h-4 w-4 text-violet-500"
                />
              }
            />

            <StatCard
              label="Pendientes"
              value={
                stats.pending
              }
              icon={
                <AlertCircle
                  className="h-4 w-4 text-amber-500"
                />
              }
            />

          </div>

          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Próximos turnos
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Seleccioná un turno para ubicarlo en el calendario.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {upcomingAppointments.length}
              </span>
            </div>

            {upcomingAppointments.length ? (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {upcomingAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => {
                      setSelectedDate(appointment.date);
                      setCalendarView("week");
                    }}
                    className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      {formatDateShort(appointment.date)} · {appointment.start}
                    </span>
                    <span className="mt-1 block truncate text-sm font-bold text-slate-800">
                      {appointment.clienteNombre || appointment.vehiculo || "Turno"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {appointment.servicio || appointment.vehiculo || appointment.status}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                No hay turnos próximos sin cancelar.
              </p>
            )}
          </section>

          {/* ===================================================
              ESTADO DISPONIBILIDAD
          =================================================== */}

          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <span
                className={`h-2.5 w-2.5 rounded-full ${scheduleConfig.active
                    ? "bg-emerald-500"
                    : "bg-red-500"
                  }`}
              />

              <div>

                <p className="text-xs font-bold text-slate-700">
                  Agenda{" "}
                  {scheduleConfig.active
                    ? "activa"
                    : "desactivada"}
                </p>

                <p className="text-[11px] text-slate-400">
                  {scheduleConfig.active
                    ? `${scheduleConfig.morningStart} a ${scheduleConfig.morningEnd} · bloques de ${scheduleConfig.slotMinutes} min`
                    : "No se pueden crear nuevos turnos."}
                </p>

              </div>

            </div>

            <div className="text-[11px] font-medium text-slate-400">
              {scheduleConfig.days.join(
                " · "
              )}
            </div>

          </div>

          {/* ===================================================
              CALENDARIO
          =================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* HEADER CALENDARIO */}
<div className="border-b border-slate-200">

  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">

    {/* =====================================================
        NAVEGACIÓN
    ===================================================== */}

    <div className="flex flex-wrap items-center gap-2">

      <button
        type="button"
        onClick={() => changeWeek(-1)}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        type="button"
        onClick={() => setSelectedDate(getToday())}
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
      >
        Hoy
      </button>

      <button
        type="button"
        onClick={() => changeWeek(1)}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <ChevronRight size={16} />
      </button>

      <div className="ml-1">

        <p className="text-sm font-bold capitalize text-slate-900">
          {calendarView === "week"
            ? formatDateLabel(selectedDate)
            : new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                "es-AR",
                { month: "long", year: "numeric" }
              )}
        </p>

        <p className="text-xs text-slate-400">
          {calendarView === "week"
            ? "Vista semanal"
            : "Vista mensual"}
        </p>

      </div>

    </div>

    {/* =====================================================
        FILTROS + VISTA
    ===================================================== */}

    <div className="flex flex-col gap-2 sm:flex-row">

      {/* BUSCADOR */}

      <div className="relative">

        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Buscar cliente, patente..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white sm:w-64"
        />

      </div>

      {/* ESTADO */}

      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(
            event.target.value as
              | "Todos"
              | AppointmentStatus
          )
        }
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-500"
      >

        <option value="Todos">
          Todos los estados
        </option>

        {appointmentStatuses.map((status) => (
          <option
            key={status}
            value={status}
          >
            {status}
          </option>
        ))}

      </select>

      {/* =================================================
          CAMBIO DE VISTA
      ================================================= */}

      <div className="flex h-9 rounded-lg border border-slate-200 bg-slate-50 p-0.5">

        <button
          type="button"
          onClick={() => setCalendarView("week")}
          className={`rounded-md px-3 text-xs font-bold transition ${
            calendarView === "week"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Semana
        </button>

        <button
          type="button"
          onClick={() => setCalendarView("month")}
          className={`rounded-md px-3 text-xs font-bold transition ${
            calendarView === "month"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Mes
        </button>

      </div>

    </div>

  </div>

  {/* =====================================================
      INFORMACIÓN DE AGENDA
  ===================================================== */}

  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">

    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-400">

      {/* MAÑANA */}

      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

        <span>
          Mañana{" "}
          {scheduleConfig.morningStart}{" "}
          -{" "}
          {scheduleConfig.morningEnd}
        </span>
      </span>

      {/* TARDE */}

      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />

        <span>
          Tarde{" "}
          {scheduleConfig.afternoonStart}{" "}
          -{" "}
          {scheduleConfig.afternoonEnd}
        </span>
      </span>

      {/* DURACIÓN */}

      <span>
        Turnos de {scheduleConfig.slotMinutes} min
      </span>

    </div>

  </div>

</div>

{calendarView === "week" ? (
<div className="overflow-x-auto">

  <div className="min-w-[950px]">

    <div className="grid grid-cols-[70px_repeat(7,minmax(145px,1fr))]">

      {/* =================================================
          COLUMNA DE HORAS
      ================================================= */}

      <div className="border-r border-slate-100 bg-white">

        {hours.map((hour) => (

          <div
            key={hour}
            className="relative h-20 border-b border-slate-100"
          >

            <span className="absolute -top-2.5 right-3 bg-white px-1 text-[10px] font-semibold text-slate-400">

              {String(hour).padStart(
                2,
                "0"
              )}

              :00

            </span>

          </div>

        ))}

      </div>


      {/* =================================================
          DÍAS DE LA SEMANA
      ================================================= */}

      {weekDays.map((day) => {

        const dayAppointments =
          filteredAppointments.filter(
            (appointment) =>
              appointment.date ===
              day.date
          );

        const active =
          selectedDate ===
          day.date;

        const enabled =
          dateIsEnabledInSchedule(
            day.date,
            scheduleConfig
          );

        return (

          <div
            key={day.date}
            onClick={() =>
              setSelectedDate(
                day.date
              )
            }
            className={`relative border-r border-slate-100 ${
              active
                ? "bg-blue-50/[0.15]"
                : "bg-white"
            }`}
          >

            {/* =============================================
                HORAS
            ============================================= */}

            {hours.map((hour) => (

              <div
                key={hour}
                className="h-20 border-b border-slate-100"
              />

            ))}


            {/* =============================================
                MEDIAS HORAS
            ============================================= */}

            {hours.map((hour) => (

              <div
                key={`half-${hour}`}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-slate-100"
                style={{
                  top: `${
                    (hour - 6) *
                      80 +
                    40
                  }px`,
                }}
              />

            ))}


            {/* =============================================
                LÍNEA DE MEDIODÍA
            ============================================= */}

            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-slate-200"
              style={{
                top: `${
                  (13 - 6) *
                  80
                }px`,
              }}
            />


            {/* =============================================
                BLOQUE CERRADO
            ============================================= */}

            {!enabled && (

              <div className="pointer-events-none absolute inset-0 z-[1] bg-slate-50/60">

                <div className="sticky top-2 flex justify-center">

                  <span className="rounded-full border border-red-100 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-red-400 shadow-sm">
                    Cerrado
                  </span>

                </div>

              </div>

            )}


            {/* =============================================
                TURNOS
            ============================================= */}

            {dayAppointments.map(
              (appointment) => {

                const style =
                  getAppointmentStyle(
                    appointment
                  );

                const colors =
                  statusStyles[
                    appointment.status
                  ];

                const mechanic =
                  mechanicColors[
                    appointment.mechanic
                  ] ?? {
                    badge:
                      "bg-slate-100 text-slate-700",
                    border:
                      "border-l-slate-400",
                  };

                return (

                  <button
                    key={
                      appointment.id
                    }
                    type="button"
                    onClick={(event) => {

                      event.stopPropagation();

                      setSelectedAppointment(
                        appointment
                      );

                    }}
                    className={`absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-lg border border-l-4 p-2 text-left shadow-sm transition hover:z-30 hover:-translate-y-0.5 hover:shadow-lg ${colors.container} ${mechanic.border}`}
                    style={style}
                  >

                    {/* =================================
                        CLIENTE + ESTADO
                    ================================= */}

                    <div className="flex items-start justify-between gap-1">

                      <p className="truncate text-[11px] font-bold">

                        {
                          appointment.clienteNombre
                        }

                      </p>

                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`}
                      />

                    </div>


                    {/* =================================
                        SERVICIO
                    ================================= */}

                    <p className="mt-0.5 truncate text-[10px] font-semibold opacity-75">

                      {
                        appointment.servicio
                      }

                    </p>


                    {/* =================================
                        HORARIO + MECÁNICO
                    ================================= */}

                    <div className="mt-1 flex items-center justify-between gap-1">

                      <span className="truncate text-[9px] font-medium opacity-60">

                        {
                          appointment.start
                        }

                        {" - "}

                        {
                          appointment.end
                        }

                      </span>

                      <span
                        className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold ${mechanic.badge}`}
                      >

                        {
                          appointment.mechanic
                        }

                      </span>

                    </div>


                    {/* =================================
                        VEHÍCULO
                    ================================= */}

                    <p className="mt-1 truncate text-[9px] opacity-60">

                      {
                        appointment.vehiculo
                      }

                      {" · "}

                      {
                        appointment.patente
                      }

                    </p>

                  </button>

                );

              }
            )}

          </div>

        );

      })}

    </div>

  </div>

</div>
) : (
  <div className="overflow-x-auto">
    <div className="min-w-[760px]">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div
            key={day}
            className="border-r border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDays.map((day) => {
          const dayAppointments = filteredAppointments.filter(
            (appointment) => appointment.date === day
          );
          const isCurrentMonth = day.slice(0, 7) === selectedDate.slice(0, 7);
          const isSelected = day === selectedDate;

          return (
            <div
              key={day}
              className={`min-h-32 border-b border-r border-slate-200 p-2 ${
                isCurrentMonth ? "bg-white" : "bg-slate-50/70"
              } ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
            >
              <button
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : isCurrentMonth
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-100"
                }`}
              >
                {Number(day.slice(-2))}
              </button>

              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => setSelectedAppointment(appointment)}
                    className={`block w-full truncate rounded px-1.5 py-1 text-left text-[10px] font-semibold ${statusStyles[appointment.status].container}`}
                    title={`${appointment.start} · ${appointment.clienteNombre} · ${appointment.servicio}`}
                  >
                    <span className="font-bold">{appointment.start}</span>
                    {" "}
                    {appointment.clienteNombre || appointment.vehiculo || "Turno"}
                  </button>
                ))}

                {dayAppointments.length > 3 && (
                  <p className="px-1.5 text-[10px] font-semibold text-slate-500">
                    +{dayAppointments.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

<div className="border-t border-slate-200 bg-slate-50/70 p-4">
  <div className="mb-3 flex items-center justify-between gap-3">
    <div>
      <h2 className="text-sm font-bold text-slate-900">
        Turnos registrados
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Abrí una tarjeta para ver el turno y cambiar su estado.
      </p>
    </div>
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
      {filteredAppointments.length}
    </span>
  </div>

  {filteredAppointments.length ? (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {[...filteredAppointments]
        .sort((a, b) =>
          `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)
        )
        .map((appointment) => (
          <button
            key={appointment.id}
            type="button"
            onClick={() => {
              setSelectedDate(appointment.date);
              setSelectedAppointment(appointment);
            }}
            className={`rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusStyles[appointment.status].container}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold">
                {formatDateShort(appointment.date)} · {appointment.start}
                {appointment.end ? `–${appointment.end}` : ""}
              </span>
              <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold">
                {appointment.status}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-bold">
              {appointment.clienteNombre || appointment.vehiculo || "Turno"}
            </p>
            <p className="mt-0.5 truncate text-xs opacity-75">
              {[appointment.servicio, appointment.vehiculo, appointment.patente]
                .filter(Boolean)
                .join(" · ") || "Sin detalles adicionales"}
            </p>
          </button>
        ))}
    </div>
  ) : (
    <p className="rounded-xl bg-white px-3 py-4 text-center text-xs text-slate-500">
      No hay turnos que coincidan con los filtros.
    </p>
  )}
</div>

          </section>

          {/* ===================================================
              LEYENDA
          =================================================== */}

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estados
              </span>

              {appointmentStatuses.map(
                (status) => (
                  <div
                    key={
                      status
                    }
                    className="flex items-center gap-1.5"
                  >

                    <span
                      className={`h-2 w-2 rounded-full ${statusStyles[status].dot}`}
                    />

                    <span className="text-[11px] font-medium text-slate-500">
                      {status}
                    </span>

                  </div>
                )
              )}

            </div>

            <p className="text-[11px] text-slate-400">
              Hacé click sobre un turno para ver sus detalles.
            </p>

          </div>

        </main>

        {/* =====================================================
            MODAL DETALLE
        ===================================================== */}

        {selectedAppointment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="border-b border-slate-100 bg-slate-50/70 p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <div className="flex items-center gap-2">

                      <span
                        className={`h-2.5 w-2.5 rounded-full ${statusStyles[
                            selectedAppointment
                              .status
                          ].dot
                          }`}
                      />

                      <span className="text-xs font-bold text-slate-500">
                        {
                          selectedAppointment.numero ??
                          selectedAppointment.id
                        }
                      </span>

                    </div>

                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {
                        selectedAppointment.clienteNombre
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedAppointment.start
                      }{" "}
                      —{" "}
                      {
                        selectedAppointment.end ||
                        "Sin hora de finalización"
                      }{" "}
                      ·{" "}
                      {formatDateShort(
                        selectedAppointment.date
                      )}
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setSelectedAppointment(
                        null
                      )
                    }
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                  >
                    <X size={20} />
                  </button>

                </div>

              </div>

              <div className="space-y-4 p-5">

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-slate-100 p-4">

                    <div className="flex items-center gap-2 text-slate-400">

                      <Car size={16} />

                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Vehículo
                      </span>

                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {
                        selectedAppointment.vehiculo ||
                        "Sin vehículo"
                      }
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {
                        selectedAppointment.patente ||
                        "Sin patente"
                      }
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">

                    <div className="flex items-center gap-2 text-slate-400">

                      <Wrench size={16} />

                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Servicio
                      </span>

                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {
                        selectedAppointment.servicio ||
                        "Sin servicio"
                      }
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {
                        selectedAppointment.mechanic ||
                        "Sin asignar"
                      }
                    </p>

                  </div>

                </div>

                <div className="rounded-xl border border-slate-100 p-4">

                  <div className="flex items-center gap-2">

                    <UserRound
                      size={16}
                      className="text-slate-400"
                    />

                    <p className="text-xs font-bold text-slate-500">
                      Contacto
                    </p>

                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {
                      selectedAppointment.telefono ||
                      "Sin teléfono registrado"
                    }
                  </p>

                  {selectedAppointment.clienteEmail && (
                    <p className="mt-1 text-xs text-slate-400">
                      {
                        selectedAppointment.clienteEmail
                      }
                    </p>
                  )}

                </div>

                {selectedAppointment.notes && (
                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Observaciones
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {
                        selectedAppointment.notes
                      }
                    </p>

                  </div>
                )}

                <div>

                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estado
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {appointmentStatuses.map(
                      (
                        status
                      ) => {

                        const Icon =
                          status ===
                            "Confirmado"
                            ? CheckCircle2
                            : status ===
                              "En espera"
                              ? Clock3
                              : status ===
                                "En taller"
                                ? Wrench
                                : status ===
                                  "Finalizado"
                                  ? CheckCircle2
                                  : XCircle;

                        return (
                          <button
                            key={
                              status
                            }
                            disabled={
                              saving
                            }
                            onClick={() =>
                              updateAppointmentStatus(
                                status
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${selectedAppointment.status ===
                                status
                                ? statusStyles[
                                  status
                                ]
                                  .container
                                : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                              }`}
                          >

                            <Icon
                              size={14}
                            />

                            {
                              status
                            }

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 p-5">

                <button
                  onClick={() =>
                    setSelectedAppointment(
                      null
                    )
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            MODAL NUEVO TURNO
        ===================================================== */}

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-100 p-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-950">
                    Nuevo turno
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Completá los datos para agendar un turno real.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>

              </div>

              {error && (
                <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-semibold text-red-700">

                  <AlertCircle
                    size={15}
                  />

                  <span>
                    {error}
                  </span>

                </div>
              )}

              <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">

                {/* CLIENTE */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Cliente
                  </label>

                  <select
                    value={
                      form.clienteId
                    }
                    onChange={(
                      event
                    ) =>
                      handleClientChange(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >

                    <option value="">
                      Seleccionar cliente
                    </option>

                    {clients.map(
                      (
                        client
                      ) => (
                        <option
                          key={
                            client.uid
                          }
                          value={
                            client.uid
                          }
                        >
                          {client.nombre}
                          {client.telefono
                            ? ` · ${client.telefono}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                  {clients.length ===
                    0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No hay clientes registrados en Firebase.
                      </p>
                    )}

                </div>

                {/* VEHÍCULO */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Vehículo
                  </label>

                  <select
                    value={
                      form.vehiculoId
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          vehiculoId:
                            event.target
                              .value,
                        })
                      )
                    }
                    disabled={
                      !form.clienteId
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >

                    <option value="">
                      {!form.clienteId
                        ? "Primero seleccioná un cliente"
                        : "Seleccionar vehículo"}
                    </option>

                    {clientVehicles.map(
                      (
                        vehicle
                      ) => (
                        <option
                          key={
                            vehicle.id
                          }
                          value={
                            vehicle.id
                          }
                        >
                          {vehicle.marca}{" "}
                          {
                            vehicle.modelo
                          }{" "}
                          ·{" "}
                          {
                            vehicle.patente
                          }
                        </option>
                      )
                    )}

                  </select>

                  {form.clienteId &&
                    clientVehicles.length ===
                    0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        Este cliente no tiene vehículos registrados.
                      </p>
                    )}

                </div>

                {/* FECHA */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={
                      form.date
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          date:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />

                  {form.date &&
                    !dateIsEnabledInSchedule(
                      form.date,
                      scheduleConfig
                    ) && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">
                        Esta fecha no está habilitada.
                      </p>
                    )}

                </div>

                {/* SERVICIO */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Servicio
                  </label>

                  <select
                    value={
                      form.servicio
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          servicio:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >

                    <option value="">
                      Seleccionar servicio
                    </option>

                    {serviceOptions.map(
                      (
                        service
                      ) => (
                        <option
                          key={
                            service
                          }
                          value={
                            service
                          }
                        >
                          {
                            service
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* HORA INICIO */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Hora de inicio
                  </label>

                  <input
                    type="time"
                    value={
                      form.start
                    }
                    onChange={(
                      event
                    ) => {
                      const start =
                        event
                          .target
                          .value;

                      setForm(
                        (prev) => ({
                          ...prev,
                          start,

                          end:
                            prev.end ===
                              "09:00" ||
                              !prev.end
                              ? getDefaultEndTime(
                                start
                              )
                              : prev.end,
                        })
                      );
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />

                </div>

                {/* HORA FIN */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Hora de finalización
                  </label>

                  <input
                    type="time"
                    value={
                      form.end
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          end:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />

                </div>

                {/* MECÁNICO */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Mecánico
                  </label>

                  <select
                    value={
                      form.mechanic
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          mechanic:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >

                    <option value="">
                      Asignar mecánico
                    </option>

                    {mechanics.map(
                      (
                        mechanic
                      ) => (
                        <option
                          key={
                            mechanic.name
                          }
                          value={
                            mechanic.name
                          }
                        >
                          {
                            mechanic.name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* OBSERVACIONES */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Observaciones
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.notes
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          notes:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Agregar observaciones..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 p-5">

                <button
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={
                    handleCreateAppointment
                  }
                  disabled={
                    saving
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={16}
                      />

                      Crear turno
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            MODAL ADMINISTRAR TURNOS
        ===================================================== */}

        {showAppointmentManager && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => setShowAppointmentManager(false)}
          >
            <div
              className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Administrar turnos
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {appointments.length} turnos registrados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAppointmentManager(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Cerrar listado de turnos"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto">
                {appointments.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">
                    No hay turnos para mostrar.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {[...appointments]
                      .sort((a, b) =>
                        `${b.date} ${b.start}`.localeCompare(
                          `${a.date} ${a.start}`
                        )
                      )
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {appointment.clienteNombre || "Sin cliente"}
                              </p>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[appointment.status].container}`}
                              >
                                {appointment.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {appointment.vehiculo || "Sin vehículo"}
                              {appointment.patente
                                ? ` · ${appointment.patente}`
                                : ""}
                              {appointment.servicio
                                ? ` · ${appointment.servicio}`
                                : ""}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateShort(appointment.date)} · {appointment.start}
                              {appointment.end ? `–${appointment.end}` : ""}
                              {appointment.numero
                                ? ` · ${appointment.numero}`
                                : ""}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => requestAppointmentDeletion(appointment)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                            Eliminar
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 p-4">
                <button
                  type="button"
                  onClick={() => setShowAppointmentManager(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {appointmentToDelete && deleteConfirmationStep > 0 && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 size={19} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                    Confirmación {deleteConfirmationStep} de 2
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {deleteConfirmationStep === 1
                      ? "¿Querés eliminar este turno?"
                      : "Confirmá la eliminación definitiva"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {appointmentToDelete.clienteNombre || "Sin cliente"} · {formatDateShort(appointmentToDelete.date)} · {appointmentToDelete.start}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {deleteConfirmationStep === 1
                      ? "El turno dejará de aparecer en la agenda. Para continuar, confirmá una vez más."
                      : "Esta acción no se puede deshacer."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelAppointmentDeletion}
                  disabled={deletingAppointmentId !== null}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                {deleteConfirmationStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmationStep(2)}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeleteAppointment}
                    disabled={deletingAppointmentId !== null}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {deletingAppointmentId
                      ? "Eliminando..."
                      : "Eliminar definitivamente"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MODAL CONFIGURACIÓN
        ===================================================== */}

        {showScheduleConfig && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-100 p-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-950">
                    Disponibilidad del taller
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Definí qué días y horarios están habilitados para turnos.
                  </p>

                </div>

                <button
                  onClick={() => {
                    setShowScheduleConfig(
                      false
                    );
                    setError("");
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>

              </div>

              {error && (
                <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-semibold text-red-700">

                  <AlertCircle
                    size={15}
                  />

                  <span>
                    {error}
                  </span>

                </div>
              )}

              <div className="space-y-5 p-5">

                {/* ACTIVA */}

                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div>

                    <p className="text-sm font-semibold text-slate-700">
                      Agenda activa
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Permite crear y solicitar nuevos turnos.
                    </p>

                  </div>

                  <input
                    type="checkbox"
                    checked={
                      scheduleConfig.active
                    }
                    onChange={(
                      event
                    ) =>
                      setScheduleConfig(
                        (prev) => ({
                          ...prev,
                          active:
                            event
                              .target
                              .checked,
                        })
                      )
                    }
                    className="h-4 w-4"
                  />

                </label>

                {/* DÍAS */}

                <div>

                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Días habilitados
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {scheduleDays.map(
                      (day) => {
                        const selected =
                          scheduleConfig.days.includes(
                            day
                          );

                        return (
                          <button
                            key={
                              day
                            }
                            type="button"
                            onClick={() =>
                              toggleDay(
                                day
                              )
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            {
                              day
                            }
                          </button>
                        );
                      }
                    )}

                  </div>

                </div>
                {/* HORARIOS */}

                <div className="space-y-4">

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Horarios de atención
                  </p>

                  {/* MAÑANA */}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <p className="mb-3 text-sm font-bold text-slate-700">
                      Horario de mañana
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">

                      <div>

                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Desde
                        </label>

                        <input
                          type="time"
                          step="60"
                          value={
                            scheduleConfig.morningStart
                          }
                          onChange={(event) =>
                            setScheduleConfig((prev) => ({
                              ...prev,
                              morningStart:
                                event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />

                      </div>

                      <div>

                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Hasta
                        </label>

                        <input
                          type="time"
                          step="60"
                          value={
                            scheduleConfig.morningEnd
                          }
                          onChange={(event) =>
                            setScheduleConfig((prev) => ({
                              ...prev,
                              morningEnd:
                                event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />

                      </div>

                    </div>

                  </div>

                  {/* TARDE */}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <p className="mb-3 text-sm font-bold text-slate-700">
                      Horario de tarde
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">

                      <div>

                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Desde
                        </label>

                        <input
                          type="time"
                          step="60"
                          value={
                            scheduleConfig.afternoonStart
                          }
                          onChange={(event) =>
                            setScheduleConfig((prev) => ({
                              ...prev,
                              afternoonStart:
                                event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />

                      </div>

                      <div>

                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Hasta
                        </label>

                        <input
                          type="time"
                          step="60"
                          value={
                            scheduleConfig.afternoonEnd
                          }
                          onChange={(event) =>
                            setScheduleConfig((prev) => ({
                              ...prev,
                              afternoonEnd:
                                event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />

                      </div>

                    </div>

                  </div>

                  {/* DURACIÓN BASE */}

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Duración base del turno
                    </label>

                    <select
                      value={
                        scheduleConfig.slotMinutes
                      }
                      onChange={(event) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          slotMinutes:
                            Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    >

                      <option value={90}>
                        90 minutos
                      </option>

                    </select>

                    <p className="mt-1.5 text-xs text-slate-400">
                      Los turnos normales tienen una duración de 90 minutos.
                    </p>

                  </div>

                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">

                <button
                  onClick={() => {
                    setShowScheduleConfig(
                      false
                    );
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  onClick={
                    guardarConfiguracionAgenda
                  }
                  disabled={
                    savingSchedule
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {savingSchedule && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {savingSchedule
                    ? "Guardando..."
                    : "Guardar disponibilidad"}

                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}

export default Turnos;

/* ============================================================
   COMPONENTE STAT CARD
============================================================ */

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">

      <div className="flex items-center justify-between">

        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        {icon}

      </div>

      <p className="mt-1 text-xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}