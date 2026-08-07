import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Trash2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi.ts';
import { AdminPanelCard } from '../components/AdminUi.tsx';
import type {
  MinutagemAnalysisRequest,
  MinutagemContentType,
  MinutagemMarker,
  MinutagemMarkerSubmission,
} from '../../types/minutagem.ts';
import { MINUTAGEM_CONTENT_LABELS } from '../../types/minutagem.ts';
import { formatMinutagemRange, formatDuracaoSegundos, contentTypeLabel } from '../../minutagem/utils.ts';

interface MinutagemAdminPageProps {
  email: string;
}

type AdminTab = 'submissions' | 'analysis' | 'catalog';

export default function MinutagemAdminPage({ email }: MinutagemAdminPageProps) {
  const { request, loading } = useAdminApi(email);
  const [tab, setTab] = useState<AdminTab>('submissions');
  const [submissions, setSubmissions] = useState<MinutagemMarkerSubmission[]>([]);
  const [analysisRequests, setAnalysisRequests] = useState<MinutagemAnalysisRequest[]>([]);
  const [markers, setMarkers] = useState<MinutagemMarker[]>([]);
  const [catalog, setCatalog] = useState<Array<{ obraId: string; obraTitulo: string; tipo: string }>>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const [completeId, setCompleteId] = useState<string | null>(null);
  const [completeNote, setCompleteNote] = useState('');
  const [completeMarkers, setCompleteMarkers] = useState('');

  const [newObraId, setNewObraId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newMinutagem, setNewMinutagem] = useState('');
  const [newTipo, setNewTipo] = useState<MinutagemContentType>('nude');

  const loadAll = useCallback(async () => {
    const [subData, analysisData, markersData, catalogRes] = await Promise.all([
      request<{ submissions: MinutagemMarkerSubmission[] }>('/api/admin/minutagem/submissions?status=pending'),
      request<{ requests: MinutagemAnalysisRequest[] }>('/api/admin/minutagem/analysis?status=pending'),
      request<{ markers: MinutagemMarker[] }>('/api/admin/minutagem/markers'),
      request<{ catalog: Array<{ obraId: string; obraTitulo: string; tipo: string }> }>('/api/minutagem/catalog'),
    ]);
    if (subData) setSubmissions(subData.submissions || []);
    if (analysisData) setAnalysisRequests(analysisData.requests || []);
    if (markersData) setMarkers(markersData.markers || []);
    if (catalogRes) setCatalog(catalogRes.catalog || []);
  }, [request]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const approveSubmission = async (id: string) => {
    setProcessing(id);
    await request(`/api/admin/minutagem/submissions/${id}/approve`, { method: 'POST' }, 'Minutagem aprovada.');
    await loadAll();
    setProcessing(null);
  };

  const rejectSubmission = async (id: string) => {
    const note = prompt('Motivo da rejeição (opcional):') || '';
    setProcessing(id);
    await request(
      `/api/admin/minutagem/submissions/${id}/reject`,
      { method: 'POST', body: JSON.stringify({ note }) },
      'Contribuição rejeitada.'
    );
    await loadAll();
    setProcessing(null);
  };

  const completeAnalysis = async (id: string) => {
    setProcessing(id);
    let markersPayload: unknown[] = [];
    if (completeMarkers.trim()) {
      try {
        markersPayload = JSON.parse(completeMarkers);
      } catch {
        alert('JSON de marcadores inválido. Use formato de array ou deixe vazio.');
        setProcessing(null);
        return;
      }
    }
    await request(
      `/api/admin/minutagem/analysis/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ note: completeNote, markers: markersPayload }),
      },
      'Análise finalizada.'
    );
    setCompleteId(null);
    setCompleteNote('');
    setCompleteMarkers('');
    await loadAll();
    setProcessing(null);
  };

  const rejectAnalysis = async (id: string) => {
    const note = prompt('Motivo (opcional):') || '';
    setProcessing(id);
    await request(
      `/api/admin/minutagem/analysis/${id}/reject`,
      { method: 'POST', body: JSON.stringify({ note }) },
      'Pedido rejeitado.'
    );
    await loadAll();
    setProcessing(null);
  };

  const addMarkerDirect = async () => {
    if (!newObraId || !newLabel.trim() || !newMinutagem.trim()) return;
    await request(
      '/api/admin/minutagem/markers',
      {
        method: 'POST',
        body: JSON.stringify({
          obraId: newObraId,
          tipoConteudo: newTipo,
          label: newLabel.trim(),
          minutagem: newMinutagem.trim(),
        }),
      },
      'Marcador adicionado.'
    );
    setNewLabel('');
    setNewMinutagem('');
    await loadAll();
  };

  const deleteMarker = async (id: string) => {
    if (!confirm('Remover este marcador?')) return;
    setProcessing(id);
    await request(`/api/admin/minutagem/markers/${id}`, { method: 'DELETE' }, 'Marcador removido.');
    await loadAll();
    setProcessing(null);
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const pendingAnalysis = analysisRequests.filter((r) => r.status === 'pending' || r.status === 'in_progress');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Minutagem sensível</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Aprove contribuições de fãs, atenda pedidos de catalogação e gerencie avisos para streamers.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['submissions', 'analysis', 'catalog'] as AdminTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
              tab === t
                ? 'bg-cine-accent-light text-black'
                : 'bg-neutral-900 text-zinc-400 border border-neutral-800'
            }`}
          >
            {t === 'submissions'
              ? `Fãs (${pendingSubmissions.length})`
              : t === 'analysis'
                ? `Pedidos (${pendingAnalysis.length})`
                : 'Catálogo'}
          </button>
        ))}
      </div>

      {loading && submissions.length === 0 && (
        <div className="flex items-center gap-2 text-zinc-500 py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando...
        </div>
      )}

      {tab === 'submissions' && (
        <div className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma contribuição pendente.</p>
          ) : (
            pendingSubmissions.map((s) => (
              <AdminPanelCard key={s.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-white">{s.obraTitulo}</p>
                    <p className="text-sm text-zinc-300">{s.label}</p>
                    <p className="text-xs text-zinc-500">
                      {contentTypeLabel(s.tipoConteudo)} ·{' '}
                      <span className="font-mono text-cyan-300">
                        {formatMinutagemRange(s.minutos, s.segundos)}
                      </span>
                      {s.episodioNum ? ` · Ep. ${s.episodioNum}` : ''}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {s.usuarioNome} ({s.usuarioEmail}) · {new Date(s.requestedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={processing === s.id}
                      onClick={() => approveSubmission(s.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 text-xs font-bold border border-emerald-500/30"
                    >
                      {processing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Aprovar
                    </button>
                    <button
                      type="button"
                      disabled={processing === s.id}
                      onClick={() => rejectSubmission(s.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 text-xs font-bold border border-rose-500/30"
                    >
                      <XCircle className="w-3 h-3" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </AdminPanelCard>
            ))
          )}
        </div>
      )}

      {tab === 'analysis' && (
        <div className="space-y-4">
          {pendingAnalysis.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum pedido de análise pendente.</p>
          ) : (
            pendingAnalysis.map((r) => (
              <AdminPanelCard key={r.id} className="p-4 space-y-3">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-bold text-white text-lg">{r.obraTitulo}</p>
                    <p className="text-xs text-zinc-500">
                      {r.tipoObra || 'tipo não informado'} · {r.usuarioNome} ({r.usuarioEmail})
                    </p>
                    {r.mensagem && <p className="text-sm text-zinc-400 mt-2">{r.mensagem}</p>}
                    <p className="text-xs text-zinc-600 mt-1">
                      {new Date(r.requestedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCompleteId(completeId === r.id ? null : r.id)}
                      className="px-3 py-2 rounded-lg bg-cyan-600/20 text-cyan-300 text-xs font-bold border border-cyan-500/30"
                    >
                      Catalogar
                    </button>
                    <button
                      type="button"
                      disabled={processing === r.id}
                      onClick={() => rejectAnalysis(r.id)}
                      className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 text-xs font-bold"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>

                {completeId === r.id && (
                  <div className="border-t border-neutral-800 pt-3 space-y-3">
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Adicione marcadores (JSON) ou finalize vazio se já catalogou manualmente.
                    </p>
                    <textarea
                      value={completeMarkers}
                      onChange={(e) => setCompleteMarkers(e.target.value)}
                      rows={4}
                      placeholder={`[{"obraId":"${r.obraId || 'obra-id'}","tipoConteudo":"nude","label":"Cena X","minutagem":"45"}]`}
                      className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-mono text-zinc-300"
                    />
                    <input
                      type="text"
                      value={completeNote}
                      onChange={(e) => setCompleteNote(e.target.value)}
                      placeholder="Mensagem para o usuário (opcional)"
                      className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-sm text-white"
                    />
                    <button
                      type="button"
                      disabled={processing === r.id}
                      onClick={() => completeAnalysis(r.id)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-black text-xs font-black"
                    >
                      Finalizar e notificar usuário
                    </button>
                  </div>
                )}
              </AdminPanelCard>
            ))
          )}
        </div>
      )}

      {tab === 'catalog' && (
        <div className="space-y-6">
          <AdminPanelCard className="p-4 space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar marcador direto
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={newObraId}
                onChange={(e) => setNewObraId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-black border border-neutral-800 text-white text-sm"
              >
                <option value="">Obra...</option>
                {catalog.map((c) => (
                  <option key={c.obraId} value={c.obraId}>{c.obraTitulo}</option>
                ))}
              </select>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as MinutagemContentType)}
                className="px-3 py-2 rounded-lg bg-black border border-neutral-800 text-white text-sm"
              >
                {(Object.keys(MINUTAGEM_CONTENT_LABELS) as MinutagemContentType[]).map((k) => (
                  <option key={k} value={k}>{MINUTAGEM_CONTENT_LABELS[k]}</option>
                ))}
              </select>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Descrição do momento"
                className="px-3 py-2 rounded-lg bg-black border border-neutral-800 text-white text-sm"
              />
              <input
                type="text"
                value={newMinutagem}
                onChange={(e) => setNewMinutagem(e.target.value)}
                placeholder="Minutagem (45 ou 1:23)"
                className="px-3 py-2 rounded-lg bg-black border border-neutral-800 text-white text-sm font-mono"
              />
            </div>
            <button
              type="button"
              onClick={addMarkerDirect}
              className="px-4 py-2 rounded-lg bg-cine-accent text-black text-xs font-black"
            >
              Salvar no catálogo
            </button>
          </AdminPanelCard>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Marcadores publicados ({markers.length})
            </h3>
            {markers.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum marcador ainda.</p>
            ) : (
              markers
                .sort((a, b) => a.obraTitulo.localeCompare(b.obraTitulo) || a.minutos - b.minutos)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {m.obraTitulo} — {m.label}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {contentTypeLabel(m.tipoConteudo)} ·{' '}
                        <span className="font-mono text-cyan-300">
                          {formatMinutagemRange(m.minutos, m.segundos, m.fimMinutos, m.fimSegundos)}
                        </span>
                        {m.duracaoSegundos ? ` · ${formatDuracaoSegundos(m.duracaoSegundos)}` : ''}
                        {m.episodioLabel ? ` · ${m.episodioLabel}` : ''}
                        · {m.source}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={processing === m.id}
                      onClick={() => deleteMarker(m.id)}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
