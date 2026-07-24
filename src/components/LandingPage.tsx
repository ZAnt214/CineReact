import React, { useState } from 'react';
import CineReactLogo from './CineReactLogo.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Compass, 
  Users, 
  Tv, 
  BookmarkCheck, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Mail, 
  X,
  PlayCircle,
  Eye,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface LandingPageProps {
  onExplore: () => void;
  isNavigating?: boolean;
}

export default function LandingPage({ onExplore, isNavigating = false }: LandingPageProps) {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'contact' | null>(null);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Decorative Gradients & Grid Glow (No media thumbnails or posters) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* HEADER / BRAND BAR */}
      <header className="relative z-10 border-b border-zinc-900/80 bg-black/95 max-md:backdrop-blur-none md:bg-black/80 md:backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <button 
            onClick={onExplore}
            className="group focus:outline-none cursor-pointer py-1"
          >
            <CineReactLogo size="md" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>

          {/* Top CTA */}
          <button
            onClick={onExplore}
            disabled={isNavigating}
            className="group relative inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs sm:text-sm hover:from-amber-400 hover:to-yellow-400 transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer active:scale-95 shrink-0 disabled:opacity-80 disabled:cursor-wait"
          >
            <span>{isNavigating ? 'Abrindo...' : 'Acessar Plataforma'}</span>
            {isNavigating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6 shadow-inner"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>O Maior Portal de Reações do Brasil</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto font-sans"
        >
          A plataforma para quem ama vídeos de reação a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
            filmes, séries, animes e games.
          </span>
        </motion.h1>

        {/* Explanatory Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          O <strong className="text-white font-semibold">CineReact</strong> reúne e organiza vídeos públicos de reação do YouTube, facilitando a descoberta de novos criadores e conteúdos em uma experiência moderna, centralizada e intuitiva.
        </motion.p>

        {/* Primary CTA Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onExplore}
            disabled={isNavigating}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-base sm:text-lg hover:brightness-110 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-80 disabled:cursor-wait disabled:transform-none"
          >
            <span>{isNavigating ? 'Abrindo catálogo...' : 'Explorar o CineReact'}</span>
            {isNavigating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </motion.div>

        {/* Fast Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-400 flex-wrap"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            100% Gratuito
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Integrado ao YouTube
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Apoio Oficial aos Criadores
          </span>
        </motion.div>
      </section>

      {/* KEY BENEFITS SECTION */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-900/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Por que usar o CineReact?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Sua experiência assistindo a reações foi completamente reformulada para ser mais rápida, organizada e divertida.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Benefit 1 */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Descubra novos criadores
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Encontre novos canais de reação com facilidade e apoie criadores independentes da comunidade.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Encontre seus favoritos
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Encontre reações aos seus filmes, séries, animes e games favoritos organizados em coleções completas.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Organize seus conteúdos
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Crie suas próprias listas de reprodução e salve tudo aquilo que você pretende assistir mais tarde.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Navegação simples e intuitiva
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Desfrute de uma interface fluida no estilo dos principais serviços de streaming do mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-900/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Como Funciona
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Transparência, facilidade e valorização dos criadores em 3 passos simples.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/60 relative">
            <span className="text-4xl font-black text-amber-500/30 mb-3 block">01</span>
            <h3 className="text-lg font-bold text-white mb-2">Organização em Catálogo</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              O CineReact identifica e categoriza vídeos públicos de reação do YouTube, agrupando-os por obras, temporadas e episódios.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/60 relative">
            <span className="text-4xl font-black text-amber-500/30 mb-3 block">02</span>
            <h3 className="text-lg font-bold text-white mb-2">Player Oficial do YouTube</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Os vídeos são exibidos por meio do player incorporado oficial. 100% das visualizações e métricas vão para o canal do YouTube do criador.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/60 relative">
            <span className="text-4xl font-black text-amber-500/30 mb-3 block">03</span>
            <h3 className="text-lg font-bold text-white mb-2">Comunidade e Interação</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Acompanhe novidades, descubra novos canais e interaja com outros fãs apaixonados por reagir aos melhores momentos do entretenimento.
            </p>
          </div>
        </div>
      </section>

      {/* SECONDARY CTA BANNER */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 my-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight relative z-10">
            Pronto para encontrar suas reações favoritas?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-300 max-w-xl mx-auto relative z-10">
            Acesse o catálogo completo do CineReact agora mesmo e explore centenas de vídeos organizados.
          </p>
          <div className="mt-8 relative z-10">
            <button
              onClick={onExplore}
              disabled={isNavigating}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base hover:brightness-110 transition-all shadow-xl shadow-amber-500/20 cursor-pointer inline-flex items-center gap-3 disabled:opacity-80 disabled:cursor-wait"
            >
              <span>{isNavigating ? 'Abrindo catálogo...' : 'Explorar o CineReact'}</span>
              {isNavigating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950 py-12 mt-12 text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <CineReactLogo size="xs" />

            {/* Links */}
            <div className="flex items-center gap-6 text-xs sm:text-sm font-medium flex-wrap justify-center">
              <button 
                onClick={() => setActiveModal('privacy')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                Política de Privacidade
              </button>
              <button 
                onClick={() => setActiveModal('terms')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                Termos de Uso
              </button>
              <button 
                onClick={() => setActiveModal('contact')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                Contato
              </button>
            </div>
          </div>

          {/* Legal Disclaimer / Notice */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-center max-w-4xl mx-auto">
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              <strong>Aviso Legal:</strong> O CineReact não hospeda vídeos. Todo o conteúdo exibido é incorporado de plataformas públicas, como o YouTube, respeitando os direitos e políticas de seus respectivos proprietários.
            </p>
          </div>

          <div className="text-center text-xs text-zinc-500 pt-4 border-t border-zinc-900">
            © {new Date().getFullYear()} CineReact. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* INSTITUTIONAL MODALS (Privacy, Terms, Contact) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl text-zinc-300 z-10"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {activeModal === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">Política de Privacidade</h2>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    O CineReact valoriza e respeita a privacidade de seus visitantes. Esta política descreve como tratamos as informações no nosso portal.
                  </p>
                  <h3 className="text-sm font-bold text-white pt-2">1. Coleta de Dados</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Não solicitamos informações pessoais para navegação básica no site. Dados fornecidos opcionalmente no login são utilizados exclusivamente para personalização de conta e sincronização de listas favoritas.
                  </p>
                  <h3 className="text-sm font-bold text-white pt-2">2. Cookies e Analytics</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Podemos utilizar cookies e tecnologias de medição anônimas para entender o tráfego do site e aprimorar a usabilidade do usuário.
                  </p>
                  <h3 className="text-sm font-bold text-white pt-2">3. Conteúdo Incorporado</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Vídeos e reprodutores exibidos utilizam as APIs públicas do YouTube, sujeitando-se também à Política de Privacidade e aos Termos de Serviço do Google / YouTube.
                  </p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">Termos de Uso</h2>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Ao acessar e navegar no CineReact, você concorda com os termos dispostos a seguir:
                  </p>
                  <h3 className="text-sm font-bold text-white pt-2">1. Natureza do Serviço</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O CineReact é uma plataforma indexadora e agregadora de conteúdo público. Não hospedamos, armazenamos ou distribuímos arquivos de vídeo protegidos por direitos autorais em nossos servidores.
                  </p>
                  <h3 className="text-sm font-bold text-white pt-2">2. Direitos Autorais e API do YouTube</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Todos os vídeos exibidos são carregados diretamente através do player incorporado oficial do YouTube. As visualizações, inscrições e retenção pertencem integralmente aos canais dos criadores de conteúdo originais.
                  </p>
                  <h3 className="text-sm font-bold text-white pt-2">3. Uso Aceitável</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    É proibida qualquer tentativa de violação de segurança, scraping abusivo ou utilização indevida da plataforma.
                  </p>
                </div>
              )}

              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Mail className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">Contato e Suporte</h2>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Tem alguma dúvida, sugestão ou solicitação de parceria? Entre em contato conosco através dos nossos canais oficiais:
                  </p>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 my-4">
                    <div className="text-xs text-zinc-400 font-mono">E-mail de Atendimento:</div>
                    <a 
                      href="mailto:atendimentocinereact@gmail.com" 
                      className="text-amber-400 hover:text-amber-300 font-bold text-sm sm:text-base underline flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      atendimentocinereact@gmail.com
                    </a>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Respondemos todas as mensagens recebidas dentro do prazo de 24 a 48 horas úteis.
                  </p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
