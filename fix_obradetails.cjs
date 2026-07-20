const fs = require('fs');
let code = fs.readFileSync('src/components/ObraDetails.tsx', 'utf8');

code = code.replace(
  /const relatedReacts = obra\.reacts\.filter\(r => r\.id !== activeReactId\);/,
  `const allRelatedReacts = obra.reacts.filter(r => r.id !== activeReactId);
  const [visibleRelatedCount, setVisibleRelatedCount] = useState(20);
  const relatedReacts = allRelatedReacts.slice(0, visibleRelatedCount);
`
);

code = code.replace(
  /Nenhum outro react encontrado para esta obra no momento\.\n\s*<\/p>\n\s*\)}/,
  `Nenhum outro react encontrado para esta obra no momento.
              </p>
            )}

            {visibleRelatedCount < allRelatedReacts.length && (
              <button
                onClick={() => setVisibleRelatedCount(prev => prev + 20)}
                className="w-full py-3 bg-zinc-900/60 hover:bg-zinc-800 text-sm font-bold text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors uppercase tracking-wider"
              >
                Carregar Mais
              </button>
            )}`
);

fs.writeFileSync('src/components/ObraDetails.tsx', code);
