import {
  CalendarClock,
  ChevronDown,
  Gauge,
  Info,
  Wrench,
} from "lucide-react";

import { useState } from "react";

const INTERVALO_SERVICE = 10000;

export default function CalculadoraProximoService() {
  const [abierto, setAbierto] = useState(false);
  const [kilometros, setKilometros] = useState("");
  const [resultado, setResultado] = useState<number | null>(null);

  const calcularService = () => {
    const km = Math.floor(Number(kilometros));

    if (!Number.isFinite(km) || km < 0) {
      setResultado(null);
      return;
    }

    const proximoService =
      Math.ceil(km / INTERVALO_SERVICE) * INTERVALO_SERVICE;

    setResultado(proximoService);
  };

  const kilometrosActuales = Math.floor(Number(kilometros));

  const kilometrosRestantes =
    resultado !== null
      ? Math.max(resultado - kilometrosActuales, 0)
      : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.04] sm:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff6a00]/10 text-[#ff6a00]">
            <Gauge size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white">
              Calcular próximo service
            </h3>

            <p className="mt-1 text-sm text-white/45">
              Consultá cuándo realizar el próximo mantenimiento.
            </p>
          </div>
        </div>

        <ChevronDown
          size={21}
          className={`shrink-0 text-white/50 transition-transform duration-300 ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Contenido desplegable */}
      {abierto && (
        <div className="border-t border-white/10 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          {/* Calculadora */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <Wrench size={19} className="text-[#ff6a00]" />

              <div>
                <h4 className="text-sm font-semibold text-white">
                  Kilometraje actual
                </h4>

                <p className="text-xs text-white/40">
                  Ingresá los kilómetros actuales de tu vehículo.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={kilometros}
                  onChange={(e) => {
                    setKilometros(e.target.value);
                    setResultado(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      calcularService();
                    }
                  }}
                  placeholder="Ej: 45000"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6a00]/50 focus:ring-2 focus:ring-[#ff6a00]/10"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                  km
                </span>
              </div>

              <button
                type="button"
                onClick={calcularService}
                disabled={!kilometros}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#ff780f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CalendarClock size={17} />
                Calcular
              </button>
            </div>

            {/* Resultado */}
            {resultado !== null && (
              <div className="mt-4 rounded-xl border border-[#ff6a00]/20 bg-[#ff6a00]/[0.06] p-4">
                <p className="text-xs text-white/45">
                  Próximo service orientativo
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl font-bold text-white">
                    {resultado.toLocaleString("es-AR")} km
                  </span>

<span className="text-sm text-[#ff6a00]">
  {kilometrosRestantes === 0
    ? "Service correspondiente"
    : `faltan ${kilometrosRestantes!.toLocaleString("es-AR")} km`}
</span>
                </div>
              </div>
            )}
          </div>

          {/* Mantenimiento recomendado */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="flex gap-3">
              <Wrench
                size={18}
                className="mt-0.5 shrink-0 text-[#ff6a00]"
              />

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white">
                  Mantenimiento recomendado
                </h4>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Como referencia general, estos son algunos de los puntos
                  que conviene controlar periódicamente.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h5 className="text-xs font-semibold text-white">
                      Cambio de aceite
                    </h5>

                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      Controlar el nivel y realizar el cambio de aceite
                      según el intervalo recomendado por el fabricante.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h5 className="text-xs font-semibold text-white">
                      Filtros
                    </h5>

                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      Revisar y reemplazar los filtros de aceite, aire,
                      combustible y habitáculo cuando corresponda.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h5 className="text-xs font-semibold text-white">
                      Frenos
                    </h5>

                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      Controlar pastillas, discos, líquido de frenos y
                      cualquier ruido o vibración durante la conducción.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h5 className="text-xs font-semibold text-white">
                      Neumáticos
                    </h5>

                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      Revisar presión, desgaste, alineación y estado general
                      de los neumáticos.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h5 className="text-xs font-semibold text-white">
                      Batería
                    </h5>

                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      Controlar carga, bornes y estado general para prevenir
                      problemas de arranque.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h5 className="text-xs font-semibold text-white">
                      Refrigerante y fluidos
                    </h5>

                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      Revisar niveles y posibles pérdidas del sistema de
                      refrigeración y otros fluidos del vehículo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de valor */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="flex gap-3">
              <Info
                size={18}
                className="mt-0.5 shrink-0 text-[#ff6a00]"
              />

              <div>
                <h4 className="text-sm font-semibold text-white">
                  ¿Por qué es importante hacer el service?
                </h4>

                <div className="mt-3 space-y-3 text-xs leading-5 text-white/45">
                  <p>
                    Realizar los mantenimientos en tiempo ayuda a detectar
                    desgastes y posibles inconvenientes antes de que se
                    conviertan en reparaciones más costosas.
                  </p>

                  <p>
                    En un service se pueden revisar elementos como aceite,
                    filtros, frenos, niveles de fluidos, neumáticos, batería
                    y otros componentes según el vehículo.
                  </p>

                  <p>
                    El intervalo de mantenimiento puede variar según la
                    marca, modelo, motor, año y condiciones de uso. Por eso,
                    esta calculadora es una referencia orientativa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <p className="mt-4 text-center text-[11px] leading-5 text-white/25">
            Referencia general: service cada 10.000 km. Consultá el plan de
            mantenimiento correspondiente a tu vehículo.
          </p>
        </div>
      )}
    </section>
  );
}