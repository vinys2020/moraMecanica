import {
    AlertCircle,
    ArrowUpRight,
    CalendarDays,
    Car,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    DollarSign,
    FileText,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";

type BudgetStatus =
    | "Pendiente"
    | "Aprobado"
    | "Rechazado"
    | "Vencido";

interface BudgetItem {
    type: "Servicio" | "Repuesto";
    name: string;
    quantity: number;
    price: number;
}

interface Budget {
    id: string;
    client: string;
    vehicle: string;
    plate: string;
    date: string;
    validUntil: string;
    total: number;
    items: number;
    status: BudgetStatus;
    advisor: string;
}

const Presupuestos = () => {
    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState<
        "Todos" | BudgetStatus
    >("Todos");

    const [periodFilter, setPeriodFilter] = useState("Todos");

    const [showModal, setShowModal] = useState(false);

    const [newBudget, setNewBudget] = useState({
        client: "",
        vehicle: "",
        validUntil: "",
        notes: "",
    });

    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
        {
            type: "Servicio",
            name: "Diagnóstico computarizado",
            quantity: 1,
            price: 35000,
        },
    ]);

    const budgets: Budget[] = [
        {
            id: "PRE-001",
            client: "Carlos Rodríguez",
            vehicle: "Toyota Corolla XEI 2022",
            plate: "AB 123 CD",
            date: "18 Sep 2026",
            validUntil: "25 Sep 2026",
            total: 285000,
            items: 4,
            status: "Pendiente",
            advisor: "Administrador",
        },
        {
            id: "PRE-002",
            client: "María González",
            vehicle: "Volkswagen Amarok V6 2021",
            plate: "AC 456 EF",
            date: "17 Sep 2026",
            validUntil: "24 Sep 2026",
            total: 465000,
            items: 6,
            status: "Aprobado",
            advisor: "Administrador",
        },
        {
            id: "PRE-003",
            client: "Lucas Fernández",
            vehicle: "Ford Ranger XLT 2023",
            plate: "AE 789 GH",
            date: "16 Sep 2026",
            validUntil: "23 Sep 2026",
            total: 720000,
            items: 8,
            status: "Aprobado",
            advisor: "Administrador",
        },
        {
            id: "PRE-004",
            client: "Sofía Martínez",
            vehicle: "Chevrolet Tracker Premier 2024",
            plate: "AF 321 JK",
            date: "15 Sep 2026",
            validUntil: "22 Sep 2026",
            total: 195000,
            items: 3,
            status: "Pendiente",
            advisor: "Administrador",
        },
        {
            id: "PRE-005",
            client: "Diego Sánchez",
            vehicle: "Renault Duster Intens 2020",
            plate: "AG 654 LM",
            date: "12 Sep 2026",
            validUntil: "19 Sep 2026",
            total: 342000,
            items: 5,
            status: "Rechazado",
            advisor: "Administrador",
        },
        {
            id: "PRE-006",
            client: "Martín Pérez",
            vehicle: "Fiat Cronos Precision 2022",
            plate: "AH 987 NP",
            date: "10 Sep 2026",
            validUntil: "17 Sep 2026",
            total: 158000,
            items: 3,
            status: "Vencido",
            advisor: "Administrador",
        },
        {
            id: "PRE-007",
            client: "Valentina Ruiz",
            vehicle: "Peugeot 208 Feline 2023",
            plate: "AI 147 QR",
            date: "09 Sep 2026",
            validUntil: "16 Sep 2026",
            total: 248000,
            items: 4,
            status: "Aprobado",
            advisor: "Administrador",
        },
        {
            id: "PRE-008",
            client: "Javier López",
            vehicle: "Honda Civic EX 2019",
            plate: "AC 258 ST",
            date: "05 Sep 2026",
            validUntil: "12 Sep 2026",
            total: 430000,
            items: 7,
            status: "Pendiente",
            advisor: "Administrador",
        },
    ];

    const filteredBudgets = useMemo(() => {
        const normalizedSearch = search.toLowerCase().trim();

        return budgets.filter((budget) => {
            const matchesSearch =
                budget.id.toLowerCase().includes(normalizedSearch) ||
                budget.client.toLowerCase().includes(normalizedSearch) ||
                budget.vehicle.toLowerCase().includes(normalizedSearch) ||
                budget.plate.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "Todos" ||
                budget.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [search, statusFilter]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const stats = {
        pending: budgets.filter(
            (budget) => budget.status === "Pendiente"
        ).length,

        approved: budgets.filter(
            (budget) => budget.status === "Aprobado"
        ).length,

        total: budgets.reduce(
            (sum, budget) => sum + budget.total,
            0
        ),

        approvalRate: Math.round(
            (budgets.filter(
                (budget) => budget.status === "Aprobado"
            ).length /
                budgets.length) *
                100
        ),
    };

    const addBudgetItem = () => {
        setBudgetItems([
            ...budgetItems,
            {
                type: "Servicio",
                name: "",
                quantity: 1,
                price: 0,
            },
        ]);
    };

    const removeBudgetItem = (index: number) => {
        setBudgetItems(
            budgetItems.filter((_, itemIndex) => itemIndex !== index)
        );
    };

    const updateBudgetItem = (
        index: number,
        field: keyof BudgetItem,
        value: string | number
    ) => {
        setBudgetItems((currentItems) =>
            currentItems.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            )
        );
    };

    const budgetSubtotal = budgetItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
    );

    const handleCreateBudget = () => {
        console.log("Nuevo presupuesto:", {
            ...newBudget,
            items: budgetItems,
            subtotal: budgetSubtotal,
        });

        setNewBudget({
            client: "",
            vehicle: "",
            validUntil: "",
            notes: "",
        });

        setBudgetItems([
            {
                type: "Servicio",
                name: "Diagnóstico computarizado",
                quantity: 1,
                price: 35000,
            },
        ]);

        setShowModal(false);
    };

    const statusConfig: Record<
        BudgetStatus,
        {
            label: string;
            className: string;
            icon: typeof CheckCircle2;
        }
    > = {
        Pendiente: {
            label: "Pendiente",
            className: "bg-amber-50 text-amber-700",
            icon: Clock3,
        },
        Aprobado: {
            label: "Aprobado",
            className: "bg-emerald-50 text-emerald-700",
            icon: CheckCircle2,
        },
        Rechazado: {
            label: "Rechazado",
            className: "bg-red-50 text-red-700",
            icon: AlertCircle,
        },
        Vencido: {
            label: "Vencido",
            className: "bg-slate-100 text-slate-500",
            icon: Clock3,
        },
    };

    return (
        <AdminLayout>
            <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">

                {/* HEADER */}
                <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                Gestión comercial
                            </span>

                            <span className="text-xs text-slate-400">
                                Septiembre 2026
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Presupuestos
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Creá, seguí y gestioná los presupuestos de cada
                            trabajo antes de convertirlos en órdenes de servicio.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:flex"
                        >
                            <Send size={17} />
                            Enviar presupuesto
                        </button>

                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Nuevo presupuesto
                        </button>
                    </div>
                </div>

                {/* COMMERCIAL OVERVIEW */}
                <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

                        {/* MAIN VALUE */}
                        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Monto presupuestado
                                    </p>

                                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                        {formatCurrency(stats.total)}
                                    </p>

                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                            <ArrowUpRight size={14} />
                                            13.8%
                                        </span>

                                        <span className="text-xs text-slate-400">
                                            vs. mes anterior
                                        </span>
                                    </div>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <DollarSign size={21} />
                                </div>
                            </div>
                        </div>

                        {/* PENDING */}
                        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
                            <p className="text-sm font-medium text-slate-500">
                                Pendientes de aprobación
                            </p>

                            <div className="mt-3 flex items-end gap-3">
                                <p className="text-3xl font-bold text-slate-900">
                                    {stats.pending}
                                </p>

                                <span className="mb-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                                    Requieren atención
                                </span>
                            </div>

                            <p className="mt-3 text-xs text-slate-400">
                                Presupuestos esperando respuesta del cliente.
                            </p>
                        </div>

                        {/* APPROVED */}
                        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
                            <p className="text-sm font-medium text-slate-500">
                                Presupuestos aprobados
                            </p>

                            <div className="mt-3 flex items-end gap-3">
                                <p className="text-3xl font-bold text-slate-900">
                                    {stats.approved}
                                </p>

                                <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <ArrowUpRight size={14} />
                                    18.4%
                                </span>
                            </div>

                            <p className="mt-3 text-xs text-slate-400">
                                Listos para convertirse en trabajos.
                            </p>
                        </div>

                        {/* APPROVAL RATE */}
                        <div className="p-6">
                            <p className="text-sm font-medium text-slate-500">
                                Tasa de aprobación
                            </p>

                            <div className="mt-3 flex items-end gap-3">
                                <p className="text-3xl font-bold text-slate-900">
                                    {stats.approvalRate}%
                                </p>

                                <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <ArrowUpRight size={14} />
                                    4.2%
                                </span>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{
                                        width: `${stats.approvalRate}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* PENDING ATTENTION */}
                <section className="mb-7 grid gap-4 lg:grid-cols-3">

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <Clock3 size={19} />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-amber-900">
                                    3 presupuestos esperan respuesta
                                </p>

                                <p className="mt-1 text-xs leading-5 text-amber-700">
                                    Algunos llevan más de 48 horas sin
                                    confirmación del cliente.
                                </p>
                            </div>
                        </div>

                        <button className="mt-4 text-xs font-bold text-amber-800 hover:underline">
                            Ver pendientes →
                        </button>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <CalendarDays size={19} />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-blue-900">
                                    2 presupuestos vencen esta semana
                                </p>

                                <p className="mt-1 text-xs leading-5 text-blue-700">
                                    Revisá su vigencia antes de confirmar el
                                    trabajo.
                                </p>
                            </div>
                        </div>

                        <button className="mt-4 text-xs font-bold text-blue-800 hover:underline">
                            Revisar presupuestos →
                        </button>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CheckCircle2 size={19} />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-emerald-900">
                                    3 listos para trabajar
                                </p>

                                <p className="mt-1 text-xs leading-5 text-emerald-700">
                                    Los presupuestos aprobados pueden convertirse
                                    en órdenes de trabajo.
                                </p>
                            </div>
                        </div>

                        <button className="mt-4 text-xs font-bold text-emerald-800 hover:underline">
                            Ver aprobados →
                        </button>
                    </div>
                </section>

                {/* LIST */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* TOOLBAR */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Todos los presupuestos
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {filteredBudgets.length} presupuestos encontrados
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">

                            {/* SEARCH */}
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Buscar presupuesto..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 md:w-64"
                                />
                            </div>

                            {/* STATUS */}
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as
                                            | "Todos"
                                            | BudgetStatus
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="Todos">
                                    Todos los estados
                                </option>
                                <option value="Pendiente">
                                    Pendientes
                                </option>
                                <option value="Aprobado">
                                    Aprobados
                                </option>
                                <option value="Rechazado">
                                    Rechazados
                                </option>
                                <option value="Vencido">
                                    Vencidos
                                </option>
                            </select>

                            {/* PERIOD */}
                            <select
                                value={periodFilter}
                                onChange={(e) =>
                                    setPeriodFilter(e.target.value)
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="Todos">
                                    Todo el período
                                </option>
                                <option value="Hoy">Hoy</option>
                                <option value="Semana">
                                    Esta semana
                                </option>
                                <option value="Mes">
                                    Este mes
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1150px]">

                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Presupuesto
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Cliente / vehículo
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Fecha
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Vigencia
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Conceptos
                                    </th>

                                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Total
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Estado
                                    </th>

                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>

                            <tbody>
                                {filteredBudgets.map(
                                    (budget, index) => {
                                        const StatusIcon =
                                            statusConfig[
                                                budget.status
                                            ].icon;

                                        return (
                                            <tr
                                                key={budget.id}
                                                className={`group transition hover:bg-slate-50 ${
                                                    index !==
                                                    filteredBudgets.length - 1
                                                        ? "border-b border-slate-100"
                                                        : ""
                                                }`}
                                            >
                                                {/* ID */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                            <FileText
                                                                size={19}
                                                            />
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {budget.id}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                {budget.advisor}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* CLIENT */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {budget.client}
                                                        </p>

                                                        <div className="mt-1 flex items-center gap-2">
                                                            <Car
                                                                size={13}
                                                                className="text-slate-400"
                                                            />

                                                            <span className="text-xs text-slate-500">
                                                                {budget.vehicle}
                                                            </span>
                                                        </div>

                                                        <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                                                            {budget.plate}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* DATE */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays
                                                            size={15}
                                                            className="text-slate-400"
                                                        />

                                                        <span className="text-sm text-slate-600">
                                                            {budget.date}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* VALID UNTIL */}
                                                <td className="px-5 py-4">
                                                    <div
                                                        className={`flex items-center gap-2 ${
                                                            budget.status ===
                                                            "Vencido"
                                                                ? "text-red-600"
                                                                : "text-slate-600"
                                                        }`}
                                                    >
                                                        <Clock3
                                                            size={15}
                                                        />

                                                        <span className="text-sm">
                                                            {budget.validUntil}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* ITEMS */}
                                                <td className="px-5 py-4">
                                                    <span className="text-sm text-slate-600">
                                                        {budget.items}{" "}
                                                        conceptos
                                                    </span>
                                                </td>

                                                {/* TOTAL */}
                                                <td className="px-5 py-4 text-right">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {formatCurrency(
                                                            budget.total
                                                        )}
                                                    </span>
                                                </td>

                                                {/* STATUS */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusConfig[
                                                            budget.status
                                                        ].className}`}
                                                    >
                                                        <StatusIcon
                                                            size={12}
                                                        />

                                                        {
                                                            statusConfig[
                                                                budget.status
                                                            ].label
                                                        }
                                                    </span>
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="px-5 py-4">
                                                    <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                                                        <MoreHorizontal
                                                            size={18}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* EMPTY */}
                    {filteredBudgets.length === 0 && (
                        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search size={24} />
                            </div>

                            <h3 className="mt-4 text-sm font-bold text-slate-900">
                                No encontramos presupuestos
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Probá con otro cliente, patente o número.
                            </p>
                        </div>
                    )}

                    {/* PAGINATION */}
                    <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">

                        <p className="text-xs text-slate-400">
                            Mostrando {filteredBudgets.length} de 48 presupuestos
                        </p>

                        <div className="flex items-center gap-2">
                            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                                <ChevronLeft size={16} />
                            </button>

                            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
                                1
                            </button>

                            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                2
                            </button>

                            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                3
                            </button>

                            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* NEW BUDGET MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                    Gestión comercial
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Nuevo presupuesto
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Armá el presupuesto con servicios y repuestos.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">

                            {/* CLIENT + VEHICLE */}
                            <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Cliente
                                    </label>

                                    <select
                                        value={newBudget.client}
                                        onChange={(e) =>
                                            setNewBudget({
                                                ...newBudget,
                                                client: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        <option value="">
                                            Seleccioná un cliente
                                        </option>

                                        <option value="Carlos Rodríguez">
                                            Carlos Rodríguez
                                        </option>

                                        <option value="María González">
                                            María González
                                        </option>

                                        <option value="Lucas Fernández">
                                            Lucas Fernández
                                        </option>

                                        <option value="Sofía Martínez">
                                            Sofía Martínez
                                        </option>

                                        <option value="Diego Sánchez">
                                            Diego Sánchez
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Vehículo
                                    </label>

                                    <select
                                        value={newBudget.vehicle}
                                        onChange={(e) =>
                                            setNewBudget({
                                                ...newBudget,
                                                vehicle: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        <option value="">
                                            Seleccioná un vehículo
                                        </option>

                                        <option value="Toyota Corolla XEI 2022">
                                            Toyota Corolla XEI 2022 · AB 123 CD
                                        </option>

                                        <option value="Volkswagen Amarok V6 2021">
                                            Volkswagen Amarok V6 2021 · AC 456 EF
                                        </option>

                                        <option value="Ford Ranger XLT 2023">
                                            Ford Ranger XLT 2023 · AE 789 GH
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Válido hasta
                                    </label>

                                    <input
                                        type="date"
                                        value={newBudget.validUntil}
                                        onChange={(e) =>
                                            setNewBudget({
                                                ...newBudget,
                                                validUntil: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <div className="flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                        <FileText
                                            size={18}
                                            className="text-blue-600"
                                        />

                                        <div>
                                            <p className="text-xs font-bold text-blue-900">
                                                Estado inicial
                                            </p>

                                            <p className="text-xs text-blue-700">
                                                Pendiente de aprobación
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ITEMS */}
                            <div className="mt-6">

                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">
                                            Conceptos del presupuesto
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Agregá los trabajos y repuestos necesarios.
                                        </p>
                                    </div>

                                    <button
                                        onClick={addBudgetItem}
                                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <Plus size={15} />
                                        Agregar concepto
                                    </button>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200">

                                    <div className="hidden grid-cols-[120px_1fr_90px_130px_40px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid">
                                        <span>Tipo</span>
                                        <span>Descripción</span>
                                        <span>Cantidad</span>
                                        <span>Precio</span>
                                        <span />
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {budgetItems.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="grid gap-3 p-4 md:grid-cols-[120px_1fr_90px_130px_40px] md:items-center"
                                                >

                                                    <select
                                                        value={item.type}
                                                        onChange={(e) =>
                                                            updateBudgetItem(
                                                                index,
                                                                "type",
                                                                e.target
                                                                    .value
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                                                    >
                                                        <option value="Servicio">
                                                            Servicio
                                                        </option>

                                                        <option value="Repuesto">
                                                            Repuesto
                                                        </option>
                                                    </select>

                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) =>
                                                            updateBudgetItem(
                                                                index,
                                                                "name",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Descripción del trabajo..."
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500"
                                                    />

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateBudgetItem(
                                                                index,
                                                                "quantity",
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                                                    />

                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                                            $
                                                        </span>

                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) =>
                                                                updateBudgetItem(
                                                                    index,
                                                                    "price",
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-xs outline-none focus:border-blue-500"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            removeBudgetItem(
                                                                index
                                                            )
                                                        }
                                                        disabled={
                                                            budgetItems.length ===
                                                            1
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL */}
                            <div className="mt-6 flex flex-col gap-6 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">

                                <div>
                                    <p className="text-sm font-semibold">
                                        Total del presupuesto
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {budgetItems.length} conceptos incluidos
                                    </p>
                                </div>

                                <p className="text-3xl font-bold tracking-tight">
                                    {formatCurrency(budgetSubtotal)}
                                </p>
                            </div>

                            {/* NOTES */}
                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Observaciones
                                </label>

                                <textarea
                                    rows={3}
                                    value={newBudget.notes}
                                    onChange={(e) =>
                                        setNewBudget({
                                            ...newBudget,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="Condiciones, detalles del trabajo o información adicional..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">

                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleCreateBudget}
                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                            >
                                Crear presupuesto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Presupuestos;