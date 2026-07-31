import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link2,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Upload,
  Download,
  ClipboardPaste,
  Film,
  ListVideo,
  Youtube,
  Instagram,
  Sparkles,
} from 'lucide-react';
import type { CineClip, CineClipImportJob } from '../../types/cineclips.ts';
import { CINECLIPS_CATEGORIES } from '../../types/cineclips.ts';
import { AdminPanelCard, AdminBadge, AdminStatCard } from '../components/AdminUi.tsx';
import { useAdminToast } from '../components/AdminToast.tsx';
import { downloadClipVideo } from '../../hooks/useCineClips.ts';
import { detectClipPlatform, platformLabel } from '../../cineclips/platform.ts';

interface CineClipsAdminPageProps {
  email: string;
}

const PLATFORM_HINTS = [
  { id: 'tiktok', label: 'TikTok', color: 'text-white' },
  { id: 'instagram', label: 'Instagram', color: 'text-pink-300' },
  { id: 'youtube', label: 'YouTube Shorts', color: 'text-red-300' },
] as const;

const JOB_STATUS_LABELS: Record<CineClipImportJob['status'], string> = {
  queued: 'Na fila',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
};

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'youtube') return <Youtube className="w-4 h-4 text-red-400" />;
  if (platform === 'instagram') return <Instagram className="w-4 h-4 text-pink-400" />;
  return <Film className="w-4 h-4 text-white" />;
}

