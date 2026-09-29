import {
    ArrowDownLeft,
    ArrowUpRight,
    CalendarDays,
    CircleDollarSign,
    CreditCard,
    Plus,
    Receipt,
    Search,
    X,
} from "lucide-react";

import {
    addDoc,
    collection,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import AdminLayout from "../components/AdminLayout";
import { db } from "../config/firebase";

type PaymentMethod =
    | "Efectivo"
    | "Transferencia"
    | "Tarjeta"
    | "Mercado Pago";

type ExpenseCategory =
    | "Repuestos"
    | "Insumos"
    | "Herramientas"
    | "Mantenimiento"
    | "Servicios"
    | "Alquiler"
    | "Combustible"
    | "Sueldos"
    | "Impuestos"
    | "Otros";

interface Payment {
    id: string;
    servicioId: string;
    clienteNombre: string;
    vehiculoNombre: string;
    patente: string;
    monto: number;
    medioPago: PaymentMethod;
    fecha: any;
    observaciones: string;
}

interface Expense {
    id: string;
    concepto: string;
    categoria: ExpenseCategory;
    monto: number;
    medioPago: PaymentMethod;
    fecha: any;
    observaciones: string;
    creadoEn: any;
}

interface Movement {
    id: string;
    tipo: "Ingreso" | "Egreso";
    concepto: string;
    detalle: string;
    monto: number;
    medioPago: PaymentMethod;
    fecha: any;
}

const normalizePaymentMethod = (
    value: any
): PaymentMethod => {
    if (
        value === "Efectivo" ||
        value === "Transferencia" ||
        value === "Tarjeta" ||
        value === "Mercado Pago"
    ) {
        return value;
    }

    return "Efectivo";
};

const normalizeExpenseCategory = (
    value: any
): ExpenseCategory => {
    const categories: ExpenseCategory[] = [
        "Repuestos",
        "Insumos",
        "Herramientas",
        "Mantenimiento",
        "Servicios",
        "Alquiler",
        "Combustible",
        "Sueldos",
        "Impuestos",
        "Otros",
    ];

    return categories.includes(value)
        ? value
        : "Otros";
};

const parseDate = (
    value: any
): Date | null => {
    if (!value) return null;

    try {
        if (
            typeof value?.toDate ===
            "function"
        ) {
            return value.toDate();
        }

        if (value instanceof Date) {
            return value;
        }

        if (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(
                value
            )
        ) {
            const [
                year,
                month,
                day,
            ] = value
                .split("-")
                .map(Number);

            return new Date(
                year,
                month - 1,
                day
            );
        }

        if (typeof value === "string") {
            const date = new Date(value);

            return Number.isNaN(
                date.getTime()
            )
                ? null
                : date;
        }

        if (typeof value === "number") {
            const date = new Date(value);

            return Number.isNaN(
                date.getTime()
            )
                ? null
                : date;
        }

        if (
            typeof value?.seconds ===
            "number"
        ) {
            return new Date(
                value.seconds * 1000
            );
        }

        return null;
    } catch {
        return null;
    }
};

const formatDate = (
    value: any
) => {
    const date = parseDate(value);

    if (!date) return "—";

    return new Intl.DateTimeFormat(
        "es-AR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    ).format(date);
};

const getTodayInputDate = () => {
    const date = new Date();

    const year =
        date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const Balance = () => {
    const [payments, setPayments] =
        useState<Payment[]>([]);

    const [expenses, setExpenses] =
        useState<Expense[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [periodFilter, setPeriodFilter] =
        useState("Este mes");

    const [movementFilter, setMovementFilter] =
        useState<
            "Todos" | "Ingreso" | "Egreso"
        >("Todos");

    const [
        showExpenseModal,
        setShowExpenseModal,
    ] = useState(false);

    const [
        savingExpense,
        setSavingExpense,
    ] = useState(false);

    const [expenseConcept, setExpenseConcept] =
        useState("");

    const [expenseCategory, setExpenseCategory] =
        useState<ExpenseCategory>(
            "Otros"
        );

    const [expenseAmount, setExpenseAmount] =
        useState("");

    const [expenseMethod, setExpenseMethod] =
        useState<PaymentMethod>(
            "Efectivo"
        );

    const [expenseDate, setExpenseDate] =
        useState(
            getTodayInputDate()
        );

    const [expenseNotes, setExpenseNotes] =
        useState("");

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

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                paymentsSnapshot,
                expensesSnapshot,
            ] = await Promise.all([
                getDocs(
                    collection(
                        db,
                        "pagos"
                    )
                ),
                getDocs(
                    collection(
                        db,
                        "gastos"
                    )
                ),
            ]);

            const paymentsData =
                paymentsSnapshot.docs.map(
                    (document) => {
                        const data =
                            document.data();

                        return {
                            id: document.id,

                            servicioId:
                                data.servicioId ??
                                "",

                            clienteNombre:
                                data.clienteNombre ??
                                "Sin cliente",

                            vehiculoNombre:
                                data.vehiculoNombre ??
                                "Sin vehículo",

                            patente:
                                data.patente ??
                                "",

                            monto:
                                Number(
                                    data.monto
                                ) || 0,

                            medioPago:
                                normalizePaymentMethod(
                                    data.medioPago
                                ),

                            fecha:
                                data.fecha ??
                                null,

                            observaciones:
                                data.observaciones ??
                                "",
                        };
                    }
                );

            const expensesData =
                expensesSnapshot.docs.map(
                    (document) => {
                        const data =
                            document.data();

                        return {
                            id: document.id,

                            concepto:
                                data.concepto ??
                                "Gasto",

                            categoria:
                                normalizeExpenseCategory(
                                    data.categoria
                                ),

                            monto:
                                Number(
                                    data.monto
                                ) || 0,

                            medioPago:
                                normalizePaymentMethod(
                                    data.medioPago
                                ),

                            fecha:
                                data.fecha ??
                                null,

                            observaciones:
                                data.observaciones ??
                                "",

                            creadoEn:
                                data.creadoEn ??
                                null,
                        };
                    }
                );

            setPayments(
                paymentsData
            );

            setExpenses(
                expensesData
            );
        } catch (err) {
            console.error(
                "Error cargando balance:",
                err
            );

            setError(
                "No se pudieron cargar los movimientos financieros."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const movements =
        useMemo<Movement[]>(() => {
            const incomeMovements =
                payments.map(
                    (payment) => ({
                        id: `ingreso-${payment.id}`,
                        tipo: "Ingreso" as const,
                        concepto:
                            "Cobro de servicio",
                        detalle:
                            `${payment.clienteNombre} · ${payment.vehiculoNombre}`,
                        monto:
                            payment.monto,
                        medioPago:
                            payment.medioPago,
                        fecha:
                            payment.fecha,
                    })
                );

            const expenseMovements =
                expenses.map(
                    (expense) => ({
                        id: `egreso-${expense.id}`,
                        tipo: "Egreso" as const,
                        concepto:
                            expense.concepto,
                        detalle:
                            expense.categoria,
                        monto:
                            expense.monto,
                        medioPago:
                            expense.medioPago,
                        fecha:
                            expense.fecha,
                    })
                );

            return [
                ...incomeMovements,
                ...expenseMovements,
            ].sort((a, b) => {
                const dateA =
                    parseDate(
                        a.fecha
                    )?.getTime() ?? 0;

                const dateB =
                    parseDate(
                        b.fecha
                    )?.getTime() ?? 0;

                return dateB - dateA;
            });
        }, [
            payments,
            expenses,
        ]);

    const filteredMovements =
        useMemo(() => {
            const normalizedSearch =
                search
                    .toLowerCase()
                    .trim();

            return movements.filter(
                (movement) => {
                    const matchesSearch =
                        movement.concepto
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        movement.detalle
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        movement.medioPago
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            );

                    const matchesType =
                        movementFilter ===
                            "Todos" ||
                        movement.tipo ===
                            movementFilter;

                    return (
                        matchesSearch &&
                        matchesType
                    );
                }
            );
        }, [
            movements,
            search,
            movementFilter,
        ]);

    const totalIncome =
        payments.reduce(
            (sum, payment) =>
                sum + payment.monto,
            0
        );

    const totalExpenses =
        expenses.reduce(
            (sum, expense) =>
                sum + expense.monto,
            0
        );

    const balance =
        totalIncome -
        totalExpenses;

    const paymentMethodTotals =
        payments.reduce<
            Record<
                PaymentMethod,
                number
            >
        >(
            (
                accumulator,
                payment
            ) => {
                accumulator[
                    payment.medioPago
                ] =
                    (accumulator[
                        payment.medioPago
                    ] ?? 0) +
                    payment.monto;

                return accumulator;
            },
            {
                Efectivo: 0,
                Transferencia: 0,
                Tarjeta: 0,
                "Mercado Pago": 0,
            }
        );

    const expenseCategoryTotals =
        expenses.reduce<
            Record<string, number>
        >(
            (
                accumulator,
                expense
            ) => {
                accumulator[
                    expense.categoria
                ] =
                    (accumulator[
                        expense.categoria
                    ] ?? 0) +
                    expense.monto;

                return accumulator;
            },
            {}
        );

    const handleAddExpense =
        async () => {
            const amount =
                Number(
                    expenseAmount
                );

            if (
                !expenseConcept.trim()
            ) {
                alert(
                    "Ingresá el concepto del gasto."
                );

                return;
            }

            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0
            ) {
                alert(
                    "Ingresá un monto válido."
                );

                return;
            }

            if (!expenseDate) {
                alert(
                    "Seleccioná una fecha."
                );

                return;
            }

            try {
                setSavingExpense(
                    true
                );

                await addDoc(
                    collection(
                        db,
                        "gastos"
                    ),
                    {
                        concepto:
                            expenseConcept.trim(),

                        categoria:
                            expenseCategory,

                        monto:
                            amount,

                        medioPago:
                            expenseMethod,

                        fecha:
                            expenseDate,

                        observaciones:
                            expenseNotes.trim(),

                        creadoEn:
                            serverTimestamp(),
                    }
                );

                setExpenseConcept(
                    ""
                );

                setExpenseCategory(
                    "Otros"
                );

                setExpenseAmount(
                    ""
                );

                setExpenseMethod(
                    "Efectivo"
                );

                setExpenseDate(
                    getTodayInputDate()
                );

                setExpenseNotes(
                    ""
                );

                setShowExpenseModal(
                    false
                );

                await cargarDatos();
            } catch (err) {
                console.error(
                    "Error registrando gasto:",
                    err
                );

                alert(
                    "No se pudo registrar el gasto."
                );
            } finally {
                setSavingExpense(
                    false
                );
            }
        };

    return (
        <AdminLayout>
            <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">

                {/* HEADER */}
                <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

                    <div>
                        <div className="mb-2 flex items-center gap-2">

                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                Administración financiera
                            </span>

                            <span className="text-xs text-slate-400">
                                Caja y movimientos
                            </span>

                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Balance
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Controlá los ingresos y egresos
                            del taller para conocer el estado
                            real de la caja.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setShowExpenseModal(
                                true
                            )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <Plus size={17} />
                        Registrar gasto
                    </button>

                </div>

                {/* RESUMEN */}
                <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="grid md:grid-cols-3">

                        {/* INGRESOS */}
                        <div className="border-b border-slate-100 p-6 md:border-r md:border-b-0">

                            <div className="flex items-start justify-between">

                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Ingresos
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                                        {formatCurrency(
                                            totalIncome
                                        )}
                                    </p>

                                    <p className="mt-3 text-xs text-slate-400">
                                        Pagos efectivamente registrados
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <ArrowDownLeft
                                        size={21}
                                    />
                                </div>

                            </div>

                        </div>

                        {/* EGRESOS */}
                        <div className="border-b border-slate-100 p-6 md:border-r md:border-b-0">

                            <div className="flex items-start justify-between">

                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Egresos
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-red-600">
                                        {formatCurrency(
                                            totalExpenses
                                        )}
                                    </p>

                                    <p className="mt-3 text-xs text-slate-400">
                                        Gastos registrados
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                    <ArrowUpRight
                                        size={21}
                                    />
                                </div>

                            </div>

                        </div>

                        {/* BALANCE */}
                        <div className="p-6">

                            <div className="flex items-start justify-between">

                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Balance neto
                                    </p>

                                    <p
                                        className={`mt-2 text-2xl font-bold tracking-tight ${
                                            balance >=
                                            0
                                                ? "text-slate-900"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {formatCurrency(
                                            balance
                                        )}
                                    </p>

                                    <p className="mt-3 text-xs text-slate-400">
                                        Ingresos − egresos
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <CircleDollarSign
                                        size={21}
                                    />
                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* DISTRIBUCIÓN */}
                <section className="mb-7 grid gap-4 lg:grid-cols-2">

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Ingresos por medio de pago
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Dinero ingresado a la caja
                                </p>
                            </div>

                            <CreditCard
                                size={19}
                                className="text-slate-400"
                            />

                        </div>

                        <div className="mt-5 space-y-3">

                            {(
                                [
                                    "Efectivo",
                                    "Transferencia",
                                    "Tarjeta",
                                    "Mercado Pago",
                                ] as PaymentMethod[]
                            ).map(
                                (method) => (
                                    <div
                                        key={
                                            method
                                        }
                                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                                    >

                                        <span className="text-sm text-slate-600">
                                            {
                                                method
                                            }
                                        </span>

                                        <span className="text-sm font-bold text-slate-900">
                                            {formatCurrency(
                                                paymentMethodTotals[
                                                    method
                                                ] ??
                                                    0
                                            )}
                                        </span>

                                    </div>
                                )
                            )}

                        </div>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Gastos por categoría
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    En qué se está utilizando la caja
                                </p>
                            </div>

                            <Receipt
                                size={19}
                                className="text-slate-400"
                            />

                        </div>

                        <div className="mt-5 space-y-3">

                            {Object.entries(
                                expenseCategoryTotals
                            )
                                .sort(
                                    (
                                        [, a],
                                        [, b]
                                    ) =>
                                        b - a
                                )
                                .slice(0, 5)
                                .map(
                                    ([
                                        category,
                                        amount,
                                    ]) => (
                                        <div
                                            key={
                                                category
                                            }
                                            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                                        >

                                            <span className="text-sm text-slate-600">
                                                {
                                                    category
                                                }
                                            </span>

                                            <span className="text-sm font-bold text-slate-900">
                                                {formatCurrency(
                                                    amount
                                                )}
                                            </span>

                                        </div>
                                    )
                                )}

                            {Object.keys(
                                expenseCategoryTotals
                            ).length ===
                                0 && (
                                <p className="py-5 text-center text-sm text-slate-400">
                                    Todavía no hay gastos registrados.
                                </p>
                            )}

                        </div>

                    </div>

                </section>

                {/* MOVIMIENTOS */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Movimientos de caja
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Ingresos y egresos registrados
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">

                            <div className="relative">

                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={
                                        search
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setSearch(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Buscar movimiento..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 md:w-64"
                                />

                            </div>

                            <select
                                value={
                                    movementFilter
                                }
                                onChange={(
                                    e
                                ) =>
                                    setMovementFilter(
                                        e
                                            .target
                                            .value as
                                            | "Todos"
                                            | "Ingreso"
                                            | "Egreso"
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="Todos">
                                    Todos
                                </option>

                                <option value="Ingreso">
                                    Ingresos
                                </option>

                                <option value="Egreso">
                                    Egresos
                                </option>
                            </select>

                            <select
                                value={
                                    periodFilter
                                }
                                onChange={(
                                    e
                                ) =>
                                    setPeriodFilter(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option>
                                    Este mes
                                </option>

                                <option>
                                    Este año
                                </option>

                                <option>
                                    Todo
                                </option>
                            </select>

                        </div>

                    </div>

                    {error && (
                        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm font-medium text-slate-600">
                                Cargando balance...
                            </p>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[900px]">

                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70">

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Movimiento
                                        </th>

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Detalle
                                        </th>

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Fecha
                                        </th>

                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Medio
                                        </th>

                                        <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Importe
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredMovements.map(
                                        (
                                            movement
                                        ) => (
                                            <tr
                                                key={
                                                    movement.id
                                                }
                                                className="border-b border-slate-100 transition hover:bg-slate-50"
                                            >

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div
                                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                                                movement.tipo ===
                                                                "Ingreso"
                                                                    ? "bg-emerald-50 text-emerald-600"
                                                                    : "bg-red-50 text-red-600"
                                                            }`}
                                                        >
                                                            {movement.tipo ===
                                                            "Ingreso" ? (
                                                                <ArrowDownLeft
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            ) : (
                                                                <ArrowUpRight
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <div>

                                                            <p className="text-sm font-bold text-slate-900">
                                                                {
                                                                    movement.concepto
                                                                }
                                                            </p>

                                                            <span
                                                                className={`text-xs font-semibold ${
                                                                    movement.tipo ===
                                                                    "Ingreso"
                                                                        ? "text-emerald-600"
                                                                        : "text-red-600"
                                                                }`}
                                                            >
                                                                {
                                                                    movement.tipo
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-5 py-4">

                                                    <p className="text-sm text-slate-600">
                                                        {
                                                            movement.detalle
                                                        }
                                                    </p>

                                                </td>

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-2">

                                                        <CalendarDays
                                                            size={
                                                                15
                                                            }
                                                            className="text-slate-400"
                                                        />

                                                        <span className="text-sm text-slate-600">
                                                            {formatDate(
                                                                movement.fecha
                                                            )}
                                                        </span>

                                                    </div>

                                                </td>

                                                <td className="px-5 py-4">

                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                        {
                                                            movement.medioPago
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-5 py-4 text-right">

                                                    <span
                                                        className={`text-sm font-bold ${
                                                            movement.tipo ===
                                                            "Ingreso"
                                                                ? "text-emerald-600"
                                                                : "text-red-600"
                                                        }`}
                                                    >
                                                        {movement.tipo ===
                                                        "Ingreso"
                                                            ? "+"
                                                            : "-"}
                                                        {formatCurrency(
                                                            movement.monto
                                                        )}
                                                    </span>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                            {filteredMovements.length ===
                                0 && (
                                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                        <Search
                                            size={
                                                24
                                            }
                                        />
                                    </div>

                                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                                        No hay movimientos
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Todavía no se registraron movimientos de caja.
                                    </p>

                                </div>
                            )}

                        </div>
                    )}

                </section>

            </div>

            {/* MODAL GASTO */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                                    Salida de caja
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Registrar gasto
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Registrá cualquier dinero que salga del taller.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowExpenseModal(
                                        false
                                    )
                                }
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="space-y-5 p-6">

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Concepto
                                </label>

                                <input
                                    type="text"
                                    value={
                                        expenseConcept
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setExpenseConcept(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Ej: Compra de aceite"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Categoría
                                    </label>

                                    <select
                                        value={
                                            expenseCategory
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setExpenseCategory(
                                                e
                                                    .target
                                                    .value as ExpenseCategory
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        <option>
                                            Repuestos
                                        </option>

                                        <option>
                                            Insumos
                                        </option>

                                        <option>
                                            Herramientas
                                        </option>

                                        <option>
                                            Mantenimiento
                                        </option>

                                        <option>
                                            Servicios
                                        </option>

                                        <option>
                                            Alquiler
                                        </option>

                                        <option>
                                            Combustible
                                        </option>

                                        <option>
                                            Sueldos
                                        </option>

                                        <option>
                                            Impuestos
                                        </option>

                                        <option>
                                            Otros
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Monto
                                    </label>

                                    <div className="relative">

                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                            $
                                        </span>

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                expenseAmount
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setExpenseAmount(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="0"
                                            className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Medio de pago
                                    </label>

                                    <select
                                        value={
                                            expenseMethod
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setExpenseMethod(
                                                e
                                                    .target
                                                    .value as PaymentMethod
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        <option>
                                            Efectivo
                                        </option>

                                        <option>
                                            Transferencia
                                        </option>

                                        <option>
                                            Tarjeta
                                        </option>

                                        <option>
                                            Mercado Pago
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Fecha
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            expenseDate
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setExpenseDate(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Observaciones
                                </label>

                                <textarea
                                    rows={3}
                                    value={
                                        expenseNotes
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setExpenseNotes(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Opcional..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowExpenseModal(
                                        false
                                    )
                                }
                                disabled={
                                    savingExpense
                                }
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleAddExpense
                                }
                                disabled={
                                    savingExpense
                                }
                                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <ArrowUpRight
                                    size={16}
                                />

                                {savingExpense
                                    ? "Guardando..."
                                    : "Registrar gasto"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </AdminLayout>
    );
};

export default Balance;