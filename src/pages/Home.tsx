
import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'

function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  const services = [
    {
      icon: Wrench,
      number: '01',
      title: 'Mecánica general',
      text: 'Mantenimiento, reparación y revisión integral para mantener tu vehículo en condiciones.',
    },
    {
      icon: Gauge,
      number: '02',
      title: 'Diagnóstico',
      text: 'Identificamos fallas y problemas para trabajar sobre el vehículo con mayor precisión.',
    },
    {
      icon: ShieldCheck,
      number: '03',
      title: 'Frenos y suspensión',
      text: 'Control y reparación de componentes fundamentales para tu seguridad al volante.',
    },
    {
      icon: Car,
      number: '04',
      title: 'Mantenimiento',
      text: 'Servicios preventivos pensados para cuidar el rendimiento y prolongar la vida útil.',
    },
  ]

  const benefits = [
    'Estado actual del vehículo',
    'Servicios realizados',
    'Historial de mantenimiento',
    'Próximos servicios',
    'turnos y recordatorios',
  ]

  const closeMenu = () => setMenuOpen(false)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.08] bg-[#080808]/85 backdrop-blur-2xl">

        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* LOGO */}

          <a
            href="#inicio"
            onClick={closeMenu}
            className="group relative flex items-center"
          >
            <div className="absolute -left-3 h-9 w-[3px] bg-[#ff6a00] transition-all duration-300 group-hover:h-11" />

            <div className="leading-[0.82]">
              <div className="text-[17px] font-black italic tracking-[-0.04em] sm:text-lg">
                MECÁNICA
              </div>

              <div className="text-[21px] font-black italic tracking-[-0.05em] text-[#ff6a00] sm:text-2xl">
                MORA
              </div>
            </div>
          </a>


          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-9 md:flex">

            {[
              ['Inicio', '#inicio'],
              ['Servicios', '#servicios'],
              ['Nosotros', '#nosotros'],
              ['Contacto', '#contacto'],
            ].map(([label, href], index) => (
              <a
                key={label}
                href={href}
                className={`group relative text-[13px] font-bold transition ${
                  index === 0
                    ? 'text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {label}

                <span
                  className={`absolute -bottom-2 left-0 h-[2px] bg-[#ff6a00] transition-all duration-300 ${
                    index === 0 ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            ))}

          </nav>


          {/* LOGIN */}

          <a
            href="/login"
            className="hidden items-center gap-2 border border-[#ff6a00]/60 px-5 py-2.5 text-[12px] font-black uppercase tracking-wide text-[#ff6a00] transition duration-300 hover:bg-[#ff6a00] hover:text-black md:flex"
          >
            Mi cuenta
            <ArrowRight size={15} />
          </a>


          {/* MOBILE BUTTON */}

          <button
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.02] transition hover:border-[#ff6a00]/50 hover:text-[#ff6a00] md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>


        {/* MOBILE NAV */}

        <div
          className={`overflow-hidden border-t border-white/[0.06] bg-[#0b0b0b] transition-all duration-300 md:hidden ${
            menuOpen
              ? 'max-h-[420px] opacity-100'
              : 'max-h-0 border-t-0 opacity-0'
          }`}
        >

          <nav className="flex flex-col gap-1 px-5 py-5">

            {[
              ['Inicio', '#inicio'],
              ['Servicios', '#servicios'],
              ['Nosotros', '#nosotros'],
              ['Contacto', '#contacto'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={closeMenu}
                className="flex items-center justify-between border-b border-white/[0.06] py-4 text-sm font-bold text-white/70 transition hover:text-[#ff6a00]"
              >
                {label}
                <ChevronRight size={16} />
              </a>
            ))}

            <a
              href="/login"
              onClick={closeMenu}
              className="mt-4 flex items-center justify-center gap-2 bg-[#ff6a00] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-black"
            >
              Mi cuenta
              <ArrowRight size={16} />
            </a>

          </nav>

        </div>

      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        id="inicio"
        className="relative flex min-h-screen items-center overflow-hidden pt-[76px]"
      >

        {/* BACKGROUND */}

        <div className="pointer-events-none absolute inset-0">

          <div className="absolute right-[-10%] top-[8%] h-[550px] w-[550px] rounded-full bg-[#ff6a00]/[0.09] blur-[140px]" />

          <div className="absolute bottom-[-20%] left-[-10%] h-[450px] w-[450px] rounded-full bg-[#ff6a00]/[0.045] blur-[120px]" />

          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '55px 55px',
            }}
          />

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080808] to-transparent" />

        </div>


        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:py-24">

          {/* HERO LEFT */}

          <div>

            {/* BADGE */}

            <div className="mb-7 inline-flex items-center gap-3 border border-[#ff6a00]/25 bg-[#ff6a00]/[0.045] px-4 py-2.5">

              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping bg-[#ff6a00] opacity-60" />
                <span className="relative inline-flex h-2 w-2 bg-[#ff6a00]" />
              </span>

              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff6a00]">
                Servicio mecánico integral
              </span>

            </div>


            {/* TITLE */}

            <h1 className="max-w-4xl text-[52px] font-black uppercase leading-[0.88] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[82px] xl:text-[90px]">

              Tu vehículo.

              <br />

              <span className="text-[#ff6a00]">
                Nuestra pasión.
              </span>

            </h1>


            {/* DESCRIPTION */}

            <p className="mt-8 max-w-xl text-[15px] leading-7 text-white/50 sm:text-[17px]">
              Experiencia, confianza y compromiso para mantener tu vehículo
              siempre en las mejores condiciones.
            </p>


            {/* ACTIONS */}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <a
                href="#contacto"
                className="group flex items-center justify-center gap-3 bg-[#ff6a00] px-7 py-4 text-xs font-black uppercase tracking-[0.08em] text-black transition duration-300 hover:bg-[#ff7b1a] hover:shadow-[0_0_35px_rgba(255,106,0,0.18)]"
              >
                Solicitar turno

                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>

              <a
                href="/login"
                className="group flex items-center justify-center gap-3 border border-white/15 bg-white/[0.015] px-7 py-4 text-xs font-black uppercase tracking-[0.08em] text-white transition duration-300 hover:border-[#ff6a00]/60 hover:text-[#ff6a00]"
              >
                Ver mi vehículo

                <ChevronRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>

            </div>


            {/* STATS */}

            <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/[0.09] py-6">

              <div className="pr-4">
                <p className="text-2xl font-black tracking-tight sm:text-3xl">
                  +10
                </p>

                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/30 sm:text-[10px]">
                  Años de experiencia
                </p>
              </div>


              <div className="border-l border-white/[0.09] px-4">
                <p className="text-2xl font-black tracking-tight sm:text-3xl">
                  100%
                </p>

                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/30 sm:text-[10px]">
                  Compromiso
                </p>
              </div>


              <div className="border-l border-white/[0.09] pl-4">
                <p className="text-2xl font-black tracking-tight text-[#ff6a00] sm:text-3xl">
                  24/7
                </p>

                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/30 sm:text-[10px]">
                  Seguimiento online
                </p>
              </div>

            </div>

          </div>


          {/* HERO RIGHT */}

          <div className="relative mx-auto w-full max-w-[530px] lg:ml-auto">

            <div className="absolute -inset-8 bg-[#ff6a00]/[0.07] blur-[80px]" />


            <div className="relative aspect-[4/5] overflow-hidden border border-white/[0.12] bg-[#101010] shadow-2xl">

              {/* IMAGE / VISUAL */}

              <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] via-[#0d0d0d] to-black">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,106,0,.17),transparent_48%)]" />

                {/* Decorative grid */}

                <div
                  className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
                    backgroundSize: '35px 35px',
                  }}
                />

                {/* Corner lines */}

                <div className="absolute left-0 top-0 h-24 w-24 border-l-2 border-t-2 border-[#ff6a00]" />

                <div className="absolute bottom-0 right-0 h-24 w-24 border-b-2 border-r-2 border-[#ff6a00]" />


                {/* Center */}

                <div className="absolute inset-0 flex items-center justify-center">

                  <div className="relative">

                    <div className="absolute -inset-8 rounded-full bg-[#ff6a00]/10 blur-2xl" />

                    <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/[0.06]">

                      <div className="absolute inset-3 rounded-full border border-white/[0.06]" />

                      <Wrench
                        size={54}
                        strokeWidth={1.25}
                        className="text-[#ff6a00]"
                      />

                    </div>

                  </div>

                </div>


                {/* Top label */}

                <div className="absolute left-6 top-6 flex items-center gap-2">

                  <Sparkles
                    size={14}
                    className="text-[#ff6a00]"
                  />

                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/45">
                    Taller especializado
                  </span>

                </div>


                {/* Vertical detail */}

                <div className="absolute bottom-32 right-5 hidden [writing-mode:vertical-rl] sm:block">

                  <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/20">
                    MORA MECÁNICA
                  </span>

                </div>

              </div>


              {/* FOOTER CARD */}

              <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/80 p-5 backdrop-blur-xl sm:p-6">

                <div className="flex items-center justify-between gap-5">

                  <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#ff6a00]">
                      Servicio profesional
                    </p>

                    <p className="mt-1.5 text-base font-black uppercase">
                      Calidad que se siente.
                    </p>

                  </div>


                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#ff6a00]/30 bg-[#ff6a00]/10">

                    <Car
                      size={19}
                      className="text-[#ff6a00]"
                    />

                  </div>

                </div>

              </div>

            </div>


            {/* FLOATING CARD */}

            <div className="absolute -bottom-5 -left-5 hidden border border-white/10 bg-[#111]/95 p-4 shadow-xl backdrop-blur-xl sm:block">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center bg-[#ff6a00]/10">
                  <CheckCircle2
                    size={18}
                    className="text-[#ff6a00]"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/30">
                    Atención
                  </p>

                  <p className="text-xs font-bold">
                    Profesional y confiable
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
    TRABAJOS REALIZADOS
====================================================== */}

