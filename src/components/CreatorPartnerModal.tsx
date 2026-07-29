import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowRight,
  Mail,
  Youtube,
  TrendingUp,
  BadgeCheck,
  Crown,
  Gift,
  Upload,
  Star,
  BarChart3,
  Sparkles,
  PlayCircle,
  Users,
} from 'lucide-react';
import CineReactLogo from './CineReactLogo.tsx';

interface CreatorPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMAIL = 'atendimentocinereact@gmail.com';

const partnerBenefits = [
  {
    icon: PlayCircle,
    title: 'Views no YouTube',
    text: 'Cada reprodução no CineReact conta direto nas métricas do seu canal.',
  },
  {
    icon: TrendingUp,
    title: 'Audiência qualificada',
    text: 'Público que já ama reacts e busca conteúdo como o seu.',
  },
  {
    icon: Users,
    title: 'Comunidade engajada',
    text: 'Curtidas, comentários e energia da plateia em um só lugar.',
  },
];

const upcomingFeatures = [
  {
    icon: Crown,
    title: 'Clube de Assinaturas',
    text: 'Ofereça planos mensais com benefícios exclusivos para seus fãs.',
  },
  {
    icon: Gift,
    title: 'Presentes & Apoio',
    text: 'Receba mimos e gorjetas direto na página de reprodução.',
  },
  {
    icon: Upload,
    title: 'Upload Nativo',
    text: 'Publique reacts exclusivos na plataforma com proteção total.',
  },
  {
    icon: Star,
    title: 'Destaque Prioritário',
    text: 'Apareça nos primeiros carrosséis da home e das páginas de obras.',
  },
  {
    icon: BadgeCheck,
    title: 'Selo Verificado',
    text: 'Badge oficial de Parceiro CineReact no seu perfil e comentários.',
  },
  {
    icon: BarChart3,
    title: 'Painel do Criador',
    text: 'Relatórios de retenção, audiência e engajamento da comunidade.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Tenha um canal',
    text: 'Canal no YouTube com conteúdos de react de filmes, séries ou jogos.',
  },
  {
    number: '02',
    title: 'Envie seu link',
    text: 'Mande um e-mail com o link do canal e dados de contato.',
  },
  {
    number: '03',
    title: 'Seja destacado',
    text: 'Após aprovação, seu canal ganha visibilidade na plataforma.',
  },
];

