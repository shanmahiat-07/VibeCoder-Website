import { ArrowRight, LayoutGrid, Link2, Layers3, MonitorPlay, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useSkills } from '@/modules/skills/useSkills';

const features = [
  {
    icon: LayoutGrid,
    title: 'Drag & Drop Builder',
    description: 'Assemble pages from reusable blocks with a clear visual workflow.',
  },
  {
    icon: MonitorPlay,
    title: 'Real-time Preview',
    description: 'Watch layouts update instantly while you shape the page structure.',
  },
  {
    icon: Layers3,
    title: 'Component Library',
    description: 'Text, button, image, and container blocks for fast composition.',
  },
  {
    icon: Zap,
    title: 'Fast Deployment',
    description: 'Ship static-ready public pages without shell clutter.',
  },
];

const stats = [
  { label: 'Routes', value: '4' },
  { label: 'Core modes', value: '3' },
  { label: 'Frontend-only', value: '100%' },
];

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Builder', href: '/website-builder' },
  { label: 'Demo', href: '/site/demo/home' },
];

export const HomePage = () => {
  const { skills } = useSkills();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_36%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#020617_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col">
          <header className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Link to="/" className="inline-flex items-center gap-3 self-start">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.28em] text-cyan-100 uppercase">
                    Vibecoder
                  </p>
                  <p className="text-sm text-slate-400">Visual website builder and public pages</p>
                </div>
              </Link>

              <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                {navLinks.map((link) => (
                  <a key={link.label} href={link.href} className="transition hover:text-white">
                    {link.label}
                  </a>
                ))}
                <Link
                  to="/website-builder"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-200"
                >
                  Start Building
                  <ArrowRight className="size-4" />
                </Link>
              </nav>
            </div>
          </header>

          <section className="grid flex-1 items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-14">
            <div>
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-lg shadow-cyan-950/20">
                <Link2 className="size-4" />
                A focused no-code workflow for public websites
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
                <span className="block bg-gradient-to-r from-white via-cyan-100 to-sky-200 bg-clip-text text-transparent">
                  Build Websites Visually
                </span>
                <span className="mt-2 block animate-[fade-slide_5s_ease-in-out_infinite] text-white/90">
                  with Vibecoder
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Design public-facing pages with a clean builder flow, preview the structure as you
                work, and move from idea to production-ready output without extra control layers.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/website-builder"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-slate-950 transition hover:translate-y-[-1px] hover:bg-slate-200"
                >
                  Start Building
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  Explore Builder
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur"
                  >
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/20 via-transparent to-indigo-400/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/85 p-4 shadow-2xl shadow-slate-950/40 ring-1 ring-white/5">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/95 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-sm font-medium text-white">Live product surface</p>
                      <p className="text-xs text-slate-400">
                        Landing, builder, and public rendering in one SPA
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      Active
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Hero block</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">
                        Design the page structure, then preview it as a public site.
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                        A clean marketing front-end with a lightweight builder experience behind it.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ['Reusable blocks', 'Text, button, image, and container components.'],
                        ['Dynamic render', 'Schema-driven public pages with route params.'],
                      ].map(([title, description]) => (
                        <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm font-medium text-white">{title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">Build summary</p>
                        <p className="text-xs text-slate-400">Frontend-only</p>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                        <div className="rounded-2xl bg-slate-950/80 px-3 py-4">
                          <p className="text-lg font-semibold text-white">4</p>
                          <p className="mt-1 text-slate-400">Routes</p>
                        </div>
                        <div className="rounded-2xl bg-slate-950/80 px-3 py-4">
                          <p className="text-lg font-semibold text-white">3</p>
                          <p className="mt-1 text-slate-400">Block types</p>
                        </div>
                        <div className="rounded-2xl bg-slate-950/80 px-3 py-4">
                          <p className="text-lg font-semibold text-white">1</p>
                          <p className="mt-1 text-slate-400">SPA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="border-y border-white/10 bg-white/5 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  Features
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                  Everything needed for a modern website workflow.
                </h2>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <article
                      key={feature.title}
                      className="group rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-slate-900"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20 transition group-hover:scale-105">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="skills" className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  Skills Section
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                  SELISE Blocks Skills available to the website layer.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  These skills are loaded locally from a frontend registry, so the SPA stays
                  lightweight and does not depend on internal backend modules.
                </p>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {skills.map((skill) => (
                  <article
                    key={skill.id}
                    className="group rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20 transition group-hover:scale-105">
                        <Sparkles className="size-5" />
                      </div>
                      <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        {skill.category}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-semibold text-white">{skill.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{skill.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <footer className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-400">Vibecoder Website</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                <a href="#features" className="transition hover:text-white">
                  Features
                </a>
                <a href="#skills" className="transition hover:text-white">
                  Skills
                </a>
                <Link to="/website-builder" className="transition hover:text-white">
                  Builder
                </Link>
                <Link to="/site/demo/home" className="transition hover:text-white">
                  Demo
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
};
