import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Check, AlertCircle, Heart, Loader2, Camera } from 'lucide-react';
import { UserState, CreatorSocialLinks } from '../types.ts';
import { getBlurEffectsEnabled, setBlurEffectsEnabled as persistBlurEffects } from '../utils/visualPreferences.ts';
import { SOCIAL_PLATFORMS } from '../utils/socialLinks.ts';
import DonorBadge from './profile/DonorBadge.tsx';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
import type { ProfileLoadout } from '../types/gamification.ts';

const MIN_PASSWORD_LENGTH = 8;

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

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[11px] uppercase tracking-[0.28em] text-zinc-500 font-semibold mb-2">
      {children}
    </label>
  );
}

const inputClass =
  'w-full bg-neutral-950/40 border border-neutral-800/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cine-accent/45 focus:ring-1 focus:ring-cine-accent/20';

function StatusMessage({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  const Icon = type === 'error' ? AlertCircle : Check;
  const color = type === 'error' ? 'text-red-400' : 'text-emerald-400';
  return (
    <p className={`text-sm ${color} flex items-center gap-2`}>
      <Icon className="w-4 h-4 shrink-0" />
      {children}
    </p>
  );
}

function ActionButton({
  children,
  loading,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-neutral-950 text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

async function patchUser(
  email: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; user?: UserState; error?: string }> {
  const res = await fetch('/api/usuario/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, ...payload }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || 'Não foi possível salvar.' };
  }
  return { success: true, user: data.user as UserState };
}

function UserSettings({
  user,
  onUpdateUser,
  onNavigateToDonations,
  isVerifiedCreator = false,
  userLoadout,
}: UserSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarDraft, setAvatarDraft] = useState(user.avatar || '');
  const [socialLinks, setSocialLinks] = useState<CreatorSocialLinks>({
    instagram: user.socialLinks?.instagram || '',
    youtube: user.socialLinks?.youtube || '',
    x: user.socialLinks?.x || '',
    twitch: user.socialLinks?.twitch || '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [blurEffectsEnabled, setBlurEffectsEnabled] = useState(() => getBlurEffectsEnabled());

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [socialMsg, setSocialMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    setAvatarDraft(user.avatar || '');
    setSocialLinks({
      instagram: user.socialLinks?.instagram || '',
      youtube: user.socialLinks?.youtube || '',
      x: user.socialLinks?.x || '',
      twitch: user.socialLinks?.twitch || '',
    });
  }, [user.avatar, user.socialLinks]);

  useEffect(() => {
    const syncBlur = () => setBlurEffectsEnabled(getBlurEffectsEnabled());
    window.addEventListener('cinereact:blur-effects-changed', syncBlur);
    return () => window.removeEventListener('cinereact:blur-effects-changed', syncBlur);
  }, []);

  const avatarDirty = avatarDraft !== (user.avatar || '');
  const socialDirty = useMemo(() => {
    if (!isVerifiedCreator) return false;
    return SOCIAL_PLATFORMS.some(({ key }) => (socialLinks[key] || '') !== (user.socialLinks?.[key] || ''));
  }, [isVerifiedCreator, socialLinks, user.socialLinks]);

  const processFile = useCallback((file: File) => {
    setAvatarMsg(null);
    if (file.size > 2.5 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'A imagem deve ter no máximo 2.5MB.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ type: 'error', text: 'Selecione apenas arquivos de imagem.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarDraft(reader.result as string);
      setAvatarMsg({ type: 'success', text: 'Foto pronta. Toque em salvar para aplicar.' });
    };
    reader.onerror = () => {
      setAvatarMsg({ type: 'error', text: 'Erro ao ler o arquivo.' });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const saveAvatar = useCallback(async () => {
    if (!user.isLoggedIn || !avatarDirty) return;
    setAvatarLoading(true);
    setAvatarMsg(null);
    try {
      const result = await patchUser(user.email, { avatar: avatarDraft });
      if (result.success && result.user) {
        onUpdateUser(result.user);
        setAvatarMsg({ type: 'success', text: 'Foto atualizada.' });
      } else {
        setAvatarMsg({ type: 'error', text: result.error || 'Erro ao salvar foto.' });
      }
    } catch {
      setAvatarMsg({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setAvatarLoading(false);
    }
  }, [avatarDirty, avatarDraft, onUpdateUser, user.email, user.isLoggedIn]);

  const savePassword = useCallback(async () => {
    if (!user.isLoggedIn) return;
    setPasswordMsg(null);

    if (!newPassword) {
      setPasswordMsg({ type: 'error', text: 'Informe a nova senha.' });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordMsg({ type: 'error', text: `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await patchUser(user.email, { password: newPassword });
      if (result.success) {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso.' });
      } else {
        setPasswordMsg({ type: 'error', text: result.error || 'Erro ao alterar senha.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setPasswordLoading(false);
    }
  }, [confirmPassword, newPassword, user.email, user.isLoggedIn]);

  const saveSocialLinks = useCallback(async () => {
    if (!user.isLoggedIn || !isVerifiedCreator || !socialDirty) return;
    setSocialLoading(true);
    setSocialMsg(null);
    try {
      const result = await patchUser(user.email, { socialLinks });
      if (result.success && result.user) {
        onUpdateUser(result.user);
        setSocialMsg({ type: 'success', text: 'Links atualizados.' });
      } else {
        setSocialMsg({ type: 'error', text: result.error || 'Erro ao salvar links.' });
      }
    } catch {
      setSocialMsg({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setSocialLoading(false);
    }
  }, [isVerifiedCreator, onUpdateUser, socialDirty, socialLinks, user.email, user.isLoggedIn]);

  return (
    <div className="cine-container pt-24 pb-20 min-h-screen w-full text-zinc-300 max-w-2xl">
      <header className="pt-2 pb-6 md:pb-8">
        <SectionLabel>Sua conta</SectionLabel>
        <h1 className="font-display text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-bold leading-snug tracking-tight text-white mt-1">
          {user.isLoggedIn ? 'Configurações' : 'Preferências'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
          {user.isLoggedIn
            ? 'Gerencie foto, senha e preferências do site.'
            : 'Ajuste a aparência do site. Entre na conta para mais opções.'}
        </p>
        <div className="mt-5">
          <SettingsDivider />
        </div>
      </header>

      <div className="space-y-8 md:space-y-10">
        {user.isLoggedIn && (
          <>
            <section className="space-y-3">
              <SectionLabel>Conta</SectionLabel>
              <p className="text-sm text-zinc-400 break-all">{user.email}</p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                A biografia é editada diretamente na aba Perfil.
              </p>
              {user.isDonor ? (
                <DonorBadge size="sm" />
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
            </section>

            <SettingsDivider />

            <section className="space-y-4">
              <SectionLabel>Foto de perfil</SectionLabel>
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  photoUrl={avatarDraft || user.avatar}
                  alt={user.nome}
                  size="lg"
                  loadout={userLoadout}
                  isDonor={!!user.isDonor}
                  lite
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    PNG, JPG ou WEBP · máx. 2.5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800/80 text-sm text-zinc-300 hover:text-white hover:border-neutral-600 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Escolher foto
                    </button>
                    {avatarDirty && (
                      <ActionButton loading={avatarLoading} onClick={() => void saveAvatar()}>
                        Salvar foto
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
              {avatarMsg && <StatusMessage type={avatarMsg.type}>{avatarMsg.text}</StatusMessage>}
            </section>

            <SettingsDivider />

            <section className="space-y-4">
              <SectionLabel>Segurança</SectionLabel>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Altere sua senha de acesso. Não compartilhe com ninguém.
              </p>
              <div className="space-y-3 max-w-md">
                <div>
                  <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="confirm-password">Confirmar senha</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>
              <ActionButton
                loading={passwordLoading}
                disabled={!newPassword && !confirmPassword}
                onClick={() => void savePassword()}
              >
                Alterar senha
              </ActionButton>
              {passwordMsg && <StatusMessage type={passwordMsg.type}>{passwordMsg.text}</StatusMessage>}
            </section>

            {isVerifiedCreator && (
              <>
                <SettingsDivider />
                <section className="space-y-4">
                  <div>
                    <SectionLabel>Redes sociais</SectionLabel>
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                      Exibidas no seu perfil público de criador.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <FieldLabel htmlFor={`social-${key}`}>{label}</FieldLabel>
                        <input
                          id={`social-${key}`}
                          type="url"
                          inputMode="url"
                          autoComplete="off"
                          value={socialLinks[key] || ''}
                          onChange={(e) => setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                  <ActionButton
                    loading={socialLoading}
                    disabled={!socialDirty}
                    onClick={() => void saveSocialLinks()}
                  >
                    Salvar links
                  </ActionButton>
                  {socialMsg && <StatusMessage type={socialMsg.type}>{socialMsg.text}</StatusMessage>}
                </section>
              </>
            )}

            <SettingsDivider />
          </>
        )}

        <section className="space-y-4">
          <SectionLabel>Experiência do site</SectionLabel>
          <div className="flex items-start justify-between gap-6 py-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">Efeito blur (vidro fosco)</p>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                Desligado por padrão para rolagem mais rápida no celular.
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
      </div>
    </div>
  );
}

export default memo(UserSettings);
