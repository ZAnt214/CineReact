import React, { useState, useEffect } from 'react';
import { Lock, Check, AlertCircle, Heart, Upload, Loader2 } from 'lucide-react';
import { UserState, CreatorSocialLinks } from '../types.ts';
import { getBlurEffectsEnabled, setBlurEffectsEnabled as persistBlurEffects } from '../utils/visualPreferences.ts';
import { SOCIAL_PLATFORMS } from '../utils/socialLinks.ts';
import DonorBadge from './profile/DonorBadge.tsx';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
import ProfileNameRow from './profile/ProfileNameRow.tsx';
import type { ProfileLoadout } from '../types/gamification.ts';

interface UserSettingsProps {
  user: UserState;
  onUpdateUser: (newUser: UserState) => void;
  onNavigateToDonations: () => void;
  isVerifiedCreator?: boolean;
  userLoadout?: ProfileLoadout | null;
}

function SettingsDivider() {
  return <div className="h-px bg-gradient-to-r from-cine-accent/25 via-neutral-800/80 to-transparent" aria-hidden />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.28em] text-zinc-500 font-semibold mb-2">
      {children}
    </label>
  );
}

const inputClass =
  'w-full bg-neutral-950/40 border border-neutral-800/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cine-accent/45 focus:ring-1 focus:ring-cine-accent/20';

export default function UserSettings({
  user,
  onUpdateUser,
  onNavigateToDonations,
  isVerifiedCreator = false,
  userLoadout,
}: UserSettingsProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [descricao, setDescricao] = useState(user.descricao || '');
  const [socialLinks, setSocialLinks] = useState<CreatorSocialLinks>({
    instagram: user.socialLinks?.instagram || '',
    youtube: user.socialLinks?.youtube || '',
    x: user.socialLinks?.x || '',
    twitch: user.socialLinks?.twitch || '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setAvatarUrl(user.avatar || '');
    setDescricao(user.descricao || '');
    setSocialLinks({
      instagram: user.socialLinks?.instagram || '',
      youtube: user.socialLinks?.youtube || '',
      x: user.socialLinks?.x || '',
      twitch: user.socialLinks?.twitch || '',
    });
  }, [user.avatar, user.descricao, user.socialLinks]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [blurEffectsEnabled, setBlurEffectsEnabled] = useState(() => getBlurEffectsEnabled());

  useEffect(() => {
    const syncBlur = () => setBlurEffectsEnabled(getBlurEffectsEnabled());
    window.addEventListener('cinereact:blur-effects-changed', syncBlur);
    return () => window.removeEventListener('cinereact:blur-effects-changed', syncBlur);
  }, []);

  const processFile = (file: File) => {
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
      setSuccessMsg('Imagem carregada. Salve para aplicar.');
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo de imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isLoggedIn) return;

    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
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
          descricao,
          socialLinks: isVerifiedCreator ? socialLinks : undefined,
          password: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onUpdateUser(data.user);
        setSuccessMsg('Alterações salvas com sucesso.');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(data.error || 'Erro ao atualizar perfil.');
      }
    } catch {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cine-container pt-24 pb-20 min-h-screen w-full text-zinc-300">
      <header className="pt-2 pb-6 md:pb-8">
        <SectionLabel>Sua conta</SectionLabel>
        <h1 className="font-display text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-bold leading-snug tracking-tight text-white mt-1">
          {user.isLoggedIn ? 'Configurações' : 'Preferências'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-lg">
          {user.isLoggedIn
            ? 'Perfil, aparência do site e segurança da sua conta.'
            : 'Ajuste a aparência do site. Entre na conta para editar perfil e senha.'}
        </p>
        <div className="mt-5">
          <SettingsDivider />
        </div>
      </header>

      <div className="space-y-8 md:space-y-10">
        <section className="space-y-4">
          <SectionLabel>Aparência</SectionLabel>
          <div className="flex items-start justify-between gap-6 py-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">Efeito blur (vidro fosco)</p>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                Desativado por padrão para melhor desempenho no celular.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={blurEffectsEnabled}
              onClick={() => {
                const next = !blurEffectsEnabled;
                setBlurEffectsEnabled(next);
                persistBlurEffects(next);
              }}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                blurEffectsEnabled ? 'bg-cine-accent' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  blurEffectsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {!user.isLoggedIn ? (
          <section className="py-2">
            <p className="text-sm text-zinc-500 leading-relaxed">
              Entre na sua conta para editar foto, bio e senha.
            </p>
          </section>
        ) : (
          <>
            <SettingsDivider />

            <section className="space-y-5">
              <SectionLabel>Seu perfil</SectionLabel>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <ProfileAvatar
                  photoUrl={avatarUrl || user.avatar}
                  alt={user.nome}
                  size="lg"
                  loadout={userLoadout}
                  isDonor={!!user.isDonor}
                  lite
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <ProfileNameRow
                    name={user.nome}
                    isDonor={!!user.isDonor}
                    loadout={userLoadout}
                    nameSize="md"
                    align="left"
                    className="w-full"
                  />
                  <p className="text-sm text-zinc-500 mt-1 truncate">{user.email}</p>
                  <div className="mt-3">
                    {user.isDonor ? (
                      <div className="space-y-1.5">
                        <DonorBadge size="sm" />
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Benefícios VIP ativos no perfil e nos comentários.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onNavigateToDonations}
                        className="inline-flex items-center gap-1.5 text-sm text-cine-accent-light hover:text-cine-accent transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        Seja um apoiador
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <SettingsDivider />

            <form onSubmit={handleUpdateProfile} className="space-y-8 md:space-y-10">
              {errorMsg && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  {successMsg}
                </p>
              )}

              <section className="space-y-3">
                <SectionLabel>Foto de perfil</SectionLabel>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border transition-colors ${
                    dragActive
                      ? 'border-cine-accent/40 bg-cine-accent/5'
                      : 'border-neutral-800/70 bg-neutral-950/30'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-3 px-4 py-4">
                    <Upload className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-300">
                        Arraste uma imagem ou <span className="text-cine-accent-light">escolha um arquivo</span>
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">PNG, JPG ou WEBP · máx. 2.5MB</p>
                    </div>
                  </div>
                </div>

                {avatarUrl && (
                  <div className="flex items-center gap-3 py-1">
                    <img
                      src={avatarUrl}
                      alt="Prévia"
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-neutral-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120';
                      }}
                    />
                    <p className="text-sm text-zinc-400 flex-1 min-w-0 truncate">Nova foto selecionada</p>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <FieldLabel>Biografia</FieldLabel>
                <p className="text-sm text-zinc-500 -mt-1 mb-2 leading-relaxed">
                  Visível na aba do seu perfil.
                </p>
                <textarea
                  placeholder="Conte um pouco sobre você..."
                  maxLength={180}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
                <p className="text-xs text-zinc-600 text-right tabular-nums">{descricao.length}/180</p>
              </section>

              {isVerifiedCreator && (
                <section className="space-y-4">
                  <div>
                    <SectionLabel>Redes sociais</SectionLabel>
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                      Links exibidos no seu perfil público de criador.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <FieldLabel>{label}</FieldLabel>
                        <input
                          type="text"
                          value={socialLinks[key] || ''}
                          onChange={(e) => setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <SectionLabel>Segurança</SectionLabel>
                <div>
                  <FieldLabel>Nova senha</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="password"
                      placeholder="Deixe em branco para manter a atual"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Confirmar senha</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </section>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-neutral-950 text-sm font-bold cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
