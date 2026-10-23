
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { app } from "../config/firebase";

interface CanjearQRResponse {
  success: boolean;
  customToken: string;
}

export default function AccesoQR() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithQR } = useAuth();

  const inicioAutomatico = useRef(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = params.get("token") ?? "";

  const ingresar = useCallback(async () => {
    if (!token) {
      setError("El enlace no contiene un QR válido.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const functions = getFunctions(app, "us-central1");

      const canjear = httpsCallable<
        { token: string },
        CanjearQRResponse
      >(functions, "canjearQRCliente");

      const resultado = await canjear({ token });

      if (!resultado.data.customToken) {
        throw new Error("No se recibió el token de acceso.");
      }

      await loginWithQR(resultado.data.customToken);

      navigate("/cliente", { replace: true });
    } catch (err) {
      console.error("Error ingresando con QR:", err);

      setError(
        "No se pudo ingresar. Verificá que el QR sea válido y que la cuenta del cliente esté habilitada. Si el problema continúa, solicitá un nuevo QR."
      );
    } finally {
      setLoading(false);
    }
  }, [token, loginWithQR, navigate]);

  useEffect(() => {
    if (!token || inicioAutomatico.current) return;

    inicioAutomatico.current = true;
    void ingresar();
  }, [token, ingresar]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
          {loading ? (
            <LoaderCircle size={32} className="animate-spin" />
          ) : (
            <ShieldCheck size={32} />
          )}
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
          Mecánica Mora
        </p>

        <h1 className="mt-3 text-2xl font-bold">
          Acceso de cliente
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {loading
            ? "Estamos verificando tu acceso e iniciando sesión. Esperá unos segundos..."
            : error
              ? "No pudimos completar el ingreso a tu cuenta."
              : "Accedé a tu cuenta para consultar la información de tus vehículos y servicios."}
        </p>

        {!token && (
          <p className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
            Falta el código de acceso en este enlace. Escaneá un QR válido.
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {token && !loading && (
          <button
            type="button"
            onClick={() => void ingresar()}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            Reintentar ingreso
          </button>
        )}

        {loading && (
          <div className="mt-7 flex items-center justify-center gap-2 text-sm text-orange-400">
            <LoaderCircle size={17} className="animate-spin" />
            Verificando acceso...
          </div>
        )}

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          Mecánica Mora · Acceso seguro de clientes
        </p>
      </div>
    </main>
  );
}
