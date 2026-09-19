import {
    Car,
    ChevronDown,
    Edit3,
    Gauge,
    Plus,
    Search,
    UserRound,
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
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";

import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
} from "react";

import AdminLayout from "../components/AdminLayout";
import { db, storage } from "../config/firebase";

type VehicleStatus =
    | "Activo"
    | "En taller"
    | "Inactivo";

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
    ultimoServicio: any;
    proximoServicio: any;
    estado: VehicleStatus;
    observaciones: string;
    creadoEn: any;
    imagenUrl: string;
    imagenPath: string;
}

interface Client {
    uid: string;
    nombre: string;
    email: string;
    activo: boolean;
}

interface OptimizedImage {
    blob: Blob;
    url: string;
    width: number;
    height: number;
    size: number;
}

const Vehiculos = () => {
    const [vehicles, setVehicles] =
        useState<Vehicle[]>([]);

    const [clients, setClients] =
        useState<Client[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<"Todos" | VehicleStatus>("Todos");

    const [showModal, setShowModal] =
        useState(false);

    const [showEditModal, setShowEditModal] =
        useState(false);

    const [selectedVehicle, setSelectedVehicle] =
        useState<Vehicle | null>(null);

    const [newVehicle, setNewVehicle] =
        useState({
            marca: "",
            modelo: "",
            anio: "",
            patente: "",
            color: "",
            kilometraje: "",
            clienteId: "",
            estado: "Activo" as VehicleStatus,
            observaciones: "",
            proximoServicio: "",
        });

    // FOTO ORIGINAL / EXISTENTE
    const [originalPreview, setOriginalPreview] =
        useState("");

    // FOTO OPTIMIZADA
    const [optimizedImage, setOptimizedImage] =
        useState<OptimizedImage | null>(null);

    /*
    ============================================================
    CARGAR CLIENTES
    ============================================================
    */

    const cargarClientes = async () => {
        try {
            const snapshot = await getDocs(
                collection(db, "usuarios")
            );

            const data = snapshot.docs
                .map((item) => {
                    const user = item.data();

                    return {
                        uid: item.id,
                        nombre:
                            user.nombre ??
                            "Sin nombre",
                        email:
                            user.email ??
                            "",
                        activo:
                            user.activo ?? false,
                        rol:
                            user.rol ?? null,
                    };
                })
                .filter(
                    (user) =>
                        user.rol === "cliente"
                );

            setClients(data);
        } catch (error) {
            console.error(
                "Error cargando clientes:",
                error
            );
        }
    };

    /*
    ============================================================
    CARGAR VEHÍCULOS
    ============================================================
    */

    const cargarVehiculos = async () => {
        try {
            setLoading(true);

            const [
                vehiclesSnapshot,
                usersSnapshot,
            ] = await Promise.all([
                getDocs(
                    collection(
                        db,
                        "vehiculos"
                    )
                ),
                getDocs(
                    collection(
                        db,
                        "usuarios"
                    )
                ),
            ]);

            const usersMap =
                new Map<
                    string,
                    string
                >();

            usersSnapshot.docs.forEach(
                (item) => {
                    const data =
                        item.data();

                    usersMap.set(
                        item.id,
                        data.nombre ??
                            "Sin nombre"
                    );
                }
            );

            const vehiclesData =
                vehiclesSnapshot.docs.map(
                    (item) => {
                        const data =
                            item.data();

                        return {
                            id: item.id,
                            marca:
                                data.marca ??
                                "",
                            modelo:
                                data.modelo ??
                                "",
                            anio:
                                data.anio ??
                                0,
                            patente:
                                data.patente ??
                                "",
                            color:
                                data.color ??
                                "",
                            kilometraje:
                                data.kilometraje ??
                                0,
                            clienteId:
                                data.clienteId ??
                                null,
                            clienteNombre:
                                data.clienteId
                                    ? usersMap.get(
                                          data.clienteId
                                      ) ??
                                      "Sin cliente"
                                    : "Sin cliente",
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
                    }
                );

            setVehicles(
                vehiclesData
            );
        } catch (error) {
            console.error(
                "Error cargando vehículos:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarVehiculos();
        cargarClientes();
    }, []);

    /*
    ============================================================
    REDIMENSIONAR Y COMPRIMIR IMAGEN
    ============================================================
    */

    const optimizeImage = (
        file: File
    ): Promise<OptimizedImage> => {
        return new Promise(
            (resolve, reject) => {
                const image =
                    new Image();

                const objectUrl =
                    URL.createObjectURL(
                        file
                    );

                image.onload = () => {
                    const maxSize = 800;

                    let width =
                        image.width;

                    let height =
                        image.height;

                    if (
                        width >
                            maxSize ||
                        height >
                            maxSize
                    ) {
                        if (
                            width >
                            height
                        ) {
                            height =
                                Math.round(
                                    (height *
                                        maxSize) /
                                        width
                                );

                            width =
                                maxSize;
                        } else {
                            width =
                                Math.round(
                                    (width *
                                        maxSize) /
                                        height
                                );

                            height =
                                maxSize;
                        }
                    }

                    const canvas =
                        document.createElement(
                            "canvas"
                        );

                    canvas.width =
                        width;

                    canvas.height =
                        height;

                    const context =
                        canvas.getContext(
                            "2d"
                        );

                    if (!context) {
                        URL.revokeObjectURL(
                            objectUrl
                        );

                        reject(
                            new Error(
                                "No se pudo crear el canvas"
                            )
                        );

                        return;
                    }

                    context.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );

                    canvas.toBlob(
                        (blob) => {
                            URL.revokeObjectURL(
                                objectUrl
                            );

                            if (!blob) {
                                reject(
                                    new Error(
                                        "No se pudo comprimir la imagen"
                                    )
                                );

                                return;
                            }

                            const previewUrl =
                                URL.createObjectURL(
                                    blob
                                );

                            resolve({
                                blob,
                                url: previewUrl,
                                width,
                                height,
                                size: blob.size,
                            });
                        },
                        "image/webp",
                        0.75
                    );
                };

                image.onerror = () => {
                    URL.revokeObjectURL(
                        objectUrl
                    );

                    reject(
                        new Error(
                            "No se pudo procesar la imagen"
                        )
                    );
                };

                image.src =
                    objectUrl;
            }
        );
    };

    /*
    ============================================================
    SELECCIONAR IMAGEN
    ============================================================
    */

    const handleImageChange = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            alert(
                "Seleccioná una imagen válida."
            );

            event.target.value = "";
            return;
        }

        try {
            // Liberar preview original anterior
            // solamente si era un blob local.
            if (
                originalPreview.startsWith(
                    "blob:"
                )
            ) {
                URL.revokeObjectURL(
                    originalPreview
                );
            }

            // Liberar preview optimizado anterior.
            if (
                optimizedImage?.url
            ) {
                URL.revokeObjectURL(
                    optimizedImage.url
                );
            }

            // Mostrar foto original.
            const originalUrl =
                URL.createObjectURL(
                    file
                );

            setOriginalPreview(
                originalUrl
            );

            // Redimensionar + comprimir
            // completamente en el navegador.
            const optimized =
                await optimizeImage(
                    file
                );

            setOptimizedImage(
                optimized
            );
        } catch (error) {
            console.error(
                "Error procesando imagen:",
                error
            );

            alert(
                "No se pudo procesar la imagen."
            );
        } finally {
            // Permite volver a seleccionar
            // la misma foto.
            event.target.value = "";
        }
    };

    /*
    ============================================================
    ELIMINAR PREVIEW
    ============================================================
    */

    const removeSelectedImage = () => {
        if (
            originalPreview.startsWith(
                "blob:"
            )
        ) {
            URL.revokeObjectURL(
                originalPreview
            );
        }

        if (
            optimizedImage?.url
        ) {
            URL.revokeObjectURL(
                optimizedImage.url
            );
        }

        setOriginalPreview("");
        setOptimizedImage(null);
    };

    /*
    ============================================================
    CREAR VEHÍCULO
    ============================================================
    */

    const handleCreateVehicle =
        async () => {
            if (
                !newVehicle.marca.trim() ||
                !newVehicle.modelo.trim() ||
                !newVehicle.patente.trim()
            ) {
                alert(
                    "Completá marca, modelo y patente."
                );

                return;
            }

            try {
                setSaving(true);

                const vehicleData = {
                    marca:
                        newVehicle.marca.trim(),

                    modelo:
                        newVehicle.modelo.trim(),

                    anio:
                        Number(
                            newVehicle.anio
                        ) || 0,

                    patente:
                        newVehicle.patente
                            .trim()
                            .toUpperCase(),

                    color:
                        newVehicle.color.trim(),

                    kilometraje:
                        Number(
                            newVehicle.kilometraje
                        ) || 0,

                    clienteId:
                        newVehicle.clienteId ||
                        null,

                    estado:
                        newVehicle.estado,

                    observaciones:
                        newVehicle.observaciones.trim(),

                    proximoServicio:
                        newVehicle.proximoServicio ||
                        null,

                    ultimoServicio:
                        null,

                    imagenUrl: "",
                    imagenPath: "",

                    creadoEn:
                        serverTimestamp(),

                    actualizadoEn:
                        serverTimestamp(),
                };

                const document =
                    await addDoc(
                        collection(
                            db,
                            "vehiculos"
                        ),
                        vehicleData
                    );

                /*
                ------------------------------------------------
                SUBIR IMAGEN SOLAMENTE AL GUARDAR
                ------------------------------------------------
                */

                if (
                    optimizedImage
                ) {
                    const imagePath =
                        `vehiculos/${document.id}/perfil.webp`;

                    const imageRef =
                        ref(
                            storage,
                            imagePath
                        );

                    await uploadBytes(
                        imageRef,
                        optimizedImage.blob,
                        {
                            contentType:
                                "image/webp",
                        }
                    );

                    const imageUrl =
                        await getDownloadURL(
                            imageRef
                        );

                    await updateDoc(
                        doc(
                            db,
                            "vehiculos",
                            document.id
                        ),
                        {
                            imagenUrl:
                                imageUrl,

                            imagenPath:
                                imagePath,
                        }
                    );
                }

                await cargarVehiculos();

                resetVehicleForm();

                setShowModal(false);
            } catch (error) {
                console.error(
                    "Error creando vehículo:",
                    error
                );

                alert(
                    "No se pudo guardar el vehículo."
                );
            } finally {
                setSaving(false);
            }
        };

    /*
    ============================================================
    ABRIR EDICIÓN
    ============================================================
    */

    const openEditModal = (
        vehicle: Vehicle
    ) => {
        setSelectedVehicle(
            vehicle
        );

        setNewVehicle({
            marca: vehicle.marca,
            modelo: vehicle.modelo,

            anio: String(
                vehicle.anio || ""
            ),

            patente:
                vehicle.patente,

            color: vehicle.color,

            kilometraje:
                String(
                    vehicle.kilometraje ||
                        ""
                ),

            clienteId:
                vehicle.clienteId ??
                "",

            estado:
                vehicle.estado,

            observaciones:
                vehicle.observaciones,

            proximoServicio:
                vehicle.proximoServicio ??
                "",
        });

        removeSelectedImage();

        if (vehicle.imagenUrl) {
            setOriginalPreview(
                vehicle.imagenUrl
            );
        }

        setShowEditModal(true);
    };

    /*
    ============================================================
    ACTUALIZAR VEHÍCULO
    ============================================================
    */

    const handleUpdateVehicle =
        async () => {
            if (
                !selectedVehicle
            ) {
                return;
            }

            try {
                setSaving(true);

                const updateData = {
                    marca:
                        newVehicle.marca.trim(),

                    modelo:
                        newVehicle.modelo.trim(),

                    anio:
                        Number(
                            newVehicle.anio
                        ) || 0,

                    patente:
                        newVehicle.patente
                            .trim()
                            .toUpperCase(),

                    color:
                        newVehicle.color.trim(),

                    kilometraje:
                        Number(
                            newVehicle.kilometraje
                        ) || 0,

                    clienteId:
                        newVehicle.clienteId ||
                        null,

                    estado:
                        newVehicle.estado,

                    observaciones:
                        newVehicle.observaciones.trim(),

                    proximoServicio:
                        newVehicle.proximoServicio ||
                        null,

                    actualizadoEn:
                        serverTimestamp(),
                };

                await updateDoc(
                    doc(
                        db,
                        "vehiculos",
                        selectedVehicle.id
                    ),
                    updateData
                );

                /*
                ------------------------------------------------
                SI HAY NUEVA IMAGEN
                ------------------------------------------------
                */

                if (
                    optimizedImage
                ) {
                    /*
                    Eliminamos la imagen anterior.
                    */

                    if (
                        selectedVehicle.imagenPath
                    ) {
                        try {
                            const oldImageRef =
                                ref(
                                    storage,
                                    selectedVehicle.imagenPath
                                );

                            await deleteObject(
                                oldImageRef
                            );
                        } catch (
                            error
                        ) {
                            console.warn(
                                "No se pudo eliminar la imagen anterior:",
                                error
                            );
                        }
                    }

                    const imagePath =
                        `vehiculos/${selectedVehicle.id}/perfil.webp`;

                    const imageRef =
                        ref(
                            storage,
                            imagePath
                        );

                    await uploadBytes(
                        imageRef,
                        optimizedImage.blob,
                        {
                            contentType:
                                "image/webp",
                        }
                    );

                    const imageUrl =
                        await getDownloadURL(
                            imageRef
                        );

                    await updateDoc(
                        doc(
                            db,
                            "vehiculos",
                            selectedVehicle.id
                        ),
                        {
                            imagenUrl:
                                imageUrl,

                            imagenPath:
                                imagePath,
                        }
                    );
                }

                await cargarVehiculos();

                resetVehicleForm();

                setShowEditModal(false);

                setSelectedVehicle(
                    null
                );
            } catch (error) {
                console.error(
                    "Error actualizando vehículo:",
                    error
                );

                alert(
                    "No se pudo actualizar el vehículo."
                );
            } finally {
                setSaving(false);
            }
        };

    /*
    ============================================================
    CAMBIAR ESTADO
    ============================================================
    */

    const cambiarEstado = async (
        vehicle: Vehicle,
        estado: VehicleStatus
    ) => {
        try {
            await updateDoc(
                doc(
                    db,
                    "vehiculos",
                    vehicle.id
                ),
                {
                    estado,
                    actualizadoEn:
                        serverTimestamp(),
                }
            );

            setVehicles(
                (prev) =>
                    prev.map(
                        (item) =>
                            item.id ===
                            vehicle.id
                                ? {
                                      ...item,
                                      estado,
                                  }
                                : item
                    )
            );
        } catch (error) {
            console.error(
                "Error cambiando estado:",
                error
            );
        }
    };

    /*
    ============================================================
    RESET
    ============================================================
    */

    const resetVehicleForm =
        () => {
            setNewVehicle({
                marca: "",
                modelo: "",
                anio: "",
                patente: "",
                color: "",
                kilometraje: "",
                clienteId: "",
                estado: "Activo",
                observaciones: "",
                proximoServicio:
                    "",
            });

            if (
                originalPreview.startsWith(
                    "blob:"
                )
            ) {
                URL.revokeObjectURL(
                    originalPreview
                );
            }

            if (
                optimizedImage?.url
            ) {
                URL.revokeObjectURL(
                    optimizedImage.url
                );
            }

            setOriginalPreview("");
            setOptimizedImage(null);

            setSelectedVehicle(
                null
            );
        };

    /*
    ============================================================
    FILTROS
    ============================================================
    */

    const filteredVehicles =
        useMemo(() => {
            return vehicles.filter(
                (vehicle) => {
                    const text =
                        `${vehicle.marca} ${vehicle.modelo} ${vehicle.patente} ${vehicle.clienteNombre}`
                            .toLowerCase();

                    const matchesSearch =
                        text.includes(
                            search.toLowerCase()
                        );

                    const matchesStatus =
                        statusFilter ===
                            "Todos" ||
                        vehicle.estado ===
                            statusFilter;

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );
        }, [
            vehicles,
            search,
            statusFilter,
        ]);

    /*
    ============================================================
    RENDER
    ============================================================
    */

    return (
        <AdminLayout>
            <div className="space-y-6 p-8">

                {/* HEADER */}

                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-1 text-sm font-medium text-blue-600">
                            Gestión de vehículos
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Vehículos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Administrá los vehículos registrados.
                        </p>

                        
                    </div>

                                        <button
                        type="button"
                        onClick={() => {
                            resetVehicleForm();
                            setShowModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <Plus size={18} />
                        Nuevo vehículo
                    </button>
                </div>

                {/* FILTROS */}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">

                    <div className="flex flex-col gap-3 md:flex-row">

                        <div className="relative flex-1">

                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Buscar vehículo, patente o cliente..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                            />

                        </div>

                        <div className="relative">

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value as
                                            | "Todos"
                                            | VehicleStatus
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 md:w-48"
                            >
                                <option value="Todos">
                                    Todos
                                </option>

                                <option value="Activo">
                                    Activo
                                </option>

                                <option value="En taller">
                                    En taller
                                </option>

                                <option value="Inactivo">
                                    Inactivo
                                </option>
                            </select>

                            <ChevronDown
                                size={17}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                        </div>

                    </div>

                </div>

                {/* TABLA */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px]">

                            <thead className="border-b border-slate-200 bg-slate-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Vehículo
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Cliente
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Kilometraje
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Estado
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Acciones
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-sm text-slate-400"
                                        >
                                            Cargando vehículos...
                                        </td>
                                    </tr>
                                ) : filteredVehicles.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Car
                                                size={30}
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                                No hay vehículos
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Todavía no hay vehículos que coincidan con la búsqueda.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVehicles.map(
                                        (
                                            vehicle
                                        ) => (
                                            <tr
                                                key={
                                                    vehicle.id
                                                }
                                                className="transition hover:bg-slate-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-3">

                                                        {vehicle.imagenUrl ? (
                                                            <img
                                                                src={
                                                                    vehicle.imagenUrl
                                                                }
                                                                alt={`${vehicle.marca} ${vehicle.modelo}`}
                                                                className="h-12 w-12 rounded-xl object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                                                <Car
                                                                    size={21}
                                                                    className="text-slate-400"
                                                                />
                                                            </div>
                                                        )}

                                                        <div>

                                                            <p className="font-semibold text-slate-900">
                                                                {
                                                                    vehicle.marca
                                                                }{" "}
                                                                {
                                                                    vehicle.modelo
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {
                                                                    vehicle.patente
                                                                }{" "}
                                                                ·{" "}
                                                                {
                                                                    vehicle.anio
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-2">

                                                        <UserRound
                                                            size={16}
                                                            className="text-slate-400"
                                                        />

                                                        <span className="text-sm text-slate-700">
                                                            {
                                                                vehicle.clienteNombre
                                                            }
                                                        </span>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-2">

                                                        <Gauge
                                                            size={16}
                                                            className="text-slate-400"
                                                        />

                                                        <span className="text-sm text-slate-700">
                                                            {vehicle.kilometraje.toLocaleString(
                                                                "es-AR"
                                                            )}{" "}
                                                            km
                                                        </span>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="relative inline-block">

                                                        <select
                                                            value={
                                                                vehicle.estado
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                cambiarEstado(
                                                                    vehicle,
                                                                    event
                                                                        .target
                                                                        .value as VehicleStatus
                                                                )
                                                            }
                                                            className={`appearance-none rounded-lg border px-3 py-2 pr-8 text-xs font-bold outline-none ${
                                                                vehicle.estado ===
                                                                "Activo"
                                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                                    : vehicle.estado ===
                                                                      "En taller"
                                                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                                                    : "border-slate-200 bg-slate-100 text-slate-600"
                                                            }`}
                                                        >

                                                            <option value="Activo">
                                                                Activo
                                                            </option>

                                                            <option value="En taller">
                                                                En taller
                                                            </option>

                                                            <option value="Inactivo">
                                                                Inactivo
                                                            </option>

                                                        </select>

                                                        <ChevronDown
                                                            size={13}
                                                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                                                        />

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="flex justify-end">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    vehicle
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                                        >
                                                            <Edit3
                                                                size={15}
                                                            />

                                                            Editar
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* MODAL CREAR / EDITAR */}
            {/* ================================================= */}

            {(showModal ||
                showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

                    <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl">

                        {/* HEADER */}

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                            <div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    {showEditModal
                                        ? "Editar vehículo"
                                        : "Nuevo vehículo"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Completá la información del vehículo.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    resetVehicleForm();

                                    setShowModal(
                                        false
                                    );

                                    setShowEditModal(
                                        false
                                    );
                                }}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X
                                    size={20}
                                />
                            </button>

                        </div>

                        {/* BODY */}

                        <div className="overflow-y-auto px-6 py-6 text-slate-900">

                            <div className="grid gap-5 md:grid-cols-2">

                                {/* FOTO */}

                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Foto del vehículo
                                    </label>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                        {!originalPreview &&
                                        !optimizedImage ? (
                                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-10 transition hover:border-slate-300">

                                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                                    <Car
                                                        size={25}
                                                        className="text-slate-400"
                                                    />
                                                </div>

                                                <span className="text-sm font-bold text-slate-800">
                                                    Sacar foto del vehículo
                                                </span>

                                                <span className="mt-1 text-xs text-slate-500">
                                                    Desde el celular se abrirá la cámara
                                                </span>

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={
                                                        handleImageChange
                                                    }
                                                    className="hidden"
                                                />

                                            </label>
                                        ) : (
                                            <div className="space-y-5">

                                                {/* ORIGINAL */}

                                                {originalPreview && (
                                                    <div>

                                                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                                                            Foto original
                                                        </p>

                                                        <img
                                                            src={
                                                                originalPreview
                                                            }
                                                            alt="Foto original"
                                                            className="mx-auto max-h-64 w-full rounded-xl object-contain"
                                                        />

                                                    </div>
                                                )}

                                                {/* OPTIMIZADA */}

                                                {optimizedImage && (
                                                    <div>

                                                        <div className="mb-2 flex items-center justify-between">

                                                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                                                                Versión optimizada
                                                            </p>

                                                            <span className="text-xs font-medium text-slate-500">
                                                                {
                                                                    optimizedImage.width
                                                                }{" "}
                                                                ×{" "}
                                                                {
                                                                    optimizedImage.height
                                                                }{" "}
                                                                ·{" "}
                                                                {(
                                                                    optimizedImage.size /
                                                                    1024
                                                                ).toFixed(
                                                                    0
                                                                )}{" "}
                                                                KB
                                                            </span>

                                                        </div>

                                                        <img
                                                            src={
                                                                optimizedImage.url
                                                            }
                                                            alt="Vista previa optimizada"
                                                            className="mx-auto max-h-64 w-full rounded-xl object-contain"
                                                        />

                                                    </div>
                                                )}

                                                <div className="flex flex-wrap justify-center gap-2">

                                                    <label className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">

                                                        Cambiar foto

                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            onChange={
                                                                handleImageChange
                                                            }
                                                            className="hidden"
                                                        />

                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            removeSelectedImage
                                                        }
                                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        Quitar
                                                    </button>

                                                </div>

                                                <p className="text-center text-xs text-slate-500">
                                                    La foto todavía no fue subida.
                                                    Se subirá únicamente al guardar.
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                </div>

                                {/* MARCA */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Marca
                                    </label>

                                    <input
                                        value={
                                            newVehicle.marca
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    marca:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        placeholder="Ej. Toyota"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                                {/* MODELO */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Modelo
                                    </label>

                                    <input
                                        value={
                                            newVehicle.modelo
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    modelo:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        placeholder="Ej. Corolla"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                                {/* AÑO */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Año
                                    </label>

                                    <input
                                        type="number"
                                        value={
                                            newVehicle.anio
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    anio:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        placeholder="Ej. 2020"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                                {/* PATENTE */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Patente
                                    </label>

                                    <input
                                        value={
                                            newVehicle.patente
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    patente:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        placeholder="Ej. AB123CD"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                                {/* COLOR */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Color
                                    </label>

                                    <input
                                        value={
                                            newVehicle.color
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    color:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        placeholder="Ej. Blanco"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                                {/* KILOMETRAJE */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Kilometraje
                                    </label>

                                    <input
                                        type="number"
                                        value={
                                            newVehicle.kilometraje
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    kilometraje:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        placeholder="Ej. 85000"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                                {/* CLIENTE */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Cliente
                                    </label>

                                    <div className="relative">

                                        <select
                                            value={
                                                newVehicle.clienteId
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setNewVehicle(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        clienteId:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                        >

                                            <option value="">
                                                Sin cliente
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

                                        <ChevronDown
                                            size={17}
                                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                    </div>

                                </div>

                                {/* ESTADO */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Estado
                                    </label>

                                    <div className="relative">

                                        <select
                                            value={
                                                newVehicle.estado
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setNewVehicle(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        estado:
                                                            event
                                                                .target
                                                                .value as VehicleStatus,
                                                    })
                                                )
                                            }
                                            className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-sm font-medium outline-none focus:ring-4 ${
                                                newVehicle.estado ===
                                                "Activo"
                                                    ? "border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/10"
                                                    : newVehicle.estado ===
                                                      "En taller"
                                                    ? "border-blue-200 text-blue-700 focus:border-blue-500 focus:ring-blue-500/10"
                                                    : "border-slate-200 text-slate-600 focus:border-slate-500 focus:ring-slate-500/10"
                                            }`}
                                        >

                                            <option value="Activo">
                                                Activo
                                            </option>

                                            <option value="En taller">
                                                En taller
                                            </option>

                                            <option value="Inactivo">
                                                Inactivo
                                            </option>

                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                    </div>

                                </div>

                                {/* PROXIMO SERVICIO */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Próximo servicio
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            newVehicle.proximoServicio
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    proximoServicio:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                                {/* OBSERVACIONES */}

                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Observaciones
                                    </label>

                                    <textarea
                                        value={
                                            newVehicle.observaciones
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewVehicle(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    observaciones:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        rows={4}
                                        placeholder="Información adicional del vehículo..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10"
                                    />

                                </div>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">

                            <button
                                type="button"
                                disabled={
                                    saving
                                }
                                onClick={() => {
                                    resetVehicleForm();

                                    setShowModal(
                                        false
                                    );

                                    setShowEditModal(
                                        false
                                    );
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                disabled={
                                    saving
                                }
                                onClick={
                                    showEditModal
                                        ? handleUpdateVehicle
                                        : handleCreateVehicle
                                }
                                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Guardando..."
                                    : showEditModal
                                    ? "Guardar cambios"
                                    : "Guardar vehículo"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </AdminLayout>
    );
};

export default Vehiculos;