
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Check, Copy, LoaderCircle, X } from "lucide-react";

import { app } from "../config/firebase";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface CrearClienteResponse {
  success: boolean;
  uid: string;
  qrUrl: string;
}

export default function CrearClienteQRModal({
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  const [qrUrl, setQrUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const actualizar = (
    campo: keyof typeof form,
    valor: string
  ) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const crearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim()) {
      setError("Ingresá el nombre del cliente.");
      return;
    }

    try {
      setSaving(true);

const functions = getFunctions(app, "us-central1");

      const crear = httpsCallable<
        {
          nombre: string;
          email: string;
          telefono: string;
          direccion: string;
          origin: string;
        },
        CrearClienteResponse
      >(functions, "crearClienteConQR");

      const resultado = await crear({
        ...form,
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
origin: import.meta.env.VITE_APP_URL,      });

      setQrUrl(resultado.data.qrUrl);
      onCreated();
    } catch (err) {
      console.error("Error creando cliente:", err);
      setError(
        "No se pudo crear el cliente. Verificá tu sesión y volvé a intentarlo."
      );
    } finally {
      setSaving(false);
    }
  };

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
    } catch {
      setError("No se pudo copiar el enlace. Podés escanear el QR directamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Mecánica Mora
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {qrUrl ? "QR del cliente" : "Agregar cliente"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {!qrUrl ? (
          <form onSubmit={crearCliente} className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Nombre completo *
              </label>
              <input
                required
                autoFocus
                value={form.nombre}
                onChange={(e) => actualizar("nombre", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Nombre y apellido"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Correo electrónico (opcional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => actualizar("email", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="cliente@correo.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Teléfono
              </label>
              <input
                value={form.telefono}
                onChange={(e) => actualizar("telefono", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Número de contacto"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Dirección
              </label>
              <input
                value={form.direccion}
                onChange={(e) => actualizar("direccion", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Dirección del cliente"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <p className="text-xs leading-relaxed text-slate-500">
              Se creará una cuenta de cliente y un QR temporal válido
              durante 7 días. El QR se podrá canjear una sola vez.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Creando cliente...
                </>
              ) : (
                "Crear cliente y generar QR"
              )}
            </button>
          </form>
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto flex h-64 w-64 max-w-full items-center justify-center rounded-2xl border border-slate-100 bg-white p-3">
              <QRCodeSVG value={qrUrl} size={220} level="H" />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-emerald-700">
              <Check size={18} />
              <p className="font-semibold">Cliente creado correctamente</p>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              El cliente debe escanear el QR desde su celular y confirmar
              el ingreso. El enlace vence en 7 días y se puede usar una sola vez.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={copiarEnlace}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? "Enlace copiado" : "Copiar enlace de activación"}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Imprimir QR
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Finalizar
              </button>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
