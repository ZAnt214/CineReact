import type { Obra } from '../types.ts';
import type { MinutagemMarker } from '../types/minutagem.ts';

/** Artes oficiais via TMDB (poster + backdrop). */
const tmdbPoster = (path: string) => `https://image.tmdb.org/t/p/w500${path}`;
const tmdbBackdrop = (path: string) => `https://image.tmdb.org/t/p/w1280${path}`;

/** IDs de obras com dados fictícios de exemplo — removidos na sincronização. */
export const LEGACY_FAKE_MINUTAGEM_OBRA_IDS = ['harry-potter', 'the-last-of-us', 'one-piece'];

export const MINUTAGEM_CATALOG_OBRA_IDS = [
  'lobo-wall-street-2013',
  'psicopata-americano-2000',
  'eu-eu-mesmo-e-irene-2000',
  'mad-max-fury-road-2015',
  'deadpool-2016',
  'the-boys',
  'pacificador',
  'la-casa-de-papel',
  'peaky-blinders',
] as const;

type RawEntry = {
  inicio: string;
  fim: string;
  duracao: string;
  descricao: string;
  episodio?: string;
};

type RawObra = {
  id: string;
  titulo: string;
  tipo: 'filme' | 'serie';
  ano: number;
  poster: string;
  banner: string;
  entries: RawEntry[];
};

function parseHms(hms: string): { minutos: number; segundos: number } {
  const [h, m, s] = hms.split(':').map(Number);
  return { minutos: h * 60 + m, segundos: s };
}