<section
  id="trabajos"
  className="relative overflow-hidden border-t border-white/[0.08] bg-[#080808] py-24 sm:py-28"
>
  {/* BACKGROUND */}

  <div className="pointer-events-none absolute inset-0">

    <div className="absolute left-[-10%] top-[20%] h-[400px] w-[400px] rounded-full bg-[#ff6a00]/[0.04] blur-[120px]" />

    <div className="absolute right-[-10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-[#ff6a00]/[0.035] blur-[120px]" />

    <div
      className="absolute inset-0 opacity-[0.018]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
        backgroundSize: '55px 55px',
      }}
    />

  </div>


  <div className="relative">

    {/* HEADER */}

    <div className="mx-auto mb-12 flex max-w-7xl flex-col justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-end">

      <div>

        <div className="flex items-center gap-3">

          <span className="h-[2px] w-8 bg-[#ff6a00]" />

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff6a00]">
            Nuestro trabajo
          </p>

        </div>


        <h2 className="mt-6 max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-5xl lg:text-6xl">

          Trabajo que
          <br />

          <span className="text-[#ff6a00]">
            habla por nosotros.
          </span>

        </h2>

      </div>


      <div className="max-w-sm">

        <p className="text-sm leading-7 text-white/40">
          Conocé algunos de los trabajos y servicios que realizamos
          diariamente en Mecánica Mora.
        </p>

      </div>

    </div>


    {/* =====================================================
        INFINITE CAROUSEL
    ====================================================== */}

    <div className="relative overflow-hidden">

      {/* LEFT FADE */}

      <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-16 bg-gradient-to-r from-[#080808] to-transparent sm:w-28 lg:w-40" />


      {/* RIGHT FADE */}

      <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-16 bg-gradient-to-l from-[#080808] to-transparent sm:w-28 lg:w-40" />


      {/* TRACK */}

      <div className="group/carousel flex w-max animate-[trabajosScroll_68s_linear_infinite] hover:[animation-play-state:paused]">

        {[...Array(2)].flatMap((_, setIndex) =>
          [
            {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790871302/jdotwwnrjbktflbm2hwz.jpg',
              number: '01',
              title: 'Mantenimiento',
              category: 'Servicio general',
            },
            {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790871302/nguw6plqyuuzh3akinlm.jpg',
              number: '02',
              title: 'Diagnóstico',
              category: 'Revisión mecánica',
            },
            {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790871302/unaknplqkod17pydwrgz.jpg',
              number: '03',
              title: 'Frenos',
              category: 'Seguridad',
            },
            {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790871302/a7qa08easpclncb0x11a.jpg',
              number: '04',
              title: 'Reparación',
              category: 'Mecánica general',
            },
            {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790871303/wua2wefxcifqos7a9mqp.jpg',
              number: '05',
              title: 'Motor',
              category: 'Mecánica general',
            },
            {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790871302/npbkkgndiuwjclr7lvrx.jpg',
              number: '06',
              title: 'Suspensión',
              category: 'Seguridad',
            },
                        {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790872275/bhep0ovroorittjttcwl.jpg',
              number: '07',
              title: 'Suspensión',
              category: 'Seguridad',
            },
                        {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790872275/woy9tbsnq9eysiv3coi7.jpg',
              number: '08',
              title: 'Suspensión',
              category: 'Seguridad',
            },
                        {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790872275/vzifindxoz0mp4ieuguu.jpg',
              number: '09',
              title: 'Suspensión',
              category: 'Seguridad',
            },
                                    {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790871302/e15sdwg5e2ifve2jplcz.jpg',
              number: '10',
              title: 'Suspensión',
              category: 'Seguridad',
            },                        {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790872604/f15obj5oodmgh8cdf2qg.jpg',
              number: '11',
              title: 'Suspensión',
              category: 'Seguridad',
            },                        {
              image: 'https://res.cloudinary.com/dcggcw8df/image/upload/v1790872275/hwe99nplyjq8r9jegycw.jpg',
              number: '12',
              title: 'Suspensión',
              category: 'Seguridad',
            },
          ].map((item) => (
            <article
              key={`${setIndex}-${item.number}`}
              className="group relative mr-3 h-[430px] w-[270px] shrink-0 overflow-hidden border border-white/[0.09] bg-[#111] sm:mr-4 sm:h-[500px] sm:w-[315px]"
            >

              {/* IMAGE */}

              <img
                src={item.image}
                alt={`${item.title} - Mecánica Mora`}
                className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-105"
              />


              {/* DARK GRADIENT */}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />


              {/* HOVER OVERLAY */}

              <div className="absolute inset-0 bg-[#ff6a00]/0 transition duration-700 group-hover:bg-[#ff6a00]/[0.05]" />


              {/* TOP NUMBER */}

              <div className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center border border-white/20 bg-black/30 backdrop-blur-md">

                <span className="text-[9px] font-black text-white/70">
                  {item.number}
                </span>

              </div>


              {/* TOP LABEL */}

              <div className="absolute right-5 top-5">

                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">
                  Mecánica Mora
                </span>

              </div>


              {/* CONTENT */}

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">

                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#ff6a00]">
                  {item.category}
                </p>

                <h3 className="mt-2 text-xl font-black uppercase tracking-tight">
                  {item.title}
                </h3>

                <div className="mt-5 h-[2px] w-8 bg-[#ff6a00] transition-all duration-500 group-hover:w-16" />

              </div>

            </article>
          ))
        )}

      </div>

    </div>


    {/* BOTTOM INFO */}

    <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-5 border-y border-white/[0.08] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">

      <div className="flex items-center gap-3">

        <div className="h-2 w-2 shrink-0 bg-[#ff6a00]" />

        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30 sm:text-[10px]">
          Mecánica · Diagnóstico · Mantenimiento · Reparación
        </p>

      </div>


      <a
        href="#contacto"
        className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#ff6a00]"
      >
        Consultar por un servicio

        <ArrowRight
          size={14}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </a>

    </div>

  </div>


  {/* =====================================================
      CAROUSEL ANIMATION
  ====================================================== */}

  <style>{`
    @keyframes trabajosScroll {
      from {
        transform: translateX(0);
      }

      to {
        transform: translateX(-50%);
      }
    }
  `}</style>

</section>




      {/* =====================================================
          SERVICES
      ====================================================== */}

      <section
        id="servicios"
        className="border-t border-white/[0.08] bg-[#0c0c0c] px-5 py-24 sm:px-8 lg:py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">

            {/* LEFT */}

            <div>

              <div className="flex items-center gap-3">

                <span className="h-[2px] w-8 bg-[#ff6a00]" />

                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                  Nuestros servicios
                </p>

              </div>

              <h2 className="mt-6 text-4xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-5xl lg:text-6xl">

                Todo lo que
                <br />
                tu auto
                <br />

                <span className="text-[#ff6a00]">
                  necesita.
                </span>

              </h2>

              <p className="mt-7 max-w-md text-sm leading-7 text-white/40">
                Soluciones de mantenimiento y reparación pensadas para que
                puedas manejar con tranquilidad, seguridad y confianza.
              </p>


              <a
                href="#contacto"
                className="group mt-8 inline-flex items-center gap-3 text-xs font-black uppercase tracking-wider text-white transition hover:text-[#ff6a00]"
              >
                Consultar servicio

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>

            </div>


            {/* SERVICES GRID */}

            <div className="grid gap-px overflow-hidden border border-white/[0.09] bg-white/[0.09] sm:grid-cols-2">

              {services.map((service) => {
                const Icon = service.icon

                return (
                  <article
                    key={service.number}
                    className="group relative overflow-hidden bg-[#111] p-7 transition duration-500 hover:bg-[#151515] sm:p-8"
                  >

                    <div className="absolute right-0 top-0 h-24 w-24 bg-[#ff6a00]/0 blur-2xl transition duration-500 group-hover:bg-[#ff6a00]/10" />


                    <div className="relative flex items-start justify-between">

                      <div className="flex h-12 w-12 items-center justify-center border border-[#ff6a00]/25 bg-[#ff6a00]/[0.05] transition duration-300 group-hover:border-[#ff6a00]/50 group-hover:bg-[#ff6a00]/10">

                        <Icon
                          size={22}
                          strokeWidth={1.6}
                          className="text-[#ff6a00]"
                        />

                      </div>

                      <span className="text-[11px] font-black text-white/15 transition group-hover:text-[#ff6a00]/50">
                        {service.number}
                      </span>

                    </div>


                    <h3 className="relative mt-10 text-base font-black uppercase tracking-tight sm:text-lg">
                      {service.title}
                    </h3>

                    <p className="relative mt-3 text-[13px] leading-6 text-white/35">
                      {service.text}
                    </p>


                    <div className="relative mt-7 flex items-center gap-2">

                      <span className="h-[2px] w-7 bg-[#ff6a00] transition-all duration-500 group-hover:w-14" />

                      <ChevronRight
                        size={13}
                        className="text-[#ff6a00] opacity-0 transition duration-300 group-hover:opacity-100"
                      />

                    </div>

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
        className="px-5 py-24 sm:px-8 lg:py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden border border-[#ff6a00]/20 bg-[#101010]">

            <div className="absolute right-[-10%] top-[-30%] h-[400px] w-[400px] rounded-full bg-[#ff6a00]/10 blur-[100px]" />

            <div className="absolute bottom-0 left-0 h-px w-1/2 bg-gradient-to-r from-[#ff6a00] to-transparent" />


            <div className="relative grid lg:grid-cols-[1fr_0.9fr]">

              {/* TEXT */}

              <div className="p-8 sm:p-12 lg:p-16">

                <div className="flex items-center gap-3">

                  <span className="h-[2px] w-8 bg-[#ff6a00]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                    Seguimiento online
                  </p>

                </div>


                <h2 className="mt-6 text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-5xl lg:text-6xl">

                  Tu auto.
                  <br />
                  Siempre
                  <br />

                  <span className="text-[#ff6a00]">
                    bajo control.
                  </span>

                </h2>


                <p className="mt-7 max-w-lg text-sm leading-7 text-white/40">
                  Accedé a tu cuenta para consultar el estado de tu vehículo,
                  los servicios realizados y todo su historial de
                  mantenimiento.
                </p>


                <a
                  href="/login"
                  className="group mt-8 inline-flex items-center gap-3 bg-[#ff6a00] px-7 py-4 text-xs font-black uppercase tracking-wider text-black transition duration-300 hover:bg-[#ff7b1a] hover:shadow-[0_0_35px_rgba(255,106,0,0.18)]"
                >
                  Ingresar a mi cuenta

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </a>

              </div>


              {/* FEATURES */}

              <div className="border-t border-white/[0.08] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">

                <div className="mb-7">

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                    Disponible para clientes
                  </p>

                  <p className="mt-2 text-sm font-bold text-white/70">
                    Toda la información de tu vehículo en un solo lugar.
                  </p>

                </div>


                <div className="space-y-3">

                  {benefits.map((item, index) => (

                    <div
                      key={item}
                      className="group flex items-center gap-4 border border-white/[0.08] bg-white/[0.018] p-4 transition duration-300 hover:border-[#ff6a00]/30 hover:bg-[#ff6a00]/[0.035] sm:p-5"
                    >

                      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ff6a00]/[0.08] text-[10px] font-black text-[#ff6a00]">
                        0{index + 1}
                      </span>

                      <span className="text-xs font-bold text-white/65 sm:text-sm">
                        {item}
                      </span>

                      <CheckCircle2
                        size={17}
                        className="ml-auto shrink-0 text-[#ff6a00]/70 transition group-hover:text-[#ff6a00]"
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
        className="border-t border-white/[0.08] bg-[#0c0c0c] px-5 py-24 sm:px-8 lg:py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">

            {/* TITLE */}

            <div>

              <div className="flex items-center gap-3">

                <span className="h-[2px] w-8 bg-[#ff6a00]" />

                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                  Contactanos
                </p>

              </div>


              <h2 className="mt-6 text-5xl font-black uppercase leading-[0.88] tracking-[-0.045em] sm:text-6xl">

                Hablemos
                <br />
                de tu
                <br />

                <span className="text-[#ff6a00]">
                  vehículo.
                </span>

              </h2>


              <p className="mt-7 max-w-md text-sm leading-7 text-white/40">
                ¿Necesitás mantenimiento, reparación o querés consultar por
                un servicio? Ponete en contacto con nosotros.
              </p>

            </div>


            {/* CONTACT CARDS */}

            <div className="grid gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">

              <div className="group bg-[#111] p-7 transition hover:bg-[#151515] sm:p-8">

                <div className="flex h-11 w-11 items-center justify-center bg-[#ff6a00]/[0.08] transition group-hover:bg-[#ff6a00]/15">

                  <Car
                    size={20}
                    className="text-[#ff6a00]"
                  />

                </div>


                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                  Dirección
                </p>

                <p className="mt-2 text-sm font-bold leading-6">
                  Pasaje 24 de Septiembre 980
                </p>

              </div>

<div className="group bg-[#111] p-7 transition duration-300 hover:bg-[#151515] sm:p-8">

  <div className="flex h-11 w-11 items-center justify-center bg-[#ff6a00]/[0.08] transition duration-300 group-hover:bg-[#ff6a00]/15">
    <Clock3
      size={20}
      className="text-[#ff6a00]"
    />
  </div>

  <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
    Atención
  </p>

  <p className="mt-2 text-sm font-bold leading-6">
    Estamos para ayudarte
  </p>

  <p className="mt-2 text-xs leading-5 text-white/35">
    Consultanos por turnos, servicios o cualquier duda sobre tu vehículo.
  </p>

  <a
    href="https://wa.me/5493865454110?text=Hola%20Mec%C3%A1nica%20Mora%2C%20quisiera%20consultar%20por%20un%20turno%20para%20mi%20veh%C3%ADculo."
    target="_blank"
    rel="noopener noreferrer"
    className="group/whatsapp mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#ff6a00] px-5 py-3 text-[11px] font-black uppercase tracking-wider text-black transition duration-300 hover:bg-[#ff7b1a] hover:shadow-[0_0_25px_rgba(255,106,0,0.15)]"
  >
    Escribir por WhatsApp

    <ArrowRight
      size={15}
      className="transition-transform duration-300 group-hover/whatsapp:translate-x-1"
    />
  </a>

</div>



            </div>

          </div>


          {/* FINAL CTA */}


            

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/[0.08] bg-[#080808] px-5 py-9 sm:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="h-8 w-[3px] bg-[#ff6a00]" />

            <div className="leading-[0.8]">

              <div className="text-sm font-black italic">
                MECÁNICA
              </div>

              <div className="text-lg font-black italic text-[#ff6a00]">
                MORA
              </div>

            </div>

          </div>


          <div className="flex flex-col gap-2 sm:items-end">

            <div className="flex items-center gap-4">

              <a
                href="#inicio"
                className="text-[10px] font-bold uppercase tracking-wider text-white/30 transition hover:text-[#ff6a00]"
              >
                Inicio
              </a>

              <a
                href="#servicios"
                className="text-[10px] font-bold uppercase tracking-wider text-white/30 transition hover:text-[#ff6a00]"
              >
                Servicios
              </a>

              <a
                href="#contacto"
                className="text-[10px] font-bold uppercase tracking-wider text-white/30 transition hover:text-[#ff6a00]"
              >
                Contacto
              </a>

              <a
                href="/login"
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 transition hover:text-[#ff6a00]"
              >
                Mi cuenta
                <Phone size={11} />
              </a>

            </div>


            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/20 sm:text-right">
              © {new Date().getFullYear()} Mecánica Mora · Todos los derechos reservados
            </p>

          </div>

        </div>

      </footer>

    </main>
  )
}

export default Home