export default function CreatorPartnerModal({ isOpen, onClose }: CreatorPartnerModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    const preventBackgroundTouchMove = (event: TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (modalContentRef.current?.contains(target)) return;
      event.preventDefault();
    };

    document.addEventListener('touchmove', preventBackgroundTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventBackgroundTouchMove);
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const emailSubject = encodeURIComponent('Quero ser um Criador Parceiro do CineReact');
  const emailBody = encodeURIComponent(
    'Olá, equipe CineReact!\n\nSou criador de conteúdo e gostaria de cadastrar meu canal como parceiro oficial.\n\nNome do Canal:\nLink do Canal no YouTube:\nE-mail de contato:\n\nAguardo o retorno!'
  );
  const mailtoHref = `mailto:${EMAIL}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[130] overscroll-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="creator-partner-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          <motion.div
            ref={modalContentRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative h-[100dvh] w-full overflow-y-auto overscroll-y-contain touch-pan-y bg-neutral-950 text-zinc-300"
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-white-dark"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ transformOrigin: 'left' }}
            />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 text-zinc-500 hover:text-white p-2 rounded-full hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cine-accent/10 border border-cine-accent/25 text-cine-accent-light text-[10px] font-bold uppercase tracking-wider"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Programa de Parceiros
            </motion.div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-5 min-h-full"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
            >
              {/* Brand panel */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                className="lg:col-span-2 flex flex-col justify-between p-6 sm:p-8 pt-16 sm:pt-20 lg:pt-8 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border-b lg:border-b-0 lg:border-r border-neutral-800/80 relative overflow-hidden"
              >
                <motion.div
                  className="absolute -top-24 -right-24 w-56 h-56 bg-cine-accent/10 rounded-full blur-3xl pointer-events-none"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute bottom-20 -left-16 w-40 h-40 bg-cine-mint/5 rounded-full blur-2xl pointer-events-none"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                />

                <div className="relative z-10 space-y-8">
                  <CineReactLogo size="lg" animated heading />

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
                      Cresça com a maior comunidade de reacts do Brasil
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
                      Direcionamos o público direto para o player oficial do seu YouTube — sem custo, sem complicação.
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {partnerBenefits.map(({ icon: Icon, title, text }) => (
                      <li key={title} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cine-accent/10 border border-cine-accent/20">
                          <Icon className="w-4 h-4 text-cine-accent-light" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-white">{title}</span>
                          <span className="block text-xs text-zinc-500 mt-0.5 leading-relaxed">{text}</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="hidden lg:flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cine-accent/10 border border-cine-accent/20">
                      <Youtube className="w-5 h-5 text-cine-accent-light" />
                    </span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      <strong className="text-zinc-200 font-bold">100% das views</strong> são contabilizadas no seu canal do YouTube.
                    </p>
                  </div>
                </div>

                <a
                  href={mailtoHref}
                  className="relative z-10 mt-8 hidden lg:flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white font-extrabold text-sm transition-all shadow-lg shadow-cine-accent/25 active:scale-[0.98] cursor-pointer"
                >
                  Quero ser Parceiro
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>

              {/* Content panel */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.1 } },
                }}
                className="lg:col-span-3 p-6 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-8"
              >
                <div className="lg:hidden pt-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cine-accent/10 border border-cine-accent/20 text-cine-accent-light text-[10px] font-bold tracking-wider uppercase mb-4">
                    <Sparkles className="w-3 h-3" />
                    Programa de Parceiros
                  </div>
                </div>

                <header>
                  <h1
                    id="creator-partner-title"
                    className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight"
                  >
                    Evolua seu canal no{' '}
                    <span className="text-cine-accent">
                      CineReact
                    </span>
                  </h1>
                  <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-2xl">
                    Estamos construindo a plataforma definitiva para reacts. Seja um dos primeiros parceiros e ganhe destaque enquanto lançamos novas ferramentas.
                  </p>
                </header>

                {/* Highlight card */}
                <div className="relative overflow-hidden rounded-2xl border border-cine-accent/30 bg-gradient-to-br from-cine-accent/10 via-neutral-900/80 to-neutral-950 p-5 sm:p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cine-accent/10 rounded-full blur-2xl pointer-events-none" />
                  <motion.div
                    className="relative flex flex-col sm:flex-row sm:items-center gap-4"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cine-accent/15 border border-cine-accent/30">
                      <TrendingUp className="w-6 h-6 text-cine-accent-light" />
                    </span>
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <p className="text-sm font-bold text-white">Por que ser parceiro agora?</p>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                        Toda visualização, curtida e engajamento no CineReact é{' '}
                        <strong className="text-cine-cream font-bold">contabilizado diretamente no seu YouTube</strong>,
                        aumentando métricas e audiência sem nenhum custo.
                      </p>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Upcoming features */}
                <section>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                      Em breve para parceiros
                    </h3>
                    <span className="text-[10px] font-bold bg-neutral-900 text-cine-accent-light px-2.5 py-1 rounded-full border border-cine-accent/30 uppercase tracking-wider">
                      Em desenvolvimento
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {upcomingFeatures.map(({ icon: Icon, title, text }, index) => (
                      <motion.div
                        key={title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        className="group p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/80 hover:border-cine-accent/30 hover:bg-neutral-900/80 transition-all duration-200"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cine-accent/10 border border-cine-accent/20 mb-3 group-hover:bg-cine-accent/15 transition-colors">
                          <Icon className="w-4 h-4 text-cine-accent-light" />
                        </span>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{text}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Steps */}
                <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 sm:p-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide mb-4">
                    Como participar
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {steps.map(({ number, title, text }) => (
                      <div
                        key={number}
                        className="relative p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80"
                      >
                        <span className="text-2xl font-black text-cine-accent/30 leading-none">{number}</span>
                        <p className="text-sm font-bold text-white mt-2">{title}</p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Footer CTA */}
                <footer className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-500">
                    <Mail className="w-4 h-4 text-cine-accent-light shrink-0" />
                    <span>
                      Fale conosco:{' '}
                      <strong className="text-cine-cream font-mono font-bold">{EMAIL}</strong>
                    </span>
                  </div>

                  <motion.div
                    className="flex items-center gap-2.5 w-full sm:w-auto"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-zinc-300 text-xs font-bold transition-colors border border-neutral-800 cursor-pointer w-full sm:w-auto"
                    >
                      Fechar
                    </button>
                    <a
                      href={mailtoHref}
                      className="px-5 py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cine-accent/25 active:scale-[0.98] w-full sm:w-auto cursor-pointer whitespace-nowrap"
                    >
                      Quero ser Parceiro
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                </footer>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
