import {
  ArrowRight,
  Car,
  CheckCircle2,
  Clock3,
  Gauge,
  Menu,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'

function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* LOGO */}

          <a href="/" className="group flex items-center gap-2">

            <div className="relative flex items-center">

              <div className="absolute -left-2 h-9 w-1 bg-[#ff6a00]" />

              <div className="leading-none">
                <div className="text-lg font-black italic tracking-tight sm:text-xl">
                  MECÁNICA
                </div>

                <div className="text-xl font-black italic leading-none text-[#ff6a00] sm:text-2xl">
                  MORA
                </div>
              </div>

            </div>

          </a>


          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#inicio"
              className="text-sm font-semibold text-white transition hover:text-[#ff6a00]"
            >
              Inicio
            </a>

            <a
              href="#servicios"
              className="text-sm font-semibold text-white/60 transition hover:text-[#ff6a00]"
            >
              Servicios
            </a>

            <a
              href="#nosotros"
              className="text-sm font-semibold text-white/60 transition hover:text-[#ff6a00]"
            >
              Nosotros
            </a>

            <a
              href="#contacto"
              className="text-sm font-semibold text-white/60 transition hover:text-[#ff6a00]"
            >
              Contacto
            </a>

          </nav>


          {/* DESKTOP LOGIN */}

          <a
            href="/login"
            className="hidden items-center gap-2 border border-[#ff6a00] px-5 py-2.5 text-sm font-bold text-[#ff6a00] transition hover:bg-[#ff6a00] hover:text-black md:flex"
          >
            Mi cuenta
            <ArrowRight size={16} />
          </a>


          {/* MOBILE MENU */}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center border border-white/10 text-white md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>


        {/* MOBILE NAV */}

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0b0b0b] px-5 py-6 md:hidden">

            <nav className="flex flex-col gap-5">

              <a
                href="#inicio"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold"
              >
                Inicio
              </a>

              <a
                href="#servicios"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-white/60"
              >
                Servicios
              </a>

              <a
                href="#nosotros"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-white/60"
              >
                Nosotros
              </a>

              <a
                href="#contacto"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-white/60"
              >
                Contacto
              </a>

              <a
                href="/login"
                className="mt-2 flex items-center justify-center gap-2 bg-[#ff6a00] px-5 py-3 text-sm font-black uppercase tracking-wide text-black"
              >
                Mi cuenta
                <ArrowRight size={16} />
              </a>

            </nav>

          </div>
        )}

      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        id="inicio"
        className="relative flex min-h-screen items-center overflow-hidden pt-20"
      >

        {/* Background */}

        <div className="absolute inset-0">

          <div className="absolute right-[-15%] top-[15%] h-[500px] w-[500px] rounded-full bg-[#ff6a00]/10 blur-[120px]" />

          <div className="absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[#ff6a00]/5 blur-[100px]" />

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />

        </div>


        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">

          {/* LEFT */}

          <div>

            <div className="mb-7 inline-flex items-center gap-3 border border-[#ff6a00]/30 bg-[#ff6a00]/5 px-4 py-2">

              <span className="h-2 w-2 animate-pulse bg-[#ff6a00]" />

              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff6a00]">
                Servicio mecánico integral
              </span>

            </div>


            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-[82px]">

              Tu vehículo.

              <br />

              <span className="text-[#ff6a00]">
                Nuestra pasión.
              </span>

            </h1>


            <p className="mt-8 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
              Experiencia, confianza y compromiso para mantener tu vehículo
              siempre en las mejores condiciones.
            </p>


            {/* BUTTONS */}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <a
                href="#contacto"
                className="group flex items-center justify-center gap-3 bg-[#ff6a00] px-7 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:bg-[#ff7b1a]"
              >
                Solicitar turno

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />

              </a>


              <a
                href="/login"
                className="flex items-center justify-center gap-3 border border-white/15 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
              >
                Ver mi vehículo
              </a>

            </div>


            {/* STATS */}

            <div className="mt-12 grid max-w-lg grid-cols-3 border-y border-white/10 py-6">

              <div>
                <p className="text-2xl font-black sm:text-3xl">
                  +10
                </p>

                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/35 sm:text-[10px]">
                  Años de experiencia
                </p>
              </div>


              <div className="border-l border-white/10 pl-5">
                <p className="text-2xl font-black sm:text-3xl">
                  100%
                </p>

                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/35 sm:text-[10px]">
                  Compromiso
                </p>
              </div>


              <div className="border-l border-white/10 pl-5">
                <p className="text-2xl font-black sm:text-3xl text-[#ff6a00]">
                  ★★★★★
                </p>

                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/35 sm:text-[10px]">
                  Calidad
                </p>
              </div>

            </div>

          </div>


          {/* RIGHT */}

          <div className="relative">

            <div className="absolute -inset-5 bg-[#ff6a00]/10 blur-3xl" />


            <div className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-[#111]">

              {/* Decorative */}

              <div className="absolute left-0 top-0 z-10 h-20 w-20 border-l-2 border-t-2 border-[#ff6a00]" />

              <div className="absolute bottom-0 right-0 z-10 h-20 w-20 border-b-2 border-r-2 border-[#ff6a00]" />


              {/* PLACEHOLDER IMAGE */}

              <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] via-[#0d0d0d] to-black">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,106,0,.15),transparent_55%)]" />

                <div className="flex h-full items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/10">

                      <Wrench
                        size={48}
                        strokeWidth={1.5}
                        className="text-[#ff6a00]"
                      />

                    </div>

                    <p className="mt-7 text-xl font-black italic uppercase">
                      Mecánica
                    </p>

                    <p className="text-3xl font-black italic uppercase text-[#ff6a00]">
                      Mora
                    </p>

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                      Tu vehículo en las mejores manos
                    </p>

                  </div>

                </div>

              </div>


              {/* IMAGE FOOTER */}

              <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/75 p-5 backdrop-blur-md">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6a00]">
                      Servicio profesional
                    </p>

                    <p className="mt-1 font-bold">
                      Calidad que se siente.
                    </p>

                  </div>


                  <div className="flex h-11 w-11 items-center justify-center border border-[#ff6a00]/40 bg-[#ff6a00]/10">

                    <Car
                      size={20}
                      className="text-[#ff6a00]"
                    />

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SERVICES
      ====================================================== */}

      <section
        id="servicios"
        className="border-t border-white/10 bg-[#0d0d0d] px-5 py-24 sm:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                Nuestros servicios
              </p>

              <h2 className="mt-5 text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
                Todo lo que
                <br />
                tu auto
                <br />
                necesita.
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/45">
                Trabajamos para que puedas manejar con tranquilidad,
                seguridad y confianza.
              </p>

            </div>


            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">

              {[
                {
                  icon: Wrench,
                  number: '01',
                  title: 'Mecánica general',
                  text: 'Mantenimiento y reparación integral de tu vehículo.',
                },
                {
                  icon: Gauge,
                  number: '02',
                  title: 'Diagnóstico',
                  text: 'Detección precisa de fallas y problemas mecánicos.',
                },
                {
                  icon: ShieldCheck,
                  number: '03',
                  title: 'Frenos y suspensión',
                  text: 'Revisión y reparación enfocada en tu seguridad.',
                },
                {
                  icon: Car,
                  number: '04',
                  title: 'Mantenimiento',
                  text: 'Mantenimiento preventivo para prolongar la vida útil.',
                },
              ].map((service) => {
                const Icon = service.icon

                return (
                  <article
                    key={service.number}
                    className="group bg-[#111] p-7 transition hover:bg-[#151515] sm:p-8"
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex h-12 w-12 items-center justify-center border border-[#ff6a00]/25 bg-[#ff6a00]/5">
                        <Icon
                          size={22}
                          strokeWidth={1.7}
                          className="text-[#ff6a00]"
                        />
                      </div>

                      <span className="text-xs font-black text-white/20">
                        {service.number}
                      </span>

                    </div>


                    <h3 className="mt-10 text-lg font-black uppercase">
                      {service.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-white/40">
                      {service.text}
                    </p>


                    <div className="mt-7 h-[2px] w-8 bg-[#ff6a00] transition-all duration-300 group-hover:w-16" />

                  </article>
                )
              })}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CLIENT PORTAL
      ====================================================== */}

      <section
        id="nosotros"
        className="px-5 py-24 sm:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden border border-[#ff6a00]/20 bg-[#111]">

            <div className="absolute right-0 top-0 h-40 w-40 bg-[#ff6a00]/10 blur-3xl" />


            <div className="grid lg:grid-cols-2">

              <div className="p-8 sm:p-12 lg:p-16">

                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                  Seguimiento online
                </p>

                <h2 className="mt-5 text-4xl font-black uppercase leading-none sm:text-5xl">
                  Tu auto.
                  <br />
                  Siempre
                  <br />
                  <span className="text-[#ff6a00]">
                    bajo control.
                  </span>
                </h2>

                <p className="mt-7 max-w-lg text-sm leading-7 text-white/45">
                  Accedé a tu cuenta para consultar el estado de tu vehículo,
                  los servicios realizados y todo su historial de
                  mantenimiento.
                </p>

                <a
                  href="/login"
                  className="mt-8 inline-flex items-center gap-3 bg-[#ff6a00] px-7 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:bg-[#ff7b1a]"
                >
                  Ingresar a mi cuenta
                  <ArrowRight size={18} />
                </a>

              </div>


              <div className="border-t border-white/10 p-8 sm:p-12 lg:border-l lg:border-t-0">

                <div className="space-y-3">

                  {[
                    'Estado actual del vehículo',
                    'Servicios realizados',
                    'Historial de mantenimiento',
                    'Próximos servicios',
                  ].map((item, index) => (

                    <div
                      key={item}
                      className="flex items-center gap-4 border border-white/10 bg-white/[0.02] p-5"
                    >

                      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ff6a00]/10 text-xs font-black text-[#ff6a00]">
                        0{index + 1}
                      </span>

                      <span className="text-sm font-bold text-white/75">
                        {item}
                      </span>

                      <CheckCircle2
                        size={17}
                        className="ml-auto text-[#ff6a00]"
                      />

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTACT
      ====================================================== */}

      <section
        id="contacto"
        className="border-t border-white/10 bg-[#0d0d0d] px-5 py-24 sm:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-12 lg:grid-cols-2">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                Contactanos
              </p>

              <h2 className="mt-5 text-5xl font-black uppercase leading-none tracking-tight">
                Hablemos
                <br />
                de tu
                <br />
                <span className="text-[#ff6a00]">
                  vehículo.
                </span>
              </h2>

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

              <div className="border border-white/10 bg-[#111] p-7">

                <div className="flex h-11 w-11 items-center justify-center bg-[#ff6a00]/10">
                  <Car
                    size={20}
                    className="text-[#ff6a00]"
                  />
                </div>

                <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/30">
                  Dirección
                </p>

                <p className="mt-2 text-sm font-bold">
                  Pasaje 24 de Septiembre 980
                </p>

              </div>


              <div className="border border-white/10 bg-[#111] p-7">

                <div className="flex h-11 w-11 items-center justify-center bg-[#ff6a00]/10">
                  <Clock3
                    size={20}
                    className="text-[#ff6a00]"
                  />
                </div>

                <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/30">
                  Atención
                </p>

                <p className="mt-2 text-sm font-bold">
                  Consultanos por WhatsApp
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/10 bg-[#080808] px-5 py-8 sm:px-8">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div className="leading-none">

            <span className="font-black italic">
              MECÁNICA
            </span>

            <span className="ml-1 font-black italic text-[#ff6a00]">
              MORA
            </span>

          </div>

          <p className="text-[10px] font-medium uppercase tracking-wider text-white/25">
            © {new Date().getFullYear()} Mecánica Mora · Todos los derechos reservados
          </p>

        </div>

      </footer>

    </main>
  )
}

export default Home