import {
    CalendarDays,
    Car,
    ChevronRight,
    CircleDollarSign,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    ShieldCheck,
    Users,
    Wrench,
    X,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/admin",
    },
    {
        title: "Turnos",
        icon: CalendarDays,
        path: "/admin/turnos",
    },
    {
        title: "Clientes",
        icon: Users,
        path: "/admin/clientes",
    },
    {
        title: "Vehículos",
        icon: Car,
        path: "/admin/vehiculos",
    },
    {
        title: "Servicios",
        icon: Wrench,
        path: "/admin/servicios",
    },
    {
        title: "Presupuestos",
        icon: FileText,
        path: "/admin/presupuestos",
    },
    {
        title: "Facturación",
        icon: CircleDollarSign,
        path: "/admin/facturacion",
    },
    {
        title: "Inventario",
        icon: Package,
        path: "/admin/inventario",
    },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50">

            {/* MOBILE OVERLAY */}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-950 transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                }`}
            >

                <div className="flex h-full flex-col">

                    {/* LOGO */}

                    <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">

                        <div>
                            <p className="text-lg font-bold text-white">
                                Mora Mecánica
                            </p>

                            <p className="text-xs text-slate-500">
                                Panel administrativo
                            </p>
                        </div>

                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
                        >
                            <X size={20} />
                        </button>

                    </div>

                    {/* USER */}

                    <div className="border-b border-white/10 p-4">

                        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                                <ShieldCheck
                                    size={20}
                                    className="text-white"
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                    Administrador
                                </p>

                                <p className="text-xs text-slate-500">
                                    Acceso completo
                                </p>
                            </div>

                        </div>

                    </div>

                    {/* NAVIGATION */}

                    <nav className="flex-1 overflow-y-auto p-4">

                        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Administración
                        </p>

                        <div className="space-y-1">

                            {menuItems.map((item) => {

                                const Icon = item.icon;

                                const isActive =
                                    location.pathname === item.path ||
                                    (
                                        item.path === "/admin" &&
                                        location.pathname === "/admin/"
                                    );

                                return (
                                    <button
                                        key={item.title}
                                        onClick={() => {
                                            navigate(item.path);
                                            setSidebarOpen(false);
                                        }}
                                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        }`}
                                    >

                                        <Icon
                                            size={19}
                                            className={
                                                isActive
                                                    ? "text-white"
                                                    : "text-slate-500 group-hover:text-white"
                                            }
                                        />

                                        <span>
                                            {item.title}
                                        </span>

                                        {isActive && (
                                            <ChevronRight
                                                size={16}
                                                className="ml-auto"
                                            />
                                        )}

                                    </button>
                                );

                            })}

                        </div>

                    </nav>

                    {/* LOGOUT */}

                    <div className="border-t border-white/10 p-4">

                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut size={19} />
                            Cerrar sesión
                        </button>

                    </div>

                </div>

            </aside>

            {/* MAIN */}

            <div className="lg:pl-72">

                {/* TOPBAR */}

                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

                    <div className="flex h-20 items-center justify-between px-5 sm:px-8">

                        <div className="flex items-center gap-3">

                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                            >
                                <Menu size={22} />
                            </button>

                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Panel administrativo
                                </p>

                                <p className="text-xs text-slate-400">
                                    Mora Mecánica
                                </p>
                            </div>

                        </div>

                    </div>

                </header>

                {/* CONTENT */}

                <main>
                    {children}
                </main>

            </div>

        </div>
    );
};

export default AdminLayout;