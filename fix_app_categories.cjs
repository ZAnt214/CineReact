const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newRows = `
                {/* HORIZONTAL ROWS */}
                <div className="space-y-10 md:mt-8 relative z-20">
                  <RowMovies 
                    title="Reacts em Alta" 
                    reacts={[...reacts].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 20)} 
                    obras={obras}
                    onPlayVideo={(reactId, obraId) => {
                      setSelectedObraId(obraId);
                      setSelectedReactId(reactId);
                      setCurrentTab('reproducao');
                    }}
                  />
                  <RowMovies 
                    title="Novidades" 
                    reacts={[...reacts].sort((a, b) => new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime()).slice(0, 20)} 
                    obras={obras}
                    onPlayVideo={(reactId, obraId) => {
                      setSelectedObraId(obraId);
                      setSelectedReactId(reactId);
                      setCurrentTab('reproducao');
                    }}
                  />
                  <RowMovies 
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
                </div>
`;

code = code.replace(/\{\/\* HORIZONTAL ROWS \*\/\}[\s\S]*?(?=<\/motion\.div>)/, newRows);
fs.writeFileSync('src/App.tsx', code);
