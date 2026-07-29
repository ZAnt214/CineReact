import React, { useState } from 'react';
import { Heart, Sparkles, Copy, Check, Mail, Gift } from 'lucide-react';
import { UserState } from '../types.ts';
import { motion } from 'motion/react';

interface DonationsPageProps {
  user: UserState;
  onUpdateUser: (newUser: UserState) => void;
  onOpenAuth: () => void;
}

export default function DonationsPage({ user: _user, onUpdateUser: _onUpdateUser, onOpenAuth: _onOpenAuth }: DonationsPageProps) {
  const [copied, setCopied] = useState(false);
  const pixEmail = 'atendimentocinereact@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(pixEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cine-container pt-24 pb-28 min-h-screen w-full text-zinc-300">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
        <div className="relative overflow-hidden rounded-3xl border border-cine-accent/20 bg-gradient-to-br from-cine-accent/10 via-neutral-950 to-neutral-950 p-8 md:p-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.12),transparent_45%)] pointer-events-none" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cine-accent/10 border border-cine-accent/25 text-cine-accent-light text-[10px] font-bold tracking-wider uppercase">
              <Heart className="w-3 h-3 text-cine-accent fill-cine-accent/30" />
              Apoiador CineReact
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Contribua e ganhe destaque</h1>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
              O CineReact é construído para reunir fãs e criadores em um só lugar. Sua doação ajuda a manter a plataforma, evoluir recursos e fortalecer a comunidade.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: 'Nome personalizado',
              text: 'Seu nome recebe destaque com a paleta oficial do CineReact em comentários, perfil e interações da plataforma.',
              foot: 'Efeito visual exclusivo',
            },
            {
              icon: Gift,
              title: 'Tag exclusiva',
              text: 'Exiba a tag Apoiador VIP ao lado do seu nome em toda a plataforma.',
              foot: 'Selo premium CineReact',
            },
            {
              icon: Heart,
              title: 'Qualquer valor',
              text: 'Não exigimos quantias altas. Com qualquer contribuição via PIX, seu status VIP pode ser ativado na plataforma.',
              foot: 'Apoio reconhecido',
            },
          ].map(({ icon: Icon, title, text, foot }) => (
            <div key={title} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cine-accent/10 blur-2xl rounded-full" />
              <div>
                <div className="w-10 h-10 rounded-xl bg-cine-accent/10 flex items-center justify-center text-cine-accent-light mb-4 border border-cine-accent/20">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">{title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{text}</p>
              </div>
              <div className="text-[10px] text-cine-accent-light/80 font-mono mt-4 flex items-center gap-1.5">
                <Check className="w-3 h-3" /> {foot}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-cine-accent/20 bg-neutral-900/40 p-6 md:p-8 space-y-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-cine-accent/10 flex items-center justify-center text-cine-accent-light border border-cine-accent/20 mb-1">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Dados para doação</h2>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
                Copie a chave PIX oficial do CineReact e realize a transferência no app do seu banco.
              </p>
            </div>
            <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-4 max-w-md">
              <div className="overflow-hidden text-left">
                <span className="text-[9px] uppercase font-mono text-zinc-600 block">Chave PIX (E-mail)</span>
                <span className="text-xs md:text-sm font-bold text-white select-all block truncate mt-0.5">{pixEmail}</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className="bg-cine-accent/10 hover:bg-cine-accent/20 border border-cine-accent/30 text-cine-accent-light p-2.5 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                title="Copiar Chave PIX"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-3 bg-cine-accent/5 border border-cine-accent/20 rounded-xl p-4 text-xs text-zinc-300 max-w-lg text-left">
              <Gift className="w-5 h-5 text-cine-accent-light flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-white">Ativação do Apoiador VIP:</strong> após doar, envie o comprovante para{' '}
                <span className="font-semibold text-cine-accent-light">{pixEmail}</span> informando seu e-mail cadastrado no CineReact.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
