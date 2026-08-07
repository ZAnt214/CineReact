import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Clock,
  Film,
  Loader2,
  LogIn,
  Plus,
  Search,
  Send,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { UserState } from '../types.ts';
import type { MinutagemMarker } from '../types/minutagem.ts';
import {
  MINUTAGEM_CONTENT_LABELS,
  type MinutagemContentType,
} from '../types/minutagem.ts';
import {
  useMinutagemCatalog,
  useMinutagemMarkers,
  useMinutagemMe,
  type MinutagemCatalogEntry,
} from '../hooks/useMinutagem.ts';
import {
  contentTypeBadgeClass,
  contentTypeLabel,
  formatMinutagemRange,
  formatDuracaoSegundos,
} from '../minutagem/utils.ts';
import OptimizedImage from './OptimizedImage.tsx';

interface MinutagemPageProps {
  user: UserState;
  onOpenAuth: () => void;
  onSelectObra?: (obraId: string) => void;
}

type PanelMode = 'browse' | 'submit' | 'request';

const TIPO_LABELS: Record<string, string> = {
  filme: 'Filmes',
  serie: 'Séries',
  anime: 'Animes',
};

function tipoLabel(tipo: string) {
  return TIPO_LABELS[tipo] || tipo;
}

function MinutagemMarkerCard({ marker }: { marker: MinutagemMarker }) {
  return (
    <article className="rounded-xl border border-neutral-800/80 bg-black/35 p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-bold text-cyan-300 tabular-nums">
          {formatMinutagemRange(marker.minutos, marker.segundos, marker.fimMinutos, marker.fimSegundos)}
        </span>
        {marker.duracaoSegundos && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 px-2 py-0.5 rounded-full border border-neutral-800">
            {formatDuracaoSegundos(marker.duracaoSegundos)}
          </span>
        )}
        {marker.episodioLabel && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 px-2 py-0.5 rounded-full border border-neutral-700/80">
            {marker.episodioLabel}
          </span>
        )}
      </div>
      <span
        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${contentTypeBadgeClass(marker.tipoConteudo)}`}
      >
        {contentTypeLabel(marker.tipoConteudo)}
      </span>
      <p className="text-sm text-zinc-200 leading-relaxed">{marker.label}</p>
    </article>
  );
}

function ObraCatalogCard({
  entry,
  onClick,
}: {
  entry: MinutagemCatalogEntry;
  onClick: () => void;
}) {
  const Icon = entry.tipo === 'filme' ? Film : Tv;

  return (
    <button
      type="button"
      onClick={onClick}
      className="catalog-card-standard catalog-card minutagem-catalog-card rounded-xl overflow-hidden cursor-pointer group/card md:select-none text-left w-full"
    >
      <div className="relative w-full h-[148px] sm:h-[176px] md:h-[200px] lg:h-[220px] overflow-hidden catalog-card-thumb catalog-card-standard-thumb bg-neutral-950">
        {entry.poster ? (
          <OptimizedImage
            src={entry.poster}
            alt={entry.obraTitulo}
            lite
            className="w-full h-full object-cover md:group-hover/card:scale-[1.04] md:transition-transform md:duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-cine-accent-light/40">
            <Icon className="w-8 h-8" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 z-10 p-2 sm:p-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[8px] sm:text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-200 bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/10">
              {tipoLabel(entry.tipo)}
            </span>
            {entry.markerCount > 0 && (
              <span
                className="inline-flex items-center gap-1 min-h-[22px] px-1.5 sm:px-2 rounded-md bg-black/60 backdrop-blur-md border border-cine-accent/35 text-[9px] sm:text-[10px] font-bold text-cine-accent-light tabular-nums leading-none shrink-0"
                aria-label={`${entry.markerCount} aviso${entry.markerCount !== 1 ? 's' : ''}`}
              >
                <Clock className="w-3 h-3 shrink-0 opacity-90" aria-hidden />
                <span>{entry.markerCount}</span>
              </span>
            )}
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover/card:text-cine-accent-light transition-colors">
            {entry.obraTitulo}
          </h3>
        </div>

        <div className="absolute inset-0 z-[5] bg-black/35 opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-cine-accent text-white flex items-center justify-center shadow-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function MinutagemPage({ user, onOpenAuth, onSelectObra }: MinutagemPageProps) {
  const { catalog, loading: catalogLoading } = useMinutagemCatalog();
  const [search, setSearch] = useState('');
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelMode>('browse');
  const [showPendingCatalog, setShowPendingCatalog] = useState(false);

  const selectedEntry = catalog.find((c) => c.obraId === selectedObraId);
  const { markers, loading: markersLoading } = useMinutagemMarkers(selectedObraId || undefined);
  const me = useMinutagemMe(user.isLoggedIn);

  const [submitObraId, setSubmitObraId] = useState('');
  const [submitLabel, setSubmitLabel] = useState('');
  const [submitMinutagem, setSubmitMinutagem] = useState('');
  const [submitTipo, setSubmitTipo] = useState<MinutagemContentType>('nude');
  const [submitEpisodio, setSubmitEpisodio] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [requestTitulo, setRequestTitulo] = useState('');
  const [requestTipo, setRequestTipo] = useState<'filme' | 'serie' | 'anime'>('filme');
  const [requestMensagem, setRequestMensagem] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) => c.obraTitulo.toLowerCase().includes(q) || c.tipo.toLowerCase().includes(q)
    );
  }, [catalog, search]);

  const catalogWithMarkers = useMemo(
    () => filteredCatalog.filter((c) => c.markerCount > 0),
    [filteredCatalog]
  );
  const catalogWithoutMarkers = useMemo(
    () => filteredCatalog.filter((c) => c.markerCount === 0),
    [filteredCatalog]
  );

  const openObra = (obraId: string) => {
    setSelectedObraId(obraId);
  };

  const closeObra = () => setSelectedObraId(null);

  const handleSubmitMarker = async () => {
    if (!user.isLoggedIn) {
      onOpenAuth();
      return;
    }
    const obraId = submitObraId || selectedObraId;
    if (!obraId || !submitLabel.trim() || !submitMinutagem.trim()) return;

    const result = await me.submitMarker({
      email: user.email,
      obraId,
      tipoConteudo: submitTipo,
      label: submitLabel.trim(),
      minutagem: submitMinutagem.trim(),
      episodioNum: submitEpisodio ? Number(submitEpisodio) : undefined,
    });
    if (result) {
      setSubmitSuccess(true);
      setSubmitLabel('');
      setSubmitMinutagem('');
      setSubmitEpisodio('');
      setTimeout(() => setSubmitSuccess(false), 4000);
    }
  };

  const handleRequestAnalysis = async () => {
    if (!user.isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!requestTitulo.trim()) return;

    const linked = catalog.find(
      (c) => c.obraTitulo.toLowerCase() === requestTitulo.trim().toLowerCase()
    );

    const result = await me.requestAnalysis({
      email: user.email,
      obraTitulo: requestTitulo.trim(),
      obraId: linked?.obraId,
      tipoObra: requestTipo,
      mensagem: requestMensagem.trim() || undefined,
    });
    if (result) {
      setRequestSuccess(true);
      setRequestTitulo('');
      setRequestMensagem('');
      setTimeout(() => setRequestSuccess(false), 4000);
    }
  };

  return (
    <div className="w-full flex-1 minutagem-page">
      <div className="cine-container pt-24 pb-20 space-y-8">
        <header className="relative pt-2 pb-2 md:pb-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 font-mono font-medium">
            minutagem
          </p>
          <h1 className="text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-semibold leading-snug tracking-tight text-zinc-100 mt-1 font-mono">
            Índice de timestamps — conteúdo sensível
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-lg font-mono text-[13px]">
            Marcadores por obra (filme/série). Intervalos em min:seg e classificação de cena.
          </p>
          <div
            className="mt-4 h-px bg-gradient-to-r from-zinc-700/40 via-neutral-800/80 to-transparent"
            aria-hidden
          />
        </header>

        <div className="flex flex-wrap gap-2">
          {(['browse', 'submit', 'request'] as PanelMode[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPanel(id);
                if (id !== 'browse') setSelectedObraId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 border ${
                panel === id
                  ? 'bg-cine-accent text-white shadow-md shadow-cine-accent/20 border-cine-accent'
                  : 'bg-neutral-900/60 text-zinc-300 border-neutral-800 hover:bg-neutral-800 hover:border-cine-accent/30'
              }`}
            >
              {id === 'browse' ? 'Consultar' : id === 'submit' ? 'Contribuir' : 'Pedir análise'}
            </button>
          ))}
        </div>

          {panel === 'browse' && (
            <div className="space-y-6">
                {selectedObraId ? (
                  <motion.div
                    key={`detail-${selectedObraId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-6"
                  >
                    <button
                      type="button"
                      onClick={closeObra}
                      className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar ao catálogo
                    </button>

                    <div className="catalog-card-standard catalog-card rounded-2xl overflow-hidden relative">
                      {(selectedEntry?.banner || selectedEntry?.poster) && (
                        <div className="absolute inset-0">
                          <OptimizedImage
                            src={selectedEntry.banner || selectedEntry.poster}
                            alt=""
                            lite
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/50" />
                        </div>
                      )}
                      <div className="relative p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {selectedEntry?.poster && (
                            <div className="hidden sm:block w-24 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-[2/3]">
                              <OptimizedImage
                                src={selectedEntry.poster}
                                alt={selectedEntry.obraTitulo}
                                lite
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 flex-1 min-w-0">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80 mb-1">
                                {tipoLabel(selectedEntry?.tipo || '')}
                              </p>
                              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {selectedEntry?.obraTitulo}
                              </h2>
                              <p className="text-sm text-zinc-400 mt-2">
                                {markersLoading
                                  ? 'Carregando...'
                                  : `${markers.length} momento(s) catalogado(s)`}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              {onSelectObra && (
                                <button
                                  type="button"
                                  onClick={() => onSelectObra(selectedObraId)}
                                  className="px-3 py-2 rounded-xl text-xs font-bold border border-neutral-700 text-zinc-300 hover:border-cyan-500/40 hover:text-white"
                                >
                                  Ver reacts
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSubmitObraId(selectedObraId);
                                  setPanel('submit');
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-bold border border-neutral-700 text-zinc-300 hover:border-cyan-500/40 hover:text-white"
                              >
                                Contribuir
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {markersLoading ? (
                      <div className="flex justify-center py-16 text-zinc-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Carregando minutagem...
                      </div>
                    ) : markers.length === 0 ? (
                      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-8 text-center space-y-4">
                        <Clock className="w-10 h-10 mx-auto text-zinc-600" />
                        <p className="text-sm text-zinc-400">Ainda não há minutagem para este título.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setRequestTitulo(selectedEntry?.obraTitulo || '');
                            setPanel('request');
                          }}
                          className="text-sm font-bold text-cyan-400 hover:underline"
                        >
                          Pedir análise completa
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {markers.map((m) => (
                          <MinutagemMarkerCard key={m.id} marker={m} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-8 minutagem-catalog-panel">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar filme, série ou anime..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-white placeholder:text-zinc-600 focus:border-cine-accent/40 focus:outline-none transition-colors duration-300"
                      />
                    </div>

                    {catalogLoading ? (
                      <div className="flex justify-center py-16 text-zinc-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Carregando catálogo...
                      </div>
                    ) : catalogWithMarkers.length === 0 ? (
                      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-10 text-center text-zinc-500 text-sm">
                        Nenhum título com minutagem encontrado.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-end justify-between gap-3 px-0.5">
                          <p className="text-xs sm:text-sm text-zinc-500">
                            <span className="font-bold text-zinc-300">{catalogWithMarkers.length}</span>
                            título{catalogWithMarkers.length !== 1 ? 's' : ''} com minutagem
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 minutagem-catalog-grid">
                          {catalogWithMarkers.map((entry) => (
                            <ObraCatalogCard
                              key={entry.obraId}
                              entry={entry}
                              onClick={() => openObra(entry.obraId)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {catalogWithoutMarkers.length > 0 && (
                      <section className="catalog-card-standard rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowPendingCatalog((v) => !v)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
                        >
                          <div>
                            <p className="text-sm font-bold text-zinc-300">Sem minutagem catalogada</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {catalogWithoutMarkers.length} título(s) — peça análise ao admin
                            </p>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${showPendingCatalog ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {showPendingCatalog && (
                          <div className="px-4 pb-4 grid grid-cols-3 gap-3 sm:gap-4 border-t border-cine-border/25 pt-4">
                            {catalogWithoutMarkers.map((c) => (
                              <button
                                key={c.obraId}
                                type="button"
                                onClick={() => {
                                  setRequestTitulo(c.obraTitulo);
                                  setPanel('request');
                                }}
                                className="text-left px-3 py-2.5 rounded-xl border border-neutral-800/80 bg-black/20 text-sm text-zinc-400 hover:border-cyan-500/30 hover:text-white transition-colors"
                              >
                                <span className="line-clamp-2">{c.obraTitulo}</span>
                                <span className="text-[10px] uppercase text-zinc-600 mt-1 block">
                                  Solicitar análise
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}
            </div>
          )}

          {panel === 'submit' && (
            <div className="max-w-xl mx-auto catalog-card-standard rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 text-amber-200/90">
                <Plus className="w-5 h-5" />
                <h2 className="font-bold">Cadastrar minutagem (fã)</h2>
              </div>
              <p className="text-sm text-zinc-400">
                Informe o filme/série, o tipo de cena e o minuto exato. Após enviar, a informação vai para
                análise do administrador antes de aparecer no site.
              </p>

              {!user.isLoggedIn ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cine-accent text-black font-black"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar para contribuir
                </button>
              ) : (
                <>
                  {me.data?.pendingSubmission && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-100 text-sm">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      Você já tem uma contribuição em análise para &quot;{me.data.pendingSubmission.obraTitulo}&quot;.
                    </div>
                  )}

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Filme / série</span>
                    <select
                      value={submitObraId || selectedObraId || ''}
                      onChange={(e) => setSubmitObraId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white"
                    >
                      <option value="">Selecione...</option>
                      {catalog.map((c) => (
                        <option key={c.obraId} value={c.obraId}>
                          {c.obraTitulo} ({c.tipo})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Tipo de conteúdo</span>
                    <select
                      value={submitTipo}
                      onChange={(e) => setSubmitTipo(e.target.value as MinutagemContentType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white"
                    >
                      {(Object.keys(MINUTAGEM_CONTENT_LABELS) as MinutagemContentType[]).map((k) => (
                        <option key={k} value={k}>{MINUTAGEM_CONTENT_LABELS[k]}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Nome / descrição do momento</span>
                    <input
                      type="text"
                      value={submitLabel}
                      onChange={(e) => setSubmitLabel(e.target.value)}
                      placeholder="Ex: Cena no quarto, beijo na piscina..."
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Minutagem</span>
                      <input
                        type="text"
                        value={submitMinutagem}
                        onChange={(e) => setSubmitMinutagem(e.target.value)}
                        placeholder="45 ou 1:23"
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white font-mono"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Episódio (opcional)</span>
                      <input
                        type="number"
                        min={1}
                        value={submitEpisodio}
                        onChange={(e) => setSubmitEpisodio(e.target.value)}
                        placeholder="Só séries"
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white"
                      />
                    </label>
                  </div>

                  {me.error && (
                    <p className="text-sm text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {me.error}
                    </p>
                  )}
                  {submitSuccess && (
                    <p className="text-sm text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Enviado! Aguarde aprovação do admin.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={me.submitting || !!me.data?.pendingSubmission}
                    onClick={handleSubmitMarker}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cine-accent text-black font-black disabled:opacity-50"
                  >
                    {me.submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar para análise
                  </button>
                </>
              )}
            </div>
          )}

          {panel === 'request' && (
            <div className="max-w-xl mx-auto catalog-card-standard rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 text-cyan-200">
                <Search className="w-5 h-5" />
                <h2 className="font-bold">Pedir análise completa</h2>
              </div>
              <p className="text-sm text-zinc-400">
                Não encontrou o filme ou a minutagem? Solicite que o admin catalogue o título. Você recebe
                notificação quando estiver pronto.
              </p>

              {!user.isLoggedIn ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cine-accent text-black font-black"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar para solicitar
                </button>
              ) : (
                <>
                  {me.data?.pendingAnalysis && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-100 text-sm">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      Pedido em andamento: &quot;{me.data.pendingAnalysis.obraTitulo}&quot;.
                    </div>
                  )}

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Nome do filme / série</span>
                    <input
                      type="text"
                      value={requestTitulo}
                      onChange={(e) => setRequestTitulo(e.target.value)}
                      placeholder="Ex: Matrix, Breaking Bad..."
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Tipo</span>
                    <select
                      value={requestTipo}
                      onChange={(e) => setRequestTipo(e.target.value as 'filme' | 'serie' | 'anime')}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white"
                    >
                      <option value="filme">Filme</option>
                      <option value="serie">Série</option>
                      <option value="anime">Anime</option>
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Observação (opcional)</span>
                    <textarea
                      value={requestMensagem}
                      onChange={(e) => setRequestMensagem(e.target.value)}
                      rows={3}
                      placeholder="Versão do filme, episódio específico, etc."
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-neutral-800 text-white resize-none"
                    />
                  </label>

                  {me.error && (
                    <p className="text-sm text-rose-400">{me.error}</p>
                  )}
                  {requestSuccess && (
                    <p className="text-sm text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Pedido enviado! O admin catalogará e você será notificado.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={me.submitting || !!me.data?.pendingAnalysis}
                    onClick={handleRequestAnalysis}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 text-black font-black disabled:opacity-50"
                  >
                    {me.submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Solicitar catalogação
                  </button>
                </>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
