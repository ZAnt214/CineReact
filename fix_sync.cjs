const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `async function syncChannelVideos(channelId: string, obraId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") {
    console.warn("[YouTube API] YOUTUBE_API_KEY não configurada. Pulando sincronização de canal.");
    return;
  }

  try {
    console.log(\`[YouTube API] Buscando TODOS os vídeos do canal \${channelId} para "\${obraId}"\`);
    let nextPageToken = '';
    const allVideoIds = [];
    
    // Instead of using search, use the uploads playlist (UU + channelId without UC)
    // This costs 1 quota unit instead of 100
    const uploadsPlaylistId = 'UU' + channelId.substring(2);
    
    // Fetch all video IDs from the channel's upload playlist
    do {
      const playlistUrl = \`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=\${uploadsPlaylistId}&maxResults=50&key=\${apiKey}\${nextPageToken ? \`&pageToken=\${nextPageToken}\` : ''}\`;
      const searchRes = await fetch(playlistUrl);
      if (!searchRes.ok) {
        const errText = await searchRes.text();
        console.error(\`[YouTube API] Erro ao pesquisar no canal \${channelId}: \${searchRes.status} - \${errText}\`);
        break;
      }
      
      const searchData: any = await searchRes.json();
      const ids = searchData.items?.map((item: any) => item.contentDetails?.videoId).filter(Boolean) || [];
      allVideoIds.push(...ids);
      
      nextPageToken = searchData.nextPageToken;
    } while (nextPageToken);
    
    const uniqueIds = Array.from(new Set(allVideoIds));
    console.log(\`[YouTube API] Encontrados \${uniqueIds.length} vídeos no canal \${channelId}. Buscando detalhes...\`);
    
    // Fetch details in batches of 50
    const validReacts: ReactVideo[] = [];
    for (let i = 0; i < uniqueIds.length; i += 50) {
      const batchIds = uniqueIds.slice(i, i + 50);
      const videosUrl = \`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&id=\${batchIds.join(',')}&key=\${apiKey}\`;
      const videosRes = await fetch(videosUrl);
      if (!videosRes.ok) {
        console.error(\`[YouTube API] Erro ao obter detalhes do lote: \${videosRes.status}\`);
        continue;
      }
      
      const videosData: any = await videosRes.json();
      
      if (videosData.items) {
        for (const video of videosData.items) {
          const isPublic = video.status?.privacyStatus === 'public';
          const isEmbeddable = video.status?.embeddable === true;
          const isProcessed = video.status?.uploadStatus === 'processed';

          if (isPublic && isEmbeddable && isProcessed) {
            const videoId = video.id;
            const snippet = video.snippet || {};
            const contentDetails = video.contentDetails || {};
            const statistics = video.statistics || {};

            const thumbnailUrl = snippet.thumbnails?.high?.url || 
                                 snippet.thumbnails?.medium?.url || 
                                 snippet.thumbnails?.default?.url || 
                                 '';

            validReacts.push({
              id: videoId,
              titulo: snippet.title || 'React Video',
              canalNome: snippet.channelTitle || 'Canal Desconhecido',
              canalId: snippet.channelId || '',
              publicadoEm: snippet.publishedAt || new Date().toISOString(),
              duracao: parseISO8601Duration(contentDetails.duration || ''),
              visualizacoes: parseInt(statistics.viewCount || '0', 10),
              thumbnailUrl: thumbnailUrl,
              obraId: obraId
            });
          }
        }
      }
    }
    
    // Sort from newest to oldest
    validReacts.sort((a, b) => new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime());
    
    // Remove existing reacts for this obra and save the new ones
    if (validReacts.length > 0) {
      const db = localDb.getDb();
      db.reacts = db.reacts.filter((r: any) => r.obraId !== obraId);
      db.reacts.push(...validReacts);
      localDb.saveDb(db);
      console.log(\`[YouTube API] Salvos \${validReacts.length} vídeos do canal \${channelId} no banco.\`);
    }

  } catch (err) {
    console.error(\`[YouTube API] Erro ao sincronizar canal \${channelId}:\`, err);
  }
}`;

code = code.replace(/async function syncChannelVideos[\s\S]*?async function searchAndSaveReacts/, replacement + "\n\nasync function searchAndSaveReacts");
fs.writeFileSync('server.ts', code);
