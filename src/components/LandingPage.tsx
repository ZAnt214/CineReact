import { useEffect } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  Compass,
  Film,
  Gamepad2,
  LayoutGrid,
  Search,
  ShieldCheck,
  Sparkles,
  Youtube,
} from 'lucide-react';
import { motion } from 'motion/react';

const benefits = [
  {
    icon: Compass,
    title: 'Descubra novos criadores',
    description: 'Amplie seu repertório e encontre diferentes perspectivas em um só lugar.',
  },
  {
    icon: Search,
    title: 'Encontre seus temas favoritos',
    description: 'Explore reações a filmes, séries, animes e games com muito mais facilidade.',
  },
  {
    icon: Bookmark,
    title: 'Organize seus conteúdos favoritos',
    description: 'Mantenha as obras e reações que você mais gosta sempre por perto.',
  },
  {
    icon: LayoutGrid,
    title: 'Navegue de forma simples',
    description: 'Uma experiência moderna, intuitiva e pensada para facilitar cada descoberta.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Conteúdo público',
    description: 'O CineReact identifica vídeos de reação publicados publicamente no YouTube.',
  },
  {
    number: '02',
    title: 'Organização inteligente',
    description: 'Os conteúdos são agrupados por obras, temas e criadores para facilitar a descoberta.',
  },
  {
    number: '03',
    title: 'Você escolhe',
    description: 'Navegue pelo catálogo e encontre, de forma simples, o conteúdo que deseja acompanhar.',
  },
];

