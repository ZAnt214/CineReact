import { useEffect } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  CircleDollarSign,
  Crown,
  Gift,
  Mail,
  Megaphone,
  Sparkles,
  Upload,
  X,
  Youtube,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface CreatorPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableBenefits = [
  {
    icon: Youtube,
    title: 'Player oficial',
    description: 'O conteúdo continua vinculado ao vídeo e ao canal de origem no YouTube.',
  },
  {
    icon: Megaphone,
    title: 'Mais descoberta',
    description: 'Seus reacts aparecem organizados por obras, temas e categorias.',
  },
  {
    icon: BadgeCheck,
    title: 'Página do canal',
    description: 'O público encontra seus conteúdos reunidos em um espaço dedicado.',
  },
];

const roadmapFeatures = [
  {
    icon: Crown,
    title: 'Clube de assinaturas',
    description: 'Benefícios recorrentes para aproximar criadores e fãs.',
  },
  {
    icon: Gift,
    title: 'Apoio direto',
    description: 'Presentes e contribuições da comunidade dentro da plataforma.',
  },
  {
    icon: Upload,
    title: 'Conteúdo exclusivo',
    description: 'Novas formas de publicar experiências para sua comunidade.',
  },
  {
    icon: Sparkles,
    title: 'Destaque de parceiro',
    description: 'Identificação e espaços editoriais para canais participantes.',
  },
  {
    icon: BadgeCheck,
    title: 'Perfil verificado',
    description: 'Selo de parceiro nas áreas de canal e comunidade.',
  },
  {
    icon: BarChart3,
    title: 'Painel do criador',
    description: 'Indicadores de descoberta, audiência e engajamento.',
  },
];

export default function CreatorPartnerModal({ isOpen, onClose }: CreatorPartnerModalProps) {
  const emailSubject = encodeURIComponent('Quero ser um Criador Parceiro do CineReact');
  const emailBody = encodeURIComponent(
    'Olá, equipe CineReact!\n\nSou criador de conteúdo e gostaria de cadastrar meu canal como parceiro oficial.\n\nNome do canal:\nLink do canal no YouTube:\nE-mail de contato:\n\nAguardo o retorno!',
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
          <motion.button
            type="button"
            aria-label="Fechar programa de criadores"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/85"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="creator-program-title"
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 18 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b0b0d] text-zinc-200 shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" aria-hidden="true" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white sm:top-5 sm:right-5"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <header className="relative shrink-0 overflow-hidden border-b border-white/[0.07] px-6 py-7 sm:px-9 sm:py-8">
              <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-amber-400/[0.08] blur-3xl" aria-hidden="true" />
              <div className="relative max-w-2xl pr-10">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10">
                    <Sparkles className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                    Programa de Criadores Parceiros
                  </span>
                </div>

                <h2 id="creator-program-title" className="mt-5 text-2xl font-black tracking-tight text-white sm:text-4xl">
                  Seu conteúdo no centro.{' '}
                  <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                    Mais caminhos para ser descoberto.
                  </span>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                  O CineReact ajuda fãs a encontrar reacts por obra, tema e criador, mantendo o canal e o conteúdo
                  original como protagonistas.
                </p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-9 sm:py-8">
              <section className="rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/[0.09] to-transparent p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-black">
                    <Youtube className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">Disponível hoje</p>
                    <h3 className="mt-1 text-lg font-black text-white">A descoberta acontece sem tirar o foco do seu canal.</h3>
                    <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm">
                      A reprodução utiliza o player oficial do YouTube. O vídeo permanece associado ao criador e a
                      contabilização segue as regras da própria plataforma.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">O que o CineReact oferece</p>
                  <h3 className="mt-1 text-lg font-black text-white">Uma vitrine organizada para seus reacts.</h3>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {availableBenefits.map(({ icon: Icon, title, description }) => (
                    <article key={title} className="rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-4">
                      <Icon className="h-5 w-5 text-amber-400" aria-hidden="true" />
                      <h4 className="mt-3 text-sm font-bold text-white">{title}</h4>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">Visão de futuro</p>
                    <h3 className="mt-1 text-lg font-black text-white">Recursos em planejamento.</h3>
                  </div>
                  <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    Roadmap
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {roadmapFeatures.map(({ icon: Icon, title, description }) => (
                    <article key={title} className="rounded-xl border border-white/[0.06] bg-zinc-900/35 p-4">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                        <h4 className="text-xs font-bold text-zinc-200">{title}</h4>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-zinc-500">{description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  <h3 className="text-sm font-black text-white">Como participar</h3>
                </div>

                <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ['01', 'Tenha um canal no YouTube com conteúdo de reação.'],
                    ['02', 'Envie o nome e o link do canal para nossa equipe.'],
                    ['03', 'Aguarde a análise e o retorno sobre a inclusão.'],
                  ].map(([number, description]) => (
                    <li key={number} className="flex gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5">
                      <span className="text-xs font-black text-amber-400">{number}</span>
                      <span className="text-xs leading-5 text-zinc-400">{description}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/[0.06] p-4 text-xs leading-5 text-zinc-500">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                A participação começa pelo contato com a equipe. Recursos indicados como roadmap ainda estão em
                planejamento e podem mudar antes do lançamento.
              </div>
            </div>

            <footer className="shrink-0 border-t border-white/[0.07] bg-zinc-950/80 px-5 py-4 sm:px-9">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
                  <Mail className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <span className="truncate">atendimentocinereact@gmail.com</span>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 sm:flex-none"
                  >
                    Agora não
                  </button>
                  <a
                    href={`mailto:atendimentocinereact@gmail.com?subject=${emailSubject}&body=${emailBody}`}
                    className="group inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-xs font-black text-black transition-colors hover:bg-yellow-300 sm:flex-none"
                  >
                    Quero ser parceiro
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
