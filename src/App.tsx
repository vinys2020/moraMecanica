import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import DashboardAdmin from './pages/DashboardAdmin'
import ClientDashboard from './pages/ClientDashboard'
import Turnos from './pages/Turnos'
import Clientes from "./pages/Clientes";
import Vehiculos from "./pages/Vehiculos";
import Servicios from './pages/Servicios' 
import Presupuestos from "./pages/Presupuestos";
import Facturacion from "./pages/Facturacion";
import Inventario from './pages/Inventario'
import Register from './pages/Register'
import RegistroPendiente from './pages/RegistroPendiente'
import { useAuth } from './context/AuthContext'

function App() {
  const { user, rol, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-sm font-bold uppercase tracking-widest text-white/40">
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* LOGIN */}

        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={
                  rol === 'admin'
                    ? '/admin'
                    : rol === 'empleado'
                      ? '/empleado'
                      : rol === 'cliente'
                        ? '/cliente'
                        : '/'
                }
                replace
              />
            ) : (
              <Login />
            )
          }
        />

        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            user && rol === 'admin' ? (
              <DashboardAdmin />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* TURNOS */}

        <Route
          path="/admin/turnos"
          element={
            user && rol === 'admin' ? (
              <Turnos />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
  path="/admin/clientes"
  element={
    user && rol === 'admin' ? (
      <Clientes />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        <Route
  path="/admin/vehiculos"
  element={
    user && rol === 'admin' ? (
      <Vehiculos />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        <Route
          path="/admin/servicios"
          element={
            user && rol === 'admin' ? (
              <Servicios />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/presupuestos"
          element={ 
            user && rol === 'admin' ? (
              <Presupuestos />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
  path="/admin/facturacion"
  element={
    user && rol === "admin" ? (
      <Facturacion />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        <Route
  path="/admin/inventario"
  element={
    user && rol === "admin" ? (
      <Inventario />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>


        {/* REGISTER */}

<Route
  path="/register"
  element={
    user ? (
      <Navigate to="/" replace />
    ) : (
      <Register />
    )
  }
/>

<Route
  path="/registro-pendiente"
  element={<RegistroPendiente />}
/>


        {/* EMPLEADO */}

        <Route
          path="/empleado"
          element={
            user && rol === 'empleado' ? (
              <div className="p-10">
                Panel empleado
              </div>
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* CLIENTE */}

        <Route
          path="/cliente"
          element={
            user && rol === 'cliente' ? (
              <ClientDashboard />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />



        {/* CUALQUIER OTRA RUTA */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App