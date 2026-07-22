import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CreatorPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatorPartnerModal({ isOpen, onClose }: CreatorPartnerModalProps) {
  if (!isOpen) return null;

  const emailSubject = encodeURIComponent("Quero ser um Criador Parceiro do CineReact");
  const emailBody = encodeURIComponent("Olá, equipe CineReact!\n\nSou criador de conteúdo e gostaria de cadastrar meu canal como parceiro oficial.\n\nNome do Canal:\nLink do Canal no YouTube:\nE-mail de contato:\n\nAguardo o retorno!");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-auto text-zinc-200 z-10 max-h-[90vh] flex flex-col box-border"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/80 pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800 flex items-center justify-center cursor-pointer text-sm font-bold z-20"
            title="Fechar"
            aria-label="Fechar"
          >
            ✕
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-2.5 pb-6 border-b border-zinc-800/80 shrink-0">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              Programa de Criadores Parceiros
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Evolua seu Canal no <span className="text-amber-400">CineReact</span>
            </h2>

            <p className="text-zinc-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-medium">
              Estamos construindo a maior plataforma para react de filmes, séries e jogos. Direcionamos o público diretamente para o seu player oficial do YouTube!
            </p>
          </div>

          {/* Scrollable Modal Content */}
          <div className="overflow-y-auto space-y-6 py-6 pr-1 custom-scrollbar flex-1">
            
            {/* Benefício Atual */}
            <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
              <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                Por que ser parceiro agora?
              </span>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
                Toda visualização, curtida e engajamento dentro do CineReact é <strong className="text-white font-bold">100% contabilizado diretamente no seu canal do YouTube</strong>, aumentando suas métricas e audiência sem nenhum custo.
              </p>
            </div>

            {/* Funcionalidades em Breve */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wide">
                  Funcionalidades que Virão Em Breve
                </h3>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                  Em Desenvolvimento
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Feature 1: Assinaturas */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1.5 hover:border-amber-500/30 transition-colors">
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                    Clube de Assinaturas
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Ofereça assinaturas mensais pagas para seus fãs com benefícios exclusivos dentro do CineReact.
                  </p>
                </div>

                {/* Feature 2: Presentes e Gorjetas */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1.5 hover:border-amber-500/30 transition-colors">
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                    Presentes & Apoio Direto
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Sua plateia poderá enviar presentes e mimos monetizados diretamente na página de reprodução.
                  </p>
                </div>

                {/* Feature 3: Upload de Reacts Nativo */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1.5 hover:border-amber-500/30 transition-colors">
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                    Upload de Reacts Nativo
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Publique conteúdos exclusivos diretamente na plataforma CineReact com proteção e total controle.
                  </p>
                </div>

                {/* Feature 4: Destaque de Parceiro */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1.5 hover:border-amber-500/30 transition-colors">
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                    Destaque Prioritário
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Seus reacts ganham destaque nas primeiras posições dos carrosséis da tela inicial e das páginas de obras.
                  </p>
                </div>

                {/* Feature 5: Perfil Verificado */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1.5 hover:border-amber-500/30 transition-colors">
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                    Selo de Perfil Verificado
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Selo oficial de Parceiro CineReact ao lado do nome do seu canal, comentários e página de criador.
                  </p>
                </div>

                {/* Feature 6: Métricas Avançadas */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1.5 hover:border-amber-500/30 transition-colors">
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
                    Painel do Criador
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Acompanhe relatórios detalhados de retenção, audiência e engajamento da sua comunidade.
                  </p>
                </div>
              </div>
            </div>

            {/* Como fazer parte */}
            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-3">
              <span className="text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider block">
                Como se tornar um parceiro hoje?
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <span className="text-amber-400 font-extrabold block mb-1">Passo 1</span>
                  <span className="text-zinc-300 font-medium">Tenha um canal no YouTube com conteúdos de React.</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <span className="text-amber-400 font-extrabold block mb-1">Passo 2</span>
                  <span className="text-zinc-300 font-medium">Envie um e-mail informando o link do seu canal.</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <span className="text-amber-400 font-extrabold block mb-1">Passo 3</span>
                  <span className="text-zinc-300 font-medium">Receba a confirmação e seja destacado na plataforma!</span>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer Call-To-Action */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-zinc-400 text-center sm:text-left">
              Fale conosco: <strong className="text-amber-300 font-mono">atendimentocinereact@gmail.com</strong>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors border border-zinc-800 cursor-pointer w-full sm:w-auto"
              >
                Fechar
              </button>
              
              <a
                href={`mailto:atendimentocinereact@gmail.com?subject=${emailSubject}&body=${emailBody}`}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 w-full sm:w-auto cursor-pointer whitespace-nowrap"
              >
                Quero ser Parceiro
              </a>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