export default function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;

    document.title = 'CineReact | Descubra vídeos de reação';
    if (description) {
      description.content = 'Conheça o CineReact, a plataforma que reúne e organiza vídeos públicos de reação do YouTube.';
    }

    return () => {
      document.title = previousTitle;
      if (description && previousDescription) {
        description.content = previousDescription;
      }
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080809] text-white selection:bg-amber-400 selection:text-black">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#080809]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/landing" className="flex items-center gap-3" aria-label="CineReact - página de apresentação">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-yellow-500/5 shadow-[0_0_24px_rgba(245,158,11,0.12)]">
              <Film className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </span>
            <span className="font-['Fredoka',sans-serif] text-xl font-extrabold tracking-wide">
              Cine<span className="text-amber-400">React</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-400 md:flex" aria-label="Navegação institucional">
            <a className="transition-colors hover:text-white" href="#beneficios">Benefícios</a>
            <a className="transition-colors hover:text-white" href="#como-funciona">Como funciona</a>
            <a className="transition-colors hover:text-white" href="#transparencia">Transparência</a>
          </nav>

          <a
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-300 transition-all hover:border-amber-300/60 hover:bg-amber-400 hover:text-black sm:px-5 sm:text-sm"
          >
            Explorar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="relative">
        <section className="relative flex min-h-screen items-center overflow-hidden px-5 pb-20 pt-32 sm:px-8 lg:pt-28">
          <div className="pointer-events-none absolute left-[-15%] top-[-20%] h-[650px] w-[650px] rounded-full bg-amber-500/[0.08] blur-[130px]" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-25%] right-[-12%] h-[600px] w-[600px] rounded-full bg-yellow-400/[0.05] blur-[140px]" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20">
            <div>
              <div className="mb-8 w-full max-w-[320px] overflow-hidden rounded-2xl border border-amber-400/15 shadow-[0_20px_70px_rgba(0,0,0,0.45)] sm:max-w-[380px]">
                <img
                  src="/cinereact-logo.svg"
                  alt="CineReact"
                  className="block h-auto w-full"
                  width="500"
                  height="120"
                />
              </div>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Descubra. Organize. Acompanhe.
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl lg:text-[64px]">
                A plataforma para quem ama vídeos de reação a{' '}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  filmes, séries, animes e games.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
                O CineReact reúne e organiza vídeos públicos de reação do YouTube, facilitando a descoberta
                de novos criadores e conteúdos em uma experiência feita para fãs.
              </p>

              <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <a
                  href="/"
                  className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-7 text-sm font-black text-black shadow-[0_16px_50px_rgba(245,158,11,0.2)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_60px_rgba(245,158,11,0.28)] sm:w-auto"
                >
                  Explorar o CineReact
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
                <div className="flex items-center gap-2.5 text-xs leading-5 text-zinc-500">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
                  <span>Ambiente de descoberta<br />com conteúdo organizado</span>
                </div>
              </div>
            </div>

            <div
              className="relative mx-auto w-full max-w-xl lg:max-w-none"
              aria-label="Visão geral dos temas encontrados no CineReact"
            >
              <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-500/5 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-b from-zinc-900/85 to-zinc-950/90 p-5 shadow-[0_35px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">Seu hub de descobertas</p>
                    <h2 className="mt-1.5 text-lg font-bold text-white">Tudo organizado para você</h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-black/40">
                    <Compass className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-6">
                  {[
                    { icon: Film, label: 'Filmes' },
                    { icon: LayoutGrid, label: 'Séries' },
                    { icon: Sparkles, label: 'Animes' },
                    { icon: Gamepad2, label: 'Games' },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition-colors hover:border-amber-400/20 hover:bg-amber-400/[0.04]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-zinc-200">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-amber-400/15 bg-gradient-to-r from-amber-400/[0.08] to-transparent p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5" aria-hidden="true">
                      {[0, 1, 2].map((item) => (
                        <span
                          key={item}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-800 text-[9px] font-black text-amber-300"
                        >
                          CR
                        </span>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Mais formas de descobrir</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">Criadores, obras e temas reunidos em um só lugar.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="border-y border-white/[0.06] bg-zinc-950/55 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Feito para descobrir</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Encontre o react certo sem complicação.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400">
                O CineReact transforma a busca por vídeos de reação em uma jornada mais clara, organizada e agradável.
              </p>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ icon: Icon, title, description }, index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                  className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-zinc-900/70 to-zinc-950/70 p-6 transition-all hover:-translate-y-1 hover:border-amber-400/20"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.08]">
                    <Icon className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-base font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="relative px-5 py-24 sm:px-8 lg:py-32">
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/[0.05] blur-[100px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/[0.08]">
                <Youtube className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-400">Como funciona</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Conteúdo público, apresentado de um jeito melhor.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400">
                O CineReact organiza vídeos públicos do YouTube em uma interface moderna e fácil de navegar,
                ajudando fãs a encontrar criadores e reações relacionadas às obras que amam.
              </p>
            </div>

            <ol className="relative mt-16 grid gap-5 lg:grid-cols-3">
              {steps.map((step) => (
                <li key={step.number} className="relative rounded-2xl border border-white/[0.07] bg-zinc-900/35 p-7">
                  <span className="text-4xl font-black text-amber-400/20">{step.number}</span>
                  <h3 className="mt-7 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{step.description}</p>
                  <Check className="absolute right-6 top-6 h-4 w-4 text-amber-400/70" aria-hidden="true" />
                </li>
              ))}
            </ol>

            <div className="mt-16 overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-r from-amber-400/[0.09] via-yellow-400/[0.04] to-transparent p-8 sm:p-10">
              <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Pronto para começar?</p>
                  <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">Seu próximo react favorito está no CineReact.</h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">Acesse o catálogo completo e explore conteúdos organizados por temas e criadores.</p>
                </div>
                <a
                  href="/"
                  className="group inline-flex min-h-13 shrink-0 items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 text-sm font-black text-black transition-all hover:bg-yellow-300"
                >
                  Explorar o CineReact
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="transparencia" className="border-t border-white/[0.06] bg-[#0b0b0d] px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.08]">
                  <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden="true" />
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-400">Transparência</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Clareza em primeiro lugar.</h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-500">
                  O CineReact atua como uma plataforma independente de organização e descoberta. Não somos o YouTube
                  e não reivindicamos a propriedade dos conteúdos dos criadores.
                </p>
              </div>

              <div className="space-y-3">
                <details id="privacidade" className="group scroll-mt-28 rounded-2xl border border-white/[0.07] bg-zinc-900/35 p-5 open:border-amber-400/15">
                  <summary className="cursor-pointer list-none font-bold text-zinc-200 marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      Política de Privacidade
                      <span className="text-xl font-light text-amber-400 transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm leading-6 text-zinc-500">
                    Esta página institucional não solicita dados pessoais. Informações enviadas voluntariamente por
                    e-mail são utilizadas somente para responder ao contato. Recursos de conta e preferências do catálogo
                    podem armazenar os dados necessários ao funcionamento desses serviços.
                  </p>
                </details>

                <details id="termos" className="group scroll-mt-28 rounded-2xl border border-white/[0.07] bg-zinc-900/35 p-5 open:border-amber-400/15">
                  <summary className="cursor-pointer list-none font-bold text-zinc-200 marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      Termos de Uso
                      <span className="text-xl font-light text-amber-400 transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm leading-6 text-zinc-500">
                    O CineReact organiza referências a conteúdos disponibilizados publicamente em plataformas de terceiros.
                    O uso desses conteúdos permanece sujeito aos termos, direitos autorais e políticas das respectivas
                    plataformas e de seus proprietários.
                  </p>
                </details>

                <a
                  id="contato"
                  href="mailto:atendimentocinereact@gmail.com"
                  className="flex scroll-mt-28 items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-zinc-900/35 p-5 font-bold text-zinc-200 transition-colors hover:border-amber-400/20 hover:text-amber-300"
                >
                  Contato
                  <ArrowRight className="h-4 w-4 text-amber-400" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#070708] px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <div className="font-['Fredoka',sans-serif] text-xl font-extrabold tracking-wide">
                Cine<span className="text-amber-400">React</span>
              </div>
              <p className="mt-2 text-xs text-zinc-600">Descubra novas reações. Valorize novos criadores.</p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-zinc-400" aria-label="Links legais">
              <a className="transition-colors hover:text-amber-300" href="#privacidade">Política de Privacidade</a>
              <a className="transition-colors hover:text-amber-300" href="#termos">Termos de Uso</a>
              <a className="transition-colors hover:text-amber-300" href="mailto:atendimentocinereact@gmail.com">Contato</a>
            </nav>
          </div>

          <div className="mt-10 border-t border-white/[0.06] pt-8">
            <p className="max-w-4xl text-xs leading-6 text-zinc-600">
              O CineReact não hospeda vídeos. Todo o conteúdo exibido é incorporado de plataformas públicas, como o
              YouTube, respeitando os direitos e políticas de seus respectivos proprietários.
            </p>
            <p className="mt-5 text-[11px] text-zinc-700">© {new Date().getFullYear()} CineReact. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
