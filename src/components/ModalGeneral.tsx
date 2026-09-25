import {
    Camera,
    Car,
    Check,
    ChevronDown,
    CreditCard,
    DollarSign,
    FileText,
    Gauge,
    UserRound,
    Wrench,
    X,
    Plus,
} from "lucide-react";

import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import {
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";

import { useEffect, useState, type ChangeEvent } from "react";

import { db, storage } from "../config/firebase";
import DocumentoPDF from "./DocumentoPDF";

type UserRole = "admin" | "empleado" | "cliente";

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

interface UserData {
    id: string;
    uid: string;
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    rol: UserRole | null;
    activo: boolean;
    creadoEn?: any;
}

interface Vehicle {
    id: string;
    clienteId: string | null;
    marca: string;
    modelo: string;
    patente: string;
    anio: string;
    color: string;
    kilometraje: number;
    creadoEn?: any;
}

interface ModalGeneralProps {
    selectedUser: UserData;
    vehicles: Vehicle[];
    onClose: () => void;
    onSaved: () => void;
}

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

const getTodayInputDate = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};



const ModalGeneral = ({
    selectedUser,
    vehicles,
    onClose,
    onSaved,
}: ModalGeneralProps) => {
    const [saving, setSaving] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | CLIENTE
    |--------------------------------------------------------------------------
    */

    const [activateClient, setActivateClient] =
        useState(selectedUser.activo);

    const [editClient, setEditClient] = useState({
        nombre: selectedUser.nombre || "",
        telefono: selectedUser.telefono || "",
        direccion: selectedUser.direccion || "",
    });

    /*
    |--------------------------------------------------------------------------
    | VEHÍCULO
    |--------------------------------------------------------------------------
    */

    const [vehicleMode, setVehicleMode] = useState<
        "existing" | "new"
    >("existing");

    const [selectedVehicleId, setSelectedVehicleId] =
        useState("");

    const [newVehicle, setNewVehicle] = useState({
        marca: "",
        modelo: "",
        anio: "",
        patente: "",
        color: "",
        kilometraje: "",
        estado: "Activo",
        proximoServicio: "",
        observaciones: "",
    });

    /*
    |--------------------------------------------------------------------------
    | IMAGEN VEHÍCULO
    |--------------------------------------------------------------------------
    */

    const [originalPreview, setOriginalPreview] =
        useState("");

    const [optimizedImage, setOptimizedImage] =
        useState<{
            blob: Blob;
            url: string;
        } | null>(null);

    /*
    |--------------------------------------------------------------------------
    | SERVICIO
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | CONFIGURACIÓN FINANCIERA
    |--------------------------------------------------------------------------
    */

    const [hasAdvancePayment, setHasAdvancePayment] =
        useState(false);

    const [advancePayment, setAdvancePayment] = useState({
        importe: "",
        medioPago: "",
        fecha: getTodayInputDate(),
        observaciones: "",
    });

    const handleAdvancePaymentChange = (
        field: string,
        value: string
    ) => {
        setAdvancePayment((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | 
    |--------------------------------------------------------------------------
    */

    const [generateBudget, setGenerateBudget] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | RECIBO
    |--------------------------------------------------------------------------
    */

    const [generateReceipt, setGenerateReceipt] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | VEHÍCULOS DISPONIBLES
    |--------------------------------------------------------------------------
    */

    const availableVehicles = vehicles.filter(
        (vehicle) =>
            !vehicle.clienteId ||
            vehicle.clienteId === selectedUser.uid
    );

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date);
    };

    /*
    |--------------------------------------------------------------------------
    | VEHÍCULO SELECCIONADO
    |--------------------------------------------------------------------------
    */

    const selectedVehicle =
        vehicles.find(
            (vehicle) =>
                vehicle.id === selectedVehicleId
        ) || null;

    /*
    |--------------------------------------------------------------------------
    | CARGAR DATOS EXISTENTES DEL CLIENTE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!selectedUser) return;

        /*
        |--------------------------------------------------------------------------
        | DATOS DEL CLIENTE
        |--------------------------------------------------------------------------
        */

        setActivateClient(
            selectedUser.activo
        );

        setEditClient({
            nombre:
                selectedUser.nombre || "",
            telefono:
                selectedUser.telefono || "",
            direccion:
                selectedUser.direccion || "",
        });

        /*
        |--------------------------------------------------------------------------
        | VEHÍCULO DEL CLIENTE
        |--------------------------------------------------------------------------
        */

        const clientVehicle = vehicles.find(
            (vehicle) =>
                vehicle.clienteId ===
                selectedUser.uid
        );

        if (clientVehicle) {
            setVehicleMode("existing");

            setSelectedVehicleId(
                clientVehicle.id
            );

            setNewService((prev) => ({
                ...prev,
                vehiculoId:
                    clientVehicle.id,
                kilometraje:
                    String(
                        clientVehicle.kilometraje ?? 0
                    ),
            }));
        } else {
            setVehicleMode("new");

            setSelectedVehicleId("");

            setNewService((prev) => ({
                ...prev,
                vehiculoId: "",
                kilometraje: "",
            }));
        }
    }, [
        selectedUser,
        vehicles,
    ]);

    /*
|--------------------------------------------------------------------------
| DATOS DEL 
|--------------------------------------------------------------------------
*/

const [partsPdf, setPartsPdf] =
    useState<File | null>(null);

const [budgetPartsCost, setBudgetPartsCost] =
    useState("");

const [budgetValidUntil, setBudgetValidUntil] =
    useState("");

const [budgetNotes, setBudgetNotes] =
    useState("");

const [budgetItems, setBudgetItems] =
    useState<
        {
            type: "Servicio" | "Repuesto";
            name: string;
            quantity: number;
            price: number;
        }[]
    >([
        {
            type: "Servicio",
            name: "",
            quantity: 1,
            price: 0,
        },
    ]);


    const addBudgetItem = () => {
    setBudgetItems((current) => [
        ...current,
        {
            type: "Servicio",
            name: "",
            quantity: 1,
            price: 0,
        },
    ]);
};

const removeBudgetItem = (index: number) => {
    setBudgetItems((current) =>
        current.filter(
            (_, itemIndex) =>
                itemIndex !== index
        )
    );
};

