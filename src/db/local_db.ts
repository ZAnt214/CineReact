import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Obra, ReactVideo, Comentario, ListaPersonalizada, Notificacao, UserAccount } from '../types.ts';
import { OBRAS_INICIAIS, VIDEOS_INICIAIS } from '../data.ts';

const DB_PATH = path.join(process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd(), 'db_cine_react.json');

interface DbSchema {
  obras: Obra[];
  reacts: ReactVideo[];
  comentarios: Comentario[];
  favoritos: { usuarioEmail: string; obraId: string }[];
  canaisSeguidos: { usuarioEmail: string; canalNome: string }[];
  listas: ListaPersonalizada[];
  notificacoes: Notificacao[];
  usuarios: UserAccount[];
}

function initDb(): DbSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Auto-migrate to include usuarios if not exists
      if (!parsed.usuarios) {
        parsed.usuarios = [
          {
            id: 'admin',
            username: 'Mateus Vinícius',
            email: 'mateusvini.t10@gmail.com',
            password: 'Zantnoar12',
            createdAt: new Date().toISOString(),
            isAdmin: true
          }
        ];
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
      }

      // Auto-migrate to recommend first 3 videos if none recommended
      if (parsed.reacts && parsed.reacts.length > 0) {
        const hasRecomendados = parsed.reacts.some((r: any) => r.isRecomendado);
        if (!hasRecomendados) {
          parsed.reacts.slice(0, 3).forEach((r: any) => {
            r.isRecomendado = true;
          });
          fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        }
      }

      return parsed;
    }
  } catch (error) {
    console.error('Erro ao ler banco de dados local, reiniciando:', error);
  }

  const initialDb: DbSchema = {
    obras: [...OBRAS_INICIAIS],
    reacts: [...VIDEOS_INICIAIS],
    comentarios: [
      {
        id: '1',
        obraId: 'harry-potter',
        usuarioNome: 'Mateus Vinicius',
        usuarioEmail: 'mateusvini.t10@gmail.com',
        texto: 'Casimiro assistindo Harry Potter é simplesmente épico! Dei muita risada.',
        nota: 5,
        criadoEm: new Date().toISOString()
      },
      {
        id: '2',
        obraId: 'the-last-of-us',
        usuarioNome: 'Ana Souza',
        usuarioEmail: 'ana@gmail.com',
        texto: 'A gameplay do Alanzoka é maravilhosa, mas o react do Luan é insano demais!',
        nota: 5,
        criadoEm: new Date().toISOString()
      }
    ],
    favoritos: [],
    canaisSeguidos: [],
    listas: [],
    notificacoes: [],
    usuarios: [
      {
        id: 'admin',
        username: 'Mateus Vinícius',
        email: 'mateusvini.t10@gmail.com',
        password: 'Zantnoar12',
        createdAt: new Date().toISOString(),
        isAdmin: true
      }
    ]
  };

  saveDb(initialDb);
  return initialDb;
}

function saveDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar banco de dados local:', error);
  }
}

let dbCache = initDb();

// Supabase Client lazy setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
let supabaseClient: any = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "" && supabaseAnonKey !== "") {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    console.log("[Supabase] Cliente inicializado com sucesso.");
  } catch (err) {
    console.error("[Supabase] Erro ao inicializar cliente:", err);
  }
}

