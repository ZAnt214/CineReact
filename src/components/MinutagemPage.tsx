import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Film,
  Loader2,
  LogIn,
  Plus,
  Search,
  Send,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import type { UserState } from '../types.ts';
import {
  MINUTAGEM_CONTENT_LABELS,
  type MinutagemContentType,
} from '../types/minutagem.ts';
import {
  useMinutagemCatalog,
  useMinutagemMarkers,
  useMinutagemMe,
} from '../hooks/useMinutagem.ts';
import {
  contentTypeBadgeClass,
  contentTypeLabel,
  formatMinutagem,
} from '../minutagem/utils.ts';

interface MinutagemPageProps {
  user: UserState;
  onOpenAuth: () => void;
  onSelectObra?: (obraId: string) => void;
}

type PanelMode = 'browse' | 'submit' | 'request';

export default function MinutagemPage({ user, onOpenAuth, onSelectObra }: MinutagemPageProps) {
  const { catalog, loading: catalogLoading } = useMinutagemCatalog();
  const [search, setSearch] = useState('');
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelMode>('browse');

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

  const catalogWithMarkers = filteredCatalog.filter((c) => c.markerCount > 0);
  const catalogWithoutMarkers = filteredCatalog.filter((c) => c.markerCount === 0);

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
    <div className="min-h-screen w-full bg-[#07090f]">
      <div className="cine-container pt-20 pb-28">
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-neutral-900/80 text-cyan-100 text-[11px] font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-cyan-300" />
              Ferramenta para streamers
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Minutagem de conteúdo sensível
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Consulte em que minuto exato de um filme ou série aparece nudez ou cenas de sexo — ideal
              para reagir com segurança ao vivo. Fãs podem contribuir; tudo passa por análise antes de
              publicar.
            </p>
          </section>

          <div className="flex flex-wrap gap-2 justify-center">
            {(['browse', 'submit', 'request'] as PanelMode[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPanel(id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${
                  panel === id
                    ? 'bg-cine-accent-light text-black border-cine-accent-light'
                    : 'bg-neutral-900/60 text-zinc-400 border-neutral-800 hover:border-cyan-500/30 hover:text-white'
                }`}
              >
                {id === 'browse' ? 'Consultar' : id === 'submit' ? 'Contribuir' : 'Pedir análise'}
              </button>
            ))}
          </div>

          {panel === 'browse' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar filme, série ou anime..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-zinc-600 focus:border-cyan-500/40 focus:outline-none"
                />
              </div>

              {catalogLoading ? (
                <div className="flex justify-center py-16 text-zinc-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando catálogo...
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Film className="w-4 h-4 text-cyan-400" />
                      Com minutagem catalogada
                    </h2>
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {catalogWithMarkers.length === 0 && (
                        <p className="text-sm text-zinc-500 py-4">Nenhum título com minutagem ainda.</p>
                      )}
                      {catalogWithMarkers.map((entry) => (
                        <button
                          key={entry.obraId}
                          type="button"
                          onClick={() => setSelectedObraId(entry.obraId)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selectedObraId === entry.obraId
                              ? 'border-cyan-500/40 bg-cyan-500/10'
                              : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-white truncate">{entry.obraTitulo}</span>
                            <span className="text-[10px] font-bold uppercase text-cyan-300 shrink-0">
                              {entry.markerCount} avisos
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500">{entry.tipo}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 min-h-[280px]">
                    {!selectedObraId ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12 text-zinc-500">
                        <Clock className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm">Selecione um título para ver os momentos catalogados.</p>
                      </div>
                    ) : markersLoading ? (
                      <div className="flex justify-center py-12 text-zinc-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : markers.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500">
                        <p className="text-sm">Sem marcadores para {selectedEntry?.obraTitulo}.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitObraId(selectedObraId);
                            setPanel('request');
                          }}
                          className="mt-4 text-cyan-400 text-sm font-bold hover:underline"
                        >
                          Pedir análise deste título
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-white">{selectedEntry?.obraTitulo}</h3>
                            <p className="text-xs text-zinc-500">{markers.length} momento(s) catalogado(s)</p>
                          </div>
                          {onSelectObra && (
                            <button
                              type="button"
                              onClick={() => onSelectObra(selectedObraId)}
                              className="text-xs font-bold text-cyan-400 hover:underline shrink-0"
                            >
                              Ver reacts
                            </button>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {markers.map((m) => (
                            <li
                              key={m.id}
                              className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-neutral-800/80"
                            >
                              <span className="font-mono text-sm font-bold text-cyan-300 shrink-0 tabular-nums">
                                {formatMinutagem(m.minutos, m.segundos)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span
                                  className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border mb-1 ${contentTypeBadgeClass(m.tipoConteudo)}`}
                                >
                                  {contentTypeLabel(m.tipoConteudo)}
                                </span>
                                <p className="text-sm text-zinc-200">{m.label}</p>
                                {m.episodioNum && (
                                  <p className="text-xs text-zinc-500 mt-0.5">Ep. {m.episodioNum}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {catalogWithoutMarkers.length > 0 && (
                <div className="rounded-xl border border-neutral-800/60 bg-neutral-950/30 p-4">
                  <p className="text-xs text-zinc-500 mb-2 uppercase font-bold tracking-wider">
                    Sem minutagem ainda ({catalogWithoutMarkers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {catalogWithoutMarkers.slice(0, 12).map((c) => (
                      <button
                        key={c.obraId}
                        type="button"
                        onClick={() => {
                          setRequestTitulo(c.obraTitulo);
                          setPanel('request');
                        }}
                        className="text-xs px-3 py-1 rounded-full border border-neutral-800 text-zinc-400 hover:border-cyan-500/30 hover:text-white"
                      >
                        {c.obraTitulo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {panel === 'submit' && (
            <div className="max-w-xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 space-y-5">
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
            <div className="max-w-xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 space-y-5">
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
    </div>
  );
}