export default function CineClipsAdminPage({ email }: CineClipsAdminPageProps) {
  const toast = useAdminToast();
  const [clips, setClips] = useState<CineClip[]>([]);
  const [jobs, setJobs] = useState<CineClipImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [importUrl, setImportUrl] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Reação']);
  const [tags, setTags] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectedPlatform = importUrl.trim() ? detectClipPlatform(importUrl) : 'unknown';

  const adminFetch = useCallback(async (path: string, options?: RequestInit) => {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': email,
        ...(options?.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.error || 'Erro na requisição') as Error & { alternatives?: string[] };
      if (body.alternatives) err.alternatives = body.alternatives;
      throw err;
    }
    return body;
  }, [email]);

  const loadData = useCallback(async () => {
    try {
      const [clipsData, jobsData] = await Promise.all([
        adminFetch('/api/admin/cineclips'),
        adminFetch('/api/admin/cineclips/import/jobs'),
      ]);
      setClips(clipsData.clips || []);
      setJobs(jobsData.jobs || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminFetch, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const pending = jobs.some((j) => j.status === 'queued' || j.status === 'processing');
    if (!pending) return;
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [jobs, loadData]);

  const handlePreview = useCallback(async (url: string) => {
    if (!url.trim()) return;
    setPreviewLoading(true);
    setPreview(null);
    setPreviewError(null);
    setAlternatives([]);
    try {
      const data = await adminFetch('/api/admin/cineclips/import/preview', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      });
      setPreview(data.preview);
    } catch (err: any) {
      setPreviewError(err.message);
      if (err.alternatives) setAlternatives(err.alternatives);
    } finally {
      setPreviewLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    if (!importUrl.trim() || detectedPlatform === 'unknown') {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    previewTimer.current = setTimeout(() => {
      handlePreview(importUrl);
    }, 900);

    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [importUrl, detectedPlatform, handlePreview]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setImportUrl(text.trim());
    } catch {
      toast.error('Não foi possível colar da área de transferência.');
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      await adminFetch('/api/admin/cineclips/import', {
        method: 'POST',
        body: JSON.stringify({
          url: importUrl.trim(),
          categorias: selectedCategories,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          createdBy: email,
        }),
      });
      toast.success('Clip adicionado à fila! Publicação em instantes.');
      setImportUrl('');
      setPreview(null);
      setTags('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleClipStatus = async (clip: CineClip) => {
    const newStatus = clip.status === 'published' ? 'hidden' : 'published';
    try {
      await adminFetch(`/api/admin/cineclips/${clip.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(newStatus === 'published' ? 'Clip publicado' : 'Clip ocultado');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteClip = async (id: string) => {
    if (!window.confirm('Excluir este clip permanentemente?')) return;
    try {
      await adminFetch(`/api/admin/cineclips/${id}`, { method: 'DELETE' });
      toast.success('Clip excluído');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDownloadClip = async (clip: CineClip) => {
    setDownloadingClipId(clip.id);
    try {
      await downloadClipVideo(clip.id, { adminEmail: email });
      toast.success('Download iniciado com marca CineReact');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloadingClipId(null);
    }
  };

  const jobIcon = (status: CineClipImportJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-cine-accent animate-spin" />;
      default: return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const publishedCount = clips.filter((c) => c.status === 'published').length;
  const pendingJobs = jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length;
  const canImport = importUrl.trim() && !importing && (preview || detectedPlatform !== 'unknown');

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cine-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cine-accent/10 border border-cine-accent/25 text-cine-accent-light text-[10px] font-bold uppercase tracking-wider mb-3">
          <Zap className="w-3.5 h-3.5" />
          CineClips Admin
        </div>
        <h1 className="text-2xl font-black text-white">Gerenciar CineClips</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
          Cole um link, revise o preview e publique. TikTok e Instagram são baixados automaticamente;
          YouTube Shorts roda via embed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminStatCard label="Clips publicados" value={publishedCount} sub={`${clips.length} no total`} icon={ListVideo} />
        <AdminStatCard label="Na fila" value={pendingJobs} sub="importações em andamento" icon={Clock} accent="text-amber-300" />
        <AdminStatCard label="Plataformas" value="3" sub="TikTok · Instagram · YouTube" icon={Sparkles} accent="text-pink-300" />
      </div>

      <AdminPanelCard
        title="Adicionar novo clip"
        description="Cole o link do vídeo — o preview aparece automaticamente"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {PLATFORM_HINTS.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                  detectedPlatform === p.id
                    ? 'bg-cine-accent/15 border-cine-accent/35 text-cine-accent-light'
                    : 'bg-neutral-900/60 border-neutral-800 text-zinc-500'
                }`}
              >
                <PlatformIcon platform={p.id} />
                {p.label}
              </span>
            ))}
          </div>

          <div
            className={`relative rounded-2xl border-2 border-dashed transition-colors ${
              importUrl.trim()
                ? 'border-cine-accent/35 bg-cine-accent/[0.04]'
                : 'border-neutral-700 bg-neutral-950/50'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-cine-accent-light shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1.5">URL do vídeo</label>
                    <input
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://www.tiktok.com/@usuario/video/..."
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cine-accent/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-cine-accent-light transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    Colar da área de transferência
                  </button>
                </div>
              </div>
            </div>

            {previewLoading && (
              <div className="px-5 pb-4 flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cine-accent" />
                Buscando informações do vídeo...
              </div>
            )}
          </div>

          {previewError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25">
              <p className="text-sm text-red-300 font-semibold">{previewError}</p>
              {alternatives.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {alternatives.map((alt) => (
                    <li key={alt} className="text-xs text-red-200/70">• {alt}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {preview && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-neutral-900/50 border border-cine-accent/20">
              <img
                src={preview.thumbnailUrl}
                alt=""
                className="w-full sm:w-28 aspect-[9/16] object-cover rounded-xl shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <PlatformIcon platform={preview.platform || detectedPlatform} />
                  <span className="text-[10px] font-bold uppercase text-cine-accent-light">
                    {platformLabel(preview.platform || detectedPlatform)}
                    {preview.willDownload ? ' · será hospedado' : ' · embed'}
                  </span>
                </div>
                <p className="font-bold text-white text-sm leading-snug">{preview.titulo}</p>
                <p className="text-xs text-zinc-400 mt-1">@{preview.criadorNome}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{preview.duracao}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(preview.hashtags || []).slice(0, 5).map((h: string) => (
                    <span key={h} className="text-[10px] text-cine-accent-light font-semibold">{h}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-zinc-400 mb-2">Categorias</p>
              <div className="flex flex-wrap gap-2">
                {CINECLIPS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selectedCategories.includes(cat)
                        ? 'bg-cine-accent/20 border-cine-accent/40 text-cine-accent-light'
                        : 'bg-neutral-900 border-neutral-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-2">Tags extras (vírgula)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="react, filme, viral"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cine-accent/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleImport}
              disabled={!canImport}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-black text-sm font-black disabled:opacity-40 cursor-pointer transition-colors"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Publicar clip
            </button>
            {importUrl && (
              <button
                type="button"
                onClick={() => {
                  setImportUrl('');
                  setPreview(null);
                  setPreviewError(null);
                }}
                className="text-xs font-bold text-zinc-500 hover:text-white cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </AdminPanelCard>

      <AdminPanelCard title="Fila de processamento" description="Acompanhe o status das importações">
        {jobs.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma importação ainda. Adicione o primeiro clip acima.</p>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 12).map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {jobIcon(job.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {job.titulo || 'Processando vídeo...'}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">{job.sourceUrl}</p>
                    </div>
                  </div>
                  <AdminBadge tone={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'danger' : 'default'}>
                    {JOB_STATUS_LABELS[job.status]}
                  </AdminBadge>
                </div>

                <div className="mt-3 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      job.status === 'failed' ? 'bg-red-500' : 'bg-cine-accent'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>

                {job.error && <p className="text-xs text-red-300 mt-2">{job.error}</p>}
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      <AdminPanelCard title={`Biblioteca (${clips.length})`}>
        {clips.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-zinc-600 mb-3">
              <Film className="w-8 h-8" />
            </div>
            <p className="text-sm text-zinc-500">Nenhum clip cadastrado.</p>
            <p className="text-xs text-zinc-600 mt-1">Cole um link acima para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <img src={clip.thumbnailUrl} alt="" className="w-14 h-[4.5rem] object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{clip.titulo}</p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    @{clip.criadorNome} · {clip.duracao}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {clip.visualizacoes.toLocaleString('pt-BR')} views · {clip.likes} curtidas
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <AdminBadge tone={clip.status === 'published' ? 'success' : 'default'}>
                    {clip.status === 'published' ? 'Publicado' : clip.status}
                  </AdminBadge>
                  <button
                    type="button"
                    onClick={() => toggleClipStatus(clip)}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-zinc-400 hover:text-white cursor-pointer"
                    title={clip.status === 'published' ? 'Ocultar' : 'Publicar'}
                  >
                    {clip.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadClip(clip)}
                    disabled={!clip.videoUrl || downloadingClipId === clip.id}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-zinc-400 hover:text-cine-accent-light disabled:opacity-40 cursor-pointer"
                    title="Baixar com marca CineReact"
                  >
                    {downloadingClipId === clip.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteClip(clip.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>
    </div>
  );
}
