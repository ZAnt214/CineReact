const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The canais variable was missing, let's fix it by adding it inside the render
// And restore the genres/types/universos 

const replacement = `                  <RowMovies 
                    title="Mais Assistidos" 
                    reacts={[...reacts].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 50)} 
                    obras={obras}
                    onPlayVideo={(reactId, obraId) => {
                      setSelectedObraId(obraId);
                      setSelectedReactId(reactId);
                      setCurrentTab('reproducao');
                    }}
                  />
                  
                  {['filme', 'serie', 'jogo', 'anime'].map(tipo => {
                    const tipoReacts = reacts.filter(r => {
                      const obra = obras.find(o => o.id === r.obraId);
                      return obra && obra.tipo === tipo;
                    });
                    if (tipoReacts.length === 0) return null;
                    return (
                      <RowMovies 
                        key={tipo}
                        title={tipo === 'filme' ? 'Filmes' : tipo === 'serie' ? 'Séries' : tipo === 'jogo' ? 'Jogos' : 'Animes'} 
                        reacts={tipoReacts.sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 30)} 
                        obras={obras}
                        onPlayVideo={(reactId, obraId) => {
                          setSelectedObraId(obraId);
                          setSelectedReactId(reactId);
                          setCurrentTab('reproducao');
                        }}
                      />
                    );
                  })}

                  {['Terror', 'Ação', 'Comédia'].map(genero => {
                    const generoReacts = reacts.filter(r => {
                      const obra = obras.find(o => o.id === r.obraId);
                      return obra && obra.generos.some(g => g.toLowerCase() === genero.toLowerCase());
                    });
                    if (generoReacts.length === 0) return null;
                    return (
                      <RowMovies 
                        key={genero}
                        title={genero} 
                        reacts={generoReacts.sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 30)} 
                        obras={obras}
                        onPlayVideo={(reactId, obraId) => {
                          setSelectedObraId(obraId);
                          setSelectedReactId(reactId);
                          setCurrentTab('reproducao');
                        }}
                      />
                    );
                  })}
                  
                  {['Marvel', 'DC', 'Harry Potter', 'One Piece', 'GTA', 'Resident Evil', 'The Last of Us'].map(universo => {
                    const uniReacts = reacts.filter(r => {
                      const obra = obras.find(o => o.id === r.obraId);
                      return obra && (obra.titulo.toLowerCase().includes(universo.toLowerCase()) || obra.id.toLowerCase().includes(universo.toLowerCase().replace(/ /g, '-')));
                    });
                    if (uniReacts.length === 0) return null;
                    return (
                      <RowMovies 
                        key={universo}
                        title={universo} 
                        reacts={uniReacts.sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 30)} 
                        obras={obras}
                        onPlayVideo={(reactId, obraId) => {
                          setSelectedObraId(obraId);
                          setSelectedReactId(reactId);
                          setCurrentTab('reproducao');
                        }}
                      />
                    );
                  })}
                  
                  {obras.filter(o => o.tipo === 'canal').map(canal => {
                    const canalReacts = reacts.filter(r => {
                      if (r.obraId === canal.id || r.canalId === canal.id) return true;
                      const cleanCanalTitle = canal.titulo.replace(/^Canal\\s+/i, '').trim().toLowerCase();
                      const cleanReactCanal = r.canalNome.trim().toLowerCase();
                      return cleanReactCanal.includes(cleanCanalTitle) || cleanCanalTitle.includes(cleanReactCanal);
                    });
                    if (canalReacts.length === 0) return null;
                    return (
                      <RowMovies 
                        key={canal.id}
                        title={canal.titulo} 
                        reacts={canalReacts.sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 30)} 
                        obras={obras}
                        onPlayVideo={(reactId, obraId) => {
                          setSelectedObraId(obraId);
                          setSelectedReactId(reactId);
                          setCurrentTab('reproducao');
                        }}
                      />
                    );
                  })}`;

code = code.replace(
  /<RowMovies\s*title="Mais Assistidos"[\s\S]*?\}\)[\s\S]*?\}/,
  replacement
);

// We must also fix the currentTab === 'detalhe' bug
code = code.replace(
  /\{\/\* DETAIL SCREEN \*\/\}[\s\S]*?\{\/\* HOMEPAGE VIEW \*\/\}/,
  `{/* UNIVERSO SCREEN */}
            {currentTab === 'universo' && selectedObraId && (
              <motion.div
                key="universo-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <UniversoPage
                  universo={obras.find(o => o.id === selectedObraId)!}
                  reacts={reacts.filter(r => r.obraId === selectedObraId)}
                  onPlayVideo={(reactId, obraId) => {
                    setSelectedObraId(obraId);
                    setSelectedReactId(reactId);
                    setCurrentTab('reproducao');
                  }}
                  onBack={() => setCurrentTab('inicio')}
                />
              </motion.div>
            )}

            {/* REPRODUCAO SCREEN */}
            {currentTab === 'reproducao' && selectedObraId && (
              <motion.div
                key="reproducao-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PlaybackPage
                  obraId={selectedObraId}
                  initialReactId={selectedReactId}
                  reacts={reacts}
                  obras={obras}
                  user={user}
                  canaisSeguidos={canaisSeguidos}
                  onToggleSeguir={handleToggleSeguir}
                  onGoToUniverso={(id) => {
                    setSelectedObraId(id);
                    setCurrentTab('universo');
                  }}
                  onGoToCanal={(id) => {
                    setSelectedObraId(id);
                    setCurrentTab('canal');
                  }}
                />
              </motion.div>
            )}

            {/* HOMEPAGE VIEW */}`
);

fs.writeFileSync('src/App.tsx', code);
