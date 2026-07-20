const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{\/\* FOLLOWED CHANNELS FEED \*\/\}[\s\S]*?(?=\{\/\* MINHA LISTA \/ SAVED \*\/\})/,
  `{/* CANAL PAGE */}
            {currentTab === 'canal' && selectedObraId && (
              <motion.div
                key="canal-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ChannelPage
                  canal={obras.find(o => o.id === selectedObraId)!}
                  reacts={reacts.filter(r => r.canalId === selectedObraId || r.canalNome === obras.find(o => o.id === selectedObraId)?.titulo.replace('Canal ', ''))}
                  obras={obras}
                  canaisSeguidos={canaisSeguidos}
                  onToggleSeguir={handleToggleSeguir}
                  onPlayVideo={(reactId, obraId) => {
                    setSelectedObraId(obraId);
                    setSelectedReactId(reactId);
                    setCurrentTab('reproducao');
                  }}
                  onBack={() => setCurrentTab('inicio')}
                />
              </motion.div>
            )}
            
            {/* CANAIS SEGUIDOS (OLD FEED) */}
            {currentTab === 'canais' && (
              <motion.div
                key="canais-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-24 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen"
              >
                <h2 className="text-2xl font-bold text-white mb-8">Canais Seguidos</h2>
                {canaisSeguidos.length === 0 ? (
                  <p className="text-zinc-500 text-center py-12">Você não segue nenhum canal ainda.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canaisSeguidos.map(nome => {
                      const canal = obras.find(o => o.tipo === 'canal' && o.titulo.includes(nome));
                      if (!canal) return null;
                      return (
                         <div key={nome} onClick={() => { setSelectedObraId(canal.id); setCurrentTab('canal'); }} className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800 transition-colors border border-zinc-800">
                           <img src={canal.poster} className="w-16 h-16 rounded-full object-cover" />
                           <div>
                             <h3 className="text-lg font-bold text-white">{nome}</h3>
                             <p className="text-zinc-400 text-sm">Visualizar canal</p>
                           </div>
                         </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
`
);

fs.writeFileSync('src/App.tsx', code);