function parseDuracao(raw: string): number {
  const t = raw.trim().toLowerCase();
  const hm = t.match(/^(\d+)m(\d+)s$/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const sec = t.match(/^(\d+)s$/);
  if (sec) return Number(sec[1]);
  return 0;
}

function parseEpisodioLabel(label: string): { episodioLabel: string; episodioNum: number } {
  const m = label.match(/S(\d+)E(\d+)/i);
  if (!m) return { episodioLabel: label, episodioNum: 0 };
  return { episodioLabel: label.toUpperCase(), episodioNum: Number(m[2]) };
}

function inferTipo(descricao: string): MinutagemMarker['tipoConteudo'] {
  const d = descricao.toLowerCase();
  if (d.includes('nua') || d.includes('nudez') || d.includes('topless')) return 'nude';
  return 'sexo';
}

function markerSeedId(obraId: string, entry: RawEntry): string {
  const ep = entry.episodio ? entry.episodio.replace(/\W/g, '') : 'film';
  const start = entry.inicio.replace(/:/g, '');
  return `mm-catalog-${obraId}-${ep}-${start}`;
}

const RAW_CATALOG: RawObra[] = [
  {
    id: 'lobo-wall-street-2013',
    titulo: 'O Lobo de Wall Street (2013)',
    tipo: 'filme',
    ano: 2013,
    poster: tmdbPoster('/34mXrPGJUEwlIboSwLDxtHvZTCA.jpg'),
    banner: tmdbBackdrop('/p2RyD15OcEOWBG3QvgOYMLKxiT.jpg'),
    entries: [
      { inicio: '00:03:01', fim: '00:03:28', duracao: '27s', descricao: 'Natalie vira o copo enquanto Leo cheira cocaína em suas nádegas.' },
      { inicio: '00:48:16', fim: '00:48:35', duracao: '19s', descricao: 'Cena no escritório: Jaclyn dança de lingerie enquanto Krista mostra os seios durante cena de sexo com funcionários.' },
      { inicio: '01:00:17', fim: '01:00:33', duracao: '16s', descricao: 'O mamilo esquerdo de Margot Robbie aparece rapidamente enquanto Leo cheira cocaína em seu decote.' },
      { inicio: '01:36:14', fim: '01:37:22', duracao: '1m08s', descricao: 'Margot Robbie aparece com nudez frontal no quarto provocando Leo.' },
      { inicio: '01:48:19', fim: '01:49:30', duracao: '1m11s', descricao: 'Cena sobre a pilha de dinheiro com Margot Robbie (seios à mostra) e Katarina Čas.' },
      { inicio: '02:31:19', fim: '02:31:39', duracao: '20s', descricao: 'Katarina Čas abre as portas do quarto e faz uma dança completamente nua para Jean Dujardin.' },
    ],
  },
  {
    id: 'psicopata-americano-2000',
    titulo: 'Psicopata Americano (2000)',
    tipo: 'filme',
    ano: 2000,
    poster: tmdbPoster('/1Rx39rH8YJdOO1mxhBvgyN2ob4.jpg'),
    banner: tmdbBackdrop('/67S99FpFWfECMcofhnkuYBfvoOS.jpg'),
    entries: [
      { inicio: '00:01:00', fim: '00:01:54', duracao: '54s', descricao: 'Samantha desliza muito rápido mostrando parte do mamilo direito ao pular da cama.' },
      { inicio: '00:42:38', fim: '00:44:11', duracao: '1m33s', descricao: 'Cara passa a perna por cima do ombro de forma sensual e se ajoelha, enquanto Krista dança de roupa íntima ao som de Phil Collins.' },
      { inicio: '00:43:55', fim: '00:44:56', duracao: '1m01s', descricao: 'Ménage à trois com Christian Bale, Cara e Krista Sutton, mostrando vislumbre de nádegas.' },
      { inicio: '00:45:10', fim: '00:45:32', duracao: '22s', descricao: 'Vislumbre do seio direito e nádegas de Krista saindo da cama enquanto Bale se prepara para usar brinquedos.' },
      { inicio: '01:13:59', fim: '01:15:14', duracao: '1m15s', descricao: 'Seios à mostra na cama pouco antes de Gwen ser atacada na cama.' },
    ],
  },
  {
    id: 'eu-eu-mesmo-e-irene-2000',
    titulo: 'Eu, Eu Mesmo e Irene (2000)',
    tipo: 'filme',
    ano: 2000,
    poster: tmdbPoster('/hxDCGMDKuT2gzL8aTseqVvGuxl.jpg'),
    banner: tmdbBackdrop('/3nRGIBy4FYAR9N4080cpm0RFrK.jpg'),
    entries: [
      { inicio: '00:21:09', fim: '00:21:29', duracao: '20s', descricao: 'Jim Carrey segue o exemplo do bebê amamentando no seio de Shannon Whirry, exibindo brevemente parte da aréola.' },
    ],
  },
  {
    id: 'mad-max-fury-road-2015',
    titulo: 'Mad Max: Estrada da Fúria (2015)',
    tipo: 'filme',
    ano: 2015,
    poster: tmdbPoster('/hA2ple9q4qnwxp3hKVNhroipsir.jpg'),
    banner: tmdbBackdrop('/tbhdm8UJAb4ViCTsLPdg2uRXwH.jpg'),
    entries: [
      { inicio: '01:18:00', fim: '01:19:13', duracao: '1m13s', descricao: 'Megan Gale (A Valquíria) aparece sem roupas em uma torre e exibe as nádegas enquanto desce até o chão.' },
    ],
  },
  {
    id: 'deadpool-2016',
    titulo: 'Deadpool (2016)',
    tipo: 'filme',
    ano: 2016,
    poster: tmdbPoster('/8s8Djy7Rm48Ge8kjazJTiitNGI5.jpg'),
    banner: tmdbBackdrop('/inAqp3eWs9r9jQpUKIKoH18WG6.jpg'),
    entries: [
      { inicio: '00:24:00', fim: '00:25:14', duracao: '1m14s', descricao: 'Flash rápido dos seios e da região pubiana de Morena Baccarin no início da sequência íntima com Ryan Reynolds.' },
    ],
  },
  {
    id: 'the-boys',
    titulo: 'The Boys',
    tipo: 'serie',
    ano: 2019,
    poster: tmdbPoster('/stTEycfG9928HYGEISBFaG1ngzM.jpg'),
    banner: tmdbBackdrop('/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg'),
    entries: [
      { episodio: 'S01E02', inicio: '00:41:14', fim: '00:41:42', duracao: '28s', descricao: 'Breve aparição do seio esquerdo de Aniko durante cena de sexo, antes de se transformar em outra pessoa.' },
      { episodio: 'S02E05', inicio: '00:57:06', fim: '00:58:52', duracao: '1m46s', descricao: 'Cena de sexo com Aya Cash (Stormfront), exibindo decote acentuado e nudez parcial (nádegas).' },
      { episodio: 'S02E07', inicio: '00:08:10', fim: '00:08:15', duracao: '05s', descricao: 'Chloe mostra os seios e aparece nua de costas em um vídeo.' },
      { episodio: 'S02E07', inicio: '00:09:36', fim: '00:10:00', duracao: '24s', descricao: 'Chloe monta em um cara com os seios à mostra em um vídeo.' },
      { episodio: 'S03E06', inicio: '00:40:24', fim: '00:40:29', duracao: '05s', descricao: 'Erin Moriarty (Starlight) se teletransporta nua ao lado de Jack Quaid perto de um carro (revela nádegas).' },
      { episodio: 'S03E07', inicio: '00:03:30', fim: '00:03:53', duracao: '23s', descricao: 'Cena de ménage à trois com Soldier Boy e duas mulheres, interrompida antes do ato começar.' },
      { episodio: 'S04E07', inicio: '00:57:15', fim: '00:57:41', duracao: '26s', descricao: 'Erin Moriarty em cena no sofá com Jack Quaid (visão das nádegas e seio direito ao sair da cama).' },
      { episodio: 'S04E08', inicio: '00:05:20', fim: '00:05:28', duracao: '08s', descricao: 'Visão rápida do traseiro e seios de Erin Moriarty ao sair correndo da cama de Jack Quaid.' },
      { episodio: 'S05E02', inicio: '00:10:34', fim: '00:11:55', duracao: '1m21s', descricao: 'Karen Fukuhara (Kimiko) em cena de intimidade com Tomer Capone (Frenchie), revelando nádegas.' },
    ],
  },
  {
    id: 'pacificador',
    titulo: 'Pacificador (Peacemaker)',
    tipo: 'serie',
    ano: 2022,
    poster: tmdbPoster('/6LISnd63OYJb2aQWSr6msy8wvqR.jpg'),
    banner: tmdbBackdrop('/xHrp2bh73FjwBRScLl9w0ZHNTeH.jpg'),
    entries: [
      { episodio: 'S01E01', inicio: '00:36:44', fim: '00:36:52', duracao: '08s', descricao: 'Os seios de Crystal roubam a cena durante sexo com John Cena.' },
      { episodio: 'S01E02', inicio: '00:36:21', fim: '00:36:51', duracao: '30s', descricao: 'Alison aproveita um momento de topless dividindo um baseado com John Cena e o Vigilante.' },
      { episodio: 'S01E06', inicio: '00:35:48', fim: '00:36:15', duracao: '27s', descricao: 'Jen Znack deitada nua na cama, levanta-se completamente nua vestindo apenas uma máscara.' },
      { episodio: 'S02E01', inicio: '00:23:00', fim: '00:24:16', duracao: '1m16s', descricao: 'Orgia na casa do Pacificador com várias mulheres nuas enquanto John Cena cheira cocaína.' },
      { episodio: 'S02E02', inicio: '00:15:38', fim: '00:15:52', duracao: '14s', descricao: 'Elliot Frances Flynn mostra os seios em meio à bagunça da manhã seguinte.' },
      { episodio: 'S02E02', inicio: '00:21:22', fim: '00:22:27', duracao: '1m05s', descricao: 'Elliot Frances Flynn sai nua do banheiro ajudando outras mulheres a saírem da casa.' },
      { episodio: 'S02E03', inicio: '00:09:50', fim: '00:10:02', duracao: '12s', descricao: 'Sarah exibe seus mamilos com piercings para John Cena.' },
    ],
  },
  {
    id: 'la-casa-de-papel',
    titulo: 'La Casa de Papel',
    tipo: 'serie',
    ano: 2017,
    poster: tmdbPoster('/g0GFAA123V5A89GnCIQUVLmZtah.jpg'),
    banner: tmdbBackdrop('/56v2K8BlMEbTuIsmH2myT8+2Aer.jpg'),
    entries: [
      { episodio: 'S01E01', inicio: '00:25:30', fim: '00:26:07', duracao: '37s', descricao: 'Um cara puxa o decote de Alison Parker expondo seu seio esquerdo antes dela se afastar.' },
      { episodio: 'S01E10', inicio: '00:41:00', fim: '00:41:40', duracao: '40s', descricao: 'Ariadna tira a blusa no escritório expondo os seios para um homem.' },
      { episodio: 'S01E11', inicio: '00:32:40', fim: '00:33:56', duracao: '1m16s', descricao: 'Mónica Gaztambide tira a blusa e revela os seios durante momento íntimo.' },
      { episodio: 'S01E12', inicio: '00:17:15', fim: '00:17:30', duracao: '15s', descricao: 'Mónica Gaztambide exibe parcialmente os seios durante cena de sexo dentro do cofre.' },
      { episodio: 'S03E07', inicio: '00:28:50', fim: '00:30:31', duracao: '1m41s', descricao: 'Tóquio faz striptease na banheira exibindo seios e nádegas de fio dental.' },
      { episodio: 'S03E07', inicio: '00:34:40', fim: '00:36:07', duracao: '1m27s', descricao: 'Lisboa tira o roupão revelando lingerie sexy e vislumbre rápido dos seios na cama.' },
    ],
  },
  {
    id: 'peaky-blinders',
    titulo: 'Peaky Blinders',
    tipo: 'serie',
    ano: 2013,
    poster: tmdbPoster('/vJjopYJorgeJYWFwGROkpcbzIYc.jpg'),
    banner: tmdbBackdrop('/6PX0r5TRRU5p0edZRNd0sCPMEgd.jpg'),
    entries: [
      { episodio: 'S01E05', inicio: '00:46:00', fim: '00:47:42', duracao: '1m42s', descricao: 'Annabelle Wallis mostra parte dos mamilos durante cena íntima com Cillian Murphy.' },
      { episodio: 'S02E04', inicio: '00:52:15', fim: '00:53:23', duracao: '1m08s', descricao: 'Vislumbre rápido do seio esquerdo de May Carleton ao tirar a camisola.' },
      { episodio: 'S03E01', inicio: '00:51:23', fim: '00:51:57', duracao: '34s', descricao: 'Aparição rápida dos seios de Annabelle Wallis em cena na cama com Cillian Murphy.' },
      { episodio: 'S03E04', inicio: '00:20:09', fim: '00:20:35', duracao: '26s', descricao: 'Princesa Tatiana Petrovna aparece usando lingerie transparente.' },
      { episodio: 'S03E04', inicio: '00:24:24', fim: '00:25:58', duracao: '1m34s', descricao: 'Princesa Tatiana Petrovna tira a blusa exibindo os seios antes de tentar provocar uma briga.' },
      { episodio: 'S03E05', inicio: '00:28:18', fim: '00:28:42', duracao: '24s', descricao: 'Mulher com os seios à mostra entretendo homens no recinto.' },
      { episodio: 'S03E05', inicio: '00:42:41', fim: '00:44:50', duracao: '2m09s', descricao: 'Princesa Tatiana Petrovna tira o vestido e fica completamente nua diante de Tommy Shelby.' },
      { episodio: 'S04E06', inicio: '00:52:06', fim: '00:52:44', duracao: '38s', descricao: 'Breves visões do peito e lateral da nádega de Jessie Eden na cama com Cillian Murphy.' },
    ],
  },
];

export const MINUTAGEM_CATALOG_OBRAS: Obra[] = RAW_CATALOG.map((raw) => ({
  id: raw.id,
  titulo: raw.titulo,
  tipo: raw.tipo,
  ano: raw.ano,
  generos: raw.tipo === 'filme' ? ['Filme'] : ['Série'],
  sinopse: 'Catálogo de minutagem para streamers — conteúdo sensível catalogado pela equipe.',
  banner: raw.banner,
  poster: raw.poster,
  trailerUrl: '',
}));

export const MINUTAGEM_CATALOG_MARKERS: MinutagemMarker[] = RAW_CATALOG.flatMap((raw) =>
  raw.entries.map((entry) => {
    const inicio = parseHms(entry.inicio);
    const fim = parseHms(entry.fim);
    const ep = entry.episodio ? parseEpisodioLabel(entry.episodio) : null;
    return {
      id: markerSeedId(raw.id, entry),
      obraId: raw.id,
      obraTitulo: raw.titulo,
      tipoConteudo: inferTipo(entry.descricao),
      label: entry.descricao,
      minutos: inicio.minutos,
      segundos: inicio.segundos,
      fimMinutos: fim.minutos,
      fimSegundos: fim.segundos,
      duracaoSegundos: parseDuracao(entry.duracao),
      episodioLabel: ep?.episodioLabel,
      episodioNum: ep?.episodioNum || undefined,
      source: 'admin' as const,
      approvedByEmail: 'mateusvini.t10@gmail.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
  })
);

/** @deprecated use MINUTAGEM_CATALOG_MARKERS */
export const MINUTAGEM_SEED_MARKERS = MINUTAGEM_CATALOG_MARKERS;
