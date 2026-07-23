import { useEffect, useState } from 'react';
import { ArrowRight, Check, FileText, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

const benefits = [
  'Descubra novos criadores.',
  'Encontre reações aos seus filmes, séries, animes e games favoritos.',
  'Organize seus conteúdos favoritos.',
  'Navegue em uma experiência simples e intuitiva.',
];

type BrandLogoProps = {
  size?: 'footer' | 'header';
};

function BrandLogo({ size = 'header' }: BrandLogoProps) {
  const textSize = {
    footer: 'text-xl',
    header: 'text-2xl sm:text-3xl',
  }[size];

  const punctuationSize = {
    footer: 'text-xl',
    header: 'text-2xl sm:text-3xl',
  }[size];

  return (
    <span className="group flex items-center select-none font-['Fredoka',sans-serif]" aria-label="CineReact">
      <span
        className={`${textSize} inline-block font-extrabold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] transition-transform duration-300 group-hover:-translate-y-0.5`}
      >
        Cine
      </span>
      <span
        className={`${textSize} ml-0.5 inline-block bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text font-black tracking-wide text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)] transition-transform duration-300 group-hover:scale-105`}
      >
        React
      </span>
      <span
        className={`${punctuationSize} ml-0.5 inline-block animate-bounce font-black text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]`}
        aria-hidden="true"
      >
        !
      </span>
    </span>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-amber-400 selection:text-black">
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-zinc-900/80 bg-zinc-950/90 shadow-lg shadow-black/30 backdrop-blur-md'
            : 'border-b border-transparent bg-zinc-950/40 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <a href="/landing" aria-label="CineReact - página de boas-vindas">
              <BrandLogo />
            </a>

            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 px-4 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-400 hover:text-black"
            >
              Explorar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="px-5 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-28">
          <div className="mx-auto max-w-4xl text-center">
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

        <section className="border-t border-white/[0.07] bg-[#0b0b0d] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                Transparência
              </p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">Privacidade e termos em linguagem clara.</h2>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Entenda quais informações podem ser utilizadas e as condições para navegar pelo CineReact.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article
                id="privacidade"
                className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-zinc-950/70 p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                    <LockKeyhole className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                      Seus dados
                    </p>
                    <h3 className="mt-1 text-xl font-black">Política de Privacidade</h3>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-zinc-400">
                  Esta página de apresentação não solicita cadastro nem dados pessoais. Ao acessar e utilizar os
                  recursos do catálogo, algumas informações podem ser necessárias para oferecer as funcionalidades
                  escolhidas por você.
                </p>

                <ul className="mt-6 space-y-4 text-sm leading-6 text-zinc-400">
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Conta e perfil:</strong> nome, e-mail, avatar e descrição
                      informados pelo usuário podem ser utilizados para identificação e personalização.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Preferências:</strong> favoritos, listas, canais seguidos,
                      comentários e progresso de reprodução podem ser associados à conta.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Armazenamento no navegador:</strong> sessão, curtidas e
                      preferências podem ser salvas localmente para manter a experiência entre acessos.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Serviços externos:</strong> ao reproduzir conteúdo incorporado,
                      o YouTube pode tratar dados conforme as próprias políticas de privacidade.
                    </span>
                  </li>
                </ul>
              </article>

              <article
                id="termos"
                className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-zinc-950/70 p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                    <FileText className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                      Uso da plataforma
                    </p>
                    <h3 className="mt-1 text-xl font-black">Termos de Uso</h3>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-zinc-400">
                  O CineReact é uma plataforma independente de descoberta e organização. Ao utilizar o serviço,
                  você concorda em navegar de forma responsável e respeitar os direitos dos criadores e das
                  plataformas de origem.
                </p>

                <ul className="mt-6 space-y-4 text-sm leading-6 text-zinc-400">
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Finalidade:</strong> organizamos referências a vídeos públicos
                      para facilitar a descoberta de obras, reações e criadores.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Direitos autorais:</strong> os vídeos pertencem aos respectivos
                      criadores e são exibidos por meio das ferramentas das plataformas de origem.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Disponibilidade:</strong> links, vídeos e informações podem ser
                      alterados ou removidos pelos proprietários sem controle do CineReact.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <span>
                      <strong className="text-zinc-200">Uso responsável:</strong> não é permitido tentar comprometer a
                      segurança, acessar áreas sem autorização ou utilizar o serviço para fins ilícitos.
                    </span>
                  </li>
                </ul>
              </article>
            </div>

            <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-5 sm:flex-row sm:items-center sm:px-6">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-white">Dúvidas ou solicitações sobre seus dados?</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Entre em contato para solicitar informações, correções ou exclusão de dados relacionados à sua conta.
                  </p>
                </div>
              </div>
              <a
                href="mailto:atendimentocinereact@gmail.com"
                className="shrink-0 text-sm font-bold text-amber-300 transition-colors hover:text-amber-200"
              >
                atendimentocinereact@gmail.com
              </a>
            </div>

            <p className="mt-5 text-center text-[11px] text-zinc-600">
              Última atualização: julho de 2026.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] bg-[#070708] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <BrandLogo size="footer" />
            <nav className="flex flex-wrap gap-5 text-xs font-semibold text-zinc-400" aria-label="Links institucionais">
              <a className="hover:text-amber-300" href="#privacidade">Política de Privacidade</a>
              <a className="hover:text-amber-300" href="#termos">Termos de Uso</a>
              <a className="hover:text-amber-300" href="mailto:atendimentocinereact@gmail.com">Contato</a>
            </nav>
          </div>

          <p className="mt-8 max-w-4xl border-t border-white/[0.06] pt-6 text-xs leading-6 text-zinc-600">
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
