import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Link2,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Upload,
  Download,
} from 'lucide-react';
import type { CineClip, CineClipImportJob } from '../../types/cineclips.ts';
import { CINECLIPS_CATEGORIES } from '../../types/cineclips.ts';
import { AdminPanelCard, AdminBadge } from '../components/AdminUi.tsx';
import { useAdminToast } from '../components/AdminToast.tsx';
import { downloadClipVideo } from '../../hooks/useCineClips.ts';

interface CineClipsAdminPageProps {
  email: string;
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

  const handlePreview = async () => {
    if (!importUrl.trim()) return;
    setPreviewLoading(true);
    setPreview(null);
    setPreviewError(null);
    setAlternatives([]);
    try {
      const data = await adminFetch('/api/admin/cineclips/import/preview', {
        method: 'POST',
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      setPreview(data.preview);
    } catch (err: any) {
      setPreviewError(err.message);
      if (err.alternatives) setAlternatives(err.alternatives);
    } finally {
      setPreviewLoading(false);
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
      toast.success('Importação iniciada! Acompanhe a fila abaixo.');
      setImportUrl('');
      setPreview(null);
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
        <h1 className="text-2xl font-black text-white">Painel CineClips</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Cole links do <strong className="text-white">TikTok</strong>, <strong className="text-white">Instagram Reels</strong> ou <strong className="text-white">YouTube Shorts</strong>.
          Vídeos do TikTok e Instagram são baixados e republicados no CineReact automaticamente.
        </p>
      </div>

      <AdminPanelCard title="Importar por link" description="TikTok/Instagram: download e hospedagem · YouTube: embed direto · Baixar com marca CineReact e sem metadados">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">URL do vídeo</label>
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.tiktok.com/... ou instagram.com/reel/..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cine-accent/50"
            />
          </div>

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
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">Tags (separadas por vírgula)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, filme, viral"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cine-accent/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading || !importUrl.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Pré-visualizar
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Importar
            </button>
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
            <div className="flex gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <img src={preview.thumbnailUrl} alt="" className="w-24 aspect-[9/16] object-cover rounded-lg" />
              <div>
                <p className="font-bold text-white text-sm">{preview.titulo}</p>
                <p className="text-xs text-zinc-400 mt-1">{preview.criadorNome}</p>
                <p className="text-xs text-zinc-500 mt-1">{preview.duracao}</p>
                {preview.platform && (
                  <p className="text-[10px] text-cine-accent-light font-bold mt-1 uppercase">
                    {preview.platform}
                    {preview.willDownload ? ' · será baixado e hospedado no CineReact' : ' · reprodução via embed'}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(preview.hashtags || []).map((h: string) => (
                    <span key={h} className="text-[10px] text-cine-accent-light">{h}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminPanelCard>

      <AdminPanelCard title="Fila de processamento" description="Importações com barra de progresso e registro de erros">
        {jobs.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma importação registrada.</p>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 15).map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {jobIcon(job.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {job.titulo || job.sourceUrl}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">{job.sourceUrl}</p>
                    </div>
                  </div>
                  <AdminBadge tone={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'danger' : 'default'}>
                    {job.status}
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
                {job.alternatives && job.alternatives.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {job.alternatives.map((alt) => (
                      <li key={alt} className="text-[11px] text-zinc-500">• {alt}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      <AdminPanelCard title={`Clips cadastrados (${clips.length})`}>
        {clips.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum clip cadastrado. Importe o primeiro vídeo acima.</p>
        ) : (
          <div className="space-y-2">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800"
              >
                <img src={clip.thumbnailUrl} alt="" className="w-12 h-16 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{clip.titulo}</p>
                  <p className="text-[11px] text-zinc-500">{clip.criadorNome} · {clip.duracao} · {clip.visualizacoes} views</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <AdminBadge tone={clip.status === 'published' ? 'success' : 'default'}>
                    {clip.status}
                  </AdminBadge>
                  <button
                    type="button"
                    onClick={() => toggleClipStatus(clip)}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {clip.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadClip(clip)}
                    disabled={!clip.videoUrl || downloadingClipId === clip.id}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-zinc-400 hover:text-cine-accent-light disabled:opacity-40 cursor-pointer"
                    title={clip.videoUrl ? 'Baixar com marca CineReact' : 'Disponível apenas para vídeos hospedados'}
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
