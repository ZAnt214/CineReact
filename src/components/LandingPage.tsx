import { useEffect } from 'react';
import { ArrowRight, Check, Film, ShieldCheck } from 'lucide-react';

const benefits = [
  'Descubra novos criadores.',
  'Encontre reações aos seus filmes, séries, animes e games favoritos.',
  'Organize seus conteúdos favoritos.',
  'Navegue em uma experiência simples e intuitiva.',
];

export default function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;

    document.title = 'CineReact | Bem-vindo';
    if (description) {
      description.content = 'Conheça o CineReact, uma plataforma para descobrir vídeos públicos de reação do YouTube.';
    }

    return () => {
      document.title = previousTitle;
      if (description && previousDescription) {
        description.content = previousDescription;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-amber-400 selection:text-black">
      <header className="border-b border-white/[0.07] bg-[#09090b]">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/landing" className="flex items-center gap-2.5" aria-label="CineReact">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10">
              <Film className="h-4.5 w-4.5 text-amber-400" aria-hidden="true" />
            </span>
            <span className="font-['Fredoka',sans-serif] text-xl font-extrabold">
              Cine<span className="text-amber-400">React</span>
            </span>
          </a>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 px-4 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-400 hover:text-black"
          >
            Explorar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main>
        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-8 w-full max-w-[300px] overflow-hidden rounded-2xl border border-amber-400/15">
              <img
                src="/cinereact-logo.svg"
                alt="CineReact"
                className="block h-auto w-full"
                width="500"
                height="120"
              />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              Boas-vindas ao CineReact
            </p>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              A plataforma para quem ama vídeos de reação a filmes, séries, animes e games.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              O CineReact reúne e organiza vídeos públicos de reação do YouTube, facilitando a descoberta
              de novos criadores e conteúdos.
            </p>

            <a
              href="/"
              className="mt-9 inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-amber-400 px-7 text-sm font-black text-black transition-colors hover:bg-yellow-300 sm:w-auto"
            >
              Explorar o CineReact
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-amber-400" aria-hidden="true" />
              Uma forma simples de descobrir e organizar conteúdos.
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-zinc-950 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                O que você encontra
              </p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                Tudo o que você gosta, mais fácil de encontrar.
              </h2>

              <ul className="mt-7 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm leading-6 text-zinc-400">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
                      <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-7 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                Como funciona
              </p>
              <h2 className="mt-3 text-2xl font-black">Conteúdo público em uma interface organizada.</h2>
              <p className="mt-5 text-sm leading-7 text-zinc-400">
                O CineReact organiza vídeos públicos do YouTube em uma interface moderna e fácil de navegar.
                Você escolhe o tema, encontra criadores e acessa as reações disponíveis no catálogo.
              </p>
              <p className="mt-5 border-t border-white/[0.07] pt-5 text-xs leading-6 text-zinc-500">
                O CineReact não produz nem reivindica a propriedade dos vídeos publicados pelos criadores.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 text-center sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-black sm:text-3xl">Pronto para conhecer o CineReact?</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Acesse o catálogo e descubra vídeos de reação organizados por obras, temas e criadores.
            </p>
            <a
              href="/"
              className="mt-7 inline-flex items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-black text-black transition-colors hover:bg-yellow-300"
            >
              Explorar o CineReact
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] bg-[#070708] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <span className="font-['Fredoka',sans-serif] text-lg font-extrabold">
              Cine<span className="text-amber-400">React</span>
            </span>
            <nav className="flex flex-wrap gap-5 text-xs font-semibold text-zinc-400" aria-label="Links institucionais">
              <a className="hover:text-amber-300" href="#privacidade">Política de Privacidade</a>
              <a className="hover:text-amber-300" href="#termos">Termos de Uso</a>
              <a className="hover:text-amber-300" href="mailto:atendimentocinereact@gmail.com">Contato</a>
            </nav>
          </div>

          <div className="mt-8 space-y-2 border-t border-white/[0.06] pt-6 text-[11px] leading-5 text-zinc-600">
            <p id="privacidade">
              <strong className="text-zinc-500">Privacidade:</strong> esta página institucional não solicita dados pessoais.
            </p>
            <p id="termos">
              <strong className="text-zinc-500">Termos:</strong> o uso de conteúdos externos permanece sujeito às políticas de seus proprietários.
            </p>
          </div>

          <p className="mt-6 max-w-4xl text-xs leading-6 text-zinc-600">
            O CineReact não hospeda vídeos. Todo o conteúdo exibido é incorporado de plataformas públicas, como o
            YouTube, respeitando os direitos e políticas de seus respectivos proprietários.
          </p>
          <p className="mt-4 text-[11px] text-zinc-700">
            © {new Date().getFullYear()} CineReact. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
