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
import { motion, AnimatePresence } from 'motion/react';
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
  index = 0,
}: {
  entry: MinutagemCatalogEntry;
  onClick: () => void;
  index?: number;
}) {
  const Icon = entry.tipo === 'filme' ? Film : Tv;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(index * 0.04, 0.24) }}
      onClick={onClick}
      className="catalog-card-standard catalog-card rounded-2xl overflow-hidden cursor-pointer group/card flex flex-col h-full md:select-none text-left w-full"
    >
      <div className="relative aspect-3/4 w-full overflow-hidden shrink-0 catalog-card-thumb catalog-card-standard-thumb bg-neutral-950">
        {entry.poster ? (
          <OptimizedImage
            src={entry.poster}
            alt={entry.obraTitulo}
            lite
            loading={index < 6 ? 'eager' : 'lazy'}
            className="w-full h-full object-cover md:group-hover/card:scale-[1.03] md:transition-transform md:duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-cine-accent-light/50">
            <Icon className="w-10 h-10" />
          </div>
        )}

        {entry.markerCount > 0 && (
          <span className="absolute top-2.5 right-2.5 z-20 catalog-card-duration shadow-md text-[10px] font-bold uppercase tracking-wide">
            {entry.markerCount} aviso{entry.markerCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-3.5 sm:p-4 flex flex-col gap-2 catalog-card-standard-body">
        <span className="text-[9px] uppercase font-mono bg-neutral-800/50 backdrop-blur-xs px-1.5 py-0.5 rounded text-zinc-400 self-start">
          {tipoLabel(entry.tipo)}
        </span>
        <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug min-h-[2.5rem] md:group-hover/card:text-cine-accent-light transition-colors">
          {entry.obraTitulo}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pt-1 border-t border-cine-border/25">
          Ver minutagem
        </p>
      </div>
    </motion.button>
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

  const groupedWithMarkers = useMemo(() => {
    const groups: Record<string, MinutagemCatalogEntry[]> = {};
    for (const entry of catalogWithMarkers) {
      const key = entry.tipo || 'outro';
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [catalogWithMarkers]);

  const openObra = (obraId: string) => {
    setSelectedObraId(obraId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="w-full flex-1">
      <div className="cine-container pt-24 pb-20 space-y-8">
        <header className="relative pt-2 pb-2 md:pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">
            Reage ao vivo sem sustinho
          </p>
          <h1 className="font-display text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-bold leading-snug tracking-tight text-white mt-1">
            O minuto certo{' '}
            <span className="text-cine-accent-light">antes da cena</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-2xl">
            Catálogo da comunidade: onde pausar, pular ou cortar. Toque no poster e abre a minutagem
            completa do filme ou série.
          </p>
          <div
            className="mt-4 h-px bg-gradient-to-r from-cine-accent/25 via-neutral-800/80 to-transparent"
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
              <AnimatePresence mode="wait">
                {selectedObraId ? (
                  <motion.div
                    key={`detail-${selectedObraId}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
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
                  <motion.div
                    key="catalog"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="space-y-8"
                  >
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
                      <div className="space-y-10">
                        {groupedWithMarkers.map(([tipo, entries]) => (
                          <section key={tipo} className="catalog-row space-y-3.5">
                            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white uppercase tracking-wider font-sans leading-none">
                              {tipoLabel(tipo)}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {entries.map((entry, index) => (
                                <ObraCatalogCard
                                  key={entry.obraId}
                                  entry={entry}
                                  index={index}
                                  onClick={() => openObra(entry.obraId)}
                                />
                              ))}
                            </div>
                          </section>
                        ))}
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
                          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-cine-border/25 pt-4">
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
                  </motion.div>
                )}
              </AnimatePresence>
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
