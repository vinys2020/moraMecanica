import {
  AlertCircle,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  UserRound,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";

type AppointmentStatus =
  | "Confirmado"
  | "En espera"
  | "En taller"
  | "Finalizado"
  | "Cancelado";

interface Appointment {
  id: string;
  date: string;
  start: string;
  end: string;
  client: string;
  phone: string;
  vehicle: string;
  plate: string;
  service: string;
  mechanic: string;
  status: AppointmentStatus;
  notes?: string;
}

const mechanics = [
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

const appointments: Appointment[] = [
  {
    id: "T-001",
    date: "2026-09-15",
    start: "08:30",
    end: "10:00",
    client: "Carlos Rodríguez",
    phone: "381 555-1020",
    vehicle: "Toyota Corolla",
    plate: "AE 452 KM",
    service: "Service completo",
    mechanic: "J. Gómez",
    status: "En espera",
    notes: "Revisión general y cambio de filtros.",
  },
  {
    id: "T-002",
    date: "2026-09-15",
    start: "10:30",
    end: "11:15",
    client: "María González",
    phone: "381 555-2241",
    vehicle: "Volkswagen Polo",
    plate: "AF 781 RT",
    service: "Cambio de aceite",
    mechanic: "M. López",
    status: "Confirmado",
    notes: "Aceite + filtro.",
  },
  {
    id: "T-003",
    date: "2026-09-15",
    start: "13:00",
    end: "14:00",
    client: "Lucas Fernández",
    phone: "381 555-3390",
    vehicle: "Ford Ranger",
    plate: "AC 234 LP",
    service: "Diagnóstico",
    mechanic: "R. Díaz",
    status: "Confirmado",
    notes: "Ruido al acelerar.",
  },
  {
    id: "T-004",
    date: "2026-09-16",
    start: "09:00",
    end: "10:30",
    client: "Sofía Martínez",
    phone: "381 555-4412",
    vehicle: "Chevrolet Cruze",
    plate: "AD 918 QW",
    service: "Frenos",
    mechanic: "A. Torres",
    status: "Confirmado",
  },
  {
    id: "T-005",
    date: "2026-09-16",
    start: "11:30",
    end: "12:30",
    client: "Diego Sánchez",
    phone: "381 555-5082",
    vehicle: "Renault Sandero",
    plate: "AE 663 JK",
    service: "Alineación",
    mechanic: "J. Gómez",
    status: "En taller",
  },
  {
    id: "T-006",
    date: "2026-09-17",
    start: "08:00",
    end: "10:00",
    client: "Martín Pérez",
    phone: "381 555-6214",
    vehicle: "Fiat Cronos",
    plate: "AF 214 MN",
    service: "Cambio de distribución",
    mechanic: "M. López",
    status: "Confirmado",
  },
  {
    id: "T-007",
    date: "2026-09-17",
    start: "14:00",
    end: "15:00",
    client: "Valentina Ruiz",
    phone: "381 555-7318",
    vehicle: "Peugeot 208",
    plate: "AE 903 KL",
    service: "Diagnóstico electrónico",
    mechanic: "R. Díaz",
    status: "Finalizado",
  },
  {
    id: "T-008",
    date: "2026-09-18",
    start: "08:30",
    end: "10:00",
    client: "Carlos Rodríguez",
    phone: "381 555-1020",
    vehicle: "Toyota Corolla",
    plate: "AE 452 KM",
    service: "Service completo",
    mechanic: "J. Gómez",
    status: "En espera",
    notes: "Revisión general y cambio de filtros.",
  },
  {
    id: "T-009",
    date: "2026-09-18",
    start: "09:15",
    end: "10:00",
    client: "María González",
    phone: "381 555-2241",
    vehicle: "Volkswagen Polo",
    plate: "AF 781 RT",
    service: "Cambio de aceite",
    mechanic: "M. López",
    status: "En taller",
    notes: "Aceite + filtro.",
  },
  {
    id: "T-010",
    date: "2026-09-18",
    start: "10:30",
    end: "11:30",
    client: "Lucas Fernández",
    phone: "381 555-3390",
    vehicle: "Ford Ranger",
    plate: "AC 234 LP",
    service: "Diagnóstico",
    mechanic: "R. Díaz",
    status: "Confirmado",
    notes: "Ruido al acelerar.",
  },
  {
    id: "T-011",
    date: "2026-09-18",
    start: "11:45",
    end: "13:15",
    client: "Sofía Martínez",
    phone: "381 555-4412",
    vehicle: "Chevrolet Cruze",
    plate: "AD 918 QW",
    service: "Frenos",
    mechanic: "A. Torres",
    status: "Confirmado",
  },
  {
    id: "T-012",
    date: "2026-09-18",
    start: "13:00",
    end: "14:00",
    client: "Diego Sánchez",
    phone: "381 555-5082",
    vehicle: "Renault Sandero",
    plate: "AE 663 JK",
    service: "Alineación",
    mechanic: "J. Gómez",
    status: "Confirmado",
  },
  {
    id: "T-013",
    date: "2026-09-18",
    start: "14:30",
    end: "16:30",
    client: "Martín Pérez",
    phone: "381 555-6214",
    vehicle: "Fiat Cronos",
    plate: "AF 214 MN",
    service: "Cambio de distribución",
    mechanic: "M. López",
    status: "Confirmado",
  },
  {
    id: "T-014",
    date: "2026-09-18",
    start: "16:00",
    end: "17:00",
    client: "Valentina Ruiz",
    phone: "381 555-7318",
    vehicle: "Peugeot 208",
    plate: "AE 903 KL",
    service: "Diagnóstico electrónico",
    mechanic: "R. Díaz",
    status: "Finalizado",
  },
  {
    id: "T-015",
    date: "2026-09-19",
    start: "09:00",
    end: "10:30",
    client: "Jorge Medina",
    phone: "381 555-8134",
    vehicle: "Toyota Hilux",
    plate: "AG 334 PX",
    service: "Cambio de pastillas",
    mechanic: "A. Torres",
    status: "Confirmado",
  },
  {
    id: "T-016",
    date: "2026-09-19",
    start: "11:00",
    end: "12:00",
    client: "Paula Díaz",
    phone: "381 555-9255",
    vehicle: "Fiat Argo",
    plate: "AF 449 MN",
    service: "Escaneo electrónico",
    mechanic: "R. Díaz",
    status: "Confirmado",
  },
];

const weekDays = [
  {
    date: "2026-09-15",
    day: "Lun",
    number: "15",
  },
  {
    date: "2026-09-16",
    day: "Mar",
    number: "16",
  },
  {
    date: "2026-09-17",
    day: "Mié",
    number: "17",
  },
  {
    date: "2026-09-18",
    day: "Jue",
    number: "18",
  },
  {
    date: "2026-09-19",
    day: "Vie",
    number: "19",
  },
  {
    date: "2026-09-20",
    day: "Sáb",
    number: "20",
  },
];

const hours = Array.from({ length: 11 }, (_, index) => index + 8);

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

function timeToMinutes(time: string) {
  const [hoursValue, minutes] = time.split(":").map(Number);

  return hoursValue * 60 + minutes;
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function Turnos() {
  const [selectedDate, setSelectedDate] = useState("2026-09-18");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "Todos" | AppointmentStatus
  >("Todos");

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.client.toLowerCase().includes(search.toLowerCase()) ||
        appointment.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        appointment.plate.toLowerCase().includes(search.toLowerCase()) ||
        appointment.service.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "Todos" ||
        appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);


  const getAppointmentStyle = (appointment: Appointment) => {
    const startMinutes = timeToMinutes(appointment.start);
    const endMinutes = timeToMinutes(appointment.end);

    const calendarStart = 8 * 60;

    const top = ((startMinutes - calendarStart) / 60) * 80;
    const height = ((endMinutes - startMinutes) / 60) * 80;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 50)}px`,
    };
  };

  const todayAppointments = appointments.filter(
    (appointment) => appointment.date === "2026-09-18",
  );

  const stats = {
    total: todayAppointments.length,
    confirmed: todayAppointments.filter(
      (item) => item.status === "Confirmado",
    ).length,
    active: todayAppointments.filter(
      (item) => item.status === "En taller",
    ).length,
    pending: todayAppointments.filter(
      (item) => item.status === "En espera",
    ).length,
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50">
        {/* HEADER */}

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
                  Organizá los trabajos del taller por día, horario y
                  mecánico.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 lg:flex">
                  <button className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                    Semana
                  </button>

                  <button className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                    Día
                  </button>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo turno
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8">
          {/* MINI SUMMARY */}

          <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Turnos de hoy
                </p>

                <CalendarDays className="h-4 w-4 text-blue-500" />
              </div>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {stats.total}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Confirmados
                </p>

                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {stats.confirmed}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  En taller
                </p>

                <Wrench className="h-4 w-4 text-violet-500" />
              </div>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {stats.active}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Pendientes
                </p>

                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {stats.pending}
              </p>
            </div>
          </div>

          {/* CALENDAR CARD */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* CALENDAR HEADER */}

            <div className="border-b border-slate-200">
              <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <button className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                    Hoy
                  </button>

                  <button className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <div className="ml-2">
                    <p className="text-sm font-bold capitalize text-slate-900">
                      {formatDateLabel(selectedDate)}
                    </p>

                    <p className="text-xs text-slate-400">
                      Semana del 15 al 20 de septiembre
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar turno..."
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white sm:w-56"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as
                          | "Todos"
                          | AppointmentStatus,
                      )
                    }
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500"
                  >
                    <option value="Todos">Todos los estados</option>
                    <option value="Confirmado">Confirmados</option>
                    <option value="En espera">En espera</option>
                    <option value="En taller">En taller</option>
                    <option value="Finalizado">Finalizados</option>
                    <option value="Cancelado">Cancelados</option>
                  </select>
                </div>
              </div>

              {/* WEEK DAYS */}

              <div className="grid min-w-[950px] grid-cols-[70px_repeat(6,minmax(145px,1fr))] border-t border-slate-100">
                <div className="border-r border-slate-100 bg-slate-50/70" />

                {weekDays.map((day) => {
                  const active = selectedDate === day.date;
                  const dayAppointments = filteredAppointments.filter(
                    (appointment) => appointment.date === day.date,
                  );

                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`border-r border-slate-100 px-3 py-3 text-center transition ${
                        active
                          ? "bg-blue-50/70"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          active ? "text-blue-600" : "text-slate-400"
                        }`}
                      >
                        {day.day}
                      </p>

                      <div className="mt-1 flex items-center justify-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            active
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                              : "text-slate-700"
                          }`}
                        >
                          {day.number}
                        </span>

                        <span className="text-[10px] font-semibold text-slate-400">
                          {dayAppointments.length}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CALENDAR BODY */}

            <div className="overflow-x-auto">
              <div className="min-w-[950px]">
                <div className="grid grid-cols-[70px_repeat(6,minmax(145px,1fr))]">
                  {/* HOURS */}

                  <div className="border-r border-slate-100 bg-white">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="relative h-20 border-b border-slate-100"
                      >
                        <span className="absolute -top-2.5 right-3 bg-white px-1 text-[10px] font-semibold text-slate-400">
                          {String(hour).padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* DAYS */}

                  {weekDays.map((day) => {
                    const dayAppointments = filteredAppointments.filter(
                      (appointment) => appointment.date === day.date,
                    );

                    const active = selectedDate === day.date;

                    return (
                      <div
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                        className={`relative border-r border-slate-100 ${
                          active ? "bg-blue-50/[0.15]" : "bg-white"
                        }`}
                      >
                        {/* HOUR GRID */}

                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className="h-20 border-b border-slate-100"
                          />
                        ))}

                        {/* HALF HOUR LINES */}

                        {hours.map((hour) => (
                          <div
                            key={`half-${hour}`}
                            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-slate-100"
                            style={{
                              top: `${(hour - 8) * 80 + 40}px`,
                            }}
                          />
                        ))}

                        {/* APPOINTMENTS */}

                        {dayAppointments.map((appointment) => {
                          const style = getAppointmentStyle(appointment);
                          const colors =
                            statusStyles[appointment.status];
                          const mechanic =
                            mechanicColors[appointment.mechanic];

                          return (
                            <button
                              key={appointment.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedAppointment(appointment);
                              }}
                              className={`absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-lg border border-l-4 p-2 text-left shadow-sm transition hover:z-30 hover:-translate-y-0.5 hover:shadow-lg ${colors.container} ${mechanic.border}`}
                              style={style}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p className="truncate text-[11px] font-bold">
                                  {appointment.client}
                                </p>

                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`}
                                />
                              </div>

                              <p className="mt-0.5 truncate text-[10px] font-semibold opacity-75">
                                {appointment.service}
                              </p>

                              <div className="mt-1 flex items-center justify-between gap-1">
                                <span className="truncate text-[9px] font-medium opacity-60">
                                  {appointment.start} - {appointment.end}
                                </span>

                                <span
                                  className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold ${mechanic.badge}`}
                                >
                                  {appointment.mechanic}
                                </span>
                              </div>

                              {timeToMinutes(appointment.end) -
                                timeToMinutes(appointment.start) >=
                                90 && (
                                <p className="mt-1 truncate text-[9px] opacity-60">
                                  {appointment.vehicle}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* LEGEND */}

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estados
              </span>

              {Object.entries(statusStyles).map(([status, styles]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${styles.dot}`}
                  />

                  <span className="text-[11px] font-medium text-slate-500">
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400">
              Hacé click sobre un turno para ver los detalles.
            </p>
          </div>
        </main>

        {/* APPOINTMENT DETAIL */}

        {selectedAppointment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          statusStyles[selectedAppointment.status].dot
                        }`}
                      />

                      <span className="text-xs font-bold text-slate-500">
                        {selectedAppointment.id}
                      </span>
                    </div>

                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {selectedAppointment.client}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedAppointment.start} —{" "}
                      {selectedAppointment.end}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Car className="h-4 w-4" />

                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Vehículo
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {selectedAppointment.vehicle}
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {selectedAppointment.plate}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Wrench className="h-4 w-4" />

                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Servicio
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {selectedAppointment.service}
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {selectedAppointment.mechanic}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-400" />

                    <p className="text-xs font-bold text-slate-500">
                      Contacto
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedAppointment.phone}
                  </p>
                </div>

                {selectedAppointment.notes && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Observaciones
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estado
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "Confirmado",
                        "En espera",
                        "En taller",
                        "Finalizado",
                        "Cancelado",
                      ] as AppointmentStatus[]
                    ).map((status) => {
                      const Icon =
                        status === "Confirmado"
                          ? CheckCircle2
                          : status === "En espera"
                            ? Clock3
                            : status === "En taller"
                              ? Wrench
                              : status === "Finalizado"
                                ? CheckCircle2
                                : XCircle;

                      return (
                        <button
                          key={status}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                            selectedAppointment.status === status
                              ? statusStyles[status].container
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-slate-100 bg-slate-50/70 p-5">
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Editar turno
                </button>

                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW APPOINTMENT */}

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Nuevo turno
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Completá los datos para agendar un turno.
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Cliente
                  </label>

                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                    <option>Seleccionar cliente</option>
                    <option>Carlos Rodríguez</option>
                    <option>María González</option>
                    <option>Lucas Fernández</option>
                    <option>Sofía Martínez</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Fecha
                  </label>

                  <input
                    type="date"
                    defaultValue={selectedDate}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Hora
                  </label>

                  <input
                    type="time"
                    defaultValue="08:30"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Vehículo
                  </label>

                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                    <option>Seleccionar vehículo</option>
                    <option>Toyota Corolla · AE 452 KM</option>
                    <option>Volkswagen Polo · AF 781 RT</option>
                    <option>Ford Ranger · AC 234 LP</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Servicio
                  </label>

                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                    <option>Seleccionar servicio</option>
                    <option>Service completo</option>
                    <option>Cambio de aceite</option>
                    <option>Diagnóstico</option>
                    <option>Frenos</option>
                    <option>Alineación</option>
                    <option>Cambio de distribución</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Mecánico
                  </label>

                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                    <option>Asignar mecánico</option>
                    {mechanics.map((mechanic) => (
                      <option key={mechanic.name}>
                        {mechanic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Observaciones
                  </label>

                  <textarea
                    rows={3}
                    placeholder="Agregar observaciones..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                >
                  Crear turno
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