export const localDb = {
  // Supabase Connection Check
  isSupabaseActive: () => {
    return !!supabaseClient;
  },

  getSupabaseClient: () => {
    return supabaseClient;
  },

  // Pull data from Supabase and refresh the memory cache
  syncFromSupabase: async () => {
    if (!supabaseClient) return false;
    try {
      console.log("[Supabase] Sincronizando dados do Supabase...");
      
      const { data: obras, error: errObras } = await supabaseClient.from('obras').select('*');
      const { data: reacts, error: errReacts } = await supabaseClient.from('reacts').select('*');
      const { data: comentarios, error: errComentarios } = await supabaseClient.from('comentarios').select('*');
      const { data: favoritos, error: errFavoritos } = await supabaseClient.from('favoritos').select('*');
      const { data: canaisSeguidos, error: errCanaisSeguidos } = await supabaseClient.from('canais_seguidos').select('*');
      const { data: listas, error: errListas } = await supabaseClient.from('listas').select('*');
      const { data: notificacoes, error: errNotificacoes } = await supabaseClient.from('notificacoes').select('*');
      const { data: usuarios, error: errUsuarios } = await supabaseClient.from('usuarios').select('*');

      if (errObras || errReacts || errComentarios || errUsuarios) {
        console.error("[Supabase] Erro ao buscar dados do Supabase. Verifique se as tabelas existem.", {
          errObras, errReacts, errComentarios, errUsuarios
        });
        return false;
      }

      // If remote Supabase is completely empty, upload local data automatically!
      if (obras.length === 0 && reacts.length === 0) {
        console.log("[Supabase] Banco de dados Supabase vazio. Enviando dados locais...");
        await localDb.uploadLocalDataToSupabase();
        return true;
      }

      // Otherwise, Supabase is the single source of truth - override local memory cache!
      dbCache.obras = obras || [];
      dbCache.reacts = (reacts || []).map((r: any) => ({
        ...r,
        thumbnailUrl: r.thumbnailUrl || r.thumbnail
      }));
      dbCache.comentarios = comentarios || [];
      dbCache.favoritos = favoritos || [];
      dbCache.canaisSeguidos = canaisSeguidos || [];
      dbCache.listas = (listas || []).map((l: any) => ({
        ...l,
        obraIds: l.obraIds || []
      }));
      dbCache.notificacoes = notificacoes || [];
      dbCache.usuarios = usuarios || [];

      console.log("[Supabase] Sincronização de volta para o cache concluída com sucesso!");
      return true;
    } catch (error) {
      console.error("[Supabase] Falha ao sincronizar dados:", error);
      return false;
    }
  },

  // Export local JSON cache up to Supabase manually
  uploadLocalDataToSupabase: async () => {
    if (!supabaseClient) return false;
    try {
      console.log("[Supabase] Enviando dados do cache local para o Supabase...");

      // 1. Obras
      if (dbCache.obras.length > 0) {
        const { error } = await supabaseClient.from('obras').upsert(
          dbCache.obras.map(o => ({
            id: o.id,
            titulo: o.titulo,
            sinopse: o.sinopse,
            synopsis: o.synopsis || '',
            poster: o.poster,
            banner: o.banner,
            ano: o.ano,
            generos: o.generos || [],
            tipo: o.tipo,
            channelId: o.channelId,
            trailerUrl: o.trailerUrl,
            destacado: !!o.destacado
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nas obras:", error);
      }

      // 2. Reacts
      if (dbCache.reacts.length > 0) {
        const { error } = await supabaseClient.from('reacts').upsert(
          dbCache.reacts.map(r => ({
            id: r.id,
            obraId: r.obraId,
            titulo: r.titulo,
            videoUrl: 'https://www.youtube.com/watch?v=' + r.id,
            thumbnailUrl: r.thumbnailUrl || '',
            duracao: r.duracao,
            canalNome: r.canalNome,
            visualizacoes: r.visualizacoes || 0,
            isRecomendado: !!r.isRecomendado
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos reacts:", error);
      }

      // 3. Comentarios
      if (dbCache.comentarios.length > 0) {
        const { error } = await supabaseClient.from('comentarios').upsert(
          dbCache.comentarios.map(c => ({
            id: c.id,
            obraId: c.obraId,
            usuarioNome: c.usuarioNome,
            usuarioEmail: c.usuarioEmail,
            texto: c.texto,
            nota: c.nota,
            criadoEm: c.criadoEm
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos comentarios:", error);
      }

      // 4. Favoritos
      if (dbCache.favoritos.length > 0) {
        await supabaseClient.from('favoritos').delete().neq('id', 0);
        const { error } = await supabaseClient.from('favoritos').insert(
          dbCache.favoritos.map(f => ({
            usuarioEmail: f.usuarioEmail,
            obraId: f.obraId
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos favoritos:", error);
      }

      // 5. Canais Seguidos
      if (dbCache.canaisSeguidos.length > 0) {
        await supabaseClient.from('canais_seguidos').delete().neq('id', 0);
        const { error } = await supabaseClient.from('canais_seguidos').insert(
          dbCache.canaisSeguidos.map(c => ({
            usuarioEmail: c.usuarioEmail,
            canalNome: c.canalNome
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos canais seguidos:", error);
      }

      // 6. Listas
      if (dbCache.listas.length > 0) {
        const { error } = await supabaseClient.from('listas').upsert(
          dbCache.listas.map(l => ({
            id: l.id,
            nome: l.nome,
            descricao: l.descricao,
            usuarioEmail: l.usuarioEmail,
            obraIds: l.obraIds || []
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nas listas:", error);
      }

      // 7. Notificações
      if (dbCache.notificacoes.length > 0) {
        const { error } = await supabaseClient.from('notificacoes').upsert(
          dbCache.notificacoes.map(n => ({
            id: n.id,
            titulo: n.titulo,
            mensagem: n.mensagem,
            lida: !!n.lida,
            criadoEm: n.criadoEm,
            canalNome: n.canalNome,
            usuarioEmail: n.usuarioEmail
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nas notificacoes:", error);
      }

      // 8. Usuários
      if (dbCache.usuarios.length > 0) {
        const { error } = await supabaseClient.from('usuarios').upsert(
          dbCache.usuarios.map(u => ({
            email: u.email,
            id: u.id,
            username: u.username,
            password: u.password,
            createdAt: u.createdAt,
            avatar: u.avatar,
            isAdmin: !!u.isAdmin,
            isDonor: !!u.isDonor,
            continueWatching: u.continueWatching || []
          }))
        );
        if (error) console.error("[Supabase Upload] Erro nos usuarios:", error);
      }

      console.log("[Supabase] Upload de dados manuais com sucesso!");
      return true;
    } catch (error) {
      console.error("[Supabase] Erro ao enviar dados:", error);
      return false;
    }
  },

  getObras: () => {
    return dbCache.obras;
  },
  
  saveObra: (obra: Obra) => {
    const idx = dbCache.obras.findIndex(o => o.id === obra.id);
    if (idx >= 0) {
      dbCache.obras[idx] = obra;
    } else {
      dbCache.obras.push(obra);
    }
    saveDb(dbCache);

    // Propagate to Supabase background
    if (supabaseClient) {
      supabaseClient.from('obras').upsert({
        id: obra.id,
        titulo: obra.titulo,
        sinopse: obra.sinopse,
        synopsis: obra.synopsis || '',
        poster: obra.poster,
        banner: obra.banner,
        ano: obra.ano,
        generos: obra.generos || [],
        tipo: obra.tipo,
        channelId: obra.channelId,
        trailerUrl: obra.trailerUrl,
        destacado: !!obra.destacado
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar obra:", error);
      });
    }

    return obra;
  },

  deleteObra: (id: string) => {
    dbCache.obras = dbCache.obras.filter(o => o.id !== id);
    dbCache.reacts = dbCache.reacts.filter(r => r.obraId !== id);
    dbCache.comentarios = dbCache.comentarios.filter(c => c.obraId !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('obras').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao deletar obra:", error);
      });
    }
  },

  getReacts: () => {
    return dbCache.reacts;
  },

  saveReact: (react: ReactVideo) => {
    const idx = dbCache.reacts.findIndex(r => r.id === react.id);
    if (idx >= 0) {
      dbCache.reacts[idx] = react;
    } else {
      dbCache.reacts.push(react);
    }
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('reacts').upsert({
        id: react.id,
        obraId: react.obraId,
        titulo: react.titulo,
        videoUrl: 'https://www.youtube.com/watch?v=' + react.id,
        thumbnailUrl: react.thumbnailUrl || '',
        duracao: react.duracao,
        canalNome: react.canalNome,
        visualizacoes: react.visualizacoes || 0,
        isRecomendado: !!react.isRecomendado
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar react:", error);
      });
    }

    return react;
  },

  deleteReact: (id: string) => {
    dbCache.reacts = dbCache.reacts.filter(r => r.id !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('reacts').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao deletar react:", error);
      });
    }
  },

  getComentarios: (obraId?: string) => {
    if (obraId) {
      return dbCache.comentarios.filter(c => c.obraId === obraId);
    }
    return dbCache.comentarios;
  },

  addComentario: (comentario: Comentario) => {
    dbCache.comentarios.push(comentario);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('comentarios').insert({
        id: comentario.id,
        obraId: comentario.obraId,
        usuarioNome: comentario.usuarioNome,
        usuarioEmail: comentario.usuarioEmail,
        texto: comentario.texto,
        nota: comentario.nota,
        criadoEm: comentario.criadoEm
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar comentario:", error);
      });
    }

    return comentario;
  },

  deleteComentario: (id: string) => {
    dbCache.comentarios = dbCache.comentarios.filter(c => c.id !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('comentarios').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao deletar comentario:", error);
      });
    }
  },

  getFavoritos: (email: string) => {
    return dbCache.favoritos.filter(f => f.usuarioEmail === email).map(f => f.obraId);
  },

  toggleFavorito: (email: string, obraId: string) => {
    const idx = dbCache.favoritos.findIndex(f => f.usuarioEmail === email && f.obraId === obraId);
    let favoritado = false;
    if (idx >= 0) {
      dbCache.favoritos.splice(idx, 1);
    } else {
      dbCache.favoritos.push({ usuarioEmail: email, obraId });
      favoritado = true;
    }
    saveDb(dbCache);

    if (supabaseClient) {
      if (favoritado) {
        supabaseClient.from('favoritos').insert({
          usuarioEmail: email,
          obraId: obraId
        }).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao salvar favorito:", error);
        });
      } else {
        supabaseClient.from('favoritos').delete()
          .eq('usuarioEmail', email)
          .eq('obraId', obraId)
          .then(({ error }: any) => {
            if (error) console.error("[Supabase Async] Erro ao deletar favorito:", error);
          });
      }
    }

    return favoritado;
  },

  getCanaisSeguidos: (email: string) => {
    return dbCache.canaisSeguidos.filter(c => c.usuarioEmail === email).map(c => c.canalNome);
  },

  toggleSeguirCanal: (email: string, canalNome: string) => {
    const idx = dbCache.canaisSeguidos.findIndex(c => c.usuarioEmail === email && c.canalNome === canalNome);
    let seguindo = false;
    if (idx >= 0) {
      dbCache.canaisSeguidos.splice(idx, 1);
    } else {
      dbCache.canaisSeguidos.push({ usuarioEmail: email, canalNome });
      seguindo = true;
      
      dbCache.notificacoes.push({
        id: Math.random().toString(36).substring(2),
        titulo: `Canal Seguido: ${canalNome}`,
        mensagem: `Você começou a seguir os reacts do canal ${canalNome}. Você será notificado sobre novos vídeos!`,
        lida: false,
        criadoEm: new Date().toISOString(),
        canalNome,
        usuarioEmail: email
      });
    }
    saveDb(dbCache);

    if (supabaseClient) {
      if (seguindo) {
        supabaseClient.from('canais_seguidos').insert({
          usuarioEmail: email,
          canalNome: canalNome
        }).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao seguir canal:", error);
        });
        
        // Also sync notification
        const lastNotif = dbCache.notificacoes[dbCache.notificacoes.length - 1];
        supabaseClient.from('notificacoes').insert({
          id: lastNotif.id,
          titulo: lastNotif.titulo,
          mensagem: lastNotif.mensagem,
          lida: false,
          criadoEm: lastNotif.criadoEm,
          canalNome: lastNotif.canalNome,
          usuarioEmail: lastNotif.usuarioEmail
        }).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao postar notificacao de canal seguido:", error);
        });
      } else {
        supabaseClient.from('canais_seguidos').delete()
          .eq('usuarioEmail', email)
          .eq('canalNome', canalNome)
          .then(({ error }: any) => {
            if (error) console.error("[Supabase Async] Erro ao deixar de seguir canal:", error);
          });
      }
    }

    return seguindo;
  },

  getSeguidoresDoCanal: (canalNome: string) => {
    const emails = dbCache.canaisSeguidos
      .filter(c => c.canalNome.toLowerCase() === canalNome.toLowerCase())
      .map(c => c.usuarioEmail);
    
    return emails.map(email => {
      const u = (dbCache.usuarios || []).find(user => user.email.toLowerCase() === email.toLowerCase());
      return {
        username: u ? u.username : email.split('@')[0],
        email: email,
        avatar: u ? u.avatar : undefined,
        isDonor: u ? u.isDonor : false
      };
    });
  },

  getListas: (email: string) => {
    return dbCache.listas.filter(l => l.usuarioEmail === email);
  },

  createLista: (lista: Omit<ListaPersonalizada, 'id'>) => {
    const novaLista: ListaPersonalizada = {
      ...lista,
      id: Math.random().toString(36).substring(2)
    };
    dbCache.listas.push(novaLista);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('listas').insert({
        id: novaLista.id,
        nome: novaLista.nome,
        descricao: novaLista.descricao,
        usuarioEmail: novaLista.usuarioEmail,
        obraIds: novaLista.obraIds || []
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar lista:", error);
      });
    }

    return novaLista;
  },

  updateLista: (lista: ListaPersonalizada) => {
    const idx = dbCache.listas.findIndex(l => l.id === lista.id);
    if (idx >= 0) {
      dbCache.listas[idx] = lista;
      saveDb(dbCache);
    }

    if (supabaseClient) {
      supabaseClient.from('listas').upsert({
        id: lista.id,
        nome: lista.nome,
        descricao: lista.descricao,
        usuarioEmail: lista.usuarioEmail,
        obraIds: lista.obraIds || []
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao atualizar lista:", error);
      });
    }

    return lista;
  },

  deleteLista: (id: string) => {
    dbCache.listas = dbCache.listas.filter(l => l.id !== id);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('listas').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao deletar lista:", error);
      });
    }
  },

  getNotificacoes: (email?: string) => {
    if (!email) return [];
    const followedChannels = dbCache.canaisSeguidos
      .filter(c => c.usuarioEmail.toLowerCase() === email.toLowerCase())
      .map(c => c.canalNome);

    return dbCache.notificacoes.filter(n => {
      if (n.usuarioEmail && n.usuarioEmail.toLowerCase() === email.toLowerCase()) {
        return true;
      }
      if (!n.usuarioEmail && n.canalNome && followedChannels.includes(n.canalNome)) {
        return true;
      }
      return false;
    });
  },

  marcarNotificacaoComoLida: (id: string) => {
    const idx = dbCache.notificacoes.findIndex(n => n.id === id);
    if (idx >= 0) {
      dbCache.notificacoes[idx].lida = true;
      saveDb(dbCache);
    }

    if (supabaseClient) {
      supabaseClient.from('notificacoes').update({ lida: true }).eq('id', id).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao marcar notificacao como lida:", error);
      });
    }
  },

  limparNotificacoes: (email?: string) => {
    if (email) {
      dbCache.notificacoes = dbCache.notificacoes.filter(n => {
        if (n.usuarioEmail && n.usuarioEmail.toLowerCase() === email.toLowerCase()) {
          return false;
        }
        return true;
      });
    } else {
      dbCache.notificacoes = [];
    }
    saveDb(dbCache);

    if (supabaseClient) {
      if (email) {
        supabaseClient.from('notificacoes').delete().eq('usuarioEmail', email).then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao limpar notificacoes do usuario:", error);
        });
      } else {
        supabaseClient.from('notificacoes').delete().neq('id', 'dummy').then(({ error }: any) => {
          if (error) console.error("[Supabase Async] Erro ao limpar notificacoes:", error);
        });
      }
    }
  },
  
  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'lida' | 'criadoEm'>) => {
    const nova: Notificacao = {
      ...notificacao,
      id: Math.random().toString(36).substring(2),
      lida: false,
      criadoEm: new Date().toISOString()
    };
    dbCache.notificacoes.unshift(nova);
    saveDb(dbCache);

    if (supabaseClient) {
      supabaseClient.from('notificacoes').insert({
        id: nova.id,
        titulo: nova.titulo,
        mensagem: nova.mensagem,
        lida: false,
        criadoEm: nova.criadoEm,
        canalNome: nova.canalNome,
        usuarioEmail: nova.usuarioEmail
      }).then(({ error }: any) => {
        if (error) console.error("[Supabase Async] Erro ao salvar nova notificacao:", error);
      });
    }

    return nova;
  },

  getUsuarios: () => {
    return dbCache.usuarios || [];
  },

  addUsuario: async (usuario: Omit<UserAccount, 'id' | 'createdAt'>, forcedId?: string) => {
    if (!dbCache.usuarios) dbCache.usuarios = [];
    const novo: UserAccount = {
      ...usuario,
      id: forcedId || Math.random().toString(36).substring(2),
      createdAt: new Date().toISOString()
    };

    if (supabaseClient) {
      const { error } = await supabaseClient.from('usuarios').insert({
        email: novo.email,
        id: novo.id,
        username: novo.username,
        password: novo.password,
        createdAt: novo.createdAt,
        avatar: novo.avatar,
        isAdmin: !!novo.isAdmin,
        isDonor: !!novo.isDonor,
        continueWatching: novo.continueWatching || []
      });
      if (error) {
        console.error("[Supabase Async] Erro ao salvar novo usuario:", error);
        let msg = error.message || "Erro ao salvar no banco Supabase.";
        if (error.code === '42501' || msg.includes('row-level security')) {
          msg = "Erro de RLS (Row Level Security) no Supabase. Por favor, desative o RLS ou configure as políticas para a tabela 'usuarios' no editor SQL do Supabase Dashboard utilizando o script disponível no Painel de Admin.";
        }
        throw new Error(msg);
      }
    }

    dbCache.usuarios.push(novo);
    saveDb(dbCache);

    return novo;
  },

  findUsuarioByEmail: async (email: string) => {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (!error && data) {
          if (!dbCache.usuarios) dbCache.usuarios = [];
          const idx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
          if (idx >= 0) {
            dbCache.usuarios[idx] = data;
          } else {
            dbCache.usuarios.push(data);
          }
          saveDb(dbCache);
          return data;
        }
      } catch (err) {
        console.error("[Supabase] Erro ao buscar usuario por email:", err);
      }
    }

    if (!dbCache.usuarios) dbCache.usuarios = [];
    return dbCache.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUsuarioByEmailSync: (email: string) => {
    if (!dbCache.usuarios) dbCache.usuarios = [];
    return dbCache.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  updateUsuario: async (email: string, updates: Partial<UserAccount>) => {
    if (!dbCache.usuarios) dbCache.usuarios = [];
    const idx = dbCache.usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    let current: UserAccount | null = null;
    
    if (idx >= 0) {
      dbCache.usuarios[idx] = {
        ...dbCache.usuarios[idx],
        ...updates
      };
      current = dbCache.usuarios[idx];
      saveDb(dbCache);
    } else if (supabaseClient) {
      const dbUser = await localDb.findUsuarioByEmail(email);
      if (dbUser) {
        current = { ...dbUser, ...updates };
      }
    }

    if (!current) return null;

    if (supabaseClient) {
      const { error } = await supabaseClient.from('usuarios').update({
        username: current.username,
        password: current.password,
        avatar: current.avatar,
        isAdmin: !!current.isAdmin,
        isDonor: !!current.isDonor,
        continueWatching: current.continueWatching || [],
        descricao: current.descricao || ""
      }).eq('email', email);
      if (error) {
        console.error("[Supabase Async] Erro ao atualizar usuario:", error);
      }
    }

    return current;
  }
};
