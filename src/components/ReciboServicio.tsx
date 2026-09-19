import {
    Car,
    CheckCircle2,
    Printer,
    X,
} from "lucide-react";

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

interface ReciboServicioProps {
    data: ReceiptData;
    onClose: () => void;
}

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

    if (!date) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "es-AR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    ).format(date);
};

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

const ReciboServicio = ({
    data,
    onClose,
}: ReciboServicioProps) => {
    const esPago =
        data.montoPagado > 0;

    const porcentajePagado =
        data.precioServicio > 0
            ? Math.min(
                  Math.round(
                      (data.montoPagado /
                          data.precioServicio) *
                          100
                  ),
                  100
              )
            : 0;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">

            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }

                        #recibo-print,
                        #recibo-print * {
                            visibility: visible !important;
                        }

                        #recibo-print {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                        }

                        .recibo-no-print {
                            display: none !important;
                        }

                        @page {
                            size: A4;
                            margin: 12mm;
                        }
                    }
                `}
            </style>

            <div className="mx-auto my-6 w-full max-w-3xl">

                {/* RECEIPT */}
                <div
                    id="recibo-print"
                    className="overflow-hidden rounded-2xl bg-white shadow-2xl"
                >

                    {/* HEADER */}
                    <div className="border-b border-slate-200 px-8 py-7">

                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">

                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                                        <Car
                                            size={
                                                21
                                            }
                                        />
                                    </div>

                                    <div>
                                        <h1 className="text-xl font-black tracking-tight text-slate-900">
                                            MORA MECÁNICA
                                        </h1>

                                        <p className="text-xs text-slate-500">
                                            Servicio y mantenimiento automotor
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-left sm:text-right">
                                <div className="flex items-center gap-2 sm:justify-end">
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                        {esPago
                                            ? "Recibo de pago"
                                            : "Comprobante de servicio"}
                                    </span>
                                </div>

                                <p className="mt-2 text-lg font-bold text-slate-900">
                                    {
                                        data.reciboNumero
                                    }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Fecha:{" "}
                                    {formatDate(
                                        data.fechaPago
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CLIENT / VEHICLE */}
                    <div className="grid gap-6 border-b border-slate-200 px-8 py-6 sm:grid-cols-2">

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Cliente
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {
                                    data.clienteNombre
                                }
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Vehículo
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {
                                    data.vehiculoNombre
                                }
                            </p>

                            {data.patente && (
                                <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wider text-slate-600">
                                    {
                                        data.patente
                                    }
                                </span>
                            )}
                        </div>
                    </div>

                    {/* SERVICE */}
                    <div className="px-8 py-6">

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Trabajo realizado
                                </p>

                                <h2 className="mt-1 text-lg font-bold text-slate-900">
                                    {
                                        data.servicioTipo
                                    }
                                </h2>
                            </div>

                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                {
                                    data.categoria
                                }
                            </span>
                        </div>

                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                            <p className="text-xs font-semibold text-slate-500">
                                Descripción
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {data.descripcion ||
                                    "Sin descripción."}
                            </p>

                            <div className="mt-4 border-t border-slate-200 pt-4">

                                <p className="text-xs font-semibold text-slate-500">
                                    Kilometraje
                                </p>

                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {data.kilometraje.toLocaleString(
                                        "es-AR"
                                    )}{" "}
                                    km
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FINANCIAL */}
                    <div className="border-y border-slate-200 px-8 py-6">

                        <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Resumen económico
                        </p>

                        <div className="overflow-hidden rounded-xl border border-slate-200">

                            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <span className="text-xs font-medium text-slate-500">
                                    Servicio
                                </span>

                                <span className="text-right text-sm font-bold text-slate-900">
                                    {formatCurrency(
                                        data.precioServicio
                                    )}
                                </span>
                            </div>

                            {esPago && (
                                <>
                                    <div className="grid grid-cols-2 border-b border-slate-200 px-4 py-3">
                                        <span className="text-xs font-medium text-slate-500">
                                            Saldo anterior
                                        </span>

                                        <span className="text-right text-sm font-semibold text-slate-700">
                                            {formatCurrency(
                                                data.saldoAnterior
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 border-b border-slate-200 px-4 py-3">
                                        <span className="text-xs font-medium text-slate-500">
                                            Pago realizado
                                        </span>

                                        <span className="text-right text-sm font-bold text-emerald-600">
                                            {formatCurrency(
                                                data.montoPagado
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 bg-slate-50 px-4 py-4">
                                        <span className="text-sm font-bold text-slate-900">
                                            Saldo restante
                                        </span>

                                        <span
                                            className={`text-right text-base font-black ${
                                                data.saldoRestante >
                                                0
                                                    ? "text-amber-600"
                                                    : "text-emerald-600"
                                            }`}
                                        >
                                            {formatCurrency(
                                                data.saldoRestante
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}

                            {!esPago && (
                                <div className="grid grid-cols-2 bg-slate-50 px-4 py-4">
                                    <span className="text-sm font-bold text-slate-900">
                                        Total pendiente
                                    </span>

                                    <span className="text-right text-base font-black text-amber-600">
                                        {formatCurrency(
                                            data.precioServicio
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PAYMENT */}
                    {esPago && (
                        <div className="px-8 py-6">

                            <div className="flex flex-col gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                        Pago registrado
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                        {
                                            data.medioPago
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Fecha de pago:{" "}
                                        {formatDate(
                                            data.fechaPago
                                        )}
                                    </p>
                                </div>

                                <div className="text-left sm:text-right">
                                    <p className="text-xs text-slate-500">
                                        Importe abonado
                                    </p>

                                    <p className="mt-1 text-xl font-black text-emerald-600">
                                        {formatCurrency(
                                            data.montoPagado
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500">
                                        Estado del pago
                                    </span>

                                    <span className="text-xs font-bold text-slate-700">
                                        {
                                            porcentajePagado
                                        }
                                        %
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{
                                            width: `${porcentajePagado}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTES */}
                    {data.observaciones && (
                        <div className="border-t border-slate-200 px-8 py-6">

                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Observaciones
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {
                                    data.observaciones
                                }
                            </p>
                        </div>
                    )}

                    {/* FOOTER */}
                    <div className="border-t border-slate-200 bg-slate-50 px-8 py-5">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2">
                                <CheckCircle2
                                    size={
                                        16
                                    }
                                    className="text-emerald-600"
                                />

                                <span className="text-xs font-medium text-slate-500">
                                    Comprobante generado por Mora Mecánica
                                </span>
                            </div>

                            <p className="text-[10px] text-slate-400">
                                Conservar este comprobante.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="recibo-no-print mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                    <button
                        onClick={
                            onClose
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-slate-50"
                    >
                        <X
                            size={
                                17
                            }
                        />

                        Cerrar
                    </button>

                    <button
                        onClick={
                            handlePrint
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                        <Printer
                            size={
                                17
                            }
                        />


                        Imprimir / Guardar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReciboServicio;