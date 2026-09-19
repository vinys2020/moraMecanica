
import {
    Car,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Edit3,
    Mail,
    Phone,
    Search,
    Shield,
    UserRound,
    Users,
    X,
} from "lucide-react";

import {
    collection,
    doc,
    getDocs,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../components/AdminLayout";
import { db } from "../config/firebase";

type UserRole = "admin" | "empleado" | "cliente";

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

type StatusFilter = "Todos" | "Activo" | "Inactivo";

const Clientes = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("Todos");

    const [selectedUser, setSelectedUser] =
        useState<UserData | null>(null);

    const [showDetailsModal, setShowDetailsModal] =
        useState(false);

    const [showEditModal, setShowEditModal] =
        useState(false);

    const [showVehicleModal, setShowVehicleModal] =
        useState(false);

    const [selectedVehicleId, setSelectedVehicleId] =
        useState("");

    const [editUser, setEditUser] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        rol: "cliente" as UserRole,
        activo: true,
    });

    /*
    |--------------------------------------------------------------------------
    | CARGAR USUARIOS
    |--------------------------------------------------------------------------
    */

    const cargarUsuarios = async () => {
        try {
            setLoading(true);

            const snapshot = await getDocs(
                collection(db, "usuarios")
            );

            const usuarios: UserData[] = snapshot.docs.map(
                (document) => {
                    const data = document.data();

                    return {
                        id: document.id,
                        uid: data.uid ?? document.id,
                        nombre: data.nombre ?? "",
                        email: data.email ?? "",
                        telefono:
                            data.telefono ??
                            data.phone ??
                            "",
                        direccion:
                            data.direccion ??
                            data.address ??
                            "",
                        rol: data.rol ?? null,
                        activo: data.activo === true,
                        creadoEn: data.creadoEn,
                    };
                }
            );

            setUsers(usuarios);
        } catch (error) {
            console.error(
                "Error cargando usuarios:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | CARGAR VEHÍCULOS
    |--------------------------------------------------------------------------
    */

    const cargarVehiculos = async () => {
        try {
            const snapshot = await getDocs(
                collection(db, "vehiculos")
            );

            const lista: Vehicle[] = snapshot.docs.map(
                (document) => {
                    const data = document.data();

                    return {
                        id: document.id,
                        clienteId:
                            data.clienteId ??
                            data.usuarioId ??
                            null,
                        marca: data.marca ?? "",
                        modelo: data.modelo ?? "",
                        patente:
                            data.patente ??
                            data.matricula ??
                            "",
                        anio: String(
                            data.anio ?? ""
                        ),
                        color: data.color ?? "",
                        kilometraje: Number(
                            data.kilometraje ?? 0
                        ),
                        creadoEn: data.creadoEn,
                    };
                }
            );

            setVehicles(lista);
        } catch (error) {
            console.error(
                "Error cargando vehículos:",
                error
            );
        }
    };

    useEffect(() => {
        cargarUsuarios();
        cargarVehiculos();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | FILTRAR CLIENTES
    |--------------------------------------------------------------------------
    */

    const clients = useMemo(() => {
        return users.filter(
            (user) => user.rol === "cliente"
        );
    }, [users]);

    const filteredClients = useMemo(() => {
        const normalizedSearch =
            search.toLowerCase().trim();

        return clients.filter((client) => {
            const matchesSearch =
                client.nombre
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                client.email
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                client.telefono
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                client.uid
                    .toLowerCase()
                    .includes(normalizedSearch);

            let matchesStatus = true;

            if (statusFilter === "Activo") {
                matchesStatus =
                    client.activo === true;
            }

            if (statusFilter === "Inactivo") {
                matchesStatus =
                    client.activo === false;
            }

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        clients,
        search,
        statusFilter,
    ]);

    /*
    |--------------------------------------------------------------------------
    | ESTADÍSTICAS
    |--------------------------------------------------------------------------
    */

    const totalClients = clients.length;

    const activeClients = clients.filter(
        (client) => client.activo
    ).length;

    const inactiveClients = clients.filter(
        (client) => !client.activo
    ).length;

    const totalVehicles = vehicles.filter(
        (vehicle) => vehicle.clienteId
    ).length;

    const stats = [
        {
            title: "Total clientes",
            value: totalClients,
            description: "usuarios registrados",
            positive: true,
            icon: Users,
        },
        {
            title: "Clientes activos",
            value: activeClients,
            description: "con acceso habilitado",
            positive: true,
            icon: UserRound,
        },
        {
            title: "Clientes inactivos",
            value: inactiveClients,
            description: "sin acceso habilitado",
            positive: false,
            icon: Clock3,
        },
        {
            title: "Vehículos registrados",
            value: totalVehicles,
            description: "asignados a clientes",
            positive: true,
            icon: Car,
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | VEHÍCULOS DE CLIENTE
    |--------------------------------------------------------------------------
    */

    const getUserVehicles = (
        userId: string
    ) => {
        return vehicles.filter(
            (vehicle) =>
                vehicle.clienteId === userId
        );
    };

    /*
    |--------------------------------------------------------------------------
    | ACTIVAR / DESACTIVAR
    |--------------------------------------------------------------------------
    */

    const toggleUserStatus = async (
        user: UserData
    ) => {
        try {
            setSaving(true);

            const newStatus =
                !user.activo;

            await updateDoc(
                doc(
                    db,
                    "usuarios",
                    user.uid
                ),
                {
                    activo: newStatus,
                    actualizadoEn:
                        serverTimestamp(),
                }
            );

            setUsers((prev) =>
                prev.map((item) =>
                    item.uid === user.uid
                        ? {
                              ...item,
                              activo:
                                  newStatus,
                          }
                        : item
                )
            );

            if (
                selectedUser?.uid ===
                user.uid
            ) {
                setSelectedUser({
                    ...user,
                    activo: newStatus,
                });
            }
        } catch (error) {
            console.error(
                "Error cambiando estado:",
                error
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | ABRIR EDICIÓN
    |--------------------------------------------------------------------------
    */

    const openEditModal = (
        user: UserData
    ) => {
        setSelectedUser(user);

        setEditUser({
            nombre: user.nombre,
            telefono: user.telefono,
            direccion: user.direccion,
            rol:
                user.rol ??
                "cliente",
            activo: user.activo,

        });

        setShowEditModal(true);
    };

    /*
    |--------------------------------------------------------------------------
    | GUARDAR EDICIÓN
    |--------------------------------------------------------------------------
    */

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true);

            await updateDoc(
                doc(
                    db,
                    "usuarios",
                    selectedUser.uid
                ),
                {
                    nombre:
                        editUser.nombre.trim(),
                    telefono:
                        editUser.telefono.trim(),
                    direccion:
                        editUser.direccion.trim(),
                    rol: editUser.rol,
                    actualizadoEn:
                        serverTimestamp(),
                        activo: editUser.activo,
                }
            );

            setUsers((prev) =>
                prev.map((user) =>
                    user.uid ===
                    selectedUser.uid
                        ? {
                              ...user,
                              nombre:
                                  editUser.nombre.trim(),
                              telefono:
                                  editUser.telefono.trim(),
                              direccion:
                                  editUser.direccion.trim(),
                              rol:
                                  editUser.rol,
                                  
                                activo:editUser.activo,
                          }
                        : user
                )
            );

            setSelectedUser({
                ...selectedUser,
                nombre:
                    editUser.nombre.trim(),
                telefono:
                    editUser.telefono.trim(),
                direccion:
                    editUser.direccion.trim(),
                rol: editUser.rol,
            });

            setShowEditModal(false);
        } catch (error) {
            console.error(
                "Error actualizando usuario:",
                error
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | ASIGNAR VEHÍCULO EXISTENTE
    |--------------------------------------------------------------------------
    */

    const assignVehicle = async () => {
        if (
            !selectedUser ||
            !selectedVehicleId
        ) {
            return;
        }

        try {
            setSaving(true);

            await updateDoc(
                doc(
                    db,
                    "vehiculos",
                    selectedVehicleId
                ),
                {
                    clienteId:
                        selectedUser.uid,
                    actualizadoEn:
                        serverTimestamp(),
                }
            );

            setVehicles((prev) =>
                prev.map((vehicle) =>
                    vehicle.id ===
                    selectedVehicleId
                        ? {
                              ...vehicle,
                              clienteId:
                                  selectedUser.uid,
                          }
                        : vehicle
                )
            );

            setSelectedVehicleId("");
            setShowVehicleModal(false);
        } catch (error) {
            console.error(
                "Error asignando vehículo:",
                error
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | DESASIGNAR VEHÍCULO
    |--------------------------------------------------------------------------
    */

    const unassignVehicle = async (
        vehicleId: string
    ) => {
        try {
            setSaving(true);

            await updateDoc(
                doc(
                    db,
                    "vehiculos",
                    vehicleId
                ),
                {
                    clienteId: null,
                    actualizadoEn:
                        serverTimestamp(),
                }
            );

            setVehicles((prev) =>
                prev.map((vehicle) =>
                    vehicle.id === vehicleId
                        ? {
                              ...vehicle,
                              clienteId: null,
                          }
                        : vehicle
                )
            );
        } catch (error) {
            console.error(
                "Error desasignando vehículo:",
                error
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | ABRIR DETALLE
    |--------------------------------------------------------------------------
    */

    const openDetails = (
        user: UserData
    ) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
    };

    /*
    |--------------------------------------------------------------------------
    | INICIALES
    |--------------------------------------------------------------------------
    */

    const getInitials = (
        name: string
    ) => {
        if (!name.trim()) return "CL";

        return name
            .split(" ")
            .filter(Boolean)
            .map(
                (word) =>
                    word[0]
            )
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    /*
    |--------------------------------------------------------------------------
    | FORMATO FECHA
    |--------------------------------------------------------------------------
    */

    const formatDate = (
        timestamp: any
    ) => {
        if (!timestamp) {
            return "Sin fecha";
        }

        try {
            const date =
                timestamp.toDate
                    ? timestamp.toDate()
                    : new Date(timestamp);

            return date.toLocaleDateString(
                "es-AR",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );
        } catch {
            return "Sin fecha";
        }
    };

    return (
        <AdminLayout>
            <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">

                {/* HEADER */}
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-1 text-sm font-medium text-blue-600">
                            Gestión de clientes
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Clientes
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Administrá usuarios, estados y vehículos del taller.
                        </p>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.title}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {stat.title}
                                        </p>

                                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                            {stat.value}
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Icon size={20} />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-xs text-slate-400">
                                        {stat.description}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CLIENTS */}
                <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* TOOLBAR */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Lista de clientes
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {filteredClients.length} clientes encontrados
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
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Buscar cliente..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-64"
                                />
                            </div>

                            {/* STATUS */}
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as StatusFilter
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="Todos">
                                    Todos los estados
                                </option>

                                <option value="Activo">
                                    Activos
                                </option>

                                <option value="Inactivo">
                                    Inactivos
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* LOADING */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center px-5 py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm text-slate-500">
                                Cargando clientes...
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* TABLE */}
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/70">
                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Cliente
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Contacto
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Vehículos
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Registro
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Rol
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Estado
                                            </th>

                                            <th className="px-5 py-3" />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredClients.map(
                                            (
                                                client,
                                                index
                                            ) => {
                                                const clientVehicles =
                                                    getUserVehicles(
                                                        client.uid
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            client.uid
                                                        }
                                                        className={`group transition hover:bg-slate-50 ${
                                                            index !==
                                                            filteredClients.length -
                                                                1
                                                                ? "border-b border-slate-100"
                                                                : ""
                                                        }`}
                                                    >
                                                        {/* CLIENT */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                                                                    {getInitials(
                                                                        client.nombre
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900">
                                                                        {client.nombre ||
                                                                            "Sin nombre"}
                                                                    </p>

                                                                    <p className="mt-0.5 max-w-[260px] truncate text-xs text-slate-400">
                                                                        {
                                                                            client.uid
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* CONTACT */}
                                                        <td className="px-5 py-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                    <Mail
                                                                        size={13}
                                                                        className="text-slate-400"
                                                                    />

                                                                    <span className="max-w-[240px] truncate">
                                                                        {
                                                                            client.email
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <Phone
                                                                        size={13}
                                                                        className="text-slate-400"
                                                                    />

                                                                    {client.telefono ||
                                                                        "Sin teléfono"}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* VEHICLES */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                                    <Car
                                                                        size={15}
                                                                    />
                                                                </div>

                                                                <span className="text-sm font-semibold text-slate-700">
                                                                    {
                                                                        clientVehicles.length
                                                                    }
                                                                </span>

                                                                <span className="text-xs text-slate-400">
                                                                    {clientVehicles.length ===
                                                                    1
                                                                        ? "vehículo"
                                                                        : "vehículos"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* DATE */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Clock3
                                                                    size={15}
                                                                    className="text-slate-400"
                                                                />

                                                                <span className="text-sm text-slate-600">
                                                                    {formatDate(
                                                                        client.creadoEn
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* ROLE */}
                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                                                                <Shield
                                                                    size={12}
                                                                />

                                                                Cliente
                                                            </span>
                                                        </td>

                                                        {/* STATUS */}
                                                        <td className="px-5 py-4">
                                                            <button
                                                                onClick={() =>
                                                                    toggleUserStatus(
                                                                        client
                                                                    )
                                                                }
                                                                disabled={
                                                                    saving
                                                                }
                                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                                                    client.activo
                                                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                                        client.activo
                                                                            ? "bg-emerald-500"
                                                                            : "bg-amber-500"
                                                                    }`}
                                                                />

                                                                {client.activo
                                                                    ? "Activo"
                                                                    : "Inactivo"}
                                                            </button>
                                                        </td>

                                                        {/* ACTIONS */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() =>
                                                                        openDetails(
                                                                            client
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                                    title="Ver cliente"
                                                                >
                                                                    <Edit3
                                                                        size={18}
                                                                    />
                                                                </button>

                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* EMPTY */}
                            {filteredClients.length === 0 && (
                                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                        <Search size={24} />
                                    </div>

                                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                                        No encontramos clientes
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Probá con otro nombre, email, teléfono o estado.
                                    </p>
                                </div>
                            )}

                            {/* FOOTER */}
                            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                                <p className="text-xs text-slate-400">
                                    Mostrando{" "}
                                    {
                                        filteredClients.length
                                    }{" "}
                                    de{" "}
                                    {
                                        clients.length
                                    }{" "}
                                    clientes
                                </p>

                                <div className="flex items-center gap-2">
                                    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                                        <ChevronLeft
                                            size={16}
                                        />
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
                                        <ChevronRight
                                            size={16}
                                        />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {/* ========================================================= */}
            {/* MODAL DETALLE */}
            {/* ========================================================= */}

            {showDetailsModal &&
                selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                            {/* HEADER */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                                        {getInitials(
                                            selectedUser.nombre
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {selectedUser.nombre ||
                                                "Sin nombre"}
                                        </h2>

                                        <p className="text-sm text-slate-500">
                                            {selectedUser.email}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() =>
                                        setShowDetailsModal(
                                            false
                                        )
                                    }
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6 p-6">

                                {/* USER INFO */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Email
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {selectedUser.email ||
                                                "Sin email"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Teléfono
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {selectedUser.telefono ||
                                                "Sin teléfono"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Dirección
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {selectedUser.direccion ||
                                                "Sin dirección"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Estado
                                        </p>

                                        <div className="mt-1">
                                            <button
                                                onClick={() =>
                                                    toggleUserStatus(
                                                        selectedUser
                                                    )
                                                }
                                                disabled={saving}
                                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                    selectedUser.activo
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-amber-50 text-amber-700"
                                                }`}
                                            >
                                                <span
                                                    className={`h-2 w-2 rounded-full ${
                                                        selectedUser.activo
                                                            ? "bg-emerald-500"
                                                            : "bg-amber-500"
                                                    }`}
                                                />

                                                {selectedUser.activo
                                                    ? "Activo"
                                                    : "Inactivo"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* VEHICLES */}
                                <div>
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                Vehículos
                                            </h3>

                                            <p className="text-sm text-slate-500">
                                                Vehículos asociados a este cliente.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                setShowVehicleModal(
                                                    true
                                                )
                                            }
                                            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            <Car size={15} />
                                            Asignar vehículo
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {getUserVehicles(
                                            selectedUser.uid
                                        ).map(
                                            (
                                                vehicle
                                            ) => (
                                                <div
                                                    key={
                                                        vehicle.id
                                                    }
                                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                                            <Car
                                                                size={20}
                                                            />
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {
                                                                    vehicle.marca
                                                                }{" "}
                                                                {
                                                                    vehicle.modelo
                                                                }
                                                            </p>

                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold">
                                                                    {
                                                                        vehicle.patente
                                                                    }
                                                                </span>

                                                                {vehicle.anio && (
                                                                    <span>
                                                                        {
                                                                            vehicle.anio
                                                                        }
                                                                    </span>
                                                                )}

                                                                {vehicle.color && (
                                                                    <span>
                                                                        {
                                                                            vehicle.color
                                                                        }
                                                                    </span>
                                                                )}

                                                                <span>
                                                                    {
                                                                        vehicle.kilometraje
                                                                    }{" "}
                                                                    km
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            unassignVehicle(
                                                                vehicle.id
                                                            )
                                                        }
                                                        disabled={
                                                            saving
                                                        }
                                                        className="rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        Desasignar
                                                    </button>
                                                </div>
                                            )
                                        )}

                                        {getUserVehicles(
                                            selectedUser.uid
                                        ).length ===
                                            0 && (
                                            <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                                                <Car
                                                    size={25}
                                                    className="mx-auto text-slate-300"
                                                />

                                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                                    Sin vehículos asignados
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Podés asignarle un vehículo existente desde el botón de arriba.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                                <button
                                    onClick={() =>
                                        openEditModal(
                                            selectedUser
                                        )
                                    }
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Edit3 size={16} />
                                    Editar cliente
                                </button>

                                <button
                                    onClick={() =>
                                        setShowDetailsModal(
                                            false
                                        )
                                    }
                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* ========================================================= */}
            {/* MODAL EDITAR */}
            {/* ========================================================= */}

            {showEditModal &&
    selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm text-black">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Clientes
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                            Editar cliente
                        </h2>
                    </div>

                    <button
                        onClick={() =>
                            setShowEditModal(
                                false
                            )
                        }
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5 p-6">

                    {/* NOMBRE */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Nombre completo
                        </label>

                        <input
                            value={
                                editUser.nombre
                            }
                            onChange={(e) =>
                                setEditUser(
                                    {
                                        ...editUser,
                                        nombre:
                                            e.target.value,
                                    }
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* TELÉFONO */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Teléfono
                        </label>

                        <input
                            value={
                                editUser.telefono
                            }
                            onChange={(e) =>
                                setEditUser(
                                    {
                                        ...editUser,
                                        telefono:
                                            e.target.value,
                                    }
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* DIRECCIÓN */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Dirección
                        </label>

                        <input
                            value={
                                editUser.direccion
                            }
                            onChange={(e) =>
                                setEditUser(
                                    {
                                        ...editUser,
                                        direccion:
                                            e.target.value,
                                    }
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* ROL */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Rol
                        </label>

                        <div className="relative">
                            <select
                                value={
                                    editUser.rol
                                }
                                onChange={(e) =>
                                    setEditUser(
                                        {
                                            ...editUser,
                                            rol:
                                                e.target.value as UserRole,
                                        }
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="cliente">
                                    Cliente
                                </option>

                                <option value="empleado">
                                    Empleado
                                </option>

                                <option value="admin">
                                    Administrador
                                </option>
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
                                    editUser.activo
                                        ? "activo"
                                        : "inactivo"
                                }
                                onChange={(e) =>
                                    setEditUser(
                                        {
                                            ...editUser,
                                            activo:
                                                e.target.value ===
                                                "activo",
                                        }
                                    )
                                }
                                className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-4 ${
                                    editUser.activo
                                        ? "border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/10"
                                        : "border-red-200 text-red-700 focus:border-red-500 focus:ring-red-500/10"
                                }`}
                            >
                                <option value="activo">
                                    Activo — Puede iniciar sesión
                                </option>

                                <option value="inactivo">
                                    Inactivo — Acceso bloqueado
                                </option>
                            </select>

                            <ChevronDown
                                size={17}
                                className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${
                                    editUser.activo
                                        ? "text-emerald-500"
                                        : "text-red-500"
                                }`}
                            />
                        </div>

                        {!editUser.activo && (
                            <p className="mt-2 text-xs text-red-500">
                                El cliente no podrá iniciar sesión mientras
                                su cuenta esté inactiva.
                            </p>
                        )}
                    </div>

                    {/* EMAIL */}
                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Email
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                            {
                                selectedUser.email
                            }
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                            El email pertenece a Firebase Authentication y no se modifica desde este formulario.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">

                    <button
                        onClick={() =>
                            setShowEditModal(
                                false
                            )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={
                            handleUpdateUser
                        }
                        disabled={
                            saving
                        }
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Check size={16} />

                        {saving
                            ? "Guardando..."
                            : "Guardar cambios"}
                    </button>

                </div>
            </div>
        </div>
    )}

            {/* ========================================================= */}
            {/* MODAL ASIGNAR VEHÍCULO */}
            {/* ========================================================= */}

            {showVehicleModal &&
                selectedUser && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm text-dark">
                        <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                        Vehículos
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                                        Asignar vehículo
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Cliente:{" "}
                                        <strong>
                                            {
                                                selectedUser.nombre
                                            }
                                        </strong>
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowVehicleModal(
                                            false
                                        );
                                        setSelectedVehicleId("");
                                    }}
                                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Vehículo
                                </label>

                                <div className="relative">
                                    <select
                                        value={
                                            selectedVehicleId
                                        }
                                        onChange={(e) =>
                                            setSelectedVehicleId(
                                                e.target.value
                                            )
                                        }
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-black"
                                    >
                                        <option value="">
                                            Seleccioná un vehículo
                                        </option>

                                        {vehicles
                                            .filter(
                                                (
                                                    vehicle
                                                ) =>
                                                    !vehicle.clienteId ||
                                                    vehicle.clienteId ===
                                                        selectedUser.uid
                                            )
                                            .map(
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

                                {vehicles.filter(
                                    (vehicle) =>
                                        !vehicle.clienteId ||
                                        vehicle.clienteId ===
                                            selectedUser.uid
                                ).length === 0 && (
                                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                        <p className="text-xs font-medium text-amber-700">
                                            No hay vehículos disponibles para asignar.
                                        </p>

                                        <p className="mt-1 text-xs text-amber-600">
                                            Primero creá el vehículo desde la sección Vehículos.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                                <button
                                    onClick={() => {
                                        setShowVehicleModal(
                                            false
                                        );
                                        setSelectedVehicleId("");
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={
                                        assignVehicle
                                    }
                                    disabled={
                                        !selectedVehicleId ||
                                        saving
                                    }
                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Asignando..."
                                        : "Asignar vehículo"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </AdminLayout>
    );
};

export default Clientes;

