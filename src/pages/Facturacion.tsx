import {
    CalendarDays,
    Car,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    CreditCard,
    FileText,
    MoreHorizontal,
    Receipt,
    Search,
    WalletCards,
    X,
} from "lucide-react";

import {
    addDoc,
    collection,
    doc,
    getDocs,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import AdminLayout from "../components/AdminLayout";
import ReciboServicio from "../components/ReciboServicio";
import { db } from "../config/firebase";
import { generarYDescargarPDF } from "../utils/pdfHelper";

type ServiceStatus =
    | "Pendiente"
    | "En proceso"
    | "Completado"
    | "Cancelado";

type PaymentMethod =
    | "Efectivo"
    | "Transferencia"
    | "Tarjeta"
    | "Mercado Pago";

type PaymentStatus =
    | "Sin cobrar"
    | "Parcial"
    | "Pagado";

interface Service {
    id: string;
    vehiculoId: string;
    clienteId: string | null;
    clienteNombre: string;
    vehiculoNombre: string;
    patente: string;
    imagenUrl: string;
    tipo: string;
    categoria: string;
    descripcion: string;
    fecha: any;
    fechaEntregaEstimada: any;
    kilometraje: number;
    precio: number;
    estado: ServiceStatus;
    observaciones: string;
    creadoEn: any;
}

interface Payment {
    id: string;
    servicioId: string;
    vehiculoId: string;
    clienteId: string | null;
    clienteNombre: string;
    vehiculoNombre: string;
    patente: string;
    monto: number;
    medioPago: PaymentMethod;
    fecha: any;
    observaciones: string;
    creadoEn: any;
}

interface BillingService extends Service {
    pagado: number;
    pendienteCobro: number;
    estadoPago: PaymentStatus;
}

interface ReceiptData {
    reciboNumero: string;
    fechaPago: any;
    clienteNombre: string;
    vehiculoNombre: string;
    patente: string;
    servicioTipo: string;
    categoria: string;
    descripcion: string;
    kilometraje: number;
    precioServicio: number;
    montoPagado: number;
    saldoAnterior: number;
    saldoRestante: number;
    medioPago: string;
    observaciones: string;
}

const normalizeServiceStatus = (
    value: any
): ServiceStatus => {
    if (
        value === "Pendiente" ||
        value === "En proceso" ||
        value === "Completado" ||
        value === "Cancelado"
    ) {
        return value;
    }

    return "Completado";
};

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

const Facturacion = () => {
    const [search, setSearch] =
        useState("");

    const [
        processingId,
        setProcessingId,
    ] = useState<string | null>(
        null
    );

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<
        "Todos" | ServiceStatus
    >("Todos");

    const [
        paymentFilter,
        setPaymentFilter,
    ] = useState<
        "Todos" | PaymentMethod
    >("Todos");

    const [
        periodFilter,
        setPeriodFilter,
    ] = useState("Este mes");

    const [
        services,
        setServices,
    ] = useState<
        BillingService[]
    >([]);

    const [
        payments,
        setPayments,
    ] = useState<Payment[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        selectedService,
        setSelectedService,
    ] =
        useState<BillingService | null>(
            null
        );

    const [
        showPaymentModal,
        setShowPaymentModal,
    ] = useState(false);

    const [
        paymentAmount,
        setPaymentAmount,
    ] = useState("");

    const [
        paymentMethod,
        setPaymentMethod,
    ] =
        useState<PaymentMethod>(
            "Efectivo"
        );

    const [
        paymentNotes,
        setPaymentNotes,
    ] = useState("");

    const [
        savingPayment,
        setSavingPayment,
    ] = useState(false);

    const [
        openMenuId,
        setOpenMenuId,
    ] = useState<string | null>(
        null
    );

    const [
        showReceipt,
        setShowReceipt,
    ] = useState(false);

    const [
        receiptData,
        setReceiptData,
    ] =
        useState<ReceiptData | null>(
            null
        );

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
                servicesSnapshot,
                paymentsSnapshot,
            ] = await Promise.all([
                getDocs(
                    collection(
                        db,
                        "servicios"
                    )
                ),
                getDocs(
                    collection(
                        db,
                        "pagos"
                    )
                ),
            ]);

            const paymentsData: Payment[] =
                paymentsSnapshot.docs.map(
                    (document) => {
                        const data =
                            document.data();

                        return {
                            id: document.id,

                            servicioId:
                                data.servicioId ??
                                "",

                            vehiculoId:
                                data.vehiculoId ??
                                "",

                            clienteId:
                                data.clienteId ??
                                null,

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

                            creadoEn:
                                data.creadoEn ??
                                null,
                        };
                    }
                );

            const servicesData: Service[] =
                servicesSnapshot.docs.map(
                    (document) => {
                        const data =
                            document.data();

                        return {
                            id: document.id,

                            vehiculoId:
                                data.vehiculoId ??
                                "",

                            clienteId:
                                data.clienteId ??
                                null,

                            clienteNombre:
                                data.clienteNombre ??
                                "Sin cliente",

                            vehiculoNombre:
                                data.vehiculoNombre ??
                                "Sin vehículo",

                            patente:
                                data.patente ??
                                "",

                            imagenUrl:
                                data.imagenUrl ??
                                "",

                            tipo:
                                data.tipo ??
                                "Servicio",

                            categoria:
                                data.categoria ??
                                "Otro",

                            descripcion:
                                data.descripcion ??
                                "",

                            fecha:
                                data.fecha ??
                                null,

                            fechaEntregaEstimada:
                                data.fechaEntregaEstimada ??
                                null,

                            kilometraje:
                                Number(
                                    data.kilometraje
                                ) || 0,

                            precio:
                                Number(
                                    data.precio
                                ) || 0,

                            estado:
                                normalizeServiceStatus(
                                    data.estado
                                ),

                            observaciones:
                                data.observaciones ??
                                "",

                            creadoEn:
                                data.creadoEn ??
                                null,
                        };
                    }
                );

            const paidByService =
                paymentsData.reduce<
                    Record<string, number>
                >(
                    (
                        accumulator,
                        payment
                    ) => {
                        if (
                            !payment.servicioId
                        ) {
                            return accumulator;
                        }

                        accumulator[
                            payment.servicioId
                        ] =
                            (accumulator[
                                payment.servicioId
                            ] ?? 0) +
                            payment.monto;

                        return accumulator;
                    },
                    {}
                );

            const billingServices =
                servicesData
                    .filter(
                        (service) =>
                            service.estado !==
                            "Cancelado"
                    )
                    .map(
                        (service) => {
                            const pagado =
                                paidByService[
                                    service.id
                                ] ?? 0;

                            const pendienteCobro =
                                Math.max(
                                    service.precio -
                                        pagado,
                                    0
                                );

                            let estadoPago: PaymentStatus =
                                "Sin cobrar";

                            if (
                                service.precio <=
                                0
                            ) {
                                estadoPago =
                                    "Pagado";
                            } else if (
                                pagado >=
                                service.precio
                            ) {
                                estadoPago =
                                    "Pagado";
                            } else if (
                                pagado > 0
                            ) {
                                estadoPago =
                                    "Parcial";
                            }

                            return {
                                ...service,
                                pagado,
                                pendienteCobro,
                                estadoPago,
                            };
                        }
                    )
                    .sort((a, b) => {
                        const dateA =
                            parseDate(
                                a.fecha
                            )?.getTime() ??
                            0;

                        const dateB =
                            parseDate(
                                b.fecha
                            )?.getTime() ??
                            0;

                        return (
                            dateB - dateA
                        );
                    });

            setPayments(
                paymentsData
            );

            setServices(
                billingServices
            );
        } catch (err) {
            console.error(
                "Error cargando facturación:",
                err
            );

            setError(
                "No se pudieron cargar los datos de facturación."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const filteredServices =
        useMemo(() => {
            const normalizedSearch =
                search
                    .toLowerCase()
                    .trim();

            return services.filter(
                (service) => {
                    const matchesSearch =
                        service.id
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        service.clienteNombre
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        service.vehiculoNombre
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        service.patente
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        service.tipo
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            );

                    const matchesStatus =
                        statusFilter ===
                            "Todos" ||
                        service.estado ===
                            statusFilter;

                    const servicePayments =
                        payments.filter(
                            (payment) =>
                                payment.servicioId ===
                                service.id
                        );

                    const matchesPayment =
                        paymentFilter ===
                            "Todos" ||
                        servicePayments.some(
                            (payment) =>
                                payment.medioPago ===
                                paymentFilter
                        );

                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesPayment
                    );
                }
            );
        }, [
            services,
            payments,
            search,
            statusFilter,
            paymentFilter,
        ]);

    const totalBilled =
        services
            .filter(
                (service) =>
                    service.estado ===
                    "Completado"
            )
            .reduce(
                (sum, service) =>
                    sum + service.precio,
                0
            );

    const totalCollected =
        payments.reduce(
            (sum, payment) =>
                sum + payment.monto,
            0
        );

    const totalPending =
        services
            .filter(
                (service) =>
                    service.estado ===
                    "Completado"
            )
            .reduce(
                (sum, service) =>
                    sum +
                    service.pendienteCobro,
                0
            );

    const pendingServices =
        services.filter(
            (service) =>
                service.estado ===
                    "Pendiente" ||
                service.estado ===
                    "En proceso"
        ).length;

    const completedServices =
        services.filter(
            (service) =>
                service.estado ===
                "Completado"
        ).length;

    const paidServices =
        services.filter(
            (service) =>
                service.estado ===
                    "Completado" &&
                service.estadoPago ===
                    "Pagado"
        ).length;

    const collectionPercentage =
        totalBilled > 0
            ? Math.min(
                  Math.round(
                      (totalCollected /
                          totalBilled) *
                          100
                  ),
                  100
              )
            : 0;

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

    const totalPayments =
        Object.values(
            paymentMethodTotals
        ).reduce(
            (sum, value) =>
                sum + value,
            0
        );

    const getPaymentPercentage = (
        method: PaymentMethod
    ) => {
        if (totalPayments <= 0) {
            return 0;
        }

        return Math.round(
            (paymentMethodTotals[
                method
            ] /
                totalPayments) *
                100
        );
    };

    const handleCompleteService =
        async (
            service: BillingService
        ) => {
            if (
                service.estado ===
                "Completado"
            ) {
                return;
            }

            try {
                setProcessingId(
                    service.id
                );

                await updateDoc(
                    doc(
                        db,
                        "servicios",
                        service.id
                    ),
                    {
                        estado:
                            "Completado",

                        fechaCompletado:
                            serverTimestamp(),
                    }
                );

                await cargarDatos();
            } catch (err) {
                console.error(
                    "Error completando servicio:",
                    err
                );

                alert(
                    "No se pudo marcar el servicio como completado."
                );
            } finally {
                setProcessingId(
                    null
                );
            }
        };

    const openPaymentModal = (
        service: BillingService
    ) => {
        if (
            service.estado !==
            "Completado"
        ) {
            alert(
                "Primero marcá el servicio como completado."
            );

            return;
        }

        if (
            service.pendienteCobro <=
            0
        ) {
            return;
        }

        setSelectedService(
            service
        );

        setPaymentAmount(
            String(
                service.pendienteCobro
            )
        );

        setPaymentMethod(
            "Efectivo"
        );

        setPaymentNotes("");

        setShowPaymentModal(
            true
        );
    };

    const closePaymentModal =
        () => {
            setShowPaymentModal(
                false
            );

            setSelectedService(
                null
            );

            setPaymentAmount(
                ""
            );

            setPaymentMethod(
                "Efectivo"
            );

            setPaymentNotes("");
        };

    const generarRecibo = async (
        service: BillingService,
        payment?: Payment
    ) => {
        try {
            const servicePayments =
                payments.filter(
                    (item) =>
                        item.servicioId ===
                        service.id
                );

            const totalPagadoAntes =
                payment
                    ? servicePayments
                          .filter(
                              (item) =>
                                  item.id !==
                                  payment.id
                          )
                          .reduce(
                              (
                                  sum,
                                  item
                              ) =>
                                  sum +
                                  item.monto,
                              0
                          )
                    : 0;

            const montoPagado =
                payment
                    ? payment.monto
                    : 0;

            const saldoAnterior =
                Math.max(
                    service.precio -
                        totalPagadoAntes,
                    0
                );

            const saldoRestante =
                Math.max(
                    saldoAnterior -
                        montoPagado,
                    0
                );

            const reciboNumero =
                `REC-${Date.now()}`;

            const recibo = {
                reciboNumero,

                servicioId:
                    service.id,

                pagoId:
                    payment?.id ??
                    null,

                fechaPago:
                    payment?.fecha ??
                    getTodayInputDate(),

                clienteNombre:
                    service.clienteNombre,

                vehiculoNombre:
                    service.vehiculoNombre,

                patente:
                    service.patente,

                servicioTipo:
                    service.tipo,

                categoria:
                    service.categoria,

                descripcion:
                    service.descripcion,

                kilometraje:
                    service.kilometraje,

                precioServicio:
                    service.precio,

                montoPagado,

                saldoAnterior,

                saldoRestante,

                medioPago:
                    payment?.medioPago ??
                    "—",

                observaciones:
                    payment?.observaciones ??
                    service.observaciones ??
                    "",

                creadoEn:
                    serverTimestamp(),
            };

            await addDoc(
                collection(
                    db,
                    "recibos"
                ),
                recibo
            );

            setReceiptData({
                reciboNumero,

                fechaPago:
                    payment?.fecha ??
                    getTodayInputDate(),

                clienteNombre:
                    service.clienteNombre,

                vehiculoNombre:
                    service.vehiculoNombre,

                patente:
                    service.patente,

                servicioTipo:
                    service.tipo,

                categoria:
                    service.categoria,

                descripcion:
                    service.descripcion,

                kilometraje:
                    service.kilometraje,

                precioServicio:
                    service.precio,

                montoPagado,

                saldoAnterior,

                saldoRestante,

                medioPago:
                    payment?.medioPago ??
                    "—",

                observaciones:
                    payment?.observaciones ??
                    service.observaciones ??
                    "",
            });

            setShowReceipt(
                true
            );

            // Generar PDF automáticamente si hay pago
            if (payment && montoPagado > 0) {
                try {
                    await generarYDescargarPDF({
                        tipo: "Recibo",
                        numero: reciboNumero,
                        fecha: payment.fecha || getTodayInputDate(),
                        cliente: {
                            nombre: service.clienteNombre,
                        },
                        vehiculo: {
                            marca: service.vehiculoNombre.split(" ")[0],
                            modelo: service.vehiculoNombre
                                .split(" ")
                                .slice(1)
                                .join(" ") || "—",
                            patente: service.patente,
                        },
                        items: [
                            {
                                type: "Servicio",
                                name: service.tipo,
                                quantity: 1,
                                price: service.precio,
                            },
                        ],
                        laborCost: service.precio,
                        partsCost: 0,
                        total: service.precio,
                        observaciones: payment.observaciones || service.observaciones,
                        adelanto:
                            saldoRestante >
                            0
                                ? {
                                      importe:
                                          montoPagado,
                                      medioPago:
                                          payment.medioPago,
                                      fecha:
                                          payment.fecha ||
                                          getTodayInputDate(),
                                  }
                                : undefined,
                        saldoPendiente:
                            saldoRestante,
                        nombrePDF: `Recibo_${reciboNumero}_${service.clienteNombre.replace(/\s+/g, "_")}.pdf`,
                    });
                } catch (pdfError) {
                    console.error(
                        "Error descargando PDF:",
                        pdfError
                    );
                    // No bloqueamos el flujo si falla el PDF
                }
            }
        } catch (err) {
            console.error(
                "Error generando recibo:",
                err
            );

            alert(
                "No se pudo generar el recibo."
            );
        }
    };

    const handleRegisterPayment =
        async () => {
            if (
                !selectedService
            ) {
                return;
            }

            const amount =
                Number(
                    paymentAmount
                );

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

            if (
                amount >
                selectedService.pendienteCobro
            ) {
                alert(
                    "El monto no puede superar el saldo pendiente."
                );

                return;
            }

            try {
                setSavingPayment(
                    true
                );

                const paymentRef =
                    await addDoc(
                        collection(
                            db,
                            "pagos"
                        ),
                        {
                            servicioId:
                                selectedService.id,

                            vehiculoId:
                                selectedService.vehiculoId,

                            clienteId:
                                selectedService.clienteId ??
                                null,

                            clienteNombre:
                                selectedService.clienteNombre,

                            vehiculoNombre:
                                selectedService.vehiculoNombre,

                            patente:
                                selectedService.patente,

                            monto:
                                amount,

                            medioPago:
                                paymentMethod,

                            fecha:
                                getTodayInputDate(),

                            observaciones:
                                paymentNotes.trim(),

                            creadoEn:
                                serverTimestamp(),
                        }
                    );

                const payment: Payment =
                    {
                        id:
                            paymentRef.id,

                        servicioId:
                            selectedService.id,

                        vehiculoId:
                            selectedService.vehiculoId,

                        clienteId:
                            selectedService.clienteId ??
                            null,

                        clienteNombre:
                            selectedService.clienteNombre,

                        vehiculoNombre:
                            selectedService.vehiculoNombre,

                        patente:
                            selectedService.patente,

                        monto:
                            amount,

                        medioPago:
                            paymentMethod,

                        fecha:
                            getTodayInputDate(),

                        observaciones:
                            paymentNotes.trim(),

                        creadoEn:
                            null,
                    };

                await generarRecibo(
                    selectedService,
                    payment
                );

                await cargarDatos();

                closePaymentModal();
            } catch (err) {
                console.error(
                    "Error registrando pago:",
                    err
                );

                alert(
                    "El pago no pudo registrarse correctamente."
                );
            } finally {
                setSavingPayment(
                    false
                );
            }
        };

    const statusConfig: Record<
        ServiceStatus,
        {
            label: string;
            className: string;
            icon: typeof CheckCircle2;
        }
    > = {
        Pendiente: {
            label: "Pendiente",
            className:
                "bg-amber-50 text-amber-700",
            icon: Clock3,
        },

        "En proceso": {
            label: "En proceso",
            className:
                "bg-blue-50 text-blue-700",
            icon: Clock3,
        },

        Completado: {
            label: "Completado",
            className:
                "bg-emerald-50 text-emerald-700",
            icon: CheckCircle2,
        },

        Cancelado: {
            label: "Cancelado",
            className:
                "bg-slate-100 text-slate-500",
            icon: X,
        },
    };

    const paymentStatusConfig: Record<
        PaymentStatus,
        {
            label: string;
            className: string;
        }
    > = {
        "Sin cobrar": {
            label: "Sin cobrar",
            className:
                "bg-amber-50 text-amber-700",
        },

        Parcial: {
            label: "Pago parcial",
            className:
                "bg-blue-50 text-blue-700",
        },

        Pagado: {
            label: "Pagado",
            className:
                "bg-emerald-50 text-emerald-700",
        },
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
                                Servicios y cobros
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Facturación
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Controlá los servicios realizados,
                            cobros pendientes e ingresos del
                            taller.
                        </p>
                    </div>
                </div>

                {/* FINANCIAL SUMMARY */}
                <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid md:grid-cols-2 xl:grid-cols-4">

                        <div className="border-b border-slate-100 p-6 md:border-r xl:border-b-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Total servicios completados
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        {formatCurrency(
                                            totalBilled
                                        )}
                                    </p>

                                    <div className="mt-3">
                                        <span className="text-xs text-slate-400">
                                            {completedServices} servicios
                                        </span>
                                    </div>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <FileText size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-slate-100 p-6 md:border-r xl:border-b-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Cobrado
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        {formatCurrency(
                                            totalCollected
                                        )}
                                    </p>

                                    <div className="mt-3">
                                        <span className="text-xs text-slate-400">
                                            Pagos registrados
                                        </span>
                                    </div>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <WalletCards size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-slate-100 p-6 xl:border-r xl:border-b-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Pendiente de cobro
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        {formatCurrency(
                                            totalPending
                                        )}
                                    </p>

                                    <p className="mt-3 text-xs text-amber-600">
                                        Servicios completados
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <Clock3 size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Trabajos pendientes
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        {pendingServices}
                                    </p>

                                    <p className="mt-3 text-xs text-blue-600">
                                        Pendientes / en proceso
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Car size={21} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PAYMENT OVERVIEW */}
                <section className="mb-7 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Estado de cobranza
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Relación entre servicios completados y cobros
                                </p>
                            </div>

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {collectionPercentage}%
                            </span>
                        </div>

                        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                    width: `${collectionPercentage}%`,
                                }}
                            />
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-4">

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                    <span className="text-xs text-slate-500">
                                        Cobrado
                                    </span>
                                </div>

                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {formatCurrency(
                                        totalCollected
                                    )}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />

                                    <span className="text-xs text-slate-500">
                                        Pendiente
                                    </span>
                                </div>

                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {formatCurrency(
                                        totalPending
                                    )}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />

                                    <span className="text-xs text-slate-500">
                                        Completados
                                    </span>
                                </div>

                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {completedServices}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 size={19} />
                            </div>

                            <div>
                                <p className="text-xs text-slate-400">
                                    Servicios cobrados
                                </p>

                                <p className="text-xl font-bold text-slate-900">
                                    {paidServices}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 h-px bg-slate-100" />

                        <p className="mt-4 text-xs leading-5 text-slate-500">
                            Servicios completados cuyo saldo ya fue
                            cobrado completamente.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Medios de pago
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    Distribución de cobros reales
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
                                    "Transferencia",
                                    "Efectivo",
                                    "Tarjeta",
                                    "Mercado Pago",
                                ] as PaymentMethod[]
                            ).map(
                                (method) => (
                                    <div
                                        key={method}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-xs text-slate-500">
                                            {method}
                                        </span>

                                        <span className="text-xs font-bold text-slate-800">
                                            {getPaymentPercentage(
                                                method
                                            )}
                                            %
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </section>

                {/* SERVICES */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* TOOLBAR */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Servicios y cobros
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {filteredServices.length} servicios encontrados
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
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Buscar servicio..."
                                    className="text-slate-700 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 md:w-64"
                                />
                            </div>

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target
                                            .value as
                                            | "Todos"
                                            | ServiceStatus
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

                                <option value="En proceso">
                                    En proceso
                                </option>

                                <option value="Completado">
                                    Completados
                                </option>

                                <option value="Cancelado">
                                    Cancelados
                                </option>
                            </select>

                            <select
                                value={
                                    paymentFilter
                                }
                                onChange={(e) =>
                                    setPaymentFilter(
                                        e.target
                                            .value as
                                            | "Todos"
                                            | PaymentMethod
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="Todos">
                                    Todos los medios
                                </option>

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

                            <select
                                value={
                                    periodFilter
                                }
                                onChange={(e) =>
                                    setPeriodFilter(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="Este mes">
                                    Este mes
                                </option>

                                <option value="Esta semana">
                                    Esta semana
                                </option>

                                <option value="Hoy">
                                    Hoy
                                </option>

                                <option value="Últimos 30 días">
                                    Últimos 30 días
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
                                Cargando facturación...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px]">

                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/70">

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Servicio
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Cliente / vehículo
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Fecha
                                            </th>

                                            <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Importe
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Trabajo
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Cobro
                                            </th>

                                            <th className="px-5 py-3" />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredServices.map(
                                            (
                                                service,
                                                index
                                            ) => {
                                                const StatusIcon =
                                                    statusConfig[
                                                        service.estado
                                                    ].icon;

                                                return (
                                                    <tr
                                                        key={
                                                            service.id
                                                        }
                                                        className={`group transition hover:bg-slate-50 ${
                                                            index !==
                                                            filteredServices.length -
                                                                1
                                                                ? "border-b border-slate-100"
                                                                : ""
                                                        }`}
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">

                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                                    <Receipt
                                                                        size={
                                                                            19
                                                                        }
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">
                                                                        {
                                                                            service.tipo
                                                                        }
                                                                    </p>

                                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                                        {
                                                                            service.categoria
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800">
                                                                    {
                                                                        service.clienteNombre
                                                                    }
                                                                </p>

                                                                <div className="mt-1 flex items-center gap-2">
                                                                    <Car
                                                                        size={
                                                                            13
                                                                        }
                                                                        className="text-slate-400"
                                                                    />

                                                                    <span className="text-xs text-slate-500">
                                                                        {
                                                                            service.vehiculoNombre
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {service.patente && (
                                                                    <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                                                                        {
                                                                            service.patente
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                                        service.fecha
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            <span className="text-sm font-bold text-slate-900">
                                                                {formatCurrency(
                                                                    service.precio
                                                                )}
                                                            </span>

                                                            {service.pagado >
                                                                0 && (
                                                                <p className="mt-1 text-[10px] text-emerald-600">
                                                                    Cobrado:{" "}
                                                                    {formatCurrency(
                                                                        service.pagado
                                                                    )}
                                                                </p>
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusConfig[
                                                                    service.estado
                                                                ].className}`}
                                                            >
                                                                <StatusIcon
                                                                    size={
                                                                        12
                                                                    }
                                                                />

                                                                {
                                                                    statusConfig[
                                                                        service.estado
                                                                    ].label
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatusConfig[
                                                                    service.estadoPago
                                                                ].className}`}
                                                            >
                                                                {
                                                                    paymentStatusConfig[
                                                                        service.estadoPago
                                                                    ].label
                                                                }
                                                            </span>

                                                            {service.pendienteCobro >
                                                                0 &&
                                                                service.estado ===
                                                                    "Completado" && (
                                                                    <p className="mt-1 text-[10px] text-amber-600">
                                                                        Saldo:{" "}
                                                                        {formatCurrency(
                                                                            service.pendienteCobro
                                                                        )}
                                                                    </p>
                                                                )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="relative flex justify-end">

                                                                {service.estado ===
                                                                    "Pendiente" ||
                                                                service.estado ===
                                                                    "En proceso" ? (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleCompleteService(
                                                                                service
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            processingId ===
                                                                            service.id
                                                                        }
                                                                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <CheckCircle2
                                                                            size={
                                                                                15
                                                                            }
                                                                        />

                                                                        {processingId ===
                                                                        service.id
                                                                            ? "Guardando..."
                                                                            : "Completar"}
                                                                    </button>
                                                                ) : service.estado ===
                                                                      "Completado" &&
                                                                  service.pendienteCobro >
                                                                      0 ? (
                                                                    <button
                                                                        onClick={() =>
                                                                            openPaymentModal(
                                                                                service
                                                                            )
                                                                        }
                                                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                                    >
                                                                        <WalletCards
                                                                            size={
                                                                                15
                                                                            }
                                                                        />

                                                                        {service.pagado >
                                                                        0
                                                                            ? "Cobrar saldo"
                                                                            : "Cobrar"}
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                                                                        <CheckCircle2
                                                                            size={
                                                                                16
                                                                            }
                                                                        />

                                                                        Pagado
                                                                    </div>
                                                                )}

                                                                <button
                                                                    onClick={() =>
                                                                        setOpenMenuId(
                                                                            openMenuId ===
                                                                                service.id
                                                                                ? null
                                                                                : service.id
                                                                        )
                                                                    }
                                                                    className="ml-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                                >
                                                                    <MoreHorizontal
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </button>

                                                                {openMenuId ===
                                                                    service.id && (
                                                                    <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">

                                                                        {service.estado ===
                                                                            "Completado" &&
                                                                            service.pendienteCobro >
                                                                                0 && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setOpenMenuId(
                                                                                            null
                                                                                        );

                                                                                        openPaymentModal(
                                                                                            service
                                                                                        );
                                                                                    }}
                                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                                                                                >
                                                                                    <WalletCards
                                                                                        size={
                                                                                            15
                                                                                        }
                                                                                    />

                                                                                    Registrar cobro
                                                                                </button>
                                                                            )}

                                                                        <button
                                                                            onClick={() => {
                                                                                setOpenMenuId(
                                                                                    null
                                                                                );

                                                                                const servicePayments =
                                                                                    payments.filter(
                                                                                        (
                                                                                            payment
                                                                                        ) =>
                                                                                            payment.servicioId ===
                                                                                            service.id
                                                                                    );

                                                                                const lastPayment =
                                                                                    servicePayments.length >
                                                                                    0
                                                                                        ? [
                                                                                              ...servicePayments,
                                                                                          ].sort(
                                                                                              (
                                                                                                  a,
                                                                                                  b
                                                                                              ) => {
                                                                                                  const dateA =
                                                                                                      parseDate(
                                                                                                          a.fecha
                                                                                                      )?.getTime() ??
                                                                                                      0;

                                                                                                  const dateB =
                                                                                                      parseDate(
                                                                                                          b.fecha
                                                                                                      )?.getTime() ??
                                                                                                      0;

                                                                                                  return (
                                                                                                      dateB -
                                                                                                      dateA
                                                                                                  );
                                                                                              }
                                                                                          )[0]
                                                                                        : undefined;

                                                                                generarRecibo(
                                                                                    service,
                                                                                    lastPayment
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                                                                        >
                                                                            <Receipt
                                                                                size={
                                                                                    15
                                                                                }
                                                                            />

                                                                            {service.pagado >
                                                                            0
                                                                                ? "Ver recibo"
                                                                                : "Generar recibo"}
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                setOpenMenuId(
                                                                                    null
                                                                                )
                                                                            }
                                                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                                                                        >
                                                                            <FileText
                                                                                size={
                                                                                    15
                                                                                }
                                                                            />

                                                                            Ver servicio
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredServices.length ===
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
                                        No encontramos servicios
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Probá con otro cliente,
                                        vehículo o estado.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                                <p className="text-xs text-slate-400">
                                    Mostrando{" "}
                                    {
                                        filteredServices.length
                                    }{" "}
                                    servicios
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        disabled
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                                    >
                                        <ChevronLeft
                                            size={
                                                16
                                            }
                                        />
                                    </button>

                                    <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
                                        1
                                    </button>

                                    <button
                                        disabled
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                                    >
                                        <ChevronRight
                                            size={
                                                16
                                            }
                                        />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {/* PAYMENT MODAL */}
            {showPaymentModal &&
                selectedService && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

                        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                        Cobranza
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                                        Registrar pago
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Registrá el cobro correspondiente al servicio.
                                    </p>
                                </div>

                                <button
                                    onClick={
                                        closePaymentModal
                                    }
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X
                                        size={
                                            20
                                        }
                                    />
                                </button>
                            </div>

                            <div className="p-6">

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <Car
                                                size={
                                                    19
                                                }
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-900">
                                                {
                                                    selectedService.tipo
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {
                                                    selectedService.clienteNombre
                                                }
                                                {" · "}
                                                {
                                                    selectedService.vehiculoNombre
                                                }
                                            </p>

                                            {selectedService.patente && (
                                                <span className="mt-2 inline-flex rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                                                    {
                                                        selectedService.patente
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Total
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {formatCurrency(
                                                    selectedService.precio
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Saldo pendiente
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-amber-600">
                                                {formatCurrency(
                                                    selectedService.pendienteCobro
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Monto a cobrar
                                    </label>

                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                            $
                                        </span>

                                        <input
                                            type="number"
                                            min="1"
                                            max={
                                                selectedService.pendienteCobro
                                            }
                                            value={
                                                paymentAmount
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setPaymentAmount(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Medio de pago
                                    </label>

                                    <select
                                        value={
                                            paymentMethod
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setPaymentMethod(
                                                e
                                                    .target
                                                    .value as PaymentMethod
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

                                <div className="mt-5">
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Observaciones
                                    </label>

                                    <textarea
                                        rows={
                                            3
                                        }
                                        value={
                                            paymentNotes
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setPaymentNotes(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Opcional..."
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                                <button
                                    onClick={
                                        closePaymentModal
                                    }
                                    disabled={
                                        savingPayment
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={
                                        handleRegisterPayment
                                    }
                                    disabled={
                                        savingPayment
                                    }
                                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <WalletCards
                                        size={
                                            16
                                        }
                                    />

                                    {savingPayment
                                        ? "Registrando..."
                                        : "Registrar pago"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* RECEIPT */}
            {showReceipt &&
                receiptData && (
                    <ReciboServicio
                        data={
                            receiptData
                        }
                        onClose={() => {
                            setShowReceipt(
                                false
                            );

                            setReceiptData(
                                null
                            );
                        }}
                    />
                )}
        </AdminLayout>
    );
};

export default Facturacion;