const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/import ChannelFeed from '\.\/components\/ChannelFeed\.tsx';/, "import ChannelPage from './components/ChannelPage.tsx';");

code = code.replace(
  /<ChannelFeed[\s\S]*?\/>/,
  `{currentTab === 'canal' && selectedObraId && (
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
            )}`
);

fs.writeFileSync('src/App.tsx', code);
