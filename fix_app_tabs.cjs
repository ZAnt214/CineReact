const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace imports
code = code.replace(/import ObraDetails from '\.\/components\/ObraDetails\.tsx';/, "import UniversoPage from './components/UniversoPage.tsx';\nimport PlaybackPage from './components/PlaybackPage.tsx';");

// Replace 'detalhe' occurrences with 'universo' or 'reproducao'
code = code.replace(
  /<ObraDetails[\s\S]*?\/>/,
  `{currentTab === 'universo' && selectedObraId && (
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
            )}
            
            {currentTab === 'reproducao' && selectedObraId && (
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
            )}`
);

// We need to fix the 'canal' tab as well. Let's see how ChannelFeed is currently used.
// It uses `selectedObraId` for channel ID?
fs.writeFileSync('src/App.tsx', code);
