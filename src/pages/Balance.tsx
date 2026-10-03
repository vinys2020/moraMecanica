import {
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    CreditCard,
    Loader2,
    Plus,
    Receipt,
    Search,
    Trash2,
    X,
} from "lucide-react";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
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


// =====================================================
// TYPES
// =====================================================

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
    firestoreId: string;
    tipo: "Ingreso" | "Egreso";
    concepto: string;
    detalle: string;
    monto: number;
    medioPago: PaymentMethod;
    fecha: any;
}

interface DeleteTarget {
    tipo: "Ingreso" | "Egreso";
    firestoreId: string;
    concepto: string;
    monto: number;
}


// =====================================================
// HELPERS
// =====================================================

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


// =====================================================
// COMPONENT
// =====================================================

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
    useState(() => {
        const date = new Date();

        return `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}`;
    });

    const [
        movementFilter,
        setMovementFilter,
    ] = useState<
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

    const [
        deletingMovement,
        setDeletingMovement,
    ] = useState(false);

    const [
        movementToDelete,
        setMovementToDelete,
    ] = useState<DeleteTarget | null>(
        null
    );

    const [
        expenseConcept,
        setExpenseConcept,
    ] = useState("");

    const [
        expenseCategory,
        setExpenseCategory,
    ] = useState<ExpenseCategory>(
        "Otros"
    );

    const [
        expenseAmount,
        setExpenseAmount,
    ] = useState("");

    const [
        expenseMethod,
        setExpenseMethod,
    ] = useState<PaymentMethod>(
        "Efectivo"
    );

    const [
        expenseDate,
        setExpenseDate,
    ] = useState(
        getTodayInputDate()
    );

    const [
        expenseNotes,
        setExpenseNotes,
    ] = useState("");


    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

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


    // =====================================================
    // LOAD DATA
    // =====================================================

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


            const loadedPayments: Payment[] =
                paymentsSnapshot.docs.map(
                    (item) => {
                        const data =
                            item.data();

                        return {
                            id: item.id,

                            servicioId:
                                data.servicioId ??
                                "",

                            clienteNombre:
                                data.clienteNombre ??
                                data.cliente ??
                                "Cliente",

                            vehiculoNombre:
                                data.vehiculoNombre ??
                                data.vehiculo ??
                                "Vehículo",

                            patente:
                                data.patente ??
                                "",

                            monto:
                                Number(
                                    data.monto ??
                                    data.importe ??
                                    0
                                ),

                            medioPago:
                                normalizePaymentMethod(
                                    data.medioPago
                                ),

                            fecha:
                                data.fecha ??
                                data.creadoEn,

                            observaciones:
                                data.observaciones ??
                                "",
                        };
                    }
                );


            const loadedExpenses: Expense[] =
                expensesSnapshot.docs.map(
                    (item) => {
                        const data =
                            item.data();

                        return {
                            id: item.id,

                            concepto:
                                data.concepto ??
                                "Gasto",

                            categoria:
                                normalizeExpenseCategory(
                                    data.categoria
                                ),

                            monto:
                                Number(
                                    data.monto ??
                                    0
                                ),

                            medioPago:
                                normalizePaymentMethod(
                                    data.medioPago
                                ),

                            fecha:
                                data.fecha ??
                                data.creadoEn,

                            observaciones:
                                data.observaciones ??
                                "",

                            creadoEn:
                                data.creadoEn,
                        };
                    }
                );


            setPayments(
                loadedPayments
            );

            setExpenses(
                loadedExpenses
            );

        } catch (error) {
            console.error(
                "Error cargando balance:",
                error
            );

            setError(
                "No se pudieron cargar los datos financieros."
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        cargarDatos();
    }, []);


    // =====================================================
    // ALL MOVEMENTS
    // =====================================================

    const movements =
        useMemo<Movement[]>(() => {

            const incomeMovements =
                payments.map(
                    (payment) => ({
                        id:
                            `ingreso-${payment.id}`,

                        firestoreId:
                            payment.id,

                        tipo:
                            "Ingreso" as const,

                        concepto:
                            "Cobro de servicio",

                        detalle:
                            `${payment.clienteNombre} · ${payment.vehiculoNombre}${payment.patente
                                ? ` · ${payment.patente}`
                                : ""
                            }`,

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
                        id:
                            `egreso-${expense.id}`,

                        firestoreId:
                            expense.id,

                        tipo:
                            "Egreso" as const,

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
            ].sort(
                (a, b) => {
                    const dateA =
                        parseDate(
                            a.fecha
                        )?.getTime() ?? 0;

                    const dateB =
                        parseDate(
                            b.fecha
                        )?.getTime() ?? 0;

                    return (
                        dateB - dateA
                    );
                }
            );

        }, [
            payments,
            expenses,
        ]);


    // =====================================================
    // PERIOD FILTER
    // =====================================================

    const matchesSelectedPeriod = (
    value: any
) => {
    const date = parseDate(value);

    if (!date || !periodFilter) {
        return false;
    }

    const selectedYear =
        Number(
            periodFilter.split("-")[0]
        );

    const selectedMonth =
        Number(
            periodFilter.split("-")[1]
        );

    return (
        date.getFullYear() ===
            selectedYear &&
        date.getMonth() + 1 ===
            selectedMonth
    );
};


    // =====================================================
    // FILTERED PAYMENTS
    // =====================================================

    const filteredPayments =
        useMemo(() => {

            return payments.filter(
                (payment) =>
                    matchesSelectedPeriod(
                        payment.fecha
                    )
            );

        }, [
            payments,
            periodFilter,
        ]);


    // =====================================================
    // FILTERED EXPENSES
    // =====================================================

    const filteredExpenses =
        useMemo(() => {

            return expenses.filter(
                (expense) =>
                    matchesSelectedPeriod(
                        expense.fecha
                    )
            );

        }, [
            expenses,
            periodFilter,
        ]);


    // =====================================================
    // FILTERED MOVEMENTS
    // =====================================================

    const filteredMovements =
        useMemo(() => {

            const normalizedSearch =
                search
                    .toLowerCase()
                    .trim();


            return movements.filter(
                (movement) => {

                    const matchesPeriod =
                        matchesSelectedPeriod(
                            movement.fecha
                        );


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
                        matchesPeriod &&
                        matchesSearch &&
                        matchesType
                    );
                }
            );

        }, [
            movements,
            search,
            movementFilter,
            periodFilter,
        ]);


    // =====================================================
    // TOTALS
    // =====================================================

    const totalIncome =
        filteredPayments.reduce(
            (sum, payment) =>
                sum + payment.monto,
            0
        );


    const totalExpenses =
        filteredExpenses.reduce(
            (sum, expense) =>
                sum + expense.monto,
            0
        );


    const balance =
        totalIncome -
        totalExpenses;


    // =====================================================
    // STATISTICS
    // =====================================================

    const incomeCount =
        filteredPayments.length;

    const expenseCount =
        filteredExpenses.length;


    const profitMargin =
        totalIncome > 0
            ? (balance /
                totalIncome) *
            100
            : 0;


    // =====================================================
    // PAYMENT METHOD TOTALS
    // =====================================================

    const paymentMethodTotals =
        filteredPayments.reduce<
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
                    (
                        accumulator[
                            payment.medioPago
                        ] ?? 0
                    ) +
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


    // =====================================================
    // EXPENSE CATEGORY TOTALS
    // =====================================================

    const expenseCategoryTotals =
        filteredExpenses.reduce<
            Record<string, number>
        >(
            (
                accumulator,
                expense
            ) => {

                accumulator[
                    expense.categoria
                ] =
                    (
                        accumulator[
                            expense.categoria
                        ] ?? 0
                    ) +
                    expense.monto;

                return accumulator;
            },
            {}
        );


    // =====================================================
    // CHART DATA
    // =====================================================

    const paymentMethodChart =
        (
            [
                "Efectivo",
                "Transferencia",
                "Tarjeta",
                "Mercado Pago",
            ] as PaymentMethod[]
        ).map(
            (method) => ({
                name: method,
                value:
                    paymentMethodTotals[
                        method
                    ] ?? 0,
            })
        );


    const expenseCategoryChart =
        Object.entries(
            expenseCategoryTotals
        )
            .map(
                ([name, value]) => ({
                    name,
                    value,
                })
            )
            .sort(
                (a, b) =>
                    b.value -
                    a.value
            );







    const maxIncomeExpense =
        Math.max(
            totalIncome,
            totalExpenses,
            1
        );


    // =====================================================
    // ADD EXPENSE
    // =====================================================

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
                !amount ||
                amount <= 0
            ) {
                alert(
                    "Ingresá un importe válido."
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

            } catch (error) {

                console.error(
                    "Error registrando gasto:",
                    error
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


    // =====================================================
    // DELETE MOVEMENT
    // =====================================================

    const handleDeleteMovement =
        async () => {

            if (
                !movementToDelete
            ) {
                return;
            }


            try {

                setDeletingMovement(
                    true
                );


                const collectionName =
                    movementToDelete.tipo ===
                        "Ingreso"
                        ? "pagos"
                        : "gastos";


                await deleteDoc(
                    doc(
                        db,
                        collectionName,
                        movementToDelete.firestoreId
                    )
                );


                if (
                    movementToDelete.tipo ===
                    "Ingreso"
                ) {

                    setPayments(
                        (current) =>
                            current.filter(
                                (payment) =>
                                    payment.id !==
                                    movementToDelete.firestoreId
                            )
                    );

                } else {

                    setExpenses(
                        (current) =>
                            current.filter(
                                (expense) =>
                                    expense.id !==
                                    movementToDelete.firestoreId
                            )
                    );
                }


                setMovementToDelete(
                    null
                );

            } catch (error) {

                console.error(
                    "Error eliminando movimiento:",
                    error
                );

                alert(
                    "No se pudo eliminar el movimiento."
                );

            } finally {

                setDeletingMovement(
                    false
                );
            }
        };


    // =====================================================
    // PERIOD LABEL
    // =====================================================
const periodDescription = (() => {
    if (!periodFilter) {
        return "Seleccioná un mes para ver los movimientos";
    }

    const [year, month] =
        periodFilter.split("-");

    const date = new Date(
        Number(year),
        Number(month) - 1,
        1
    );

    const monthName =
        new Intl.DateTimeFormat(
            "es-AR",
            {
                month: "long",
                year: "numeric",
            }
        ).format(date);

    return `Mostrando los movimientos de ${monthName}`;
})();


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <AdminLayout>

            <div className="min-h-screen bg-slate-50">

                <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

                    {/* ================================================= */}
                    {/* HEADER */}
                    {/* ================================================= */}

                    <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                                <CircleDollarSign
                                    size={17}
                                />

                                Administración
                                financiera
                            </div>

                            <h1 className="text-3xl font-black tracking-tight text-slate-900">
                                Balance
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Caja y movimientos
                                financieros
                            </p>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CalendarDays size={19} />
                            </div>

                            <div className="pr-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Período
                                </p>

                                <input
                                    type="month"
                                    value={periodFilter}
                                    onChange={(e) =>
                                        setPeriodFilter(
                                            e.target.value
                                        )
                                    }
                                    className="mt-0.5 border-0 bg-transparent p-0 text-sm font-bold text-slate-800 outline-none focus:ring-0"
                                />
                            </div>

                        </div>

                    </div>


                    {/* ================================================= */}
                    {/* ERROR */}
                    {/* ================================================= */}

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}


                    {/* ================================================= */}
                    {/* SUMMARY */}
                    {/* ================================================= */}

                    <section className="grid gap-4 md:grid-cols-3">

                        {/* INGRESOS */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            <div className="flex items-start justify-between">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Ingresos
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {formatCurrency(
                                            totalIncome
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {incomeCount}{" "}
                                        movimientos
                                    </p>

                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <ArrowUpRight
                                        size={21}
                                    />
                                </div>

                            </div>

                        </div>


                        {/* EGRESOS */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            <div className="flex items-start justify-between">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Egresos
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {formatCurrency(
                                            totalExpenses
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {expenseCount}{" "}
                                        movimientos
                                    </p>

                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                    <ArrowDownLeft
                                        size={21}
                                    />
                                </div>

                            </div>

                        </div>


                        {/* BALANCE */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            <div className="flex items-start justify-between">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Balance neto
                                    </p>

                                    <p
                                        className={`mt-2 text-2xl font-black ${balance >= 0
                                                ? "text-emerald-600"
                                                : "text-red-600"
                                            }`}
                                    >
                                        {formatCurrency(
                                            balance
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {profitMargin.toFixed(
                                            1
                                        )}
                                        % sobre ingresos
                                    </p>

                                </div>

                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${balance >= 0
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-600"
                                        }`}
                                >
                                    <CircleDollarSign
                                        size={21}
                                    />
                                </div>

                            </div>

                        </div>

                    </section>


                    {/* ================================================= */}
                    {/* ACTION BUTTON */}
                    {/* ================================================= */}

                    <div className="my-6 flex justify-between gap-4">
                        <button
                            type="button"
                            onClick={() =>
                                setShowExpenseModal(
                                    true
                                )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                        >
                            <Plus
                                size={18}
                            />

                            Registrar gasto
                        </button>
                    </div>


                    {/* ================================================= */}
                    {/* DISTRIBUTION */}
                    {/* ================================================= */}

                    <section className="mt-6 grid gap-6 lg:grid-cols-2">

                        {/* PAYMENT METHODS */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="mb-5 flex items-center justify-between">

                                <div>

                                    <h2 className="text-lg font-bold text-slate-900">
                                        Ingresos por medio
                                        de pago
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Distribución de
                                        cobros
                                    </p>

                                </div>

                                <CreditCard
                                    size={20}
                                    className="text-slate-400"
                                />

                            </div>


                            <div className="space-y-4">

                                {paymentMethodChart.map(
                                    (item) => {

                                        const percentage =
                                            totalIncome >
                                                0
                                                ? (
                                                    item.value /
                                                    totalIncome
                                                ) *
                                                100
                                                : 0;

                                        return (
                                            <div
                                                key={
                                                    item.name
                                                }
                                            >

                                                <div className="mb-2 flex items-center justify-between gap-4">

                                                    <span className="text-sm font-medium text-slate-700">
                                                        {
                                                            item.name
                                                        }
                                                    </span>

                                                    <span className="text-sm font-bold text-slate-900">
                                                        {formatCurrency(
                                                            item.value
                                                        )}
                                                    </span>

                                                </div>

                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                                                    <div
                                                        className="h-full rounded-full bg-blue-600 transition-all"
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </div>


                        {/* EXPENSE CATEGORIES */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="mb-5 flex items-center justify-between">

                                <div>

                                    <h2 className="text-lg font-bold text-slate-900">
                                        Gastos por
                                        categoría
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Distribución de
                                        egresos
                                    </p>

                                </div>

                                <Receipt
                                    size={20}
                                    className="text-slate-400"
                                />

                            </div>


                            <div className="space-y-4">

                                {expenseCategoryChart.length ===
                                0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                                        No hay gastos
                                        registrados en
                                        este período.
                                    </div>
                                ) : (
                                    expenseCategoryChart.map(
                                        (
                                            item
                                        ) => {

                                            const percentage =
                                                totalExpenses >
                                                    0
                                                    ? (
                                                        item.value /
                                                        totalExpenses
                                                    ) *
                                                    100
                                                    : 0;

                                            return (
                                                <div
                                                    key={
                                                        item.name
                                                    }
                                                >

                                                    <div className="mb-2 flex items-center justify-between gap-4">

                                                        <span className="text-sm font-medium text-slate-700">
                                                            {
                                                                item.name
                                                            }
                                                        </span>

                                                        <span className="text-sm font-bold text-slate-900">
                                                            {formatCurrency(
                                                                item.value
                                                            )}
                                                        </span>

                                                    </div>

                                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                                                        <div
                                                            className="h-full rounded-full bg-red-500 transition-all"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />

                                                    </div>

                                                </div>
                                            );
                                        }
                                    )
                                )}

                            </div>

                        </div>

                    </section>


                    {/* ================================================= */}
                    {/* MOVEMENTS */}
                    {/* ================================================= */}

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="border-b border-slate-100 p-6">

                            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                                <div>

                                    <h2 className="text-lg font-bold text-slate-900">
                                        Movimientos
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {periodDescription}
                                    </p>

                                </div>


                                <div className="flex flex-col gap-3 sm:flex-row">

                                    {/* SEARCH */}

                                    <div className="relative">

                                        <Search
                                            size={17}
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
                                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-64"
                                        />

                                    </div>


                                    {/* TYPE */}

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
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

                                </div>

                            </div>

                        </div>


                        {/* TABLE */}

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[850px]">

                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70">

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Movimiento
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Detalle
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Fecha
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Medio
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Importe
                                        </th>

                                        <th className="w-20 px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Acción
                                        </th>

                                    </tr>
                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {loading ? (

                                        <tr>
                                            <td
                                                colSpan={
                                                    6
                                                }
                                                className="px-6 py-14 text-center"
                                            >
                                                <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">

                                                    <Loader2
                                                        size={18}
                                                        className="animate-spin"
                                                    />

                                                    Cargando
                                                    movimientos...
                                                </div>
                                            </td>
                                        </tr>

                                    ) : filteredMovements.length ===
                                      0 ? (

                                        <tr>
                                            <td
                                                colSpan={
                                                    6
                                                }
                                                className="px-6 py-14 text-center"
                                            >
                                                <div className="mx-auto flex max-w-sm flex-col items-center">

                                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                                        <Receipt
                                                            size={
                                                                21
                                                            }
                                                        />
                                                    </div>

                                                    <p className="font-semibold text-slate-700">
                                                        No hay
                                                        movimientos
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-400">
                                                        No se
                                                        encontraron
                                                        registros
                                                        con los
                                                        filtros
                                                        seleccionados.
                                                    </p>

                                                </div>
                                            </td>
                                        </tr>

                                    ) : (

                                        filteredMovements.map(
                                            (
                                                movement
                                            ) => (

                                                <tr
                                                    key={
                                                        movement.id
                                                    }
                                                    className="transition hover:bg-slate-50/70"
                                                >

                                                    {/* MOVEMENT */}

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${movement.tipo ===
                                                                        "Ingreso"
                                                                        ? "bg-emerald-50 text-emerald-600"
                                                                        : "bg-red-50 text-red-600"
                                                                    }`}
                                                            >
                                                                {movement.tipo ===
                                                                "Ingreso" ? (
                                                                    <ArrowUpRight
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <ArrowDownLeft
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                )}
                                                            </div>


                                                            <div>

                                                                <p className="font-semibold text-slate-800">
                                                                    {
                                                                        movement.concepto
                                                                    }
                                                                </p>

                                                                <p
                                                                    className={`mt-0.5 text-xs font-medium ${movement.tipo ===
                                                                            "Ingreso"
                                                                            ? "text-emerald-600"
                                                                            : "text-red-600"
                                                                        }`}
                                                                >
                                                                    {
                                                                        movement.tipo
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* DETAIL */}

                                                    <td className="px-6 py-4">

                                                        <span className="text-sm text-slate-600">
                                                            {
                                                                movement.detalle
                                                            }
                                                        </span>

                                                    </td>


                                                    {/* DATE */}

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-2 text-sm text-slate-500">

                                                            <CalendarDays
                                                                size={
                                                                    15
                                                                }
                                                                className="text-slate-400"
                                                            />

                                                            {formatDate(
                                                                movement.fecha
                                                            )}

                                                        </div>

                                                    </td>


                                                    {/* METHOD */}

                                                    <td className="px-6 py-4">

                                                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                                            {
                                                                movement.medioPago
                                                            }
                                                        </span>

                                                    </td>


                                                    {/* AMOUNT */}

                                                    <td className="px-6 py-4 text-right">

                                                        <span
                                                            className={`text-sm font-bold ${movement.tipo ===
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


                                                    {/* DELETE */}

                                                    <td className="px-6 py-4 text-right">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setMovementToDelete(
                                                                    {
                                                                        tipo:
                                                                            movement.tipo,

                                                                        firestoreId:
                                                                            movement.firestoreId,

                                                                        concepto:
                                                                            movement.concepto,

                                                                        monto:
                                                                            movement.monto,
                                                                    }
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                            title={
                                                                movement.tipo ===
                                                                "Ingreso"
                                                                    ? "Eliminar pago"
                                                                    : "Eliminar gasto"
                                                            }
                                                        >
                                                            <Trash2
                                                                size={
                                                                    17
                                                                }
                                                            />
                                                        </button>

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
{/* FINANCIAL CHARTS */}
{/* ================================================= */}

<section className="mt-8">

    <div className="mb-6 flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BarChart3 size={21} />
        </div>

        <div>
            <h2 className="text-xl font-black text-slate-900">
                Gráficos financieros
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                Visualización del comportamiento financiero del período seleccionado
            </p>
        </div>

    </div>


    {/* ================================================= */}
    {/* PREPARACIÓN DE DATOS */}
    {/* ================================================= */}

    {(() => {

        const daysInMonth = periodFilter
            ? new Date(
                Number(periodFilter.split("-")[0]),
                Number(periodFilter.split("-")[1]),
                0
            ).getDate()
            : 31;

        const dailyData = Array.from(
            { length: daysInMonth },
            (_, index) => {

                const day = index + 1;

                const income = filteredPayments.reduce(
                    (total, payment) => {

                        const date = parseDate(
                            payment.fecha
                        );

                        if (
                            date &&
                            date.getDate() === day
                        ) {
                            return total + payment.monto;
                        }

                        return total;
                    },
                    0
                );

                const expense = filteredExpenses.reduce(
                    (total, expense) => {

                        const date = parseDate(
                            expense.fecha
                        );

                        if (
                            date &&
                            date.getDate() === day
                        ) {
                            return total + expense.monto;
                        }

                        return total;
                    },
                    0
                );

                return {
                    day,
                    income,
                    expense,
                    balance:
                        income - expense,
                };
            }
        );


        const maxDailyValue = Math.max(
            ...dailyData.flatMap(
                (item) => [
                    item.income,
                    item.expense,
                ]
            ),
            1
        );


        const maxDailyBalance = Math.max(
            ...dailyData.map(
                (item) =>
                    Math.abs(item.balance)
            ),
            1
        );


        const chartWidth = 900;
        const chartHeight = 320;

        const chartPaddingLeft = 70;
        const chartPaddingRight = 25;
        const chartPaddingTop = 25;
        const chartPaddingBottom = 45;

        const graphWidth =
            chartWidth -
            chartPaddingLeft -
            chartPaddingRight;

        const graphHeight =
            chartHeight -
            chartPaddingTop -
            chartPaddingBottom;


        const getX = (index: number) => {

            if (dailyData.length <= 1) {
                return chartPaddingLeft;
            }

            return (
                chartPaddingLeft +
                (index /
                    (dailyData.length - 1)) *
                graphWidth
            );
        };


        const getY = (value: number) => {

            return (
                chartPaddingTop +
                graphHeight -
                (value /
                    maxDailyValue) *
                    graphHeight
            );
        };


        const getBalanceY = (
            value: number
        ) => {

            const normalized =
                (value +
                    maxDailyBalance) /
                (maxDailyBalance * 2);

            return (
                chartPaddingTop +
                graphHeight -
                normalized * graphHeight
            );
        };


        const incomePoints =
            dailyData
                .map(
                    (item, index) =>
                        `${getX(index)},${getY(
                            item.income
                        )}`
                )
                .join(" ");


        const expensePoints =
            dailyData
                .map(
                    (item, index) =>
                        `${getX(index)},${getY(
                            item.expense
                        )}`
                )
                .join(" ");


        const balancePoints =
            dailyData
                .map(
                    (item, index) =>
                        `${getX(index)},${getBalanceY(
                            item.balance
                        )}`
                )
                .join(" ");


        const pieTotal =
            paymentMethodChart.reduce(
                (total, item) =>
                    total + item.value,
                0
            );


        const pieColors = [
            "#2563eb",
            "#10b981",
            "#f59e0b",
            "#ef4444",
        ];


        let currentPercentage = 0;

        const pieSegments =
            paymentMethodChart.map(
                (item, index) => {

                    const percentage =
                        pieTotal > 0
                            ? (item.value /
                                pieTotal) *
                            100
                            : 0;

                    const start =
                        currentPercentage;

                    currentPercentage +=
                        percentage;

                    return {
                        ...item,
                        percentage,
                        start,
                        end:
                            currentPercentage,
                        color:
                            pieColors[
                                index %
                                pieColors.length
                            ],
                    };
                }
            );


        const pieGradient =
            pieSegments.length > 0 &&
            pieTotal > 0
                ? `conic-gradient(${pieSegments
                    .map(
                        (segment) =>
                            `${segment.color} ${segment.start}% ${segment.end}%`
                    )
                    .join(", ")})`
                : "conic-gradient(#e2e8f0 0% 100%)";


        const categoryMax =
            Math.max(
                ...expenseCategoryChart.map(
                    (item) => item.value
                ),
                1
            );


        return (
            <div className="space-y-6">


                {/* ================================================= */}
                {/* ROW 1 */}
                {/* ================================================= */}

                <div className="grid gap-6 xl:grid-cols-2">


                    {/* ================================================= */}
                    {/* INGRESOS VS EGRESOS - BAR CHART */}
                    {/* ================================================= */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mb-6">

                            <div className="flex items-center justify-between">

                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Ingresos vs egresos
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Comparación del período
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-semibold">

                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                        Ingresos
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                        Egresos
                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="relative h-[300px]">

                            {/* EJE Y */}

                            <div className="absolute bottom-10 left-0 top-0 flex w-14 flex-col justify-between text-right text-[10px] font-medium text-slate-400">

                                <span>
                                    {formatCurrency(
                                        maxIncomeExpense
                                    )}
                                </span>

                                <span>
                                    {formatCurrency(
                                        maxIncomeExpense *
                                        0.75
                                    )}
                                </span>

                                <span>
                                    {formatCurrency(
                                        maxIncomeExpense *
                                        0.5
                                    )}
                                </span>

                                <span>
                                    {formatCurrency(
                                        maxIncomeExpense *
                                        0.25
                                    )}
                                </span>

                                <span>$0</span>

                            </div>


                            {/* GRÁFICO */}

                            <div className="absolute bottom-10 left-16 right-0 top-0">

                                {/* GRID */}

                                <div className="absolute inset-0 flex flex-col justify-between">

                                    {[0, 1, 2, 3, 4].map(
                                        (line) => (
                                            <div
                                                key={line}
                                                className="border-t border-dashed border-slate-100"
                                            />
                                        )
                                    )}

                                </div>


                                {/* BARRAS */}

                                <div className="absolute inset-0 flex items-end justify-around gap-3 px-3">

                                    <div className="flex h-full flex-1 items-end justify-center">

                                        <div
                                            className="w-full max-w-24 rounded-t-xl bg-emerald-500 transition-all duration-500"
                                            style={{
                                                height:
                                                    `${Math.max(
                                                        totalIncome /
                                                        maxIncomeExpense *
                                                        100,
                                                        totalIncome >
                                                            0
                                                            ? 2
                                                            : 0
                                                    )}%`,
                                            }}
                                            title={`Ingresos: ${formatCurrency(
                                                totalIncome
                                            )}`}
                                        />

                                    </div>


                                    <div className="flex h-full flex-1 items-end justify-center">

                                        <div
                                            className="w-full max-w-24 rounded-t-xl bg-red-500 transition-all duration-500"
                                            style={{
                                                height:
                                                    `${Math.max(
                                                        totalExpenses /
                                                        maxIncomeExpense *
                                                        100,
                                                        totalExpenses >
                                                            0
                                                            ? 2
                                                            : 0
                                                    )}%`,
                                            }}
                                            title={`Egresos: ${formatCurrency(
                                                totalExpenses
                                            )}`}
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* EJE X */}

                            <div className="absolute bottom-0 left-16 right-0 flex justify-around text-xs font-semibold text-slate-400">

                                <span>Ingresos</span>
                                <span>Egresos</span>

                            </div>

                        </div>


                        <div className="mt-5 grid grid-cols-2 gap-3">

                            <div className="rounded-xl bg-emerald-50 p-4">

                                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                                    Total ingresos
                                </p>

                                <p className="mt-1 text-lg font-black text-emerald-700">
                                    {formatCurrency(
                                        totalIncome
                                    )}
                                </p>

                            </div>


                            <div className="rounded-xl bg-red-50 p-4">

                                <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                                    Total egresos
                                </p>

                                <p className="mt-1 text-lg font-black text-red-700">
                                    {formatCurrency(
                                        totalExpenses
                                    )}
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* ================================================= */}
                    {/* PIE CHART */}
                    {/* ================================================= */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mb-6">

                            <h3 className="text-lg font-bold text-slate-900">
                                Distribución de cobros
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Ingresos según medio de pago
                            </p>

                        </div>


                        <div className="flex min-h-[300px] flex-col items-center justify-center gap-8 sm:flex-row">

                            {/* TORTA */}

                            <div className="relative flex h-56 w-56 shrink-0 items-center justify-center">

                                <div
                                    className="h-full w-full rounded-full shadow-inner"
                                    style={{
                                        background:
                                            pieGradient,
                                    }}
                                />

                                <div className="absolute flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-sm">

                                    <span className="text-xs font-semibold text-slate-400">
                                        Total
                                    </span>

                                    <span className="mt-1 text-base font-black text-slate-900">
                                        {formatCurrency(
                                            pieTotal
                                        )}
                                    </span>

                                </div>

                            </div>


                            {/* LEYENDA */}

                            <div className="w-full max-w-xs space-y-4">

                                {pieSegments.map(
                                    (item) => (
                                        <div
                                            key={
                                                item.name
                                            }
                                            className="flex items-center justify-between gap-4"
                                        >

                                            <div className="flex min-w-0 items-center gap-3">

                                                <span
                                                    className="h-3 w-3 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            item.color,
                                                    }}
                                                />

                                                <span className="truncate text-sm font-semibold text-slate-700">
                                                    {
                                                        item.name
                                                    }
                                                </span>

                                            </div>

                                            <div className="shrink-0 text-right">

                                                <p className="text-sm font-black text-slate-900">
                                                    {formatCurrency(
                                                        item.value
                                                    )}
                                                </p>

                                                <p className="text-xs font-semibold text-slate-400">
                                                    {item.percentage.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </p>

                                            </div>

                                        </div>
                                    )
                                )}

                                {pieSegments.length ===
                                    0 && (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                                        No hay cobros
                                        registrados
                                        para este
                                        período.
                                    </div>
                                )}

                            </div>

                        </div>

                    </div>

                </div>


                {/* ================================================= */}
                {/* EVOLUCIÓN DIARIA - LINE CHART */}
                {/* ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h3 className="text-lg font-bold text-slate-900">
                                Evolución diaria
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Movimiento de ingresos, egresos y resultado durante el mes
                            </p>

                        </div>


                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">

                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                Ingresos
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                Egresos
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                Resultado
                            </div>

                        </div>

                    </div>


                    <div className="overflow-x-auto">

                        <div className="min-w-[850px]">

                            <svg
                                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                className="h-auto w-full"
                                preserveAspectRatio="none"
                            >

                                {/* GRID HORIZONTAL */}

                                {[0, 1, 2, 3, 4].map(
                                    (line) => {

                                        const y =
                                            chartPaddingTop +
                                            (graphHeight /
                                                4) *
                                            line;

                                        return (
                                            <line
                                                key={
                                                    line
                                                }
                                                x1={
                                                    chartPaddingLeft
                                                }
                                                x2={
                                                    chartWidth -
                                                    chartPaddingRight
                                                }
                                                y1={y}
                                                y2={y}
                                                stroke="#e2e8f0"
                                                strokeDasharray="5 5"
                                            />
                                        );
                                    }
                                )}


                                {/* EJE Y */}

                                {[0, 1, 2, 3, 4].map(
                                    (line) => {

                                        const value =
                                            maxDailyValue -
                                            (maxDailyValue /
                                                4) *
                                            line;

                                        const y =
                                            chartPaddingTop +
                                            (graphHeight /
                                                4) *
                                            line;

                                        return (
                                            <text
                                                key={
                                                    line
                                                }
                                                x="8"
                                                y={
                                                    y +
                                                    4
                                                }
                                                fontSize="11"
                                                fill="#94a3b8"
                                            >
                                                {formatCurrency(
                                                    value
                                                )}
                                            </text>
                                        );
                                    }
                                )}


                                {/* EJE Y LABEL */}

                                <text
                                    x="12"
                                    y="16"
                                    fontSize="10"
                                    fontWeight="600"
                                    fill="#94a3b8"
                                >
                                    ARS
                                </text>


                                {/* EJE X */}

                                <line
                                    x1={
                                        chartPaddingLeft
                                    }
                                    x2={
                                        chartWidth -
                                        chartPaddingRight
                                    }
                                    y1={
                                        chartHeight -
                                        chartPaddingBottom
                                    }
                                    y2={
                                        chartHeight -
                                        chartPaddingBottom
                                    }
                                    stroke="#cbd5e1"
                                />


                                {/* LÍNEA INGRESOS */}

                                <polyline
                                    points={
                                        incomePoints
                                    }
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />


                                {/* LÍNEA EGRESOS */}

                                <polyline
                                    points={
                                        expensePoints
                                    }
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />


                                {/* LÍNEA RESULTADO */}

                                <polyline
                                    points={
                                        balancePoints
                                    }
                                    fill="none"
                                    stroke="#2563eb"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />


                                {/* PUNTOS */}

                                {dailyData.map(
                                    (
                                        item,
                                        index
                                    ) => {

                                        const hasIncome =
                                            item.income >
                                            0;

                                        const hasExpense =
                                            item.expense >
                                            0;

                                        return (
                                            <g
                                                key={
                                                    item.day
                                                }
                                            >

                                                {hasIncome && (
                                                    <circle
                                                        cx={getX(
                                                            index
                                                        )}
                                                        cy={getY(
                                                            item.income
                                                        )}
                                                        r="3.5"
                                                        fill="#10b981"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                    />
                                                )}

                                                {hasExpense && (
                                                    <circle
                                                        cx={getX(
                                                            index
                                                        )}
                                                        cy={getY(
                                                            item.expense
                                                        )}
                                                        r="3.5"
                                                        fill="#ef4444"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                    />
                                                )}

                                                <circle
                                                    cx={getX(
                                                        index
                                                    )}
                                                    cy={getBalanceY(
                                                        item.balance
                                                    )}
                                                    r="3.5"
                                                    fill="#2563eb"
                                                    stroke="white"
                                                    strokeWidth="2"
                                                />

                                            </g>
                                        );
                                    }
                                )}


                                {/* ETIQUETAS EJE X */}

                                {dailyData.map(
                                    (
                                        item,
                                        index
                                    ) => {

                                        const showLabel =
                                            item.day ===
                                                1 ||
                                            item.day %
                                                5 ===
                                                0 ||
                                            item.day ===
                                                daysInMonth;

                                        if (
                                            !showLabel
                                        ) {
                                            return null;
                                        }

                                        return (
                                            <text
                                                key={
                                                    `label-${item.day}`
                                                }
                                                x={getX(
                                                    index
                                                )}
                                                y={
                                                    chartHeight -
                                                    18
                                                }
                                                textAnchor="middle"
                                                fontSize="11"
                                                fontWeight="600"
                                                fill="#94a3b8"
                                            >
                                                {item.day}
                                            </text>
                                        );
                                    }
                                )}

                            </svg>

                        </div>

                    </div>

                    <div className="mt-3 flex justify-end pr-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Día del mes →
                    </div>

                </div>


                {/* ================================================= */}
                {/* GASTOS POR CATEGORÍA */}
                {/* ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-6">

                        <h3 className="text-lg font-bold text-slate-900">
                            Gastos por categoría
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Distribución de los egresos del período
                        </p>

                    </div>


                    {expenseCategoryChart.length ===
                        0 ? (

                        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                            No hay gastos registrados para este período.
                        </div>

                    ) : (

                        <div className="space-y-5">

                            {expenseCategoryChart.map(
                                (item) => {

                                    const percentage =
                                        totalExpenses >
                                            0
                                            ? (
                                                item.value /
                                                totalExpenses
                                            ) *
                                            100
                                            : 0;

                                    const width =
                                        (
                                            item.value /
                                            categoryMax
                                        ) *
                                        100;

                                    return (
                                        <div
                                            key={
                                                item.name
                                            }
                                        >

                                            <div className="mb-2 flex items-center justify-between gap-4">

                                                <span className="truncate text-sm font-semibold text-slate-700">
                                                    {
                                                        item.name
                                                    }
                                                </span>

                                                <div className="flex shrink-0 items-center gap-3">

                                                    <span className="text-xs font-bold text-slate-400">
                                                        {percentage.toFixed(
                                                            1
                                                        )}
                                                        %
                                                    </span>

                                                    <span className="text-sm font-black text-slate-900">
                                                        {formatCurrency(
                                                            item.value
                                                        )}
                                                    </span>

                                                </div>

                                            </div>


                                            <div className="h-4 overflow-hidden rounded-full bg-slate-100">

                                                <div
                                                    className="h-full rounded-full bg-red-500 transition-all duration-700"
                                                    style={{
                                                        width: `${Math.max(
                                                            width,
                                                            item.value >
                                                                0
                                                                ? 2
                                                                : 0
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    )}

                </div>


                {/* ================================================= */}
                {/* RESULTADO FINAL */}
                {/* ================================================= */}

                <div
                    className={`rounded-2xl border p-6 shadow-sm ${balance >=
                        0
                        ? "border-emerald-100 bg-emerald-50"
                        : "border-red-100 bg-red-50"
                        }`}
                >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Resultado del período
                            </p>

                            <p
                                className={`mt-1 text-3xl font-black ${balance >=
                                    0
                                    ? "text-emerald-700"
                                    : "text-red-700"
                                    }`}
                            >
                                {formatCurrency(
                                    balance
                                )}
                            </p>

                        </div>


                        <div className="grid grid-cols-2 gap-3 sm:w-auto">

                            <div className="rounded-xl bg-white/80 px-5 py-3">

                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Ingresos
                                </p>

                                <p className="mt-1 text-sm font-black text-emerald-600">
                                    {formatCurrency(
                                        totalIncome
                                    )}
                                </p>

                            </div>


                            <div className="rounded-xl bg-white/80 px-5 py-3">

                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Egresos
                                </p>

                                <p className="mt-1 text-sm font-black text-red-600">
                                    {formatCurrency(
                                        totalExpenses
                                    )}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        );

    })()}

</section>


                    {/* ================================================= */}
                    {/* EXPENSE MODAL */}
                    {/* ================================================= */}

                    {showExpenseModal && (

                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">

                            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                                {/* HEADER */}

                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                                    <div>

                                        <h3 className="text-lg font-bold text-slate-900">
                                            Registrar gasto
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Agregá un nuevo
                                            egreso al
                                            balance.
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowExpenseModal(
                                                false
                                            )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        <X
                                            size={
                                                18
                                            }
                                        />
                                    </button>

                                </div>


                                {/* BODY */}

                                <div className="space-y-5 p-6">

                                    {/* CONCEPT */}

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
                                            placeholder="Ej. Compra de aceite"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>


                                    {/* CATEGORY + AMOUNT */}

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
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                            >
                                                <option value="Repuestos">
                                                    Repuestos
                                                </option>

                                                <option value="Insumos">
                                                    Insumos
                                                </option>

                                                <option value="Herramientas">
                                                    Herramientas
                                                </option>

                                                <option value="Mantenimiento">
                                                    Mantenimiento
                                                </option>

                                                <option value="Servicios">
                                                    Servicios
                                                </option>

                                                <option value="Alquiler">
                                                    Alquiler
                                                </option>

                                                <option value="Combustible">
                                                    Combustible
                                                </option>

                                                <option value="Sueldos">
                                                    Sueldos
                                                </option>

                                                <option value="Impuestos">
                                                    Impuestos
                                                </option>

                                                <option value="Otros">
                                                    Otros
                                                </option>

                                            </select>

                                        </div>


                                        <div>

                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Importe
                                            </label>

<input
    type="text"
    inputMode="numeric"
    value={
        expenseAmount
            ? Number(
                  expenseAmount
              ).toLocaleString("es-AR")
            : ""
    }
    onChange={(e) => {
        const value = e.target.value
            .replace(/\./g, "")
            .replace(/\D/g, "");

        setExpenseAmount(value);
    }}
    placeholder="0"
    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
/>

                                        </div>

                                    </div>


                                    {/* METHOD + DATE */}

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
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                            >
                                                <option value="Efectivo">
                                                    Efectivo
                                                </option>

                                                <option value="Transferencia">
                                                    Transferencia
                                                </option>

                                                <option value="Tarjeta">
                                                    Tarjeta
                                                </option>

                                                <option value="Mercado Pago">
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
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                            />

                                        </div>

                                    </div>


                                    {/* NOTES */}

                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Observaciones
                                            <span className="ml-1 font-normal text-slate-400">
                                                (opcional)
                                            </span>
                                        </label>

                                        <textarea
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
                                            rows={
                                                3
                                            }
                                            placeholder="Agregá información adicional..."
                                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>

                                </div>


                                {/* FOOTER */}

                                <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">

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
                                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >

                                        {savingExpense ? (
                                            <>
                                                <Loader2
                                                    size={
                                                        17
                                                    }
                                                    className="animate-spin"
                                                />

                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Plus
                                                    size={
                                                        17
                                                    }
                                                />

                                                Registrar
                                                gasto
                                            </>
                                        )}

                                    </button>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* ================================================= */}
                    {/* DELETE MODAL */}
                    {/* ================================================= */}

                    {movementToDelete && (

                        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">

                            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                                <div className="p-6">

                                    <div className="flex items-start gap-4">

                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${movementToDelete.tipo ===
                                                    "Ingreso"
                                                    ? "bg-red-50 text-red-600"
                                                    : "bg-red-50 text-red-600"
                                                }`}
                                        >
                                            <Trash2
                                                size={
                                                    22
                                                }
                                            />
                                        </div>


                                        <div>

                                            <h3 className="text-lg font-bold text-slate-900">
                                                {movementToDelete.tipo ===
                                                "Ingreso"
                                                    ? "Eliminar pago"
                                                    : "Eliminar gasto"}
                                            </h3>


                                            <p className="mt-1 text-sm leading-6 text-slate-500">

                                                ¿Estás
                                                seguro de
                                                que querés
                                                eliminar
                                                este{" "}

                                                {movementToDelete.tipo ===
                                                "Ingreso"
                                                    ? "pago"
                                                    : "gasto"}{" "}
                                                por{" "}

                                                <span className="font-bold text-slate-700">
                                                    {formatCurrency(
                                                        movementToDelete.monto
                                                    )}
                                                </span>
                                                ?

                                            </p>


                                            <p className="mt-2 text-sm text-slate-400">
                                                {
                                                    movementToDelete.concepto
                                                }
                                            </p>


                                            <p className="mt-3 text-xs text-slate-400">
                                                Esta acción
                                                no se puede
                                                deshacer.
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMovementToDelete(
                                                null
                                            )
                                        }
                                        disabled={
                                            deletingMovement
                                        }
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>


                                    <button
                                        type="button"
                                        onClick={
                                            handleDeleteMovement
                                        }
                                        disabled={
                                            deletingMovement
                                        }
                                        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >

                                        {deletingMovement ? (
                                            <>
                                                <Loader2
                                                    size={
                                                        16
                                                    }
                                                    className="animate-spin"
                                                />

                                                Eliminando...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2
                                                    size={
                                                        16
                                                    }
                                                />

                                                Eliminar
                                            </>
                                        )}

                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                </div>

            </div>

        </AdminLayout>
    );
};


export default Balance;