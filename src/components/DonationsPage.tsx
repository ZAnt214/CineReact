import React, { useState } from 'react';
import { Heart, Sparkles, Copy, Check, Mail, Gift } from 'lucide-react';
import { UserState } from '../types.ts';
import { motion } from 'motion/react';

interface DonationsPageProps {
  user: UserState;
  onUpdateUser: (newUser: UserState) => void;
  onOpenAuth: () => void;
}

export default function DonationsPage({ user, onUpdateUser, onOpenAuth }: DonationsPageProps) {
  const [copied, setCopied] = useState(false);

  const pixEmail = 'atendimentocinereact@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(pixEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cine-container pt-24 pb-20 min-h-screen w-full text-zinc-300">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        {/* Hero Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
            <Heart className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
            Seja um Apoiador
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider font-sans">
            Contribua e Ganhe Destaque
          </h1>
          <p className="text-zinc-500 text-xs max-w-2xl mx-auto leading-relaxed">
            O CineReact nasceu da paixão por reunir fãs e criadores em um só lugar. Ao fazer uma doação, você ajuda a manter a plataforma viva, melhorar nossos recursos, fortalecer a comunidade e trazer novas experiências para todos que amam acompanhar reacts. Cada contribuição faz parte da construção do futuro do CineReact.
          </p>
        </div>

        {/* Benefits Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Card 1 */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-2xl rounded-full" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Nome Personalizado</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Seu nome de usuário receberá uma estilização única com gradiente brilhante (<span className="text-amber-400 font-bold">Dourado</span> e <span className="text-yellow-300 font-bold">Amarelo</span>) em todos os comentários, chat ao vivo e painéis.
              </p>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-4 flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Efeito visual exclusivo
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-2xl rounded-full" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Tag Exclusiva</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Exiba orgulhosamente a tag <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] uppercase font-black text-black tracking-wider">APOIADOR VIP</span> ao lado do seu nome, diferenciando você nas avaliações e chats.
              </p>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-4 flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Selo dourado de prestígio
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-2xl rounded-full" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
                <Heart className="w-5 h-5 fill-amber-400/10" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Qualquer Valor</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Não exigimos quantias exorbitantes. Doando 1 real ou mais através de nossa chave de e-mail, seu status VIP é ativado de forma permanente!
              </p>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-4 flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Apoio vitalício
            </div>
          </div>

        </div>

        {/* Action Panel */}
        <div className="max-w-2xl mx-auto pt-4">
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-1">
              <Mail className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Dados para Doação
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
                Você pode apoiar o projeto copiando nossa chave PIX oficial abaixo. Realize a transferência de qualquer valor no aplicativo de seu banco.
              </p>
            </div>

            {/* Email Box */}
            <div className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex items-center justify-between gap-4 max-w-md">
              <div className="overflow-hidden text-left">
                <span className="text-[9px] uppercase font-mono text-zinc-600 block">Chave PIX (E-mail)</span>
                <span className="text-xs md:text-sm font-bold text-white select-all block truncate mt-0.5">{pixEmail}</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-2.5 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                title="Copiar Chave PIX"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Instruction Advice */}
            <div className="flex gap-3 bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300 max-w-lg text-left">
              <Gift className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-bounce" />
              <p className="leading-relaxed">
                <strong>Ativação do Apoiador VIP:</strong> Após realizar sua contribuição, envie-nos o comprovante para o nosso e-mail <span className="font-semibold text-white">{pixEmail}</span> informando seu e-mail cadastrado na plataforma para ativarmos o seu selo exclusivo permanentemente!
              </p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
