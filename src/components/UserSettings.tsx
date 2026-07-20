import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, Sparkles, Check, AlertCircle, Heart, Upload } from 'lucide-react';
import { UserState } from '../types.ts';
import { motion } from 'motion/react';

interface UserSettingsProps {
  user: UserState;
  onUpdateUser: (newUser: UserState) => void;
  onNavigateToDonations: () => void;
}

export default function UserSettings({ user, onUpdateUser, onNavigateToDonations }: UserSettingsProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [descricao, setDescricao] = useState(user.descricao || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setAvatarUrl(user.avatar || '');
    setDescricao(user.descricao || '');
  }, [user.avatar, user.descricao]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file: File) => {
    // Limit to 2.5MB to ensure safe transmission and storage in JSON database
    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 2.5MB.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setSuccessMsg('Imagem carregada com sucesso! Clique em "Salvar Alterações" para aplicar.');
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo de imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isLoggedIn) return;
    
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/usuario/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          avatar: avatarUrl,
          descricao: descricao,
          password: newPassword || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onUpdateUser(data.user);
        setSuccessMsg('Perfil atualizado com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(data.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-4xl mx-auto min-h-screen text-zinc-300">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Shield className="w-8 h-8 text-teal-500" />
            Configurações de Conta
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Gerencie suas informações de acesso, envie sua foto de perfil diretamente e visualize seus benefícios VIP.
          </p>
        </div>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Panel: Profile Preview & Status */}
          <div className="md:col-span-5 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-between space-y-6 text-center">
            
            {/* Profile Avatar Live Preview */}
            <div className="space-y-4">
              <div className="relative group">
                {/* Glowing Aura if Donor */}
                {user.isDonor && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500 via-pink-500 to-rose-500 blur-md opacity-75 animate-pulse" />
                )}
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center mx-auto">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback on image error
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120";
                      }}
                    />
                  ) : (
                    <User className="w-12 h-12 text-zinc-600" />
                  )}
                </div>
              </div>

              {/* User Name with customization based on Donor Status */}
              <div>
                <h3 className={`text-lg font-black tracking-wide flex items-center justify-center gap-1.5 ${
                  user.isDonor 
                    ? "bg-gradient-to-r from-teal-400 via-pink-400 to-rose-400 bg-clip-text text-transparent font-black drop-shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse" 
                    : "text-white"
                }`}>
                  {user.nome}
                </h3>
                <p className="text-zinc-500 text-[10px] font-mono">{user.email}</p>
              </div>
            </div>

            {/* Badge / Donor Status Showcase */}
            <div className="w-full pt-4 border-t border-zinc-800/60 space-y-3">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Status da Conta</div>
              
              {user.isDonor ? (
                <div className="bg-gradient-to-r from-teal-950/40 via-rose-950/30 to-pink-950/40 border border-rose-500/35 rounded-xl p-4 text-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 blur-xl rounded-full" />
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-rose-400 animate-spin-slow" />
                    APOIADOR VIP
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Seu nome brilha com destaque! Você tem a tag exclusiva de doador além do seu nome estilizado em tons de teal e rosa. Obrigado por apoiar o CineReact!
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-zinc-800 rounded-xl p-4 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    Membro Comum
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Você ainda não possui as decorações especiais. Apoie nosso projeto para obter benefícios visuais únicos!
                  </p>
                  <button
                    onClick={onNavigateToDonations}
                    className="w-full bg-teal-600/15 hover:bg-teal-600/25 border border-teal-500/20 hover:border-teal-500/40 text-teal-400 text-[11px] font-bold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-teal-400 fill-teal-400/20" /> Seja um Apoiador
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Panel: Settings Form */}
          <div className="md:col-span-7 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <User className="text-teal-500 w-4 h-4" /> Editar Informações
            </h2>

            {errorMsg && (
              <div className="bg-red-950/30 border border-red-500/35 text-red-400 p-3 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-950/30 border border-green-500/35 text-green-400 p-3 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2 mb-5">
                <Check className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              
              {/* Field: Photo/Avatar Local Upload */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                  Foto de Perfil (Enviar Arquivo)
                </label>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative ${
                    dragActive 
                      ? 'border-teal-500 bg-teal-500/5' 
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-300">
                        Arraste sua foto aqui ou <span className="text-teal-400 hover:underline">escolha um arquivo</span>
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Formatos suportados: PNG, JPG, JPEG ou WEBP (Max. 2.5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {avatarUrl && (
                  <div className="flex items-center gap-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850">
                    <img 
                      src={avatarUrl} 
                      alt="Thumbnail" 
                      className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120";
                      }}
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-[10px] font-bold text-zinc-300 truncate">Foto selecionada</p>
                      <p className="text-[8px] text-zinc-500 font-mono">Pronta para salvar</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline px-2 py-1"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              {/* Field: Biografia / Descrição do Perfil */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                  Biografia / Descrição do Perfil
                </label>
                <textarea
                  placeholder="Escreva uma breve biografia sobre você para exibir no seu perfil (máx. 180 caracteres)..."
                  maxLength={180}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-teal-500 rounded-lg p-3 text-xs text-white outline-none transition-colors resize-none leading-relaxed"
                />
                <div className="flex justify-end text-[9px] text-zinc-600 font-mono">
                  {descricao.length}/180 caracteres
                </div>
              </div>

              {/* Password Divider */}
              <div className="relative py-2 flex items-center">
                <div className="flex-grow border-t border-zinc-800/80"></div>
                <span className="flex-shrink mx-4 text-[9px] text-zinc-500 uppercase font-mono tracking-widest">Segurança</span>
                <div className="flex-grow border-t border-zinc-800/80"></div>
              </div>

              {/* Field: New Password */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                  Nova Senha (Deixe em branco para manter a atual)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="Sua nova senha secreta"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-teal-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Field: Confirm Password */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-teal-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-lg shadow-teal-950/25"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Salvar Alterações</>
                )}
              </button>

            </form>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
