import {
  AlertCircle,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  Search,
  Settings,
  UserRound,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

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
    { length: 6 },
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
     CARGAR TURNOS
  ============================================================ */

  const cargarTurnos =
    async () => {
      const snapshot =
        await getDocs(
          collection(
            db,
            "turnos"
          )
        );

      const data =
        snapshot.docs.map(
          (item) => {
            const value =
              item.data();

            const rawStatus =
              value.status ??
              value.estado ??
              "En espera";

            const validStatus =
              appointmentStatuses.includes(
                rawStatus
              )
                ? rawStatus
                : "En espera";

            return {
              id: item.id,

              numero:
                value.numero ??
                item.id,

              clienteId:
                value.clienteId ??
                value.usuarioId ??
                "",

              clienteNombre:
                value.clienteNombre ??
                value.cliente ??
                "",

              clienteEmail:
                value.clienteEmail ??
                value.email ??
                "",

              telefono:
                value.telefono ??
                "",

              vehiculoId:
                value.vehiculoId ??
                "",

              vehiculo:
                value.vehiculo ??
                "",

              patente:
                value.patente ??
                "",

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

              servicio:
                value.servicio ??
                "",

              mechanic:
                value.mechanic ??
                value.mecanico ??
                "Sin asignar",

              date:
                value.date ??
                value.fecha ??
                "",

              start:
                value.start ??
                value.hora ??
                "",

              end:
                value.end ??
                value.horaFin ??
                "",

              status:
                validStatus,

              notes:
                value.notes ??
                value.observaciones ??
                "",

              creadoEn:
                value.creadoEn ??
                null,
            } as Appointment;
          }
        );

      data.sort(
        (a, b) => {
          const dateA =
            `${a.date} ${a.start}`;

          const dateB =
            `${b.date} ${b.start}`;

          return (
            new Date(
              dateA
            ).getTime() -
            new Date(
              dateB
            ).getTime()
          );
        }
      );

      setAppointments(
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
          cargarTurnos(),
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
      const day =
        appointments.filter(
          (appointment) =>
            appointment.date ===
            selectedDate
        );

      return {
        total:
          day.length,

        confirmed:
          day.filter(
            (item) =>
              item.status ===
              "Confirmado"
          ).length,

        active:
          day.filter(
            (item) =>
              item.status ===
              "En taller"
          ).length,

        pending:
          day.filter(
            (item) =>
              item.status ===
              "En espera"
          ).length,
      };
    }, [
      appointments,
      selectedDate,
    ]);

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

        await cargarTurnos();

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

    currentDate.setMonth(
      currentDate.getMonth() + direction
    );

    const year = currentDate.getFullYear();

    const month = String(
      currentDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      currentDate.getDate()
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

  if (loading) {
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
              label="Turnos del día"
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
          {formatDateLabel(selectedDate)}
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

{/* =====================================================
    CUERPO — VISTA SEMANAL
===================================================== */}

<div className="overflow-x-auto">

  <div className="min-w-[950px]">

    <div className="grid grid-cols-[70px_repeat(6,minmax(145px,1fr))]">

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