const updateBudgetItem = <
    K extends keyof (typeof budgetItems)[number]
>(
    index: number,
    field: K,
    value: (typeof budgetItems)[number][K]
) => {
    setBudgetItems((current) =>
        current.map((item, itemIndex) =>
            itemIndex === index
                ? {
                      ...item,
                      [field]: value,
                  }
                : item
        )
    );
};

const partsCost =
    Number(budgetPartsCost || 0);

const laborCost =
    Number(newService.precio || 0);

const budgetTotal =
    laborCost + partsCost;




    /*
    |--------------------------------------------------------------------------
    | ACTUALIZAR SERVICIO AL CAMBIAR VEHÍCULO
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            vehicleMode !== "existing" ||
            !selectedVehicleId
        ) {
            return;
        }

        const vehicle =
            vehicles.find(
                (item) =>
                    item.id ===
                    selectedVehicleId
            );

        if (!vehicle) return;

        setNewService((prev) => ({
            ...prev,
            vehiculoId:
                vehicle.id,
            kilometraje:
                String(
                    vehicle.kilometraje ?? 0
                ),
        }));
    }, [
        selectedVehicleId,
        vehicleMode,
        vehicles,
    ]);

    /*
    |--------------------------------------------------------------------------
    | OPTIMIZAR IMAGEN
    |--------------------------------------------------------------------------
    */

    const optimizeImage = (
        file: File
    ): Promise<{
        blob: Blob;
        url: string;
    }> => {
        return new Promise(
            (
                resolve,
                reject
            ) => {
                const image =
                    new Image();

                const objectUrl =
                    URL.createObjectURL(
                        file
                    );

                image.onload = () => {
                    const maxSize = 800;

                    let width =
                        image.naturalWidth;

                    let height =
                        image.naturalHeight;

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
                                    (height /
                                        width) *
                                        maxSize
                                );

                            width =
                                maxSize;
                        } else {
                            width =
                                Math.round(
                                    (width /
                                        height) *
                                        maxSize
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
                                "No se pudo crear el canvas."
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
                                        "No se pudo optimizar la imagen."
                                    )
                                );

                                return;
                            }

                            resolve({
                                blob,
                                url: URL.createObjectURL(
                                    blob
                                ),
                            });
                        },
                        "image/webp",
                        0.75
                    );
                };

                image.onerror =
                    () => {
                        URL.revokeObjectURL(
                            objectUrl
                        );

                        reject(
                            new Error(
                                "No se pudo leer la imagen."
                            )
                        );
                    };

                image.src =
                    objectUrl;
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CAMBIAR IMAGEN
    |--------------------------------------------------------------------------
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

            const originalUrl =
                URL.createObjectURL(
                    file
                );

            const optimized =
                await optimizeImage(
                    file
                );

            setOriginalPreview(
                originalUrl
            );

            setOptimizedImage(
                optimized
            );
        } catch (error) {
            console.error(
                "Error optimizando imagen:",
                error
            );

            alert(
                "No se pudo procesar la imagen."
            );
        }

        event.target.value = "";
    };

    /*
    |--------------------------------------------------------------------------
    | ELIMINAR IMAGEN
    |--------------------------------------------------------------------------
    */

    const removeSelectedImage =
        () => {
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
    |--------------------------------------------------------------------------
    | VEHÍCULO NUEVO
    |--------------------------------------------------------------------------
    */

    const handleNewVehicleChange = (
        field: string,
        value: string
    ) => {
        setNewVehicle((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | SERVICIO
    |--------------------------------------------------------------------------
    */

    const handleServiceChange = (
        field: string,
        value: string
    ) => {
        setNewService((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | GUARDAR
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {
        if (!selectedUser) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDAR CLIENTE
        |--------------------------------------------------------------------------
        */

        if (!editClient.nombre.trim()) {
            alert(
                "Completá el nombre del cliente."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDAR ESTADO
        |--------------------------------------------------------------------------
        */

        if (!activateClient) {
            const confirmInactive =
                window.confirm(
                    "El cliente quedará inactivo y no podrá iniciar sesión. ¿Querés continuar?"
                );

            if (!confirmInactive) {
                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDAR VEHÍCULO
        |--------------------------------------------------------------------------
        */

        if (
            vehicleMode ===
            "existing" &&
            !selectedVehicleId
        ) {
            alert(
                "Seleccioná un vehículo existente."
            );

            return;
        }

        if (
            vehicleMode === "new"
        ) {
            if (
                !newVehicle.marca.trim() ||
                !newVehicle.modelo.trim() ||
                !newVehicle.patente.trim()
            ) {
                alert(
                    "Completá marca, modelo y patente del vehículo."
                );

                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDAR SERVICIO
        |--------------------------------------------------------------------------
        */

        if (
            !newService.tipo.trim()
        ) {
            alert(
                "Completá el servicio realizado."
            );

            return;
        }

        if (
            !newService.categoria
        ) {
            alert(
                "Seleccioná una categoría para el servicio."
            );

            return;
        }

        if (
            !newService.fecha
        ) {
            alert(
                "Seleccioná la fecha del servicio."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDAR ANTICIPO
        |--------------------------------------------------------------------------
        */

        if (hasAdvancePayment) {
            const advanceAmount =
                Number(
                    advancePayment.importe
                );

            if (
                !advancePayment.importe ||
                advanceAmount <= 0
            ) {
                alert(
                    "Ingresá un importe de anticipo válido."
                );

                return;
            }

            if (
                !advancePayment.medioPago
            ) {
                alert(
                    "Seleccioná el medio de pago del anticipo."
                );

                return;
            }

            if (
                !advancePayment.fecha
            ) {
                alert(
                    "Seleccioná la fecha del anticipo."
                );

                return;
            }
        }

        try {
            setSaving(true);

            /*
            |--------------------------------------------------------------------------
            | 1. ACTUALIZAR CLIENTE
            |--------------------------------------------------------------------------
            */

            await updateDoc(
                doc(
                    db,
                    "usuarios",
                    selectedUser.uid
                ),
                {
                    nombre:
                        editClient.nombre.trim(),

                    telefono:
                        editClient.telefono.trim(),

                    direccion:
                        editClient.direccion.trim(),

                    activo:
                        activateClient,

                    actualizadoEn:
                        serverTimestamp(),
                }
            );

            /*
            |--------------------------------------------------------------------------
            | VARIABLES DEL VEHÍCULO
            |--------------------------------------------------------------------------
            */

            let vehicleId = "";

            let vehicleData:
                | Vehicle
                | null = null;

            let vehicleImageUrl =
                "";

            /*
            |--------------------------------------------------------------------------
            | 2. VEHÍCULO EXISTENTE
            |--------------------------------------------------------------------------
            */

            if (
                vehicleMode ===
                "existing"
            ) {
                const existingVehicle =
                    vehicles.find(
                        (vehicle) =>
                            vehicle.id ===
                            selectedVehicleId
                    );

                if (
                    !existingVehicle
                ) {
                    throw new Error(
                        "No se encontró el vehículo seleccionado."
                    );
                }

                vehicleId =
                    existingVehicle.id;

                vehicleData =
                    existingVehicle;

                vehicleImageUrl = "";
            }

            /*
            |--------------------------------------------------------------------------
            | 3. CREAR VEHÍCULO NUEVO
            |--------------------------------------------------------------------------
            */

            if (
                vehicleMode === "new"
            ) {
                const vehiclePayload =
                    {
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
                            selectedUser.uid,

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

                const vehicleDocument =
                    await addDoc(
                        collection(
                            db,
                            "vehiculos"
                        ),
                        vehiclePayload
                    );

                vehicleId =
                    vehicleDocument.id;

                /*
                |--------------------------------------------------------------------------
                | SUBIR IMAGEN
                |--------------------------------------------------------------------------
                */

                if (
                    optimizedImage
                ) {
                    const imagePath =
                        `vehiculos/${vehicleId}/perfil.webp`;

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

                    vehicleImageUrl =
                        imageUrl;

                    await updateDoc(
                        doc(
                            db,
                            "vehiculos",
                            vehicleId
                        ),
                        {
                            imagenUrl:
                                imageUrl,

                            imagenPath:
                                imagePath,

                            actualizadoEn:
                                serverTimestamp(),
                        }
                    );
                }

                vehicleData =
                    {
                        id: vehicleId,

                        clienteId:
                            selectedUser.uid,

                        marca:
                            newVehicle.marca.trim(),

                        modelo:
                            newVehicle.modelo.trim(),

                        patente:
                            newVehicle.patente
                                .trim()
                                .toUpperCase(),

                        anio:
                            newVehicle.anio,

                        color:
                            newVehicle.color.trim(),

                        kilometraje:
                            Number(
                                newVehicle.kilometraje
                            ) || 0,
                    };
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDAR VEHÍCULO
            |--------------------------------------------------------------------------
            */

            if (
                !vehicleData
            ) {
                throw new Error(
                    "No se pudo determinar el vehículo."
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 4. CREAR SERVICIO
            |--------------------------------------------------------------------------
            */

            const serviceKilometraje =
                Number(
                    newService.kilometraje ||
                        vehicleData.kilometraje ||
                        0
                );

            const servicePrecio =
                Number(
                    newService.precio ||
                        0
                );

            if (
                serviceKilometraje <
                0
            ) {
                alert(
                    "El kilometraje no puede ser negativo."
                );

                setSaving(false);

                return;
            }

            if (
                servicePrecio < 0
            ) {
                alert(
                    "El importe no puede ser negativo."
                );

                setSaving(false);

                return;
            }

            const serviceRef =
                await addDoc(
                    collection(
                        db,
                        "servicios"
                    ),
                    {
                        vehiculoId:
                            vehicleId,

                        clienteId:
                            selectedUser.uid,

                        clienteNombre:
                            editClient.nombre.trim() ||
                            "Sin nombre",

                        vehiculoNombre:
                            `${vehicleData.marca} ${vehicleData.modelo}`.trim(),

                        patente:
                            vehicleData.patente ||
                            "",

                        imagenUrl:
                            vehicleImageUrl ||
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
                            newService.fechaEntregaEstimada ||
                            null,

                        kilometraje:
                            serviceKilometraje,

                        precio:
                            servicePrecio,

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

            /*
            |--------------------------------------------------------------------------
            | 5. CREAR PAGO
            |--------------------------------------------------------------------------
            */

            if (
                hasAdvancePayment
            ) {
                const paymentImporte =
                    Number(
                        advancePayment.importe
                    );

                const paymentRef =
                    await addDoc(
                        collection(
                            db,
                            "pagos"
                        ),
                        {
                            servicioId:
                                serviceRef.id,

                            vehiculoId:
                                vehicleId,

                            clienteId:
                                selectedUser.uid,

                            clienteNombre:
                                editClient.nombre.trim() ||
                                "Sin nombre",

                            vehiculoNombre:
                                `${vehicleData.marca} ${vehicleData.modelo}`.trim(),

                            patente:
                                vehicleData.patente ||
                                "",

                            monto:
                                paymentImporte,

                            medioPago:
                                advancePayment.medioPago,

                            fecha:
                                advancePayment.fecha,

                            observaciones:
                                advancePayment.observaciones.trim(),

                            creadoEn:
                                serverTimestamp(),
                        }
                    );

                /*
                |--------------------------------------------------------------------------
                | CREAR RECIBO
                |--------------------------------------------------------------------------
                */

                if (
                    generateReceipt
                ) {
                    const reciboNumero =
                        `REC-${Date.now()}`;

                    await addDoc(
                        collection(
                            db,
                            "recibos"
                        ),
                        {
                            reciboNumero,

                            servicioId:
                                serviceRef.id,

                            pagoId:
                                paymentRef.id,

                            fechaPago:
                                advancePayment.fecha,

                            clienteNombre:
                                editClient.nombre.trim() ||
                                "Sin nombre",

                            vehiculoNombre:
                                `${vehicleData.marca} ${vehicleData.modelo}`.trim(),

                            patente:
                                vehicleData.patente ||
                                "",

                            servicioTipo:
                                newService.tipo.trim(),

                            categoria:
                                newService.categoria,

                            descripcion:
                                newService.descripcion.trim(),

                            kilometraje:
                                serviceKilometraje,

                            precioServicio:
                                servicePrecio,

                            montoPagado:
                                paymentImporte,

                            saldoAnterior:
                                0,

                            saldoRestante:
                                Math.max(
                                    servicePrecio -
                                        paymentImporte,
                                    0
                                ),

                            medioPago:
                                advancePayment.medioPago,

                            observaciones:
                                advancePayment.observaciones.trim(),

                            creadoEn:
                                serverTimestamp(),
                        }
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 6. ACTUALIZAR VEHÍCULO
            |--------------------------------------------------------------------------
            */

            const vehicleUpdates: Record<
                string,
                any
            > = {
                actualizadoEn:
                    serverTimestamp(),
            };

            if (
                serviceKilometraje >
                Number(
                    vehicleData.kilometraje ||
                        0
                )
            ) {
                vehicleUpdates.kilometraje =
                    serviceKilometraje;
            }

            if (
                newService.estado ===
                "Completado"
            ) {
                vehicleUpdates.ultimoServicio =
                    newService.fecha;
            }

            await updateDoc(
                doc(
                    db,
                    "vehiculos",
                    vehicleId
                ),
                vehicleUpdates
            );

            /*
            |--------------------------------------------------------------------------
            | 7. GENERAR Y DESCARGAR PRESUPUESTO
            |--------------------------------------------------------------------------
            */

            if (generateBudget) {
                try {
                    const budgetNumber = `PRE-${Date.now()}`;
                    
                    // Calcular adelanto y saldo
                    const advanceAmount = hasAdvancePayment
                        ? Number(advancePayment.importe || 0)
                        : 0;

                    const balance = Math.max(
                        budgetTotal - advanceAmount,
                        0
                    );

                    const pdfBytes = await DocumentoPDF({
                        tipo: "Presupuesto",
                        numero: budgetNumber,
                        fecha: getTodayInputDate(),
                        cliente: {
                            nombre: editClient.nombre.trim(),
                            email: selectedUser.email,
                        },
                        vehiculo: vehicleData,
                        items: budgetItems,
                        laborCost,
                        partsCost,
                        total: budgetTotal,
                        observaciones: budgetNotes,
                        adelanto: hasAdvancePayment
                            ? {
                                  importe: advanceAmount,
                                  medioPago: advancePayment.medioPago,
                                  fecha: advancePayment.fecha,
                              }
                            : undefined,
                        saldoPendiente: balance,
                        partsPdf,
                        formatCurrency,
                        formatDate,
                    });

                    // Crear un blob del PDF
                    const pdfBlob = new Blob([pdfBytes as BlobPart], {
                        type: "application/pdf",
                    });

                    // Crear URL temporal
                    const pdfUrl = URL.createObjectURL(pdfBlob);

                    // Crear elemento de descarga
                    const link = document.createElement("a");
                    link.href = pdfUrl;
                    link.download = `Presupuesto_${budgetNumber}_${editClient.nombre.replace(/\s+/g, "_")}.pdf`;
                    
                    // Trigger descarga
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Liberar URL temporal
                    URL.revokeObjectURL(pdfUrl);
                } catch (pdfError) {
                    console.error(
                        "Error generando presupuesto:",
                        pdfError
                    );
                    
                    alert(
                        "Se guardó la configuración pero hubo un error al generar el presupuesto."
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | FINALIZAR
            |--------------------------------------------------------------------------
            */

            alert(
                "Cliente configurado correctamente."
            );

            onSaved();

            onClose();
        } catch (error) {
            console.error(
                "Error configurando cliente:",
                error
            );

            alert(
                "No se pudo completar la configuración del cliente."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | CERRAR
    |--------------------------------------------------------------------------
    */

    const handleClose = () => {
        if (saving) return;

        removeSelectedImage();

        onClose();
    };
    

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

            <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* ===================================================== */}
                {/* HEADER */}
                {/* ===================================================== */}

                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <UserRound
                                size={21}
                            />
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                Alta de cliente
                            </p>

                            <h2 className="text-xl font-bold text-slate-900">
                                Configurar cliente
                            </h2>

                            <p className="text-sm text-slate-500">
                                {selectedUser.nombre ||
                                    "Sin nombre"}{" "}
                                ·{" "}
                                {
                                    selectedUser.email
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={
                            handleClose
                        }
                        disabled={saving}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

{/* ===================================================== */}
{/* CONTENIDO */}
{/* ===================================================== */}

<div className="overflow-y-auto p-6">

    <div className="space-y-6">

        {/* ================================================= */}
        {/* 1. CLIENTE */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <UserRound size={17} />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Datos del cliente
                        </h3>

                        <p className="text-xs text-slate-500">
                            Editá los datos y configurá el acceso del cliente al sistema.
                        </p>
                    </div>

                </div>

            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">

                {/* NOMBRE */}

                <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Nombre
                    </label>

                    <input
                        type="text"
                        value={editClient.nombre}
                        onChange={(e) =>
                            setEditClient((prev) => ({
                                ...prev,
                                nombre: e.target.value,
                            }))
                        }
                        placeholder="Nombre completo"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                </div>

                {/* EMAIL */}

                <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Email
                    </label>

                    <input
                        type="email"
                        value={selectedUser.email}
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 outline-none"
                    />

                    <p className="mt-1.5 text-[11px] text-slate-400">
                        El email de acceso no se modifica desde este formulario.
                    </p>
                </div>

                {/* TELÉFONO */}

                <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Teléfono
                    </label>

                    <input
                        type="text"
                        value={editClient.telefono}
                        onChange={(e) =>
                            setEditClient((prev) => ({
                                ...prev,
                                telefono: e.target.value,
                            }))
                        }
                        placeholder="Ej. 383 4123456"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                </div>

                {/* DIRECCIÓN */}

                <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Dirección
                    </label>

                    <input
                        type="text"
                        value={editClient.direccion}
                        onChange={(e) =>
                            setEditClient((prev) => ({
                                ...prev,
                                direccion: e.target.value,
                            }))
                        }
                        placeholder="Dirección del cliente"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                </div>

                {/* ESTADO */}

                <button
                    type="button"
                    onClick={() =>
                        setActivateClient(!activateClient)
                    }
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                        activateClient
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-amber-200 bg-amber-50"
                    }`}
                >

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Acceso al sistema
                        </p>

                        <p
                            className={`mt-1 text-sm font-bold ${
                                activateClient
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                            }`}
                        >
                            {activateClient
                                ? "Cliente activo"
                                : "Cliente inactivo"}
                        </p>
                    </div>

                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            activateClient
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-500 text-white"
                        }`}
                    >
                        <Check size={17} />
                    </div>

                </button>

            </div>

        </section>


        {/* ================================================= */}
        {/* 2. VEHÍCULO */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <Car size={17} />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Vehículo
                        </h3>

                        <p className="text-xs text-slate-500">
                            Seleccioná un vehículo existente o registrá uno nuevo.
                        </p>
                    </div>

                </div>

            </div>

            <div className="space-y-5 p-5">

                {/* TIPO */}

                <div className="grid gap-3 sm:grid-cols-2">

                    <button
                        type="button"
                        onClick={() =>
                            setVehicleMode("existing")
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                            vehicleMode === "existing"
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                                : "border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        <p className="text-sm font-bold text-slate-900">
                            Usar vehículo existente
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Seleccionar un vehículo ya registrado.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setVehicleMode("new")
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                            vehicleMode === "new"
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                                : "border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        <p className="text-sm font-bold text-slate-900">
                            Registrar vehículo nuevo
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Crear y asignar un vehículo desde acá.
                        </p>
                    </button>

                </div>


                {/* EXISTENTE */}

                {vehicleMode === "existing" && (
                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Vehículo
                        </label>

                        <div className="relative">

                            <select
                                value={selectedVehicleId}
                                onChange={(e) =>
                                    setSelectedVehicleId(
                                        e.target.value
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >

                                <option value="">
                                    Seleccioná un vehículo
                                </option>

                                {availableVehicles.map(
                                    (vehicle) => (
                                        <option
                                            key={vehicle.id}
                                            value={vehicle.id}
                                        >
                                            {vehicle.marca}{" "}
                                            {vehicle.modelo}{" "}
                                            —{" "}
                                            {vehicle.patente}
                                        </option>
                                    )
                                )}

                            </select>

                            <ChevronDown
                                size={17}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                        </div>

                        {availableVehicles.length === 0 && (
                            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">

                                <p className="text-xs font-medium text-amber-700">
                                    No hay vehículos disponibles.
                                </p>

                                <p className="mt-1 text-xs text-amber-600">
                                    Podés registrar uno nuevo usando la opción de arriba.
                                </p>

                            </div>
                        )}

                        {selectedVehicle && (
                            <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                                    <Car size={20} />
                                </div>

                                <div>

                                    <p className="text-sm font-bold text-slate-900">
                                        {selectedVehicle.marca}{" "}
                                        {selectedVehicle.modelo}
                                    </p>

                                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">

                                        <span className="rounded-md bg-white px-2 py-1 font-semibold">
                                            {selectedVehicle.patente}
                                        </span>

                                        <span>
                                            {selectedVehicle.kilometraje} km
                                        </span>

                                        {selectedVehicle.color && (
                                            <span>
                                                {selectedVehicle.color}
                                            </span>
                                        )}

                                    </div>

                                </div>

                            </div>
                        )}

                    </div>
                )}


                {/* NUEVO */}

                {vehicleMode === "new" && (
                    <div className="space-y-5">

                        {/* FOTO */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Foto del vehículo
                            </label>

                            <div className="flex flex-col gap-4 sm:flex-row">

                                <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 sm:w-52">

                                    {originalPreview ? (
                                        <img
                                            src={originalPreview}
                                            alt="Vista previa"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center">

                                            <Camera
                                                size={25}
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-2 text-xs text-slate-400">
                                                Sin imagen
                                            </p>

                                        </div>
                                    )}

                                </div>

                                <div className="flex flex-1 flex-col justify-center gap-2">

                                    <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">

                                        <Camera size={16} />

                                        Seleccionar foto

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

                                    {originalPreview && (
                                        <button
                                            type="button"
                                            onClick={
                                                removeSelectedImage
                                            }
                                            className="w-fit text-xs font-semibold text-red-500 hover:text-red-600"
                                        >
                                            Quitar imagen
                                        </button>
                                    )}

                                    <p className="text-xs text-slate-400">
                                        La imagen se optimiza automáticamente antes de subirla.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* CAMPOS */}

                        <div className="grid gap-4 sm:grid-cols-2">

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Marca *
                                </label>

                                <input
                                    value={newVehicle.marca}
                                    onChange={(e) =>
                                        handleNewVehicleChange(
                                            "marca",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej. Volkswagen"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Modelo *
                                </label>

                                <input
                                    value={newVehicle.modelo}
                                    onChange={(e) =>
                                        handleNewVehicleChange(
                                            "modelo",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej. Golf"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Año
                                </label>

                                <input
                                    type="number"
                                    value={newVehicle.anio}
                                    onChange={(e) =>
                                        handleNewVehicleChange(
                                            "anio",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej. 2022"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Patente *
                                </label>

                                <input
                                    value={newVehicle.patente}
                                    onChange={(e) =>
                                        handleNewVehicleChange(
                                            "patente",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej. AB123CD"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Color
                                </label>

                                <input
                                    value={newVehicle.color}
                                    onChange={(e) =>
                                        handleNewVehicleChange(
                                            "color",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej. Blanco"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Kilometraje
                                </label>

                                <div className="relative">

                                    <Gauge
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        value={
                                            newVehicle.kilometraje
                                        }
                                        onChange={(e) =>
                                            handleNewVehicleChange(
                                                "kilometraje",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ej. 85000"
                                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Estado
                                </label>

                                <div className="relative">

                                    <select
                                        value={newVehicle.estado}
                                        onChange={(e) =>
                                            handleNewVehicleChange(
                                                "estado",
                                                e.target.value
                                            )
                                        }
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Próximo servicio
                                </label>

                                <input
                                    type="date"
                                    value={
                                        newVehicle.proximoServicio
                                    }
                                    onChange={(e) =>
                                        handleNewVehicleChange(
                                            "proximoServicio",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Observaciones del vehículo
                            </label>

                            <textarea
                                value={
                                    newVehicle.observaciones
                                }
                                onChange={(e) =>
                                    handleNewVehicleChange(
                                        "observaciones",
                                        e.target.value
                                    )
                                }
                                rows={3}
                                placeholder="Información adicional del vehículo..."
                                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            />

                        </div>

                    </div>
                )}

            </div>

        </section>


        {/* ================================================= */}
        {/* 3. SERVICIO */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <Wrench size={17} />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Servicio inicial
                        </h3>

                        <p className="text-xs text-slate-500">
                            Registrá el primer servicio realizado al vehículo.
                        </p>
                    </div>

                </div>

            </div>

            <div className="space-y-5 p-5">

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                    <div className="flex gap-3">

                        <Car
                            size={18}
                            className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                            <p className="text-xs font-bold text-blue-800">
                                Vehículo asociado
                            </p>

                            <p className="mt-1 text-xs text-blue-700">

                                {vehicleMode === "existing" &&
                                selectedVehicle
                                    ? `${selectedVehicle.marca} ${selectedVehicle.modelo} — ${selectedVehicle.patente}`
                                    : vehicleMode === "new" &&
                                        newVehicle.marca &&
                                        newVehicle.modelo
                                      ? `${newVehicle.marca} ${newVehicle.modelo} — ${newVehicle.patente || "Sin patente"}`
                                      : "Se asociará al vehículo seleccionado arriba"}

                            </p>

                        </div>

                    </div>

                </div>


                <div className="grid gap-4 sm:grid-cols-2">

                    {/* SERVICIO */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Servicio realizado *
                        </label>

                        <input
                            value={newService.tipo}
                            onChange={(e) =>
                                handleServiceChange(
                                    "tipo",
                                    e.target.value
                                )
                            }
                            placeholder="Ej. Cambio de aceite"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                    </div>


                    {/* CATEGORÍA */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Categoría *
                        </label>

                        <div className="relative">

                            <select
                                value={
                                    newService.categoria
                                }
                                onChange={(e) =>
                                    handleServiceChange(
                                        "categoria",
                                        e.target.value
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >

                                <option value="">
                                    Seleccioná una categoría
                                </option>

                                {SERVICE_CATEGORIES.map(
                                    (category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
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


                    {/* FECHA */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Fecha del servicio *
                        </label>

                        <input
                            type="date"
                            value={newService.fecha}
                            onChange={(e) =>
                                handleServiceChange(
                                    "fecha",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                    </div>


                    {/* FECHA ENTREGA */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Fecha de entrega estimada
                        </label>

                        <input
                            type="date"
                            min={newService.fecha}
                            value={
                                newService.fechaEntregaEstimada
                            }
                            onChange={(e) =>
                                handleServiceChange(
                                    "fechaEntregaEstimada",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                    </div>


                    {/* KM */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Kilometraje
                        </label>

                        <div className="relative">

                            <Gauge
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="number"
                                min="0"
                                value={
                                    newService.kilometraje
                                }
                                onChange={(e) =>
                                    handleServiceChange(
                                        "kilometraje",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            />

                        </div>

                    </div>


                    {/* IMPORTE */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Importe
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={newService.precio}
                            onChange={(e) =>
                                handleServiceChange(
                                    "precio",
                                    e.target.value
                                )
                            }
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                    </div>


                    {/* ESTADO */}

                    <div className="sm:col-span-2">

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Estado
                        </label>

                        <div className="relative">

                            <select
                                value={
                                    newService.estado
                                }
                                onChange={(e) =>
                                    handleServiceChange(
                                        "estado",
                                        e.target.value
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >

                                {SERVICE_STATUSES.map(
                                    (status) => (
                                        <option
                                            key={status}
                                            value={status}
                                        >
                                            {status}
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

                </div>


                {/* DESCRIPCIÓN */}

                <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Descripción del trabajo
                    </label>

                    <textarea
                        value={
                            newService.descripcion
                        }
                        onChange={(e) =>
                            handleServiceChange(
                                "descripcion",
                                e.target.value
                            )
                        }
                        rows={3}
                        placeholder="Describí el trabajo realizado..."
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                </div>


                {/* OBSERVACIONES */}

                <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Observaciones
                    </label>

                    <textarea
                        value={
                            newService.observaciones
                        }
                        onChange={(e) =>
                            handleServiceChange(
                                "observaciones",
                                e.target.value
                            )
                        }
                        rows={3}
                        placeholder="Observaciones adicionales..."
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                </div>

            </div>

        </section>


        {/* ================================================= */}
        {/* 4. CONFIGURACIÓN FINANCIERA */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <CreditCard size={17} />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Configuración financiera
                        </h3>

                        <p className="text-xs text-slate-500">
                            Registrá un anticipo si el cliente realizó un pago inicial.
                        </p>
                    </div>

                </div>

            </div>

            <div className="space-y-5 p-5">

                <button
                    type="button"
                    onClick={() =>
                        setHasAdvancePayment(
                            !hasAdvancePayment
                        )
                    }
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                        hasAdvancePayment
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                >

                    <div className="flex items-center gap-3">

                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                hasAdvancePayment
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white text-slate-400"
                            }`}
                        >
                            <DollarSign size={19} />
                        </div>

                        <div>

                            <p className="text-sm font-bold text-slate-900">
                                ¿Hubo un anticipo?
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {hasAdvancePayment
                                    ? "Sí, se registrará un pago inicial."
                                    : "No se registrará ningún anticipo."}
                            </p>

                        </div>

                    </div>

                    <div
                        className={`relative h-6 w-11 rounded-full transition ${
                            hasAdvancePayment
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                        }`}
                    >

                        <div
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                hasAdvancePayment
                                    ? "left-6"
                                    : "left-1"
                            }`}
                        />

                    </div>

                </button>


                {hasAdvancePayment && (
                    <div className="space-y-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">

                        <div className="flex items-start gap-3">

                            <DollarSign
                                size={18}
                                className="mt-0.5 shrink-0 text-emerald-600"
                            />

                            <div>

                                <p className="text-sm font-bold text-emerald-800">
                                    Datos del anticipo
                                </p>

                                <p className="mt-1 text-xs text-emerald-700">
                                    Este pago quedará asociado al cliente y al vehículo seleccionado.
                                </p>

                            </div>

                        </div>


                        <div className="grid gap-4 sm:grid-cols-2">

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Importe *
                                </label>

                                <div className="relative">

                                    <DollarSign
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        value={
                                            advancePayment.importe
                                        }
                                        onChange={(e) =>
                                            handleAdvancePaymentChange(
                                                "importe",
                                                e.target.value
                                            )
                                        }
                                        placeholder="0"
                                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                    />

                                </div>

                            </div>


                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Medio de pago *
                                </label>

                                <div className="relative">

                                    <select
                                        value={
                                            advancePayment.medioPago
                                        }
                                        onChange={(e) =>
                                            handleAdvancePaymentChange(
                                                "medioPago",
                                                e.target.value
                                            )
                                        }
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                    >

                                        <option value="">
                                            Seleccioná un medio
                                        </option>

                                        <option value="Efectivo">
                                            Efectivo
                                        </option>

                                        <option value="Transferencia">
                                            Transferencia
                                        </option>

                                        <option value="Tarjeta de débito">
                                            Tarjeta de débito
                                        </option>

                                        <option value="Tarjeta de crédito">
                                            Tarjeta de crédito
                                        </option>

                                        <option value="Mercado Pago">
                                            Mercado Pago
                                        </option>

                                        <option value="Otro">
                                            Otro
                                        </option>

                                    </select>

                                    <ChevronDown
                                        size={17}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>

                            </div>


                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Fecha del pago *
                                </label>

                                <input
                                    type="date"
                                    value={
                                        advancePayment.fecha
                                    }
                                    onChange={(e) =>
                                        handleAdvancePaymentChange(
                                            "fecha",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />

                            </div>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Observaciones del pago
                            </label>

                            <textarea
                                value={
                                    advancePayment.observaciones
                                }
                                onChange={(e) =>
                                    handleAdvancePaymentChange(
                                        "observaciones",
                                        e.target.value
                                    )
                                }
                                rows={3}
                                placeholder="Ej. Seña para comenzar el trabajo..."
                                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />

                        </div>

                    </div>
                )}

            </div>

        </section>


        {/* ================================================= */}
        {/* 5.  */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText size={17} />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            
                        </h3>

                        <p className="text-xs text-slate-500">
                            Configurá si querés generar un  para este servicio.
                        </p>
                    </div>

                </div>

            </div>

            <div className="p-5">

                <button
                    type="button"
                    onClick={() =>
                        setGenerateBudget(
                            !generateBudget
                        )
                    }
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                        generateBudget
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                >

                    <div className="flex items-center gap-3">

                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                generateBudget
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-slate-400"
                            }`}
                        >
                            <FileText size={19} />
                        </div>

                        <div>

                            <p className="text-sm font-bold text-slate-900">
                                ¿Generar ?
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {generateBudget
                                    ? "Sí, se generará un  para el servicio."
                                    : "No se generará ningún ."}
                            </p>

                        </div>

                    </div>

                    <div
                        className={`relative h-6 w-11 rounded-full transition ${
                            generateBudget
                                ? "bg-blue-500"
                                : "bg-slate-300"
                        }`}
                    >

                        <div
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                generateBudget
                                    ? "left-6"
                                    : "left-1"
                            }`}
                        />

                    </div>

                </button>


                {generateBudget && (
    <div className="mt-4 space-y-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4">

        {/* ================================================= */}
        {/* INFORMACIÓN */}
        {/* ================================================= */}

        <div className="flex items-start gap-3">

            <FileText
                size={18}
                className="mt-0.5 shrink-0 text-blue-600"
            />

            <div>

                <p className="text-sm font-bold text-blue-800">
                     habilitado
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                    Se utilizarán los datos del cliente,
                    vehículo y servicio para generar el
                    .
                </p>

            </div>

        </div>


        {/* ================================================= */}
        {/* COTIZACIÓN REPUESTOS */}
        {/* ================================================= */}

        <div className="rounded-xl border border-blue-100 bg-white p-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <p className="text-sm font-bold text-slate-900">
                        Cotización de repuestos
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Subí el PDF que te entrega el proveedor.
                        Se incorporará al  final.
                    </p>

                </div>


                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700">

                    <FileText size={15} />

                    Subir PDF

                    <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {

                            const file =
                                e.target.files?.[0] ??
                                null;

                            if (!file) {
                                return;
                            }

                            if (
                                file.type !==
                                "application/pdf"
                            ) {
                                alert(
                                    "El archivo debe ser un PDF."
                                );

                                return;
                            }

                            if (
                                file.size >
                                15 *
                                    1024 *
                                    1024
                            ) {
                                alert(
                                    "El PDF no puede superar los 15 MB."
                                );

                                return;
                            }

                            setPartsPdf(file);
                        }}
                    />

                </label>

            </div>


            {partsPdf ? (

                <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">

                    <div className="flex min-w-0 items-center gap-3">

                        <FileText
                            size={18}
                            className="shrink-0 text-red-600"
                        />

                        <div className="min-w-0">

                            <p className="truncate text-xs font-semibold text-slate-800">
                                {partsPdf.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                                {(
                                    partsPdf.size /
                                    1024 /
                                    1024
                                ).toFixed(2)}{" "}
                                MB
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            setPartsPdf(null)
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <X size={15} />
                    </button>

                </div>

            ) : (

                <div className="mt-4 rounded-lg border border-dashed border-blue-200 px-4 py-6 text-center">

                    <FileText
                        size={22}
                        className="mx-auto text-blue-300"
                    />

                    <p className="mt-2 text-xs font-semibold text-slate-600">
                        No hay una cotización cargada
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                        PDF de hasta 15 MB
                    </p>

                </div>

            )}

        </div>


        {/* ================================================= */}
        {/* COSTOS */}
        {/* ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2">

            <div>

                <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Repuestos
                </label>

                <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        $
                    </span>

                    <input
                        type="number"
                        min="0"
                        value={budgetPartsCost}
                        onChange={(e) =>
                            setBudgetPartsCost(
                                e.target.value
                            )
                        }
                        placeholder="0"
                        className="text-slate-700 w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                </div>

            </div>


            <div>

                <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Mano de obra
                </label>

                <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        $
                    </span>

                    <input
                        type="number"
                        value={newService.precio}
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 pl-7 pr-3 text-sm text-slate-600 outline-none"
                    />

                </div>

                <p className="mt-1 text-[10px] text-slate-400">
                    Tomado del costo del servicio.
                </p>

            </div>

        </div>


        {/* ================================================= */}
        {/* CONCEPTOS */}
        {/* ================================================= */}

        <div>

            <div className="mb-3 flex items-center justify-between">

                <div>

                    <p className="text-sm font-bold text-slate-900">
                        Conceptos
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Detallá los trabajos y repuestos.
                    </p>

                </div>


                <button
                    type="button"
                    onClick={addBudgetItem}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                    <Plus size={14} />
                    Agregar
                </button>

            </div>


            <div className="space-y-2">

                {budgetItems.map(
                    (item, index) => (

                        <div
                            key={index}
                            className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[110px_1fr_75px_110px_32px]"
                        >

                            <select
                                value={item.type}
                                onChange={(e) =>
                                    updateBudgetItem(
                                        index,
                                        "type",
                                        e.target
                                            .value as
                                            | "Servicio"
                                            | "Repuesto"
                                    )
                                }
                                className="text-slate-700 rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500"
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
                                placeholder="Descripción..."
                                className="text-slate-700 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
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
                                            e.target.value
                                        )
                                    )
                                }
                                className="text-slate-700 rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500"
                            />


                            <div className="relative">

                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                    $
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    value={item.price}
                                    onChange={(e) =>
                                        updateBudgetItem(
                                            index,
                                            "price",
                                            Number(
                                                e.target.value
                                            )
                                        )
                                    }
                                    className="text-slate-700 w-full rounded-lg border border-slate-200 py-2 pl-6 pr-2 text-xs outline-none focus:border-blue-500"
                                />

                            </div>


                            <button
                                type="button"
                                disabled={
                                    budgetItems.length ===
                                    1
                                }
                                onClick={() =>
                                    removeBudgetItem(
                                        index
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                            >
                                <X size={14} />
                            </button>

                        </div>

                    )
                )}

            </div>

        </div>


        {/* ================================================= */}
        {/* VIGENCIA */}
        {/* ================================================= */}

        <div>

            <label className="mb-2 block text-xs font-semibold text-slate-700">
                 válido hasta
            </label>

            <input
                type="date"
                value={budgetValidUntil}
                onChange={(e) =>
                    setBudgetValidUntil(
                        e.target.value
                    )
                }
                className="text-slate-700 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

        </div>


        {/* ================================================= */}
        {/* TOTAL */}
        {/* ================================================= */}

        <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-4 text-white">

            <div>

                <p className="text-sm font-semibold">
                    Total 
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                    Repuestos + mano de obra
                </p>

            </div>


            <p className="text-2xl font-bold">
                {new Intl.NumberFormat(
                    "es-AR",
                    {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                    }
                ).format(
                    budgetTotal
                )}
            </p>

        </div>


        {/* ================================================= */}
        {/* OBSERVACIONES */}
        {/* ================================================= */}

        <div>

            <label className="mb-2 block text-xs font-semibold text-slate-700">
                Observaciones del 
            </label>

            <textarea
                rows={3}
                value={budgetNotes}
                onChange={(e) =>
                    setBudgetNotes(
                        e.target.value
                    )
                }
                placeholder="Condiciones, detalles o información adicional..."
                className="text-slate-700 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

        </div>

    </div>
)}

            </div>

        </section>


        {/* ================================================= */}
        {/* 6. RECIBO */}
        {/* ================================================= */}

        {hasAdvancePayment && (
            <section className="rounded-2xl border border-slate-200 bg-white">

                <div className="border-b border-slate-100 px-5 py-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                            <FileText size={17} />
                        </div>

                        <div>

                            <h3 className="text-sm font-bold text-slate-900">
                                Recibo
                            </h3>

                            <p className="text-xs text-slate-500">
                                Configurá si querés emitir un recibo por el pago registrado.
                            </p>

                        </div>

                    </div>

                </div>

                <div className="p-5">

                    <button
                        type="button"
                        onClick={() =>
                            setGenerateReceipt(
                                !generateReceipt
                            )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                            generateReceipt
                                ? "border-violet-200 bg-violet-50"
                                : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                    >

                        <div className="flex items-center gap-3">

                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                    generateReceipt
                                        ? "bg-violet-500 text-white"
                                        : "bg-white text-slate-400"
                                }`}
                            >
                                <FileText size={19} />
                            </div>

                            <div>

                                <p className="text-sm font-bold text-slate-900">
                                    ¿Generar recibo?
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {generateReceipt
                                        ? "Sí, se emitirá un recibo por el anticipo."
                                        : "No se generará ningún recibo."}
                                </p>

                            </div>

                        </div>

                        <div
                            className={`relative h-6 w-11 rounded-full transition ${
                                generateReceipt
                                    ? "bg-violet-500"
                                    : "bg-slate-300"
                            }`}
                        >

                            <div
                                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                    generateReceipt
                                        ? "left-6"
                                        : "left-1"
                                }`}
                            />

                        </div>

                    </button>


                    {generateReceipt && (
                        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">

                            <div className="flex items-start gap-3">

                                <FileText
                                    size={18}
                                    className="mt-0.5 shrink-0 text-violet-600"
                                />

                                <div>

                                    <p className="text-sm font-bold text-violet-800">
                                        Recibo habilitado
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-violet-700">
                                        El recibo utilizará los datos del cliente, vehículo, importe y medio de pago registrados.
                                    </p>

                                </div>

                            </div>

                        </div>
                    )}

                </div>

            </section>
        )}


        {/* ================================================= */}
        {/* RESUMEN */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex items-start gap-3">

                <FileText
                    size={19}
                    className="mt-0.5 text-slate-500"
                />

                <div>

                    <h3 className="text-sm font-bold text-slate-800">
                        Resumen de la operación
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Al guardar se actualizarán los datos del cliente y el estado de acceso. También se podrá asignar o crear el vehículo y registrar el servicio correspondiente.
                    </p>

                </div>

            </div>

        </div>

    </div>

</div>

                {/* ===================================================== */}
                {/* FOOTER */}
                {/* ===================================================== */}

                <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs text-slate-400">
                        Los cambios se guardarán en Firebase.
                    </p>

                    <div className="flex justify-end gap-3">

                        <button
                            onClick={
                                handleClose
                            }
                            disabled={saving}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={
                                handleSave
                            }
                            disabled={
                                saving
                            }
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check
                                size={
                                    16
                                }
                            />

                            {saving
                                ? "Guardando..."
                                : "Guardar configuración"}
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ModalGeneral;