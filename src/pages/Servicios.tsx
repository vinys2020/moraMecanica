import {
    Car,
    CheckCircle2,
    ChevronDown,
    Clock3,
    DollarSign,
    Edit3,
    Eye,
    FileText,
    Gauge,
    Plus,
    Search,
    UserRound,
    Wrench,
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

import type { LucideIcon } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { db } from "../config/firebase";

/* ============================================================
   TYPES
============================================================ */

type ServiceStatus =
    | "Pendiente"
    | "En proceso"
    | "Completado"
    | "Cancelado";

type ServiceCategory =
    | "Mecánica"
    | "Mantenimiento"
    | "Diagnóstico"
    | "Electricidad"
    | "Neumáticos"
    | "Otro";

interface Vehicle {
    id: string;
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
    color: string;
    kilometraje: number;
    clienteId: string | null;
    clienteNombre: string;
    imagenUrl: string;
    estado: string;
}

interface Service {
    id: string;
    vehiculoId: string;
    clienteId: string | null;
    clienteNombre: string;
    vehiculoNombre: string;
    patente: string;
    imagenUrl: string;
    tipo: string;
    categoria: ServiceCategory;
    descripcion: string;
    fecha: any;
    fechaEntregaEstimada: any;
    kilometraje: number;
    precio: number;
    estado: ServiceStatus;
    observaciones: string;
    creadoEn: any;
    facturado: false,
facturaId: null,
}

/* ============================================================
   CONSTANTS
============================================================ */

const SERVICE_CATEGORIES: ServiceCategory[] = [
    "Mecánica",
    "Mantenimiento",
    "Diagnóstico",
    "Electricidad",
    "Neumáticos",
    "Otro",
];

const SERVICE_STATUSES: ServiceStatus[] = [
    "Pendiente",
    "En proceso",
    "Completado",
    "Cancelado",
];

/* ============================================================
   COMPONENT
============================================================ */

const Servicios = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    /* ========================================================
       DETAIL MODAL
    ======================================================== */

    const [selectedService, setSelectedService] =
        useState<Service | null>(null);

    const [showServiceDetailModal, setShowServiceDetailModal] =
        useState(false);

    /* ========================================================
       GENERAL
    ======================================================== */

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");

    const [categoryFilter, setCategoryFilter] = useState<
        "Todas" | ServiceCategory
    >("Todas");

    const [statusFilter, setStatusFilter] = useState<
        "Todos" | ServiceStatus
    >("Todos");

    /* ========================================================
       SERVICE FORM MODAL
    ======================================================== */

    const [showModal, setShowModal] = useState(false);

    const [editingService, setEditingService] =
        useState<Service | null>(null);

    /* ========================================================
       FORM
    ======================================================== */

    const [newService, setNewService] = useState({
        vehiculoId: "",
        tipo: "",
        categoria: "" as ServiceCategory | "",
        descripcion: "",
        fecha: getTodayInputDate(),
        fechaEntregaEstimada: "",
        kilometraje: "",
        precio: "",
        estado: "Completado" as ServiceStatus,
        observaciones: "",
    });

    /* ============================================================
       LOAD DATA
    ============================================================ */

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

/* =================================================
   USUARIOS / CLIENTES
================================================= */

const usuariosSnapshot = await getDocs(
    collection(db, "usuarios")
);

const clientesMap = new Map<string, string>();

usuariosSnapshot.docs.forEach((item) => {
    const data = item.data();

    const nombre =
        data.nombre ||
        data.nombreCompleto ||
        `${data.nombre || ""} ${data.apellido || ""}`.trim() ||
        data.email ||
        "Sin nombre";

    // ID del documento de Firestore
    clientesMap.set(
        item.id,
        nombre
    );

    // UID de Firebase Auth
    if (data.uid) {
        clientesMap.set(
            data.uid,
            nombre
        );
    }
});


/* =================================================
   VEHÍCULOS
================================================= */

const vehiculosSnapshot = await getDocs(
    collection(db, "vehiculos")
);

const vehiculosData: Vehicle[] =
    vehiculosSnapshot.docs.map((item) => {
        const data = item.data();

        const clienteId =
            data.clienteId ?? null;

        const clienteNombre =
            data.clienteNombre ||
            (clienteId
                ? clientesMap.get(clienteId)
                : null) ||
            "Sin cliente";

        console.log(
            "VEHÍCULO:",
            item.id,
            {
                clienteId,
                clienteNombre,
                datosVehiculo: data,
            }
        );

        return {
            id: item.id,

            marca:
                data.marca ?? "",

            modelo:
                data.modelo ?? "",

            anio:
                Number(
                    data.anio ?? 0
                ),

            patente:
                data.patente ?? "",

            color:
                data.color ?? "",

            kilometraje:
                Number(
                    data.kilometraje ?? 0
                ),

            clienteId,

            clienteNombre,

            imagenUrl:
                data.imagenUrl ?? "",

            estado:
                data.estado ?? "Activo",
        };
    });

setVehicles(vehiculosData);

            /* =================================================
               SERVICIOS
            ================================================= */

            const serviciosSnapshot = await getDocs(
                collection(db, "servicios")
            );

            const serviciosData: Service[] =
                serviciosSnapshot.docs.map((item) => {
                    const data = item.data();

                    const vehicle =
                        vehiculosData.find(
                            (v) =>
                                v.id ===
                                data.vehiculoId
                        );

                    return {
                        id: item.id,

                        vehiculoId:
                            data.vehiculoId ?? "",

                        clienteId:
                            data.clienteId ??
                            vehicle?.clienteId ??
                            null,

                        clienteNombre:
                            data.clienteNombre ??
                            vehicle?.clienteNombre ??
                            "Sin cliente",

                        vehiculoNombre:
                            data.vehiculoNombre ??
                            (vehicle
                                ? `${vehicle.marca} ${vehicle.modelo}`.trim()
                                : "Vehículo eliminado"),

                        patente:
                            data.patente ??
                            vehicle?.patente ??
                            "",

                        imagenUrl:
                            data.imagenUrl ??
                            vehicle?.imagenUrl ??
                            "",

                        tipo:
                            data.tipo ??
                            "Servicio",

                        categoria:
                            normalizeCategory(
                                data.categoria
                            ),

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
                                data.kilometraje ?? 0
                            ),

                        precio:
                            Number(
                                data.precio ?? 0
                            ),

                        estado:
                            normalizeStatus(
                                data.estado
                            ),

                        observaciones:
                            data.observaciones ??
                            "",

                        creadoEn:
                            data.creadoEn ??
                            null,

                        facturado: data.facturado ?? false,
                        facturaId: data.facturaId ?? null,

                    };
                });

            /* =================================================
               MÁS RECIENTES PRIMERO
            ================================================= */

            serviciosData.sort((a, b) => {
                const dateA =
                    getDateValue(a.fecha);

                const dateB =
                    getDateValue(b.fecha);

                return dateB - dateA;
            });

            setServices(serviciosData);
        } catch (error) {
            console.error(
                "Error cargando servicios:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    /* ============================================================
       OPEN DETAIL
    ============================================================ */

    const openServiceDetailModal = (
        service: Service
    ) => {
        setSelectedService(service);
        setShowServiceDetailModal(true);
    };

    /* ============================================================
       CLOSE DETAIL
    ============================================================ */

    const closeServiceDetailModal = () => {
        setShowServiceDetailModal(false);
        setSelectedService(null);
    };

    /* ============================================================
       FILTER
    ============================================================ */

    const filteredServices = useMemo(() => {
        const normalizedSearch =
            search.toLowerCase().trim();

        return services.filter((service) => {
            const matchesSearch =
                service.tipo
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                service.descripcion
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                service.vehiculoNombre
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                service.patente
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                service.clienteNombre
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesCategory =
                categoryFilter === "Todas" ||
                service.categoria ===
                    categoryFilter;

            const matchesStatus =
                statusFilter === "Todos" ||
                service.estado ===
                    statusFilter;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });
    }, [
        services,
        search,
        categoryFilter,
        statusFilter,
    ]);

    /* ============================================================
       STATS
    ============================================================ */

    const stats = useMemo(() => {
        const completed =
            services.filter(
                (service) =>
                    service.estado ===
                    "Completado"
            );

        const inProcess =
            services.filter(
                (service) =>
                    service.estado ===
                    "En proceso"
            );

        const pending =
            services.filter(
                (service) =>
                    service.estado ===
                    "Pendiente"
            );

        const totalRevenue =
            completed.reduce(
                (total, service) =>
                    total + service.precio,
                0
            );

        return {
            total: services.length,
            completed:
                completed.length,
            inProcess:
                inProcess.length,
            pending:
                pending.length,
            revenue:
                totalRevenue,
        };
    }, [services]);

    /* ============================================================
       CREATE SERVICE
    ============================================================ */

    const handleCreateService =
        async () => {
            if (
                !newService.vehiculoId
            ) {
                alert(
                    "Seleccioná el vehículo al que corresponde el servicio."
                );
                return;
            }

            if (
                !newService.tipo.trim()
            ) {
                alert(
                    "Ingresá el nombre del servicio realizado."
                );
                return;
            }

            if (
                !newService.categoria
            ) {
                alert(
                    "Seleccioná una categoría."
                );
                return;
            }

            if (!newService.fecha) {
                alert(
                    "Seleccioná la fecha del servicio."
                );
                return;
            }

            const vehicle =
                vehicles.find(
                    (item) =>
                        item.id ===
                        newService.vehiculoId
                );

            if (!vehicle) {
                alert(
                    "No se encontró el vehículo seleccionado."
                );
                return;
            }

            try {
                setSaving(true);

                const precio =
                    Number(
                        newService.precio ||
                            0
                    );

                const kilometraje =
                    Number(
                        newService.kilometraje ||
                            vehicle.kilometraje ||
                            0
                    );

                if (precio < 0) {
                    alert(
                        "El importe no puede ser negativo."
                    );
                    return;
                }

                if (kilometraje < 0) {
                    alert(
                        "El kilometraje no puede ser negativo."
                    );
                    return;
                }

                await addDoc(
                    collection(
                        db,
                        "servicios"
                    ),
                    {
                        vehiculoId:
                            vehicle.id,

                        clienteId:
                            vehicle.clienteId ??
                            null,

                        clienteNombre:
                            vehicle.clienteNombre ??
                            "Sin cliente",

                        vehiculoNombre:
                            `${vehicle.marca} ${vehicle.modelo}`.trim(),

                        patente:
                            vehicle.patente ??
                            "",

                        imagenUrl:
                            vehicle.imagenUrl ??
                            "",

                        tipo:
                            newService.tipo.trim(),

                        categoria:
                            newService.categoria,

                        descripcion:
                            newService.descripcion.trim(),

                        fecha:
                            newService.fecha,

                        fechaEntregaEstimada:
                            newService
                                .fechaEntregaEstimada ||
                            null,

                        kilometraje,

                        precio,

                        estado:
                            newService.estado,

                        observaciones:
                            newService.observaciones.trim(),

                        creadoEn:
                            serverTimestamp(),
                        
                        facturado: false,
                        facturaId: null,
                    }
                );

                /* =================================================
                   ACTUALIZAR VEHÍCULO
                ================================================= */

                const currentKilometraje =
                    Number(
                        vehicle.kilometraje ||
                            0
                    );

                const vehicleUpdates: {
                    kilometraje?: number;
                    ultimoServicio?: string;
                } = {};

                if (
                    kilometraje >
                    currentKilometraje
                ) {
                    vehicleUpdates.kilometraje =
                        kilometraje;
                }

                if (
                    newService.estado ===
                    "Completado"
                ) {
                    vehicleUpdates.ultimoServicio =
                        newService.fecha;
                }

                if (
                    Object.keys(
                        vehicleUpdates
                    ).length > 0
                ) {
                    await updateDoc(
                        doc(
                            db,
                            "vehiculos",
                            vehicle.id
                        ),
                        vehicleUpdates
                    );
                }

                await cargarDatos();

                resetForm();

                setShowModal(false);
            } catch (error) {
                console.error(
                    "Error creando servicio:",
                    error
                );

                alert(
                    "No se pudo registrar el servicio."
                );
            } finally {
                setSaving(false);
            }
        };

    /* ============================================================
       UPDATE SERVICE
    ============================================================ */

    const handleUpdateService =
        async () => {
            if (!editingService) {
                return;
            }

            if (
                !newService.vehiculoId
            ) {
                alert(
                    "Seleccioná el vehículo al que corresponde el servicio."
                );
                return;
            }

            if (
                !newService.tipo.trim()
            ) {
                alert(
                    "Ingresá el nombre del servicio realizado."
                );
                return;
            }

            if (
                !newService.categoria
            ) {
                alert(
                    "Seleccioná una categoría."
                );
                return;
            }

            if (!newService.fecha) {
                alert(
                    "Seleccioná la fecha del servicio."
                );
                return;
            }

            const vehicle =
                vehicles.find(
                    (item) =>
                        item.id ===
                        newService.vehiculoId
                );

            if (!vehicle) {
                alert(
                    "No se encontró el vehículo seleccionado."
                );
                return;
            }

            try {
                setSaving(true);

                const precio =
                    Number(
                        newService.precio ||
                            0
                    );

                const kilometraje =
                    Number(
                        newService.kilometraje ||
                            vehicle.kilometraje ||
                            0
                    );

                if (precio < 0) {
                    alert(
                        "El importe no puede ser negativo."
                    );
                    return;
                }

                if (kilometraje < 0) {
                    alert(
                        "El kilometraje no puede ser negativo."
                    );
                    return;
                }

                await updateDoc(
                    doc(
                        db,
                        "servicios",
                        editingService.id
                    ),
                    {
                        vehiculoId:
                            vehicle.id,

                        clienteId:
                            vehicle.clienteId ??
                            null,

                        clienteNombre:
                            vehicle.clienteNombre ??
                            "Sin cliente",

                        vehiculoNombre:
                            `${vehicle.marca} ${vehicle.modelo}`.trim(),

                        patente:
                            vehicle.patente ??
                            "",

                        imagenUrl:
                            vehicle.imagenUrl ??
                            "",

                        tipo:
                            newService.tipo.trim(),

                        categoria:
                            newService.categoria,

                        descripcion:
                            newService.descripcion.trim(),

                        fecha:
                            newService.fecha,

                        fechaEntregaEstimada:
                            newService
                                .fechaEntregaEstimada ||
                            null,

                        kilometraje,

                        precio,

                        estado:
                            newService.estado,

                        observaciones:
                            newService.observaciones.trim(),
                    }
                );

                /* =================================================
                   ACTUALIZAR VEHÍCULO
                ================================================= */

                const currentKilometraje =
                    Number(
                        vehicle.kilometraje ||
                            0
                    );

                const vehicleUpdates: {
                    kilometraje?: number;
                    ultimoServicio?: string;
                } = {};

                if (
                    kilometraje >
                    currentKilometraje
                ) {
                    vehicleUpdates.kilometraje =
                        kilometraje;
                }

                if (
                    newService.estado ===
                    "Completado"
                ) {
                    vehicleUpdates.ultimoServicio =
                        newService.fecha;
                }

                if (
                    Object.keys(
                        vehicleUpdates
                    ).length > 0
                ) {
                    await updateDoc(
                        doc(
                            db,
                            "vehiculos",
                            vehicle.id
                        ),
                        vehicleUpdates
                    );
                }

                await cargarDatos();

                setEditingService(null);

                setShowModal(false);

                resetForm();
            } catch (error) {
                console.error(
                    "Error modificando servicio:",
                    error
                );

                alert(
                    "No se pudo modificar el servicio."
                );
            } finally {
                setSaving(false);
            }
        };

    /* ============================================================
       RESET
    ============================================================ */

    const resetForm = () => {
        setNewService({
            vehiculoId: "",
            tipo: "",
            categoria: "",
            descripcion: "",
            fecha: getTodayInputDate(),
            fechaEntregaEstimada: "",
            kilometraje: "",
            precio: "",
            estado: "Completado",
            observaciones: "",
        });
    };

    /* ============================================================
       OPEN NEW SERVICE
    ============================================================ */

    const openNewServiceModal =
        () => {
            if (
                vehicles.length === 0
            ) {
                alert(
                    "Primero necesitás registrar al menos un vehículo."
                );
                return;
            }

            setEditingService(null);

            resetForm();

            setShowModal(true);
        };

    /* ============================================================
       OPEN EDIT SERVICE
    ============================================================ */

    const openEditServiceModal =
        (service: Service) => {
            setEditingService(
                service
            );

            setNewService({
                vehiculoId:
                    service.vehiculoId,

                tipo:
                    service.tipo,

                categoria:
                    service.categoria,

                descripcion:
                    service.descripcion,

                fecha:
                    getInputDate(
                        service.fecha
                    ),

                fechaEntregaEstimada:
                    getInputDate(
                        service.fechaEntregaEstimada
                    ),

                kilometraje:
                    service.kilometraje
                        ? String(
                              service.kilometraje
                          )
                        : "",

                precio:
                    service.precio
                        ? String(
                              service.precio
                          )
                        : "",

                estado:
                    service.estado,

                observaciones:
                    service.observaciones,
            });

            setShowModal(true);
        };

    /* ============================================================
       CLOSE FORM MODAL
    ============================================================ */

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);

        setEditingService(null);

        resetForm();
    };

    /* ============================================================
       FORMATTERS
    ============================================================ */

    const formatPrice = (
        value: number
    ) => {
        return value.toLocaleString(
            "es-AR",
            {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
            }
        );
    };

    const formatDate = (
        value: any
    ) => {
        const date =
            parseDate(value);

        if (!date) {
            return "Sin fecha";
        }

        return date.toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    /* ============================================================
       CATEGORY STYLE
    ============================================================ */

    const getCategoryStyle = (
        category: ServiceCategory
    ) => {
        switch (category) {
            case "Mecánica":
                return "bg-blue-50 text-blue-700";

            case "Mantenimiento":
                return "bg-emerald-50 text-emerald-700";

            case "Diagnóstico":
                return "bg-violet-50 text-violet-700";

            case "Electricidad":
                return "bg-amber-50 text-amber-700";

            case "Neumáticos":
                return "bg-cyan-50 text-cyan-700";

            default:
                return "bg-slate-100 text-slate-600";
        }
    };

    /* ============================================================
       STATUS STYLE
    ============================================================ */

    const getStatusStyle = (
        status: ServiceStatus
    ) => {
        switch (status) {
            case "Completado":
                return "bg-emerald-50 text-emerald-700";

            case "En proceso":
                return "bg-blue-50 text-blue-700";

            case "Pendiente":
                return "bg-amber-50 text-amber-700";

            case "Cancelado":
                return "bg-red-50 text-red-700";

            default:
                return "bg-slate-100 text-slate-500";
        }
    };

    /* ============================================================
       LOADING
    ============================================================ */

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">

                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                        <p className="text-sm text-slate-400">
                            Cargando servicios...
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

            <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

                    <div>

                        <p className="mb-1 text-sm font-medium text-blue-600">
                            Gestión del taller
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Servicios
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Registrá y consultá los trabajos realizados en cada vehículo del taller.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={
                            openNewServiceModal
                        }
                        className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                        <Plus size={18} />

                        Registrar servicio
                    </button>

                </div>

                {/* ==================================================
                    STATS
                ================================================== */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <StatCard
                        title="Servicios registrados"
                        value={stats.total.toString()}
                        description="Historial total"
                        icon={Wrench}
                    />

                    <StatCard
                        title="Completados"
                        value={stats.completed.toString()}
                        description="Trabajos finalizados"
                        icon={CheckCircle2}
                    />

                    <StatCard
                        title="En proceso"
                        value={stats.inProcess.toString()}
                        description={`${stats.pending} pendientes`}
                        icon={Clock3}
                    />

                    <StatCard
                        title="Facturación"
                        value={formatPrice(
                            stats.revenue
                        )}
                        description="Servicios completados"
                        icon={DollarSign}
                    />

                </div>

                {/* ==================================================
                    HISTORY
                ================================================== */}

                <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* FILTERS */}

                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">

                        <div>

                            <h2 className="text-lg font-bold text-slate-900">
                                Historial de servicios
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {filteredServices.length}{" "}
                                servicios encontrados
                            </p>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            {/* SEARCH */}

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
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Buscar vehículo, patente..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-64"
                                />

                            </div>

                            {/* CATEGORY */}

                            <select
                                value={
                                    categoryFilter
                                }
                                onChange={(e) =>
                                    setCategoryFilter(
                                        e.target.value as
                                            | "Todas"
                                            | ServiceCategory
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >

                                <option value="Todas">
                                    Todas las categorías
                                </option>

                                {SERVICE_CATEGORIES.map(
                                    (category) => (
                                        <option
                                            key={
                                                category
                                            }
                                            value={
                                                category
                                            }
                                        >
                                            {
                                                category
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                            {/* STATUS */}

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as
                                            | "Todos"
                                            | ServiceStatus
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >

                                <option value="Todos">
                                    Todos los estados
                                </option>

                                {SERVICE_STATUSES.map(
                                    (status) => (
                                        <option
                                            key={
                                                status
                                            }
                                            value={
                                                status
                                            }
                                        >
                                            {
                                                status
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                    </div>

                    {/* ==================================================
                        TABLE
                    ================================================== */}

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1080px]">

                            <thead>

                                <tr className="border-b border-slate-100 bg-slate-50/70">

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Vehículo
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Servicio
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Fecha
                                    </th>

                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Entrega estimada
                                    </th>


                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Estado
                                    </th>

                                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Acción
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredServices.map(
                                    (
                                        service,
                                        index
                                    ) => (
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

                                            {/* VEHICLE */}

                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-3">

                                                    {service.imagenUrl ? (
                                                        <img
                                                            src={
                                                                service.imagenUrl
                                                            }
                                                            alt={
                                                                service.vehiculoNombre
                                                            }
                                                            className="h-12 w-16 rounded-xl border border-slate-200 bg-slate-100 object-contain"
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                                            <Car
                                                                size={
                                                                    22
                                                                }
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">

                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {
                                                                service.vehiculoNombre
                                                            }
                                                        </p>

                                                        <div className="mt-1 flex items-center gap-2">

                                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600">
                                                                {
                                                                    service.patente
                                                                }
                                                            </span>

                                                            <span className="max-w-[180px] truncate text-xs text-slate-400">
                                                                {
                                                                    service.clienteNombre
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* SERVICE */}

                                            <td className="px-5 py-4">

                                                <div>

                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {
                                                            service.tipo
                                                        }
                                                    </p>

                                                    <span
                                                        className={`mt-1 inline-flex rounded-full px-0.5 py-1 text-[10px] font-semibold ${getCategoryStyle(
                                                            service.categoria
                                                        )}`}
                                                    >
                                                        {
                                                            service.categoria
                                                        }
                                                    </span>

                                                    {service.descripcion && (
                                                        <p className="mt-1 max-w-[260px] truncate text-xs text-slate-400">
                                                            {
                                                                service.descripcion
                                                            }
                                                        </p>
                                                    )}

                                                </div>

                                            </td>

                                            {/* DATE */}

                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-2">

                                                    <Clock3
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

                                            {/* DELIVERY */}

                                            <td className="px-5 py-4">

                                                {service.fechaEntregaEstimada ? (
                                                    <div className="flex items-center gap-2">

                                                        <Clock3
                                                            size={
                                                                15
                                                            }
                                                            className="text-blue-500"
                                                        />

                                                        <span className="text-sm font-medium text-slate-700">
                                                            {formatDate(
                                                                service.fechaEntregaEstimada
                                                            )}
                                                        </span>

                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        Sin definir
                                                    </span>
                                                )}

                                            </td>

                                            

                                            {/* STATUS */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                                                        service.estado
                                                    )}`}
                                                >
                                                    {
                                                        service.estado
                                                    }
                                                </span>

                                            </td>

                                            {/* ACTION */}

                                            <td className="px-5 py-4 text-right">

                                                <div className="flex items-center justify-end gap-1">

                                                    {/* VIEW */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openServiceDetailModal(
                                                                service
                                                            )
                                                        }
                                                        title="Ver información del servicio"
                                                        className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                    >
                                                        <Eye
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>

                                                    {/* EDIT */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditServiceModal(
                                                                service
                                                            )
                                                        }
                                                        title="Modificar servicio"
                                                        className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                    >
                                                        <Edit3
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* EMPTY */}

                    {filteredServices.length ===
                        0 && (
                        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Wrench
                                    size={
                                        24
                                    }
                                />
                            </div>

                            <h3 className="mt-4 text-sm font-bold text-slate-900">
                                No hay servicios registrados
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                Cuando registres un trabajo realizado en un vehículo, va a aparecer acá.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    openNewServiceModal
                                }
                                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <Plus
                                    size={
                                        17
                                    }
                                />

                                Registrar servicio
                            </button>

                        </div>
                    )}

                </section>

            </div>

            {/* ==================================================
                SERVICE FORM MODAL
            ================================================== */}

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">

                        {/* HEADER */}

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

                            <div>

                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                    Gestión del taller
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    {editingService
                                        ? "Modificar servicio"
                                        : "Registrar servicio"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {editingService
                                        ? "Modificá los datos del servicio registrado."
                                        : "Asociá el trabajo realizado con un vehículo."}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X
                                    size={
                                        20
                                    }
                                />
                            </button>

                        </div>

                        {/* FORM */}

                        <div className="space-y-5 p-6">

                            {/* VEHICLE */}

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Vehículo
                                </label>

                                <div className="relative">

                                    <Car
                                        size={
                                            18
                                        }
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <select
                                        value={
                                            newService.vehiculoId
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            const vehicle =
                                                vehicles.find(
                                                    (
                                                        item
                                                    ) =>
                                                        item.id ===
                                                        e
                                                            .target
                                                            .value
                                                );

                                            setNewService(
                                                {
                                                    ...newService,

                                                    vehiculoId:
                                                        e
                                                            .target
                                                            .value,

                                                    kilometraje:
                                                        vehicle?.kilometraje
                                                            ? String(
                                                                  vehicle.kilometraje
                                                              )
                                                            : "",
                                                }
                                            );
                                        }}
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    >

                                        <option value="">
                                            Seleccioná un vehículo
                                        </option>

                                        {vehicles.map(
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
                                                    —{" "}
                                                    {
                                                        vehicle.patente
                                                    }{" "}
                                                    —{" "}
                                                    {
                                                        vehicle.clienteNombre
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                    <ChevronDown
                                        size={
                                            17
                                        }
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>

                                {newService.vehiculoId && (
                                    <VehiclePreview
                                        vehicle={
                                            vehicles.find(
                                                (
                                                    item
                                                ) =>
                                                    item.id ===
                                                    newService.vehiculoId
                                            ) ??
                                            null
                                        }
                                    />
                                )}

                            </div>

                            {/* SERVICE + CATEGORY */}

                            <div className="grid gap-5 sm:grid-cols-2">

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Servicio realizado
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            newService.tipo
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewService(
                                                {
                                                    ...newService,
                                                    tipo: e
                                                        .target
                                                        .value,
                                                }
                                            )
                                        }
                                        placeholder="Ej. Cambio de aceite"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Categoría
                                    </label>

                                    <select
                                        value={
                                            newService.categoria
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewService(
                                                {
                                                    ...newService,

                                                    categoria:
                                                        e
                                                            .target
                                                            .value as ServiceCategory,
                                                }
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    >

                                        <option value="">
                                            Seleccioná una categoría
                                        </option>

                                        {SERVICE_CATEGORIES.map(
                                            (
                                                category
                                            ) => (
                                                <option
                                                    key={
                                                        category
                                                    }
                                                    value={
                                                        category
                                                    }
                                                >
                                                    {
                                                        category
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                            {/* DATES */}

                            <div className="grid gap-5 sm:grid-cols-2">

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Fecha del servicio
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            newService.fecha
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewService(
                                                {
                                                    ...newService,
                                                    fecha: e
                                                        .target
                                                        .value,
                                                }
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Fecha de entrega estimada

                                        <span className="ml-1 text-xs font-normal text-slate-400">
                                            (opcional)
                                        </span>
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            newService.fechaEntregaEstimada
                                        }
                                        min={
                                            newService.fecha
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewService(
                                                {
                                                    ...newService,

                                                    fechaEntregaEstimada:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Podés dejar este campo vacío si todavía no hay una fecha definida.
                                    </p>

                                </div>

                            </div>

                            {/* KM + PRICE */}

                            <div className="grid gap-5 sm:grid-cols-2">

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Kilometraje
                                    </label>

                                    <div className="relative">

                                        <Gauge
                                            size={
                                                17
                                            }
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                newService.kilometraje
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setNewService(
                                                    {
                                                        ...newService,

                                                        kilometraje:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            placeholder="82450"
                                            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Importe
                                    </label>

                                    <div className="relative">

                                        <DollarSign
                                            size={
                                                17
                                            }
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                newService.precio
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setNewService(
                                                    {
                                                        ...newService,

                                                        precio:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            placeholder="95000"
                                            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* STATUS */}

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Estado
                                </label>

                                <select
                                    value={
                                        newService.estado
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setNewService(
                                            {
                                                ...newService,

                                                estado:
                                                    e
                                                        .target
                                                        .value as ServiceStatus,
                                            }
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                >

                                    {SERVICE_STATUSES.map(
                                        (status) => (
                                            <option
                                                key={
                                                    status
                                                }
                                                value={
                                                    status
                                                }
                                            >
                                                {
                                                    status
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* DESCRIPTION */}

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Descripción del trabajo
                                </label>

                                <textarea
                                    rows={
                                        4
                                    }
                                    value={
                                        newService.descripcion
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setNewService(
                                            {
                                                ...newService,

                                                descripcion:
                                                    e
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    placeholder="Describí qué se realizó en el vehículo..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            {/* OBSERVATIONS */}

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Observaciones
                                </label>

                                <textarea
                                    rows={
                                        3
                                    }
                                    value={
                                        newService.observaciones
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setNewService(
                                            {
                                                ...newService,

                                                observaciones:
                                                    e
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    placeholder="Observaciones adicionales..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            {/* INFO */}

                            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">

                                <FileText
                                    size={
                                        18
                                    }
                                    className="mt-0.5 shrink-0 text-blue-600"
                                />

                                <div>

                                    <p className="text-sm font-semibold text-blue-900">
                                        Servicio asociado al vehículo
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-blue-700">
                                        El servicio quedará asociado al vehículo seleccionado y a su cliente. El cliente podrá consultarlo desde su cuenta.
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    editingService
                                        ? handleUpdateService
                                        : handleCreateService
                                }
                                disabled={
                                    saving
                                }
                                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {saving ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        {editingService ? (
                                            <Edit3
                                                size={
                                                    17
                                                }
                                            />
                                        ) : (
                                            <Plus
                                                size={
                                                    17
                                                }
                                            />
                                        )}

                                        {editingService
                                            ? "Guardar cambios"
                                            : "Registrar servicio"}
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ==================================================
                SERVICE DETAIL MODAL
            ================================================== */}

            {showServiceDetailModal &&
                selectedService && (
                    <div
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                        onClick={
                            closeServiceDetailModal
                        }
                    >

                        <div
                            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            {/* HEADER */}

                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                                <div>

                                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                        Detalle del servicio
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                                        {
                                            selectedService.tipo
                                        }
                                    </h2>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeServiceDetailModal
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

                            {/* CONTENT */}

                            <div className="max-h-[70vh] overflow-y-auto p-6">

                                {/* VEHICLE */}

                                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                    {selectedService.imagenUrl ? (
                                        <img
                                            src={
                                                selectedService.imagenUrl
                                            }
                                            alt={
                                                selectedService.vehiculoNombre
                                            }
                                            className="h-20 w-28 rounded-xl border border-slate-200 bg-white object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-28 items-center justify-center rounded-xl bg-white text-slate-400">
                                            <Car
                                                size={
                                                    28
                                                }
                                            />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">

                                        <p className="text-base font-bold text-slate-900">
                                            {
                                                selectedService.vehiculoNombre
                                            }
                                        </p>

                                        <div className="mt-2 flex flex-wrap items-center gap-2">

                                            <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-700">
                                                {
                                                    selectedService.patente
                                                }
                                            </span>

                                            <span className="text-xs text-slate-500">
                                                Cliente:{" "}
                                                <strong className="text-slate-700">
                                                    {
                                                        selectedService.clienteNombre
                                                    }
                                                </strong>
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                {/* SERVICE DATA */}

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                                    <DetailItem
                                        label="Servicio"
                                        value={
                                            selectedService.tipo
                                        }
                                    />

                                    <div className="rounded-xl border border-slate-100 p-4">

                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Categoría
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getCategoryStyle(
                                                selectedService.categoria
                                            )}`}
                                        >
                                            {
                                                selectedService.categoria
                                            }
                                        </span>

                                    </div>

                                    <DetailItem
                                        label="Fecha del servicio"
                                        value={
                                            formatDate(
                                                selectedService.fecha
                                            )
                                        }
                                        icon={
                                            Clock3
                                        }
                                    />

                                    <DetailItem
                                        label="Entrega estimada"
                                        value={
                                            selectedService.fechaEntregaEstimada
                                                ? formatDate(
                                                      selectedService.fechaEntregaEstimada
                                                  )
                                                : "Sin definir"
                                        }
                                        icon={
                                            Clock3
                                        }
                                    />

                                    <DetailItem
                                        label="Kilometraje"
                                        value={
                                            selectedService.kilometraje
                                                ? `${selectedService.kilometraje.toLocaleString(
                                                      "es-AR"
                                                  )} km`
                                                : "Sin registrar"
                                        }
                                        icon={
                                            Gauge
                                        }
                                    />

                                    <DetailItem
                                        label="Importe"
                                        value={formatPrice(
                                            selectedService.precio
                                        )}
                                        valueClassName="text-lg font-bold text-slate-900"
                                    />

                                </div>

                                {/* STATUS */}

                                <div className="mt-4 rounded-xl border border-slate-100 p-4">

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Estado
                                    </p>

                                    <span
                                        className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                            selectedService.estado
                                        )}`}
                                    >
                                        {
                                            selectedService.estado
                                        }
                                    </span>

                                </div>

                                {/* DESCRIPTION */}

                                <div className="mt-4 rounded-xl border border-slate-100 p-4">

                                    <div className="flex items-center gap-2">

                                        <FileText
                                            size={
                                                16
                                            }
                                            className="text-slate-400"
                                        />

                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Descripción del trabajo
                                        </p>

                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                        {
                                            selectedService.descripcion ||
                                            "Sin descripción."
                                        }
                                    </p>

                                </div>

                                {/* OBSERVATIONS */}

                                <div className="mt-4 rounded-xl border border-slate-100 p-4">

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Observaciones
                                    </p>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                        {
                                            selectedService.observaciones ||
                                            "Sin observaciones."
                                        }
                                    </p>

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">

                                <button
                                    type="button"
                                    onClick={
                                        closeServiceDetailModal
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    Cerrar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        closeServiceDetailModal();

                                        openEditServiceModal(
                                            selectedService
                                        );
                                    }}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    <Edit3
                                        size={
                                            16
                                        }
                                    />

                                    Editar servicio
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </AdminLayout>
    );
};

/* ============================================================
   STAT CARD
============================================================ */

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
}: StatCardProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon
                        size={
                            20
                        }
                    />
                </div>

            </div>

            <p className="mt-4 text-xs text-slate-400">
                {description}
            </p>

        </div>
    );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

interface DetailItemProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    valueClassName?: string;
}

function DetailItem({
    label,
    value,
    icon: Icon,
    valueClassName = "text-sm font-medium text-slate-700",
}: DetailItemProps) {
    return (
        <div className="rounded-xl border border-slate-100 p-4">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </p>

            <div className="mt-1 flex items-center gap-2">

                {Icon && (
                    <Icon
                        size={
                            15
                        }
                        className="shrink-0 text-slate-400"
                    />
                )}

                <p
                    className={
                        valueClassName
                    }
                >
                    {value}
                </p>

            </div>

        </div>
    );
}

/* ============================================================
   VEHICLE PREVIEW
============================================================ */

interface VehiclePreviewProps {
    vehicle: Vehicle | null;
}

function VehiclePreview({
    vehicle,
}: VehiclePreviewProps) {
    if (!vehicle) {
        return null;
    }

    return (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">

            {vehicle.imagenUrl ? (
                <img
                    src={
                        vehicle.imagenUrl
                    }
                    alt={`${vehicle.marca} ${vehicle.modelo}`}
                    className="h-14 w-20 rounded-lg border border-slate-200 bg-white object-contain"
                />
            ) : (
                <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-white text-slate-300">
                    <Car
                        size={
                            25
                        }
                    />
                </div>
            )}

            <div className="min-w-0 flex-1">

                <div className="flex items-center gap-2">

                    <p className="truncate text-sm font-semibold text-slate-900">
                        {vehicle.marca}{" "}
                        {vehicle.modelo}
                    </p>

                    <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                        {vehicle.patente}
                    </span>

                </div>

                <div className="mt-1 flex items-center gap-2">

                    <UserRound
                        size={
                            13
                        }
                        className="text-slate-400"
                    />

                    <span className="truncate text-xs text-slate-500">
                        {
                            vehicle.clienteNombre
                        }
                    </span>

                </div>

            </div>

        </div>
    );
}

/* ============================================================
   NORMALIZE CATEGORY
============================================================ */

function normalizeCategory(
    value: any
): ServiceCategory {
    if (
        SERVICE_CATEGORIES.includes(
            value
        )
    ) {
        return value;
    }

    return "Otro";
}

/* ============================================================
   NORMALIZE STATUS
============================================================ */

function normalizeStatus(
    value: any
): ServiceStatus {
    if (
        SERVICE_STATUSES.includes(
            value
        )
    ) {
        return value;
    }

    return "Completado";
}

/* ============================================================
   TODAY
============================================================ */

function getTodayInputDate(): string {
    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* ============================================================
   PARSE DATE
============================================================ */

function parseDate(
    value: any
): Date | null {
    if (!value) {
        return null;
    }

    try {
        /* FIREBASE TIMESTAMP */

        if (
            typeof value?.toDate ===
            "function"
        ) {
            return value.toDate();
        }

        /* JS DATE */

        if (
            value instanceof Date
        ) {
            return value;
        }

        /* YYYY-MM-DD */

        if (
            typeof value ===
                "string" &&
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

        /* STRING */

        if (
            typeof value ===
            "string"
        ) {
            const date =
                new Date(value);

            return Number.isNaN(
                date.getTime()
            )
                ? null
                : date;
        }

        /* NUMBER */

        if (
            typeof value ===
            "number"
        ) {
            const date =
                new Date(value);

            return Number.isNaN(
                date.getTime()
            )
                ? null
                : date;
        }

        /* FIRESTORE RAW TIMESTAMP */

        if (
            typeof value?.seconds ===
            "number"
        ) {
            return new Date(
                value.seconds *
                    1000
            );
        }

        return null;
    } catch {
        return null;
    }
}

/* ============================================================
   DATE VALUE
============================================================ */

function getDateValue(
    value: any
): number {
    const date =
        parseDate(value);

    return date
        ? date.getTime()
        : 0;
}

/* ============================================================
   INPUT DATE
============================================================ */

function getInputDate(
    value: any
): string {
    const date =
        parseDate(value);

    if (!date) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default Servicios;