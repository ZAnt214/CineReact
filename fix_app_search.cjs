const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/Nenhuma obra encontrada para esta pesquisa\./g, "Nenhum universo ou canal encontrado para esta pesquisa.");
code = code.replace(/Tente pesquisar por filmes clássicos, animes como Naruto ou jogos\./g, "Tente pesquisar por universos como Marvel, Harry Potter ou jogos.");
code = code.replace(/Busca inteligente realizada com auxílio do Gemini AI/g, "Busca local rápida de universos e canais");

fs.writeFileSync('src/App.tsx', code);
