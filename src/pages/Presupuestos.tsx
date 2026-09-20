import {
    AlertCircle,
    CalendarDays,
    Car,
    Eye,
    CheckCircle2,
    Clock3,
    DollarSign,
    Download,
    FileText,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    Upload,
    X,
    Loader2,
} from "lucide-react";

import {
    addDoc,
    collection,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";

import {
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";

import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../components/AdminLayout";
import PresupuestoPdf from "../components/PresupuestoPdf";
import { db, storage } from "../config/firebase";


/* =========================================================
   TIPOS
========================================================= */

type BudgetStatus =
    | "Pendiente"
    | "Aprobado"
    | "Rechazado"
    | "Vencido";

interface Client {
    uid: string;
    nombre: string;
    email: string;
}

interface Vehicle {
    id: string;
    clienteId: string | null;
    clienteNombre: string;
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
    color: string;
    kilometraje: number;
}

interface BudgetItem {
    type: "Servicio" | "Repuesto";
    name: string;
    quantity: number;
    price: number;
}

interface Budget {
    id: string;
    firestoreId?: string;

    clientId: string;
    client: string;

    vehicleId: string;
    vehicle: string;
    plate: string;

    date: string;
    validUntil: string;

    total: number;
    laborCost: number;
    partsCost: number;

    items: number;

    status: BudgetStatus;

    advisor: string;

    notes: string;

    partsPdfUrl?: string;
    finalPdfUrl?: string;
}


/* =========================================================
   COMPONENTE
========================================================= */

const Presupuestos = () => {

    /* =====================================================
       ESTADOS
    ===================================================== */

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState<
        "Todos" | BudgetStatus
    >("Todos");

    const [showModal, setShowModal] = useState(false);
    const [selectedBudget, setSelectedBudget] =
    useState<Budget | null>(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [clients, setClients] = useState<Client[]>([]);

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [budgets, setBudgets] = useState<Budget[]>([]);

    const [partsPdf, setPartsPdf] = useState<File | null>(null);

    const [newBudget, setNewBudget] = useState({
        clientId: "",
        vehicleId: "",
        validUntil: "",
        notes: "",
        laborCost: "",
        partsCost: "",
    });

    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
        {
            type: "Servicio",
            name: "Mano de obra",
            quantity: 1,
            price: 0,
        },
    ]);


    /* =====================================================
       CARGAR DATOS
    ===================================================== */

    const cargarDatos = async () => {

        try {

            setLoading(true);

            /* ===============================================
               CLIENTES
            =============================================== */

            const usuariosSnapshot = await getDocs(
                collection(db, "usuarios")
            );

            const clientsData: Client[] =
                usuariosSnapshot.docs.map((doc) => {

                    const data = doc.data();

                    const uid =
                        data.uid ??
                        doc.id;

                    const nombre =
                        data.nombreCompleto ||
                        data.nombre ||
                        `${data.nombre || ""} ${data.apellido || ""}`.trim() ||
                        data.email ||
                        "Sin nombre";

                    return {
                        uid,
                        nombre,
                        email: data.email ?? "",
                    };

                });

            setClients(clientsData);


            /* ===============================================
               MAPA DE CLIENTES
            =============================================== */

            const clientsMap = new Map<string, string>();

            usuariosSnapshot.docs.forEach((doc) => {

                const data = doc.data();

                const nombre =
                    data.nombreCompleto ||
                    data.nombre ||
                    `${data.nombre || ""} ${data.apellido || ""}`.trim() ||
                    data.email ||
                    "Sin nombre";

                clientsMap.set(
                    doc.id,
                    nombre
                );

                if (data.uid) {

                    clientsMap.set(
                        data.uid,
                        nombre
                    );

                }

            });


            /* ===============================================
               VEHÍCULOS
            =============================================== */

            const vehiculosSnapshot = await getDocs(
                collection(db, "vehiculos")
            );

            const vehiclesData: Vehicle[] =
                vehiculosSnapshot.docs.map((doc) => {

                    const data = doc.data();

                    const clienteId =
                        data.clienteId ??
                        null;

                    return {
                        id: doc.id,

                        clienteId,

                        clienteNombre:
                            data.clienteNombre ||
                            (clienteId
                                ? clientsMap.get(clienteId)
                                : null) ||
                            "Sin cliente",

                        marca:
                            data.marca ??
                            "",

                        modelo:
                            data.modelo ??
                            "",

                        anio:
                            Number(
                                data.anio ??
                                0
                            ),

                        patente:
                            data.patente ??
                            "",

                        color:
                            data.color ??
                            "",

                        kilometraje:
                            Number(
                                data.kilometraje ??
                                0
                            ),
                    };

                });

            setVehicles(
                vehiclesData
            );


            /* ===============================================
               PRESUPUESTOS
            =============================================== */

            const presupuestosSnapshot = await getDocs(
                collection(db, "presupuestos")
            );

            const budgetsData: Budget[] =
                presupuestosSnapshot.docs.map((doc) => {

                    const data = doc.data();

                    return {
                        id:
                            data.numero ??
                            doc.id,

                        firestoreId:
                            doc.id,

                        clientId:
                            data.clienteId ??
                            "",

                        client:
                            data.clienteNombre ??
                            "Sin cliente",

                        vehicleId:
                            data.vehiculoId ??
                            "",

                        vehicle:
                            data.vehiculoNombre ??
                            "Vehículo",

                        plate:
                            data.patente ??
                            "",

                        date:
                            data.fecha ??
                            "",

                        validUntil:
                            data.validUntil ??
                            "",

                        total:
                            Number(
                                data.total ??
                                0
                            ),

                        laborCost:
                            Number(
                                data.manoDeObra ??
                                0
                            ),

                        partsCost:
                            Number(
                                data.repuestos ??
                                0
                            ),

                        items:
                            Number(
                                data.items ??
                                0
                            ),

                        status:
                            data.estado ??
                            "Pendiente",

                        advisor:
                            data.advisor ??
                            "Administrador",

                        notes:
                            data.observaciones ??
                            "",

                        partsPdfUrl:
                            data.partsPdfUrl ??
                            "",

                        finalPdfUrl:
                            data.finalPdfUrl ??
                            "",
                    };

                });


            budgetsData.sort(
                (a, b) =>
                    b.date.localeCompare(
                        a.date
                    )
            );

            setBudgets(
                budgetsData
            );

        } catch (error) {

            console.error(
                "Error cargando presupuestos:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        cargarDatos();

    }, []);


    /* =====================================================
       CLIENTE SELECCIONADO
    ===================================================== */

    const selectedClient = useMemo(() => {

        return clients.find(
            (client) =>
                client.uid ===
                newBudget.clientId
        );

    }, [
        clients,
        newBudget.clientId,
    ]);


    /* =====================================================
       VEHÍCULOS DEL CLIENTE
    ===================================================== */

    const clientVehicles = useMemo(() => {

        if (!newBudget.clientId) {

            return [];

        }

        return vehicles.filter(
            (vehicle) =>
                vehicle.clienteId ===
                newBudget.clientId
        );

    }, [
        vehicles,
        newBudget.clientId,
    ]);


    /* =====================================================
       VEHÍCULO SELECCIONADO
    ===================================================== */

    const selectedVehicle = useMemo(() => {

        return vehicles.find(
            (vehicle) =>
                vehicle.id ===
                newBudget.vehicleId
        );

    }, [
        vehicles,
        newBudget.vehicleId,
    ]);


    /* =====================================================
       FORMATEAR MONEDA
    ===================================================== */

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


    /* =====================================================
       FORMATEAR FECHA
    ===================================================== */

    const formatDate = (
        value: string
    ) => {

        if (!value) {

            return "-";

        }

        const parts =
            value.split("-");

        if (
            parts.length !== 3
        ) {

            return value;

        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;

    };


    /* =====================================================
       ESTADOS
    ===================================================== */

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

            className:
                "bg-amber-50 text-amber-700",

            icon: Clock3,

        },

        Aprobado: {

            label: "Aprobado",

            className:
                "bg-emerald-50 text-emerald-700",

            icon: CheckCircle2,

        },

        Rechazado: {

            label: "Rechazado",

            className:
                "bg-red-50 text-red-700",

            icon: AlertCircle,

        },

        Vencido: {

            label: "Vencido",

            className:
                "bg-slate-100 text-slate-500",

            icon: Clock3,

        },

    };


    /* =====================================================
       AGREGAR CONCEPTO
    ===================================================== */

    const addBudgetItem = () => {

        setBudgetItems(
            (current) => [
                ...current,

                {
                    type: "Servicio",
                    name: "",
                    quantity: 1,
                    price: 0,
                },
            ]
        );

    };


    /* =====================================================
       ELIMINAR CONCEPTO
    ===================================================== */

    const removeBudgetItem = (
        index: number
    ) => {

        setBudgetItems(
            (current) =>
                current.filter(
                    (_, itemIndex) =>
                        itemIndex !== index
                )
        );

    };


    /* =====================================================
       ACTUALIZAR CONCEPTO
    ===================================================== */

    const updateBudgetItem = <
        K extends keyof BudgetItem
    >(
        index: number,
        field: K,
        value: BudgetItem[K]
    ) => {

        setBudgetItems(
            (currentItems) =>
                currentItems.map(
                    (
                        item,
                        itemIndex
                    ) =>
                        itemIndex === index
                            ? {
                                  ...item,
                                  [field]:
                                      value,
                              }
                            : item
                )
        );

    };


    /* =====================================================
       TOTALES
    ===================================================== */

    const laborCost =
        Number(
            newBudget.laborCost || 0
        );

    const partsCost =
        Number(
            newBudget.partsCost || 0
        );

    const budgetTotal =
        laborCost +
        partsCost;


    /* =====================================================
       CREAR PRESUPUESTO
    ===================================================== */

    const handleCreateBudget =
        async () => {

            try {

                /* ==========================================
                   VALIDACIONES
                ========================================== */

                if (
                    !newBudget.clientId
                ) {

                    alert(
                        "Seleccioná un cliente."
                    );

                    return;

                }


                if (
                    !newBudget.vehicleId
                ) {

                    alert(
                        "Seleccioná un vehículo."
                    );

                    return;

                }


                if (
                    !newBudget.validUntil
                ) {

                    alert(
                        "Seleccioná la fecha de vigencia."
                    );

                    return;

                }


                if (!partsPdf) {

                    alert(
                        "Subí el PDF de la cotización de repuestos."
                    );

                    return;

                }


                if (
                    partsPdf.type !==
                    "application/pdf"
                ) {

                    alert(
                        "El archivo de repuestos debe ser un PDF."
                    );

                    return;

                }


                if (
                    partsPdf.size >
                    15 *
                        1024 *
                        1024
                ) {

                    alert(
                        "El PDF no puede superar los 15 MB."
                    );

                    return;

                }


                if (
                    laborCost <= 0
                ) {

                    alert(
                        "Ingresá el costo de mano de obra."
                    );

                    return;

                }


                setSaving(true);


                /* ==========================================
                   GENERAR NÚMERO
                ========================================== */

                const numeroPresupuesto =
                    `PRE-${String(
                        budgets.length + 1
                    ).padStart(
                        3,
                        "0"
                    )}`;


                /* ==========================================
                   FECHA
                ========================================== */

                const today =
                    new Date()
                        .toISOString()
                        .split("T")[0];


                /* ==========================================
                   GENERAR PDF COMPLETO

                   ORDEN:
                   1. PDF REPUESTOS
                   2. PDF MORA MECÁNICA
                ========================================== */

                const presupuestoPdf =
                    await PresupuestoPdf({
                        numeroPresupuesto,

                        selectedClient,

                        selectedVehicle,

                        budgetItems,

                        laborCost,

                        partsCost,

                        budgetTotal,

                        notes:
                            newBudget.notes,

                        partsPdf,

                        formatCurrency,

                        formatDate,
                    });


                /* ==========================================
                   STORAGE - PDF REPUESTOS ORIGINAL
                ========================================== */

                const partsStorageRef =
                    ref(
                        storage,
                        `presupuestos/${numeroPresupuesto}/repuestos-${numeroPresupuesto}.pdf`
                    );


                await uploadBytes(
                    partsStorageRef,
                    partsPdf,
                    {
                        contentType:
                            "application/pdf",
                    }
                );


                const partsPdfUrl =
                    await getDownloadURL(
                        partsStorageRef
                    );


                /* ==========================================
                   STORAGE - PDF COMPLETO
                ========================================== */

                const finalStorageRef =
                    ref(
                        storage,
                        `presupuestos/${numeroPresupuesto}/${numeroPresupuesto}-completo.pdf`
                    );


                await uploadBytes(
                    finalStorageRef,
                    presupuestoPdf,
                    {
                        contentType:
                            "application/pdf",
                    }
                );


                const finalPdfUrl =
                    await getDownloadURL(
                        finalStorageRef
                    );


                /* ==========================================
                   FIRESTORE
                ========================================== */

                await addDoc(
                    collection(
                        db,
                        "presupuestos"
                    ),
                    {

                        numero:
                            numeroPresupuesto,

                        clienteId:
                            selectedClient?.uid ??
                            "",

                        clienteNombre:
                            selectedClient?.nombre ??
                            "",

                        clienteEmail:
                            selectedClient?.email ??
                            "",

                        vehiculoId:
                            selectedVehicle?.id ??
                            "",

                        vehiculoNombre:
                            selectedVehicle
                                ? `${selectedVehicle.marca} ${selectedVehicle.modelo} ${selectedVehicle.anio}`
                                : "",

                        patente:
                            selectedVehicle?.patente ??
                            "",

                        fecha:
                            today,

                        validUntil:
                            newBudget.validUntil,

                        manoDeObra:
                            laborCost,

                        repuestos:
                            partsCost,

                        total:
                            budgetTotal,

                        items:
                            budgetItems.length,

                        conceptos:
                            budgetItems,

                        estado:
                            "Pendiente",

                        advisor:
                            "Administrador",

                        observaciones:
                            newBudget.notes.trim(),

                        partsPdfUrl,

                        finalPdfUrl,

                        partsPdfName:
                            partsPdf.name,

                        partsPdfSize:
                            partsPdf.size,

                        creadoEn:
                            serverTimestamp(),

                    }
                );


                /* ==========================================
                    COMPLETO
                ========================================== */

const pdfArrayBuffer =
    new ArrayBuffer(
        presupuestoPdf.byteLength
    );

new Uint8Array(
    pdfArrayBuffer
).set(
    presupuestoPdf
);

const blob =
    new Blob(
        [
            pdfArrayBuffer,
        ],
        {
            type:
                "application/pdf",
        }
    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    url;


                link.download =
                    `${numeroPresupuesto}-completo.pdf`;


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                URL.revokeObjectURL(
                    url
                );


                /* ==========================================
                   LIMPIAR FORMULARIO
                ========================================== */

                setNewBudget({

                    clientId: "",

                    vehicleId: "",

                    validUntil: "",

                    notes: "",

                    laborCost: "",

                    partsCost: "",

                });


                setPartsPdf(
                    null
                );


                setBudgetItems([
                    {

                        type:
                            "Servicio",

                        name:
                            "Mano de obra",

                        quantity:
                            1,

                        price:
                            0,

                    },
                ]);


                setShowModal(
                    false
                );


                await cargarDatos();


                alert(
                    `Presupuesto ${numeroPresupuesto} creado correctamente.`
                );

            } catch (error) {

                console.error(
                    "Error creando presupuesto:",
                    error
                );

                alert(
                    "No se pudo crear el presupuesto. Revisá la consola."
                );

            } finally {

                setSaving(
                    false
                );

            }

        };


    /* =====================================================
       FILTRADO
    ===================================================== */

    const filteredBudgets =
        useMemo(() => {

            const normalizedSearch =
                search
                    .toLowerCase()
                    .trim();

            return budgets.filter(
                (budget) => {

                    const matchesSearch =
                        budget.id
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||

                        budget.client
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||

                        budget.vehicle
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||

                        budget.plate
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            );


                    const matchesStatus =
                        statusFilter ===
                            "Todos" ||
                        budget.status ===
                            statusFilter;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );

        }, [
            budgets,
            search,
            statusFilter,
        ]);


    /* =====================================================
       ESTADÍSTICAS
    ===================================================== */

    const stats = {

        pending:
            budgets.filter(
                (budget) =>
                    budget.status ===
                    "Pendiente"
            ).length,

        approved:
            budgets.filter(
                (budget) =>
                    budget.status ===
                    "Aprobado"
            ).length,

        total:
            budgets.reduce(
                (sum, budget) =>
                    sum +
                    budget.total,
                0
            ),

        approvalRate:
            budgets.length
                ? Math.round(
                      (budgets.filter(
                          (budget) =>
                              budget.status ===
                              "Aprobado"
                      ).length /
                          budgets.length) *
                          100
                  )
                : 0,

    };


    /* =====================================================
       RESET CLIENTE
    ===================================================== */

    const handleClientChange = (
        clientId: string
    ) => {

        setNewBudget(
            (current) => ({
                ...current,
                clientId,
                vehicleId: "",
            })
        );

    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <AdminLayout>

            <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">

                {/* =================================================
                    HEADER
                ================================================= */}

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
                            Creá y gestioná presupuestos con cotizaciones
                            de repuestos y mano de obra.
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
                            onClick={() =>
                                setShowModal(
                                    true
                                )
                            }
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                        >

                            <Plus size={18} />

                            Nuevo presupuesto

                        </button>

                    </div>

                </div>


                {/* =================================================
                    STATS
                ================================================= */}

                <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

                        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">

                            <div className="flex items-start justify-between">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Monto presupuestado
                                    </p>

                                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                        {formatCurrency(
                                            stats.total
                                        )}
                                    </p>

                                </div>


                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                    <DollarSign
                                        size={21}
                                    />

                                </div>

                            </div>

                        </div>


                        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">

                            <p className="text-sm font-medium text-slate-500">
                                Pendientes de aprobación
                            </p>

                            <p className="mt-3 text-3xl font-bold text-slate-900">
                                {stats.pending}
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                                Presupuestos esperando respuesta.
                            </p>

                        </div>


                        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">

                            <p className="text-sm font-medium text-slate-500">
                                Presupuestos aprobados
                            </p>

                            <p className="mt-3 text-3xl font-bold text-slate-900">
                                {stats.approved}
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                                Listos para convertirse en trabajos.
                            </p>

                        </div>


                        <div className="p-6">

                            <p className="text-sm font-medium text-slate-500">
                                Tasa de aprobación
                            </p>

                            <p className="mt-3 text-3xl font-bold text-slate-900">
                                {stats.approvalRate}%
                            </p>

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


                {/* =================================================
                    LISTADO
                ================================================= */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

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
                                    placeholder="Buscar presupuesto..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 md:w-64"
                                />

                            </div>


                            <select
                                value={
                                    statusFilter
                                }
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

                        </div>

                    </div>


                    {/* =================================================
                        TABLE
                    ================================================= */}

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1100px]">

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

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan={8}
                                            className="px-5 py-16 text-center"
                                        >

                                            <Loader2
                                                className="mx-auto animate-spin text-blue-600"
                                                size={28}
                                            />

                                            <p className="mt-3 text-sm text-slate-500">
                                                Cargando presupuestos...
                                            </p>

                                        </td>

                                    </tr>

                                ) : (

                                    filteredBudgets.map(
                                        (
                                            budget,
                                            index
                                        ) => {

                                            const StatusIcon =
                                                statusConfig[
                                                    budget.status
                                                ]?.icon ??
                                                Clock3;

                                            return (

                                                <tr
                                                    key={
                                                        budget.firestoreId ??
                                                        budget.id
                                                    }
                                                    className={`group transition hover:bg-slate-50 ${
                                                        index !==
                                                        filteredBudgets.length -
                                                            1
                                                            ? "border-b border-slate-100"
                                                            : ""
                                                    }`}
                                                >

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                                                <FileText
                                                                    size={19}
                                                                />

                                                            </div>


                                                            <div>

                                                                <p className="text-sm font-bold text-slate-900">
                                                                    {
                                                                        budget.id
                                                                    }
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-slate-400">
                                                                    {
                                                                        budget.advisor
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {
                                                                budget.client
                                                            }
                                                        </p>

                                                        <div className="mt-1 flex items-center gap-2">

                                                            <Car
                                                                size={13}
                                                                className="text-slate-400"
                                                            />

                                                            <span className="text-xs text-slate-500">
                                                                {
                                                                    budget.vehicle
                                                                }
                                                            </span>

                                                        </div>

                                                        <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                                                            {
                                                                budget.plate
                                                            }
                                                        </span>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-2">

                                                            <CalendarDays
                                                                size={15}
                                                                className="text-slate-400"
                                                            />

                                                            <span className="text-sm text-slate-600">
                                                                {formatDate(
                                                                    budget.date
                                                                )}
                                                            </span>

                                                        </div>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-2">

                                                            <Clock3
                                                                size={15}
                                                                className="text-slate-400"
                                                            />

                                                            <span className="text-sm text-slate-600">
                                                                {formatDate(
                                                                    budget.validUntil
                                                                )}
                                                            </span>

                                                        </div>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <span className="text-sm text-slate-600">
                                                            {
                                                                budget.items
                                                            }{" "}
                                                            conceptos
                                                        </span>

                                                    </td>


                                                    <td className="px-5 py-4 text-right">

                                                        <span className="text-sm font-bold text-slate-900">
                                                            {formatCurrency(
                                                                budget.total
                                                            )}
                                                        </span>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                statusConfig[
                                                                    budget.status
                                                                ]?.className ??
                                                                "bg-slate-100 text-slate-500"
                                                            }`}
                                                        >

                                                            <StatusIcon
                                                                size={12}
                                                            />

                                                            {
                                                                budget.status
                                                            }

                                                        </span>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-1">

<button
    type="button"
    onClick={() =>
        setSelectedBudget(
            budget
        )
    }
    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
    title="Ver presupuesto"
>

    <Eye
        size={17}
    />

    Ver

</button>


                                                            <button
                                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                            >

                                                                <MoreHorizontal
                                                                    size={18}
                                                                />

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>


                    {!loading &&
                        filteredBudgets.length ===
                            0 && (

                            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                                    <Search
                                        size={24}
                                    />

                                </div>


                                <h3 className="mt-4 text-sm font-bold text-slate-900">
                                    No encontramos presupuestos
                                </h3>


                                <p className="mt-1 text-sm text-slate-500">
                                    Todavía no hay presupuestos que coincidan con la búsqueda.
                                </p>

                            </div>

                        )}

                </section>

            </div>


            {/* =====================================================
                MODAL NUEVO PRESUPUESTO
            ===================================================== */}

            {showModal && (

                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

                    <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

                            <div>

                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                    Gestión comercial
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Nuevo presupuesto
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Adjuntá la cotización de repuestos y agregá la mano de obra.
                                </p>

                            </div>


                            <button
                                onClick={() =>
                                    !saving &&
                                    setShowModal(
                                        false
                                    )
                                }
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <div className="p-6">

                            {/* =================================================
                                CLIENTE / VEHÍCULO
                            ================================================= */}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">

                                <div className="mb-4">

                                    <h3 className="text-base font-bold text-slate-900">
                                        Cliente y vehículo
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Seleccioná los datos reales registrados en el sistema.
                                    </p>

                                </div>


                                <div className="grid gap-5 sm:grid-cols-2">

                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Cliente
                                        </label>

                                        <select
                                            value={
                                                newBudget.clientId
                                            }
                                            onChange={(e) =>
                                                handleClientChange(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        >

                                            <option value="">
                                                Seleccioná un cliente
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
                                                        {
                                                            client.nombre
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Vehículo
                                        </label>

                                        <select
                                            value={
                                                newBudget.vehicleId
                                            }
                                            onChange={(e) =>
                                                setNewBudget(
                                                    {
                                                        ...newBudget,
                                                        vehicleId:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            disabled={
                                                !newBudget.clientId
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        >

                                            <option value="">
                                                {!newBudget.clientId
                                                    ? "Primero seleccioná un cliente"
                                                    : clientVehicles.length
                                                    ? "Seleccioná un vehículo"
                                                    : "El cliente no tiene vehículos"}
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
                                                        {
                                                            vehicle.marca
                                                        }{" "}
                                                        {
                                                            vehicle.modelo
                                                        }{" "}
                                                        {
                                                            vehicle.anio
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            vehicle.patente
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Válido hasta
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                newBudget.validUntil
                                            }
                                            onChange={(e) =>
                                                setNewBudget(
                                                    {
                                                        ...newBudget,
                                                        validUntil:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
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

                            </div>


                            {/* =================================================
                                PDF REPUESTOS
                            ================================================= */}

                            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                    <div>

                                        <h3 className="text-base font-bold text-slate-900">
                                            Cotización de repuestos
                                        </h3>

                                        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                                            Subí el PDF que te entrega la casa de repuestos.
                                            Se va a incorporar automáticamente al PDF final.
                                        </p>

                                    </div>


                                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700">

                                        <Upload
                                            size={16}
                                        />

                                        Subir PDF

                                        <input
                                            type="file"
                                            accept="application/pdf,.pdf"
                                            className="hidden"
                                            onChange={(e) => {

                                                const file =
                                                    e
                                                        .target
                                                        .files?.[0] ??
                                                    null;

                                                setPartsPdf(
                                                    file
                                                );

                                            }}
                                        />

                                    </label>

                                </div>


                                {partsPdf ? (

                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-white px-4 py-3">

                                        <div className="flex min-w-0 items-center gap-3">

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">

                                                <FileText
                                                    size={19}
                                                />

                                            </div>


                                            <div className="min-w-0">

                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {
                                                        partsPdf.name
                                                    }
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-400">

                                                    {(
                                                        partsPdf.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(
                                                        2
                                                    )}{" "}
                                                    MB · PDF listo

                                                </p>

                                            </div>

                                        </div>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPartsPdf(
                                                    null
                                                )
                                            }
                                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                        >

                                            <X
                                                size={17}
                                            />

                                        </button>

                                    </div>

                                ) : (

                                    <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-white px-5 py-8 text-center">

                                        <Upload
                                            size={24}
                                            className="mx-auto text-blue-400"
                                        />

                                        <p className="mt-2 text-sm font-semibold text-slate-700">
                                            Todavía no cargaste el PDF
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Máximo 15 MB
                                        </p>

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                COSTOS
                            ================================================= */}

                            <div className="mt-6">

                                <div className="mb-4">

                                    <h3 className="text-base font-bold text-slate-900">
                                        Costos
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Indicá los valores de repuestos y mano de obra.
                                    </p>

                                </div>


                                <div className="grid gap-5 sm:grid-cols-2">

                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Costo de repuestos
                                        </label>

                                        <div className="relative">

                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                $
                                            </span>

                                            <input
                                                type="number"
                                                min="0"
                                                value={
                                                    newBudget.partsCost
                                                }
                                                onChange={(e) =>
                                                    setNewBudget(
                                                        {
                                                            ...newBudget,
                                                            partsCost:
                                                                e
                                                                    .target
                                                                    .value,
                                                        }
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                            />

                                        </div>

                                    </div>


                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Mano de obra
                                        </label>

                                        <div className="relative">

                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                $
                                            </span>

                                            <input
                                                type="number"
                                                min="0"
                                                value={
                                                    newBudget.laborCost
                                                }
                                                onChange={(e) =>
                                                    setNewBudget(
                                                        {
                                                            ...newBudget,
                                                            laborCost:
                                                                e
                                                                    .target
                                                                    .value,
                                                        }
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                CONCEPTOS
                            ================================================= */}

                            <div className="mt-6">

                                <div className="mb-4 flex items-center justify-between">

                                    <div>

                                        <h3 className="text-base font-bold text-slate-900">
                                            Conceptos
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Podés agregar el detalle de los trabajos realizados.
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={
                                            addBudgetItem
                                        }
                                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >

                                        <Plus
                                            size={15}
                                        />

                                        Agregar

                                    </button>

                                </div>


                                <div className="overflow-hidden rounded-xl border border-slate-200">

                                    <div className="hidden grid-cols-[120px_1fr_90px_130px_40px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid">

                                        <span>
                                            Tipo
                                        </span>

                                        <span>
                                            Descripción
                                        </span>

                                        <span>
                                            Cantidad
                                        </span>

                                        <span>
                                            Precio
                                        </span>

                                        <span />

                                    </div>


                                    <div className="divide-y divide-slate-100">

                                        {budgetItems.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="grid gap-3 p-4 md:grid-cols-[120px_1fr_90px_130px_40px] md:items-center"
                                                >

                                                    <select
                                                        value={
                                                            item.type
                                                        }
                                                        onChange={(e) =>
                                                            updateBudgetItem(
                                                                index,
                                                                "type",
                                                                e.target.value as BudgetItem["type"]
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
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
                                                        value={
                                                            item.name
                                                        }
                                                        onChange={(e) =>
                                                            updateBudgetItem(
                                                                index,
                                                                "name",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Descripción del trabajo..."
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                                                    />


                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={
                                                            item.quantity
                                                        }
                                                        onChange={(e) =>
                                                            updateBudgetItem(
                                                                index,
                                                                "quantity",
                                                                Number(
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                                                    />


                                                    <div className="relative">

                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                                            $
                                                        </span>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={
                                                                item.price
                                                            }
                                                            onChange={(e) =>
                                                                updateBudgetItem(
                                                                    index,
                                                                    "price",
                                                                    Number(
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500"
                                                        />

                                                    </div>


                                                    <button
                                                        type="button"
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

                                                        <X
                                                            size={15}
                                                        />

                                                    </button>

                                                </div>

                                            )
                                        )}

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                TOTAL
                            ================================================= */}

                            <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">

                                <div>

                                    <p className="text-sm font-semibold">
                                        Total del presupuesto
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Repuestos + mano de obra
                                    </p>

                                </div>


                                <div className="text-right">

                                    <p className="text-xs text-slate-400">

                                        {formatCurrency(
                                            partsCost
                                        )}{" "}

                                        +{" "}

                                        {formatCurrency(
                                            laborCost
                                        )}

                                    </p>


                                    <p className="mt-1 text-3xl font-bold tracking-tight">

                                        {formatCurrency(
                                            budgetTotal
                                        )}

                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                OBSERVACIONES
                            ================================================= */}

                            <div className="mt-6">

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Observaciones
                                </label>

                                <textarea
                                    rows={3}
                                    value={
                                        newBudget.notes
                                    }
                                    onChange={(e) =>
                                        setNewBudget(
                                            {
                                                ...newBudget,
                                                notes:
                                                    e
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    placeholder="Condiciones, detalles del trabajo o información adicional..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                        </div>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                disabled={
                                    saving
                                }
                                onClick={() =>
                                    setShowModal(
                                        false
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >

                                Cancelar

                            </button>


                            <button
                                type="button"
                                disabled={
                                    saving
                                }
                                onClick={
                                    handleCreateBudget
                                }
                                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {saving ? (

                                    <>

                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />

                                        Generando presupuesto...

                                    </>

                                ) : (

                                    <>

                                        <FileText
                                            size={17}
                                        />

                                        Crear y generar PDF

                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =====================================================
    MODAL VER PRESUPUESTO
===================================================== */}

{selectedBudget && (

    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Presupuesto
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {selectedBudget.id}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {selectedBudget.client}
                    </p>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        setSelectedBudget(
                            null
                        )
                    }
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >

                    <X
                        size={20}
                    />

                </button>

            </div>


            {/* INFORMACIÓN */}

            <div className="space-y-4 p-6">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-xs font-medium text-slate-400">
                                Cliente
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                {selectedBudget.client}
                            </p>

                        </div>


                        <div className="text-right">

                            <p className="text-xs font-medium text-slate-400">
                                Total
                            </p>

                            <p className="mt-1 text-base font-bold text-slate-900">
                                {formatCurrency(
                                    selectedBudget.total
                                )}
                            </p>

                        </div>

                    </div>


                    <div className="mt-4 grid grid-cols-2 gap-4">

                        <div>

                            <p className="text-xs font-medium text-slate-400">
                                Vehículo
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                                {selectedBudget.vehicle}
                            </p>

                        </div>


                        <div>

                            <p className="text-xs font-medium text-slate-400">
                                Patente
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                                {selectedBudget.plate}
                            </p>

                        </div>

                    </div>

                </div>


                {/* PDF COMPLETO */}

                <div className="rounded-xl border border-slate-200 bg-white p-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

                            <FileText
                                size={19}
                            />

                        </div>


                        <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold text-slate-800">
                                Presupuesto completo
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Presupuesto + cotización de repuestos
                            </p>

                        </div>

                    </div>


                    <div className="mt-4 flex gap-2">

                        {selectedBudget.finalPdfUrl && (

                            <a
                                href={
                                    selectedBudget.finalPdfUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >

                                <Eye
                                    size={15}
                                />

                                Ver PDF

                            </a>

                        )}


                        {selectedBudget.finalPdfUrl && (

                            <a
                                href={
                                    selectedBudget.finalPdfUrl
                                }
                                download={`${selectedBudget.id}-completo.pdf`}
                                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >

                                <Download
                                    size={15}
                                />

                                Descargar

                            </a>

                        )}

                    </div>

                </div>


                {/* PDF REPUESTOS */}

                <div className="rounded-xl border border-slate-200 bg-white p-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">

                            <FileText
                                size={19}
                            />

                        </div>


                        <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold text-slate-800">
                                Cotización de repuestos
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                                PDF original enviado por el proveedor
                            </p>

                        </div>

                    </div>


                    <div className="mt-4 flex gap-2">

                        {selectedBudget.partsPdfUrl && (

                            <a
                                href={
                                    selectedBudget.partsPdfUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >

                                <Eye
                                    size={15}
                                />

                                Ver PDF

                            </a>

                        )}


                        {selectedBudget.partsPdfUrl && (

                            <a
                                href={
                                    selectedBudget.partsPdfUrl
                                }
                                download={`${selectedBudget.id}-repuestos.pdf`}
                                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >

                                <Download
                                    size={15}
                                />

                                Descargar

                            </a>

                        )}

                    </div>

                </div>

            </div>


            {/* FOOTER */}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4">

                <button
                    type="button"
                    onClick={() =>
                        setSelectedBudget(
                            null
                        )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >

                    Cerrar

                </button>

            </div>

        </div>

    </div>

)}

        </AdminLayout>
    );
};

export default Presupuestos;